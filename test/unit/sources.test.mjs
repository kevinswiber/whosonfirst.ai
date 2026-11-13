// Checks, without the network, that three lists of the site's sources agree:
// the links in the data, the values recorded for them in
// docs/source-validators.json, and what docs/source-review.md names.
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { RECORDED, sources as readSources } from "../../scripts/sources.mjs";
import { standards } from "../../src/data/standards.ts";

const root = fileURLToPath(new URL("../..", import.meta.url));
const review = readFileSync(`${root}/docs/source-review.md`, "utf8");
const sources = await readSources();
const recorded = JSON.parse(readFileSync(RECORDED, "utf8"));

test("every source the data links to has an entry in docs/source-validators.json", () => {
  assert.deepEqual(
    [...sources]
      .filter(([url]) => !(url in recorded))
      .map(([url, where]) => `${url} (${where.join(", ")})`),
    [],
    "Read the source, then run: npm run sources:changed -- --add",
  );
});

test("docs/source-validators.json has no entry that nothing in the data links to", () => {
  assert.deepEqual(
    Object.keys(recorded).filter((url) => !sources.has(url)),
    [],
    "Run: npm run sources:changed -- --add, which drops it",
  );
});

test("every host the data links to is under “Domains a run needs” in docs/source-review.md", () => {
  const block = review.match(
    /## Domains a run needs[\s\S]*?```text\n([\s\S]*?)```/,
  );
  const hosts = new Set((block?.[1] ?? "").split("\n").filter(Boolean));
  assert.ok(
    hosts.size > 0,
    "The check reads the first ```text block under that heading",
  );
  assert.deepEqual(
    [...sources]
      .filter(([url]) => !hosts.has(new URL(url).host))
      .map(([url, where]) => `${new URL(url).host} (${where.join(", ")})`),
    [],
    "Add the host to that list",
  );
});

// The review names them as `standards.ts` (`id`, `id`), with `prefix-*` for a group.
test("every tracker entry docs/source-review.md names is in src/data/standards.ts", () => {
  const ids = standards.map((s) => s.id);
  const unknown = [];
  for (const m of review.matchAll(/`standards\.ts` \(([^)]*)\)/g)) {
    for (const [, id] of m[1].matchAll(/`([^`]+)`/g)) {
      const ok = id.endsWith("*")
        ? ids.some((i) => i.startsWith(id.slice(0, -1)))
        : ids.includes(id);
      if (!ok) unknown.push(id);
    }
  }
  assert.deepEqual(
    unknown,
    [],
    "Correct the id, or remove the row if the entry is gone",
  );
});

test("every file docs/source-review.md names exists", () => {
  const places = ["", "src/", "src/data/", "src/pages/", "src/components/"];
  const missing = [];
  for (const [, path] of review.matchAll(
    /`([\w./[\]-]+\.(?:ts|mdx|astro|mjs|md|json))`/g,
  )) {
    // A source's own record, named in a pattern, is not a file here.
    if (path === "doc.json" || path.includes("<") || path.includes("*"))
      continue;
    if (!places.some((p) => existsSync(`${root}/${p}${path}`)))
      missing.push(path);
  }
  assert.deepEqual(
    missing,
    [],
    "Correct the path, or remove the row if the file is gone",
  );
});
