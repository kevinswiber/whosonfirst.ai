// Checks, without the network, that three lists of the site's sources agree:
// the links in the data, the values recorded for them in
// docs/source-validators.json, and what docs/source-review.md names.
// Part of `npm test`.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { standards } from "../src/data/standards.ts";
import { RECORDED, sources as readSources } from "./sources.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const review = readFileSync(`${root}docs/source-review.md`, "utf8");
const sources = await readSources();
const recorded = JSON.parse(readFileSync(RECORDED, "utf8"));

const problems = [];
const problem = (what, fix) => problems.push(`${what}\n    ${fix}`);

// 1. Every source the data links to has an entry, and no entry is left over.
for (const [url, where] of sources) {
  if (!(url in recorded)) {
    problem(
      `${url} (${where.join(", ")}) has no entry in docs/source-validators.json`,
      "Read the source, then run: npm run sources:changed -- --add",
    );
  }
}
for (const url of Object.keys(recorded)) {
  if (!sources.has(url)) {
    problem(
      `docs/source-validators.json has ${url}, which nothing in the data links to`,
      "Run: npm run sources:changed -- --add, which drops it",
    );
  }
}

// 2. Every host the data links to is in the review's list of hosts.
const block = review.match(
  /## Domains a run needs[\s\S]*?```text\n([\s\S]*?)```/,
);
const hosts = new Set((block?.[1] ?? "").split("\n").filter(Boolean));
if (hosts.size === 0) {
  problem(
    "docs/source-review.md has no list of hosts under “Domains a run needs”",
    "The check reads the first ```text block under that heading",
  );
}
for (const [url, where] of sources) {
  const host = new URL(url).host;
  if (!hosts.has(host)) {
    problem(
      `${host} (${where.join(", ")}) is not under “Domains a run needs” in docs/source-review.md`,
      "Add the host to that list",
    );
  }
}

// 3. Every tracker entry the review names exists. It names them as
//    `standards.ts` (`id`, `id`), with `prefix-*` for a group.
const ids = standards.map((s) => s.id);
for (const m of review.matchAll(/`standards\.ts` \(([^)]*)\)/g)) {
  for (const [, id] of m[1].matchAll(/`([^`]+)`/g)) {
    const ok = id.endsWith("*")
      ? ids.some((i) => i.startsWith(id.slice(0, -1)))
      : ids.includes(id);
    if (!ok) {
      problem(
        `docs/source-review.md names the tracker entry \`${id}\`, which src/data/standards.ts does not have`,
        "Correct the id, or remove the row if the entry is gone",
      );
    }
  }
}

// 4. Every file the review names exists.
const places = ["", "src/", "src/data/", "src/pages/", "src/components/"];
for (const [, path] of review.matchAll(
  /`([\w./[\]-]+\.(?:ts|mdx|astro|mjs|md|json))`/g,
)) {
  // A source's own record, named in a pattern, is not a file here.
  if (path === "doc.json" || path.includes("<") || path.includes("*")) continue;
  if (!places.some((p) => existsSync(`${root}${p}${path}`))) {
    problem(
      `docs/source-review.md names the file \`${path}\`, which does not exist`,
      "Correct the path, or remove the row if the file is gone",
    );
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) with the site's sources:\n`);
  for (const p of problems) console.error(`  ${p}\n`);
  process.exit(1);
}
console.log(
  `${sources.size} sources, each with an entry and a listed host; every entry and file the source review names exists.`,
);
