// Checks the history of the standards: that the log in src/data/history/ is
// well formed, that it agrees with the tracker it describes, and that the
// functions that read it give what they say.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { history } from "../../src/data/history/index.ts";
import {
  currentOf,
  eventIds,
  historyOf,
  validateHistory,
  versionsOf,
} from "../../src/data/history/model.ts";
import { standards } from "../../src/data/standards.ts";

const ids = standards.map((s) => s.id);

test("the log is well formed, and every tracker entry has a baseline", () => {
  assert.deepEqual(validateHistory(history, ids), []);
});

// Until the tracker reads its status line from the log, each states it once,
// and the two have to agree.
test("the log gives every entry the status the tracker shows", () => {
  const differ = standards
    .filter((s) => currentOf(history, s.id)?.status !== s.status)
    .map(
      (s) =>
        `${s.id}: tracker ${s.status}, log ${currentOf(history, s.id)?.status}`,
    );
  assert.deepEqual(differ, []);
});

test("the log gives every draft the revision the tracker shows", () => {
  const differ = [];
  for (const s of standards) {
    const said = /^Revision (-\d+),/.exec(s.detail ?? "");
    if (!said) continue;
    const label = currentOf(history, s.id)?.version?.label;
    if (label !== said[1])
      differ.push(`${s.id}: tracker ${said[1]}, log ${label}`);
  }
  assert.deepEqual(differ, []);
});

test("every event has a name of its own", () => {
  const names = eventIds(history);
  assert.equal(new Set(names).size, names.length);
});

/* ───────────── The rules, on a log made for the purpose ───────────── */

const base = {
  entry: "a",
  kind: "baseline",
  date: "2026-11-19",
  recorded: "2026-11-19",
  status: "wg-draft",
  version: { label: "-01", url: "https://example.org/a-01", date: "2026-10" },
};
const event = (over) => ({
  entry: "a",
  kind: "process",
  date: "2026-11-20",
  recorded: "2026-11-21",
  summary: "Something happened.",
  source: "https://example.org/history",
  ...over,
});
const problems = (events, entries = ["a"]) => validateHistory(events, entries);
const refuses = (events, pattern, entries) => {
  const found = problems(events, entries);
  assert.ok(
    found.some((line) => pattern.test(line)),
    `expected ${pattern}, got ${JSON.stringify(found)}`,
  );
};

test("a well-formed log has nothing wrong with it", () => {
  assert.deepEqual(problems([base, event({})]), []);
});

test("an event cannot happen after it was recorded", () => {
  refuses([base, event({ date: "2026-11-22" })], /after it was recorded/);
  refuses([base, event({ date: "2026-12" })], /after it was recorded/);
  assert.deepEqual(problems([base, event({ date: "2026-11" })]), []);
});

test("an event has a summary and a source", () => {
  refuses([base, event({ summary: " " })], /no summary/);
  refuses([base, event({ source: undefined })], /no source/);
  refuses([base, event({ source: "http://example.org/" })], /no source/);
});

test("a date is a real day or a real month", () => {
  refuses([base, event({ date: "2026-02-30" })], /not a day or a month/);
  refuses([base, event({ date: "2026-13" })], /not a day or a month/);
  refuses([base, event({ recorded: "2026-11" })], /is not a day/);
});

test("the log is in the order it was written", () => {
  refuses(
    [base, event({}), event({ date: "2026-11-01", recorded: "2026-11-20" })],
    /the log is in the order it was written/,
  );
});

test("an event names a tracker entry, or says what else it is about", () => {
  refuses([base, event({ entry: "b" })], /not a tracker entry/);
  refuses([base, event({ entry: undefined })], /needs a subject/);
  assert.deepEqual(
    problems([base, event({ entry: undefined, subject: "A working group" })]),
    [],
  );
});

test("every entry has one baseline, and a baseline states the status", () => {
  refuses([base], /^b: has no baseline/, ["a", "b"]);
  refuses([base, { ...base }], /second baseline/);
  refuses([{ ...base, status: undefined }], /states the status/);
  refuses([{ ...base, summary: "It began." }], /carries no summary/);
});

test("a version is published once", () => {
  const publish = (label, over) =>
    event({
      kind: "version",
      version: { label, url: `https://example.org/a${label}` },
      ...over,
    });
  assert.deepEqual(problems([base, publish("-02")]), []);
  refuses([base, publish("-01")], /already published/);
  refuses([base, publish("-02"), publish("-02")], /already published/);
  refuses([base, event({ kind: "version" })], /publishes no version/);
  // A baseline may name the version an earlier event published.
  const earlier = publish("-01", {
    date: "2026-10-05",
    recorded: "2026-11-01",
  });
  assert.deepEqual(problems([earlier, base]), []);
});

test("changes belong to a version and have a source", () => {
  refuses([base, event({ changes: ["A thing."] })], /names no version/);
  refuses(
    [
      base,
      event({
        kind: "version",
        version: { label: "-02", url: "https://example.org/a-02" },
        changes: ["A thing."],
      }),
    ],
    /no source for them/,
  );
});

test("a correction says when and what", () => {
  refuses(
    [base, event({ corrected: { on: "2026-11-25", note: "" } })],
    /a correction has/,
  );
  refuses(
    [base, event({ corrected: { on: "2026-11-01", note: "The date." } })],
    /corrected before it was recorded/,
  );
});

test("where an entry stands is its baseline, changed by what came after", () => {
  const log = [
    // Before the baseline: history, which the baseline restates.
    event({
      kind: "version",
      date: "2026-10-05",
      recorded: "2026-11-01",
      version: { label: "-01", url: "https://example.org/a-01" },
      standing: "Old news.",
    }),
    base,
    event({
      kind: "version",
      version: { label: "-02", url: "https://example.org/a-02" },
    }),
    event({
      kind: "version",
      date: "2026-11-21",
      version: { label: "-03-rc", url: "https://example.org/rc", pre: true },
    }),
    event({
      kind: "call",
      date: "2026-11-21",
      standing: "In last call.",
    }),
    event({
      kind: "publication",
      date: "2026-11-21",
      status: "rfc",
    }),
  ];
  assert.deepEqual(problems(log), []);
  const now = currentOf(log, "a");
  assert.equal(now.status, "rfc");
  assert.equal(now.version.label, "-02");
  assert.equal(now.version.date, "2026-11-20");
  assert.equal(now.standing, "In last call.");
  assert.deepEqual(
    versionsOf(log, "a").map((v) => `${v.label} ${v.date}`),
    ["-01 2026-10-05", "-02 2026-11-20", "-03-rc 2026-11-21"],
  );
  assert.equal(currentOf(log, "b"), undefined);
});

test("a document's history is in the order things happened", () => {
  const log = [
    event({ date: "2026-11-05", recorded: "2026-11-06", summary: "Second." }),
    event({ date: "2026-10", recorded: "2026-11-07", summary: "First." }),
    event({ date: "2026-11", recorded: "2026-11-08", summary: "Third." }),
  ];
  assert.deepEqual(
    historyOf(log, "a").map((e) => e.summary),
    ["First.", "Second.", "Third."],
  );
});
