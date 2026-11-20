// Checks the history of the standards: that the log in src/data/history/ is
// well formed, that it agrees with the tracker it describes, and that the
// functions that read it give what they say.
import { strict as assert } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { citations } from "../../src/data/history/citations.ts";
import { history } from "../../src/data/history/index.ts";
import { standards } from "../../src/data/standards.ts";
import {
  changelog,
  currentOf,
  eventIds,
  feedOf,
  happenings,
  historyOf,
  movedIn,
  readCitations,
  recordBegan,
  spellDate,
  statusLine,
  timeline,
  validateCitations,
  validateHistory,
  versionsOf,
} from "../../src/lib/history.ts";

const ids = standards.map((s) => s.id);

test("the log is well formed, and every tracker entry has a baseline", () => {
  assert.deepEqual(validateHistory(history, ids), []);
});

test("every entry has its status from the log, and names none of its own", () => {
  const source = readFileSync(
    new URL("../../src/data/standards.ts", import.meta.url),
    "utf8",
  );
  assert.equal(source.match(/^ {4}status:/gm), null);
  for (const s of standards)
    assert.equal(s.status, currentOf(history, s.id).status, s.id);
});

test("a draft's status line opens with its name, as the IETF writes it, and its month, and an RFC's with its month", () => {
  const byId = Object.fromEntries(standards.map((s) => [s.id, s]));
  assert.match(
    byId["oauth-2-1"].detail,
    /^draft-ietf-oauth-v2-1-\d+, [A-Z][a-z]+ \d{4}\. /,
  );
  assert.equal(byId.rfc7636.detail, "September 2015.");
  for (const s of standards) {
    const version = currentOf(history, s.id).version;
    if (!/^-\d+$/.test(version?.label ?? "")) continue;
    // the name is the draft's own, and ends with the revision the log calls current
    assert.equal(version.name, `${s.ref}${version.label}`, s.id);
    assert.ok(s.detail.startsWith(`${version.name}, `), s.id);
  }
});

