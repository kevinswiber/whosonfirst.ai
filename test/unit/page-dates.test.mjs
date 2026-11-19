// The dates a page gives are read from the repository's history. This checks
// the reading: which commit is a file's first and which its last, and that a
// commit that only reformats is not counted as a change.
import { strict as assert } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ENTRIES,
  entriesOf,
  entryDates,
  entryFirsts,
  historyDates,
  ignoredRevisions,
  LOGS,
  readLog,
  withoutLayout,
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

// A page that shows a few entries of a long list is dated by those entries.
// What follows checks that an entry's date moves when its own text does, by a
// line put in or one taken out, and not when its neighbor's does or when the
// file is only laid out again.
const list = (...entries) =>
  `export const standards = [\n${entries.join("\n")}\n];\n`;
const entry = (id, ...fields) =>
  `  {\n    id: "${id}",\n${fields.map((f) => `    ${f},\n`).join("")}  },`;

test("a list's entries are read by name, each without its layout", () => {
  const entries = entriesOf(
    list(entry("rfc1", 'status: "rfc"'), entry("draft-2", 'status: "draft"')),
    "id",
  );
  assert.deepEqual([...entries.keys()], ["rfc1", "draft-2"]);
  // the same entry on one line less, in the other quote marks, is the same entry
  assert.equal(
    entriesOf(
      "export const x = [\n  {\n    id: 'rfc1', status: 'rfc'\n  }\n];",
      "id",
    ).get("rfc1"),
    entries.get("rfc1"),
  );
});

test("an entry's date is the last commit that changed its own text, and its neighbor's change leaves it alone", () => {
  const versions = [
    {
      date: "2026-11-14",
      text: list(
        entry("a", 'status: "rfc"'),
        entry("b", 'status: "draft"', 'note: "new"'),
      ),
    },
    {
      date: "2026-11-12",
      text: list(entry("a", 'status: "rfc"'), entry("b", 'status: "draft"')),
    },
    {
      date: "2026-11-10",
      text: list(entry("a", 'status: "draft"'), entry("b", 'status: "draft"')),
    },
  ];
  assert.deepEqual(entryDates(versions, "id"), {
    a: "2026-11-12",
    b: "2026-11-14",
  });
});

test("a line taken out of an entry is a change to it, and an entry that is new is dated from the commit that added it", () => {
  const versions = [
    { date: "2026-11-14", text: list(entry("a"), entry("c", 'status: "rfc"')) },
    { date: "2026-11-12", text: list(entry("a", 'level: "emerging"')) },
    { date: "2026-11-10", text: list(entry("a", 'level: "emerging"')) },
  ];
  assert.deepEqual(entryDates(versions, "id"), {
    a: "2026-11-14",
    c: "2026-11-14",
  });
});

test("an entry is as old as the commit that added it, whatever has changed in it since", () => {
  const versions = [
    { date: "2026-11-14", text: list(entry("a", 'status: "rfc"'), entry("c")) },
    { date: "2026-11-12", text: list(entry("a", 'status: "draft"')) },
    { date: "2026-11-10", text: list(entry("a")) },
    // before the list had any entry by these names
    { date: "2026-11-09", text: list(entry("z")) },
  ];
  assert.deepEqual(entryFirsts(versions, "id"), {
    a: "2026-11-10",
    c: "2026-11-14",
  });
  assert.deepEqual(entryFirsts([], "id"), {});
});

test("an entry that was only laid out again keeps its date", () => {
  const versions = [
    { date: "2026-11-14", text: list(entry("a", 'status: "rfc"')) },
    {
      date: "2026-11-10",
      text: "export const standards = [\n  {\n    id: 'a', status: 'rfc'\n  }\n];",
    },
  ];
  assert.deepEqual(entryDates(versions, "id"), { a: "2026-11-10" });
});

