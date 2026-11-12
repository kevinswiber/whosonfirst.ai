// Asks each source the tracker links to whether it has changed since the last
// source review, without reading it: a conditional GET with the ETag or
// Last-Modified value recorded then. Run with `npm run sources:changed`.
//
// "Not modified" means the page is as it was when it was last checked. Anything
// else means only "read this one": a page can change without the fact on the
// site changing. docs/source-review.md says how a review uses this.
//
// `--record` writes the values the sources give today to
// docs/source-validators.json. Run it at the end of a review, once every source
// listed as changed has been read: recording says "checked as of now".
// `--add` does the same for sources the file does not have yet, and leaves the
// rest alone. Every source has an entry, empty where its server gives nothing
// to ask with: `npm test` fails on a link that has none.
//
// Node strips the types from standards.ts as it loads it.
import { readFileSync, writeFileSync } from "node:fs";
import { RECORDED as FILE, sources as readSources } from "./sources.mjs";

const record = process.argv.includes("--record");
// `--add` records only the sources the file does not have yet: for a link
// added between reviews, whose source has just been read.
const addNew = process.argv.includes("--add");

const sources = await readSources();

const known = (() => {
  try {
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    return {};
  }
})();

// Hosts whose value passes that test and is different a minute later, so that
// every page on them would read as changed. A project on GitHub is checked by
// its releases, as the review says.
const NEVER_THE_SAME = new Set(["github.com"]);

const get = (url, headers = {}) =>
  fetch(url, {
    headers,
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
const conditions = (v) => ({
  ...(v.etag ? { "if-none-match": v.etag } : {}),
  ...(v.lastModified ? { "if-modified-since": v.lastModified } : {}),
});

const result = { same: [], look: [], unknown: [], failed: [] };
const next = {};

const check = async (url) => {
  const listed = url in known;
  const usable = known[url] && Object.keys(known[url]).length > 0;
  const had =
    usable && !NEVER_THE_SAME.has(new URL(url).host) ? known[url] : undefined;
  const writing = record || (addNew && !listed);
  // Every source keeps an entry, empty until a value is found for it.
  next[url] = known[url] ?? {};
  try {
    let res = await get(url, had ? conditions(had) : {});
    await res.arrayBuffer();
    // A site served from several machines can give a value that differs from
    // one machine to the next. Ask twice more before calling a page changed.
    for (let again = 0; had && res.status === 200 && again < 2; again++) {
      res = await get(url, conditions(had));
      await res.arrayBuffer();
    }
    if (res.status === 304) {
      result.same.push(url);
      return;
    }
    if (!res.ok) {
      result.failed.push([url, `HTTP ${res.status}`]);
      return;
    }
    (had ? result.look : result.unknown).push(url);
    if (!writing) return;
    next[url] = {};
    const v = {};
    const etag = res.headers.get("etag");
    const lastModified = res.headers.get("last-modified");
    if (etag) v.etag = etag;
    // A Last-Modified within the hour before the response is, far more often
    // than a page just edited, the time a cache last rebuilt the page. It
    // would read as changed at every rebuild, so it is not kept.
    const served = Date.parse(res.headers.get("date") ?? "") || Date.now();
    const fresh = lastModified && served - Date.parse(lastModified) < 3600000;
    if (lastModified && !fresh) v.lastModified = lastModified;
    if (!v.etag && !v.lastModified) return;
    if (NEVER_THE_SAME.has(new URL(url).host)) return;
    // Some servers send a value and never honour it, or send a new one each
    // time. Keep a value only if asking again with it says "not modified".
    const again = await get(url, conditions(v));
    await again.arrayBuffer();
    if (again.status === 304) next[url] = v;
  } catch (e) {
    result.failed.push([
      url,
      e.name === "TimeoutError" ? "timed out" : e.message,
    ]);
    if (had) next[url] = had;
  }
};

const queue = [...sources.keys()].sort();
let at = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (at < queue.length) await check(queue[at++]);
  }),
);

const list = (title, urls) => {
  if (urls.length === 0) return;
  console.log(`\n${title} (${urls.length})`);
  for (const u of [...urls].sort()) {
    const [url, why] = Array.isArray(u) ? u : [u];
    const ids = [...new Set(sources.get(url))].join(", ");
    console.log(`  ${url}${why ? `  — ${why}` : ""}\n      ${ids}`);
  }
};

console.log(
  `${sources.size} sources: ${result.same.length} not modified, ${result.look.length} changed since recorded, ${result.unknown.length} with nothing recorded, ${result.failed.length} not reached.`,
);
list("Changed since recorded: read these", result.look);
list(
  "Nothing recorded, or the server gives nothing to ask with: read these",
  result.unknown,
);
list("Not reached: not checked", result.failed);

if (record || addNew) {
  const sorted = Object.fromEntries(
    Object.keys(next)
      .filter((u) => sources.has(u))
      .sort()
      .map((u) => [u, next[u]]),
  );
  writeFileSync(FILE, `${JSON.stringify(sorted, null, 2)}\n`);
  const withValue = Object.values(sorted).filter(
    (v) => Object.keys(v).length > 0,
  ).length;
  console.log(
    `\nWrote docs/source-validators.json: ${Object.keys(sorted).length} sources, ${withValue} with a value to ask with.`,
  );
}