// "SPIRE 1.16" and "A2A 1.0" put a version in an entry's name, by hand. It is
// the one the log calls current, or the start of it.
test("a version in an entry's name is the one the log calls current", () => {
  const differ = [];
  for (const s of standards) {
    const named = /\bv?(\d+\.\d+|\d{4}-\d{2}-\d{2})\b/.exec(s.ref)?.[1];
    const label = currentOf(history, s.id).version?.label;
    if (named && label && !label.replace(/^v/, "").startsWith(named))
      differ.push(`${s.id}: named ${named}, log ${label}`);
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

test("days are in order whatever a month-only date sits between them", () => {
  const log = [
    event({ date: "2026-11-20", summary: "The 20th." }),
    event({ date: "2026-11", summary: "Some day in November." }),
    event({ date: "2026-11-10", summary: "The 10th.", standing: "Early." }),
    event({ date: "2026-10-30", summary: "October." }),
  ];
  assert.deepEqual(
    historyOf(log, "a").map((e) => e.summary),
    ["October.", "The 10th.", "Some day in November.", "The 20th."],
  );
});

// A version is written as its body writes it, and the IETF names a draft in
// full: draft-ietf-wimse-arch-09, not “revision -09”. The tracker's status
// lines do so, and what the changelog and the timeline say of each event has
// to as well, or a reader finds both forms on one page.
test("what the changelog says of an event names a draft's version in full, not by its number alone", () => {
  const bare = happenings(history).flatMap((e) =>
    [e.summary ?? "", ...(e.changes ?? [])]
      .filter((text) => /\b[Rr]evision -\d/.test(text))
      .map((text) => `${e.id}: ${text}`),
  );
  assert.deepEqual(bare, []);
});

test("the status line is the version, where the document stands, and the entry's note", () => {
  const draft = {
    status: "wg-draft",
    version: {
      entry: "a",
      label: "-03",
      url: "https://example.org/",
      date: "2026-11-05",
    },
    standing: "In last call.",
  };
  assert.equal(
    statusLine(draft, "It would be the first."),
    "Revision -03, November 2026. In last call. It would be the first.",
  );
  // a draft with its name in the log is called by it
  assert.equal(
    statusLine({
      ...draft,
      version: { ...draft.version, name: "draft-example-a-03" },
    }),
    "draft-example-a-03, November 2026. In last call.",
  );
  const rfc = {
    status: "rfc",
    version: {
      entry: "a",
      label: "RFC 9999",
      url: "https://example.org/",
      date: "2012-10",
    },
  };
  assert.equal(statusLine(rfc, "BCP 212."), "October 2012. BCP 212.");
  assert.equal(statusLine(rfc), "October 2012.");
  // any other version is named by the standing, in its publisher's words
  const release = {
    status: "project",
    version: {
      entry: "a",
      label: "v1.16.0",
      url: "https://example.org/",
      date: "2026-11",
    },
    standing: "Version 1.16.0, November 2026.",
  };
  assert.equal(statusLine(release), "Version 1.16.0, November 2026.");
  assert.equal(statusLine({ status: "project" }), "");
});

test("a version the tracker does not word itself comes with where the document stands", () => {
  const release = (over) =>
    event({
      kind: "version",
      version: { label: "v2.0.0", url: "https://example.org/v2" },
      ...over,
    });
  refuses([base, release({})], /has no standing/);
  assert.deepEqual(
    problems([base, release({ standing: "Version 2.0.0." })]),
    [],
  );
  // a release candidate is not the current version, and changes no status line
  assert.deepEqual(
    problems([
      base,
      release({
        version: {
          label: "v2.0.0-rc",
          url: "https://example.org/rc",
          pre: true,
        },
      }),
    ]),
    [],
  );
});

test("the timeline is by the month things happened, and the changelog by the day they were recorded", () => {
  const log = [
    event({ date: "2026-10-30", recorded: "2026-11-11", summary: "A." }),
    event({ date: "2026-11-13", recorded: "2026-11-19", summary: "B." }),
    event({ date: "2026-11-02", recorded: "2026-11-19", summary: "C." }),
    base,
    event({
      date: "2026-11-20",
      recorded: "2026-11-21",
      summary: "D.",
      corrected: { on: "2026-11-25", note: "The date." },
    }),
  ];
  const shape = (groups) =>
    groups.map((g) => `${g.key}: ${g.events.map((e) => e.summary).join(" ")}`);
  assert.deepEqual(shape(timeline(log)), ["2026-11: D. B. C.", "2026-10: A."]);
  assert.deepEqual(shape(changelog(log)), [
    "2026-11-25: D.",
    "2026-11-21: D.",
    "2026-11-19: B. C.",
    "2026-11-11: A.",
  ]);
  // a baseline is where a document stood, not something that happened
  assert.ok(
    timeline(log).every((g) => g.events.every((e) => e.kind !== "baseline")),
  );
  assert.equal(recordBegan(log), "2026-11-19");
  assert.equal(spellDate("2026-11-02"), "November 2, 2026");
  assert.equal(spellDate("2026-10"), "October 2026");
});

const ORIGIN = "https://whosonfirst.ai";
// The site formats an event's text with inline() in src/lib/md.ts, which reads
// the glossary and the tracker and is not loaded here. This stands in for it:
// it escapes the text and makes code spans and links, as inline() does.
// test/build/forms.test.mjs reads the feed the site is built with.
const format = (text) =>
  text
    .replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    )
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
// A piece of the feed as a reader has it once it has read the XML.
const unxml = (text) =>
  text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");

test("the feed has an entry for each event, newest recording first, and none for a baseline", () => {
  const log = [
    event({
      date: "2026-10-30",
      recorded: "2026-11-11",
      summary: "A <b> & c.",
    }),
    base,
    event({
      kind: "version",
      date: "2026-11-20",
      recorded: "2026-11-21",
      summary: "Revision -02.",
      version: { label: "-02", url: "https://example.org/a-02" },
      changes: ["One thing."],
      changesSource: "https://example.org/diff",
    }),
    event({
      date: "2026-11",
      recorded: "2026-11-12",
      summary: "Late.",
      corrected: { on: "2026-11-25", note: "The month." },
    }),
  ];
  const feed = feedOf(log, ORIGIN, (id) => `Doc ${id}`, format);
  const all = (pattern) => [...feed.matchAll(pattern)].map((m) => m[1]);
  assert.deepEqual(all(/<entry>\s*<id>([^<]+)<\/id>/g), [
    "tag:whosonfirst.ai,2026:standards/a/2026-11/process",
    "tag:whosonfirst.ai,2026:standards/a/2026-11-20/version",
    "tag:whosonfirst.ai,2026:standards/a/2026-10-30/process",
  ]);
  // the feed is as new as its newest entry, which is the correction
  assert.match(
    feed,
    /<feed[^>]*>\s*<id>https:\/\/whosonfirst\.ai\/standards\/changes\.xml<\/id>/,
  );
  assert.equal(all(/^ {2}<updated>([^<]+)</gm)[0], "2026-11-25T00:00:00Z");
  assert.deepEqual(all(/^ {4}<updated>([^<]+)</gm), [
    "2026-11-25T00:00:00Z",
    "2026-11-21T00:00:00Z",
    "2026-11-11T00:00:00Z",
  ]);
  // an entry is published the day the site recorded its event: not the day
  // it happened, which may be long before, and a month for the late one.
  // A correction changes when it was updated, not when it was published.
  assert.deepEqual(all(/<published>([^<]+)</g), [
    "2026-11-12T00:00:00Z",
    "2026-11-21T00:00:00Z",
    "2026-11-11T00:00:00Z",
  ]);
  assert.match(feed, /<title>New version: Doc a<\/title>/);
  assert.match(
    feed,
    /href="https:\/\/whosonfirst\.ai\/standards\/timeline\/#a-2026-11-20-version"/,
  );
  // what an event says is text: escaped once in its summary, and in its
  // content once for the HTML and again for the XML
  assert.match(feed, /<summary>A &lt;b&gt; &amp; c\.<\/summary>/);
  assert.match(feed, /&lt;p&gt;A &amp;lt;b&amp;gt; &amp;amp; c\.&lt;\/p&gt;/);
  assert.ok(!feed.includes("<b>"));
});

test("a feed entry is the event as the timeline gives it, in HTML, with what happened in plain text and its kind and document as categories", () => {
  const log = [
    base,
    event({
      kind: "version",
      date: "2026-11",
      summary: "Revision `-02`, under [the tracker](/standards/#a) & <b>.",
      version: {
        label: "-02",
        name: "draft-a-02",
        url: "https://example.org/a-02",
      },
      changes: ["Adds `x`."],
      changesSource: "https://example.org/diff",
      corrected: { on: "2026-11-25", note: "The <month>." },
    }),
    event({
      entry: undefined,
      subject: "A meeting",
      kind: "discussion",
      summary: "Met.",
      reported: true,
    }),
  ];
  const feed = feedOf(log, ORIGIN, (id) => `Doc ${id}`, format);
  const [version, meeting] = feed.split("<entry>").slice(1);
  const content = (entry) =>
    unxml(entry.match(/<content type="html">([^<]*)<\/content>/)[1]);
  const summary = (entry) =>
    unxml(entry.match(/<summary>([^<]*)<\/summary>/)[1]);
  const categories = (entry) =>
    [...entry.matchAll(/<category ([^>]*)\/>/g)].map((m) => m[1]);

  // when it happened, what, what changed, the correction and the links, with
  // a link on the site given in full: the feed is read away from it
  assert.equal(
    content(version),
    [
      "<p>Happened November 2026</p>",
      '<p>Revision <code>-02</code>, under <a href="https://whosonfirst.ai/standards/#a">the tracker</a> &amp; &lt;b&gt;.</p>',
      "<ul><li>Adds <code>x</code>.</li></ul>",
      "<p>Corrected: The &lt;month&gt;.</p>",
      '<p><a href="https://example.org/history">Source</a> · <a href="https://example.org/diff">What changed</a> · <a href="https://example.org/a-02">draft-a-02</a></p>',
    ].join("\n"),
  );
  assert.match(
    content(meeting),
    /<p><a href="https:\/\/example\.org\/history">Reported by this source<\/a><\/p>$/,
  );
  // what happened alone, with no formatting, for a service that posts a line
  assert.equal(summary(version), "Revision -02, under the tracker & <b>.");
  assert.equal(summary(meeting), "Met.");
  // the kind always, and the document where the event is about one
  assert.deepEqual(categories(version), [
    'scheme="tag:whosonfirst.ai,2026:standards/kind" term="version" label="New version"',
    'scheme="tag:whosonfirst.ai,2026:standards/entry" term="a" label="Doc a"',
  ]);
  assert.deepEqual(categories(meeting), [
    'scheme="tag:whosonfirst.ai,2026:standards/kind" term="discussion" label="Discussed"',
  ]);
  // the HTML is escaped in the XML, so none of it is an element of the feed
  for (const tag of ["<p>", "<code>", "<a ", "<ul>", "<b>"])
    assert.ok(!feed.includes(tag), `the feed has ${tag} unescaped`);
});

test("what moved in a year is what changed where a document is, and what was marked notable", () => {
  const log = [
    event({
      kind: "publication",
      date: "2026-08",
      recorded: "2026-11-09",
      summary: "Published.",
    }),
    event({
      kind: "process",
      date: "2026-10-28",
      recorded: "2026-11-11",
      summary: "A step.",
    }),
    event({
      kind: "call",
      date: "2026-11-13",
      recorded: "2026-11-19",
      summary: "Ended.",
      notable: true,
    }),
    event({
      kind: "adoption",
      date: "2025-12-01",
      recorded: "2026-11-19",
      summary: "Last year.",
    }),
    base,
  ];
  assert.deepEqual(
    movedIn(log, "2026").map(
      (g) => `${g.key}: ${g.events.map((e) => e.summary).join(" ")}`,
    ),
    ["2026-08: Published.", "2026-11: Ended."],
  );
});

/* ───────────── What one specification cites of another ───────────── */

test("every citation names versions the log knows", () => {
  assert.deepEqual(validateCitations(citations, history, ids), []);
});

test("a citation is refused unless both its versions are in the log", () => {
  const log = [
    base,
    {
      ...base,
      entry: "b",
      version: { label: "v2", url: "https://example.org/b", date: "2026-10" },
    },
  ];
  const cite = (over) => ({
    from: "b@v2",
    to: "a@-01",
    kind: "normative",
    how: "requires",
    source: "https://example.org/b#refs",
    ...over,
  });
  const wrong = (c, pattern) => {
    const found = validateCitations([c], log, ["a", "b"]);
    assert.ok(
      found.some((l) => pattern.test(l)),
      `expected ${pattern}, got ${JSON.stringify(found)}`,
    );
  };
  assert.deepEqual(validateCitations([cite({})], log, ["a", "b"]), []);
  // a document cited with no revision named
  assert.deepEqual(validateCitations([cite({ to: "a" })], log, ["a", "b"]), []);
  wrong(cite({ to: "a@-09" }), /the log has no version -09 of "a"/);
  wrong(cite({ from: "b" }), /names a version/);
  wrong(cite({ to: "c@-01" }), /"c" is not a tracker entry/);
  wrong(cite({ from: "a@-01" }), /does not cite itself/);
  wrong(cite({ source: "" }), /no source/);
  wrong(cite({ how: " " }), /how it is cited/);
  const twice = validateCitations([cite({}), cite({})], log, ["a", "b"]);
  assert.ok(twice.some((l) => /listed twice/.test(l)));
});

test("whether a cited revision is still current is read from the log", () => {
  const cite = {
    from: "b@v2",
    to: "a@-01",
    kind: "normative",
    how: "requires",
    source: "https://example.org/",
  };
  const b = {
    ...base,
    entry: "b",
    version: { label: "v2", url: "https://example.org/b", date: "2026-10" },
  };
  const [now] = readCitations([cite], [base, b]);
  assert.equal(now.behind, false);
  assert.equal(now.current, "-01");
  // the cited document publishes a revision: nothing in the citation changes, and it is behind
  const later = event({
    kind: "version",
    version: { label: "-02", url: "https://example.org/a-02" },
  });
  const [then] = readCitations([cite], [base, b, later]);
  assert.equal(then.behind, true);
  assert.equal(then.current, "-02");
  assert.equal(then.superseded, false);
  // a version is written as its publisher writes it: its full name where the log has one
  const named = event({
    kind: "version",
    date: "2026-11-21",
    version: {
      label: "-03",
      name: "draft-example-a-03",
      url: "https://example.org/a-03",
    },
  });
  const [full] = readCitations([cite], [base, b, later, named]);
  assert.equal(full.currentName, "draft-example-a-03");
  assert.equal(full.toName, "-01");
  assert.equal(full.fromName, "v2");
  // a document cited with no revision named is never behind
  assert.equal(
    readCitations([{ ...cite, to: "a" }], [base, b, later])[0].behind,
    false,
  );
});

test("a page's own sentence gets a version's name from the log, or the build stops", async () => {
  const { cited, current, currentDate } = await import(
    "../../src/data/history/says.ts"
  );
  const now = currentOf(history, "oauth-2-1").version;
  assert.equal(current("oauth-2-1"), now.name);
  assert.match(current("oauth-2-1"), /^draft-ietf-oauth-v2-1-\d+$/);
  assert.match(currentDate("oauth-2-1"), /^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
  assert.equal(
    cited("mcp-authorization@2026-07-28", "oauth-2-1"),
    "draft-ietf-oauth-v2-1-13",
  );
  // nothing to give: an entry with no version, a citation that is not there, one that names no revision
  assert.throws(() => current("aws-iam-roles"), /no current version/);
  assert.throws(
    () => cited("mcp-authorization@2026-07-28", "id-jag"),
    /no citation/,
  );
  assert.throws(() => cited("aauth-hardt@-11", "signature-key"), /no citation/);
});

// A flow that reads a version from the log has to be dated by the log's
// events for that standard, which it is only if it lists the standard.
test("a flow that names a standard's version from the log lists that standard", () => {
  const dir = new URL("../../src/data/flows/", import.meta.url);
  const wrong = [];
  for (const file of readdirSync(dir)) {
    const text = readFileSync(new URL(file, dir), "utf8");
    const listed = /standards:\s*\[([^\]]*)\]/.exec(text)?.[1] ?? "";
    for (const [, id] of text.matchAll(
      /\b(?:current|currentDate)\("([^"]+)"\)/g,
    ))
      if (!listed.includes(`"${id}"`)) wrong.push(`${file}: ${id}`);
    for (const [, id] of text.matchAll(/\bcited\("[^"]+",\s*"([^"]+)"\)/g))
      if (!listed.includes(`"${id}"`)) wrong.push(`${file}: ${id}`);
  }
  assert.deepEqual(wrong, []);
});
