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
//
// Node strips the types from standards.ts as it loads it.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { standards } from "../src/data/standards.ts";

const FILE = fileURLToPath(
  new URL("../docs/source-validators.json", import.meta.url),
);
const record = process.argv.includes("--record");

/** Where the review reads a link: the record behind an RFC or a draft, or the page itself. */
const sourceOf = (url) => {
  const rfc = url.match(/^https:\/\/www\.rfc-editor\.org\/rfc\/rfc(\d+)$/);
  if (rfc) return `https://www.rfc-editor.org/rfc/rfc${rfc[1]}.json`;
  const draft = url.match(/^https:\/\/datatracker\.ietf\.org\/doc\/([^/]+)\/$/);
  if (draft) return `https://datatracker.ietf.org/doc/${draft[1]}/doc.json`;
  return url.split("#")[0];
};

// source address -> the entries that rest on it
const sources = new Map();
const add = (url, id) => {
  const s = sourceOf(url);
  sources.set(s, [...(sources.get(s) ?? []), id]);
};
for (const s of standards) {
  add(s.url, s.id);
  for (const r of s.related ?? []) if ("url" in r) add(r.url, s.id);
}

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
  const had = NEVER_THE_SAME.has(new URL(url).host) ? undefined : known[url];
  try {
    const res = await get(url, had ? conditions(had) : {});
    await res.arrayBuffer();
    if (res.status === 304) {
      result.same.push(url);
      next[url] = had;
      return;
    }
    if (!res.ok) {
      result.failed.push([url, `HTTP ${res.status}`]);
      if (had) next[url] = had;
      return;
    }
    (had ? result.look : result.unknown).push(url);
    if (!record) {
      if (had) next[url] = had;
      return;
    }
    const v = {};
    const etag = res.headers.get("etag");
    const lastModified = res.headers.get("last-modified");
    if (etag) v.etag = etag;
    if (lastModified) v.lastModified = lastModified;
    if (!etag && !lastModified) return;
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

if (record) {
  const sorted = Object.fromEntries(
    Object.keys(next)
      .filter((u) => sources.has(u))
      .sort()
      .map((u) => [u, next[u]]),
  );
  writeFileSync(FILE, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(
    `\nRecorded ${Object.keys(sorted).length} of ${sources.size} in docs/source-validators.json.`,
  );
}
