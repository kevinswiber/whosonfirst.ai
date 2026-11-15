// The dates a page gives are read from the repository's history. This checks
// the reading: which commit is a file's first and which its last, and that a
// commit that only reformats is not counted as a change.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  historyDates,
  ignoredRevisions,
  readLog,
} from "../../src/integrations/page-dates.mjs";

const A = "a".repeat(40);
const B = "b".repeat(40);
const C = "c".repeat(40);
// as `git log --format=<mark>%H %cI --name-only` prints it: newest commit first
const LOG = [
  `\u0001${C} 2026-11-14T10:00:00-08:00`,
  "",
  "src/data/flows/dpop.ts",
  "src/data/glossary.ts",
  `\u0001${B} 2026-11-12T09:00:00+00:00`,
  "",
  "src/data/flows/dpop.ts",
  `\u0001${A} 2026-11-09T08:00:00+00:00`,
  "",
  "src/data/flows/dpop.ts",
  "src/pages/index.astro",
].join("\n");

test("a file's first date is its oldest commit and its last is its newest", () => {
  const dates = readLog(LOG);
  assert.deepEqual(dates["src/data/flows/dpop.ts"], {
    first: "2026-11-09T08:00:00+00:00",
    last: "2026-11-14T10:00:00-08:00",
  });
  assert.deepEqual(dates["src/data/glossary.ts"], {
    first: "2026-11-14T10:00:00-08:00",
    last: "2026-11-14T10:00:00-08:00",
  });
  assert.deepEqual(dates["src/pages/index.astro"], {
    first: "2026-11-09T08:00:00+00:00",
    last: "2026-11-09T08:00:00+00:00",
  });
});

test("a commit that only reformats does not change a file's date", () => {
  const ignored = ignoredRevisions(
    `# Commits that only reformat.\n\n# style: format\n${C}\nnot-a-hash\n`,
  );
  assert.deepEqual([...ignored], [C]);
  const dates = readLog(LOG, ignored);
  assert.equal(
    dates["src/data/flows/dpop.ts"].last,
    "2026-11-12T09:00:00+00:00",
  );
  // a file that only that commit touched has no date at all, and so gives none
  assert.equal(dates["src/data/glossary.ts"], undefined);
});

test("where there is no history to read, no file is dated and the reason is given", () => {
  const { dates, found } = historyDates("/");
  assert.deepEqual(dates, {});
  assert.match(found, /pages carry no date/);
});

test("a build that is not the deployed one never fetches: a shallow clone is reported and left as it is", () => {
  // this repository's own clone, whatever its depth, with no sign of Workers Builds
  const { found } = historyDates(
    new URL("../../", import.meta.url).pathname,
    {},
  );
  assert.doesNotMatch(found, /fetch/);
});