test("every file read entry by entry is a list this reading can take apart", () => {
  for (const { file, key } of ENTRIES) {
    const text = readFileSync(
      new URL(`../../${file}`, import.meta.url),
      "utf8",
    );
    const entries = entriesOf(text, key);
    // every object of the outermost array has a name, and no two share one
    assert.equal(entries.size, text.match(/^ {2}\{\s*$/gm).length, file);
    assert.ok(entries.size > 0, file);
  }
});

// Layout is everything between the strings. What is inside one is what a page
// says, so nothing inside one is layout.
test("code that was only laid out again reads as the same, and a change inside a string does not", () => {
  const same = (a, b) => withoutLayout(a) === withoutLayout(b);
  // spacing, line breaks, a trailing comma, a comment and the kind of quote mark
  assert.ok(
    same(
      `{ id: "a", scopes: ["read", "write"] }`,
      `{\n  // which scopes\n  id: 'a',\n  scopes: [\n    "read",\n    "write",\n  ],\n}`,
    ),
  );
  assert.ok(same(`{ note: "it's" }`, `{ note: 'it\\'s' }`));
  // a space put into a quoted word
  assert.ok(!same(`{ scope: "readwrite" }`, `{ scope: "read write" }`));
  // a line break taken out of a template, where a blank line is a paragraph
  assert.ok(!same("{ body: `One.\n\nTwo.` }", "{ body: `One. Two.` }"));
  // two slashes in an address are not a comment, and what follows them counts
  assert.ok(
    !same(`{ url: "https://a.example/x" }`, `{ url: "https://a.example/y" }`),
  );
  // a comma before a bracket inside a string is the string's own
  assert.ok(!same(`{ code: "[1,]" }`, `{ code: "[1]" }`));
});

test("an entry's date moves when only the inside of one of its strings changes", () => {
  const versions = [
    { date: "2026-11-14", text: list(entry("a", 'scope: "read write"')) },
    { date: "2026-11-10", text: list(entry("a", 'scope: "readwrite"')) },
  ];
  assert.deepEqual(entryDates(versions, "id"), { a: "2026-11-14" });
});

// A commit that only moves text changes what a file says and not what a page
// says. The move of each standard's status into the log was one.
test("an entry reads the same on either side of an ignored commit, however its text differs there", () => {
  const versions = [
    // after the move, a real change to b
    { date: "2026-11-21", text: list(entry("a"), entry("b", 'note: "new"')) },
    // the move: status taken out of both
    { date: "2026-11-20", text: list(entry("a"), entry("b")), ignored: true },
    {
      date: "2026-11-12",
      text: list(entry("a", 'status: "rfc"'), entry("b", 'status: "draft"')),
    },
    {
      date: "2026-11-10",
      text: list(entry("a", 'status: "draft"'), entry("b", 'status: "draft"')),
    },
  ];
  assert.deepEqual(entryDates(versions, "id"), {
    a: "2026-11-12",
    b: "2026-11-21",
  });
  // with the move the newest commit, nothing has a new date
  assert.deepEqual(entryDates(versions.slice(1), "id"), {
    a: "2026-11-12",
    b: "2026-11-10",
  });
});

test("an entry that came in with an ignored commit has no date until a later commit changes it", () => {
  const versions = [
    {
      date: "2026-11-21",
      text: list(entry("a"), entry("b", 'note: "new"'), entry("c")),
    },
    { date: "2026-11-20", text: list(entry("a"), entry("b")), ignored: true },
    { date: "2026-11-19", text: list(entry("z")), ignored: true },
  ];
  assert.deepEqual(entryDates(versions, "id"), {
    b: "2026-11-21",
    c: "2026-11-21",
  });
  assert.deepEqual(entryDates(versions.slice(1), "id"), {});
  assert.deepEqual(entryFirsts(versions, "id"), {
    a: "2026-11-21",
    b: "2026-11-21",
    c: "2026-11-21",
  });
});

test("a log's entry is every event with its name, so a new event for one moves that one's date alone", () => {
  const event = (name, what) =>
    `  {\n    entry: "${name}",\n    summary: "${what}",\n  },`;
  const log = (...events) =>
    `export const events = [\n${events.join("\n")}\n];`;
  const versions = [
    {
      date: "2026-12-03",
      text: log(event("a", "One."), event("b", "One."), event("a", "Two.")),
    },
    { date: "2026-12-01", text: log(event("a", "One."), event("b", "One.")) },
  ];
  assert.deepEqual(entryDates(versions, "entry"), {
    a: "2026-12-03",
    b: "2026-12-01",
  });
});

test("every month of a log is a list this reading can take apart", () => {
  for (const { dir, key } of LOGS) {
    const months = readdirSync(
      new URL(`../../${dir}/`, import.meta.url),
    ).filter((name) => /^\d{4}-\d{2}\.ts$/.test(name));
    assert.ok(months.length > 0, dir);
    for (const month of months) {
      const text = readFileSync(
        new URL(`../../${dir}/${month}`, import.meta.url),
        "utf8",
      );
      const objects = text.match(/^ {2}\{\s*$/gm).length;
      const named = text.match(new RegExp(`^ {4}${key}: "`, "gm")).length;
      // every event that names an entry is read, under that entry
      assert.ok(entriesOf(text, key).size > 0, month);
      assert.ok(named <= objects, month);
      const read = [...entriesOf(text, key).values()].join("");
      assert.equal(read.split(`${key}:`).length - 1, named, month);
    }
  }
});
