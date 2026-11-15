// A page's date is the last change to anything it is made from, in
// src/lib/page-sources.ts. This checks that a change which reaches a page
// through shared data moves its date: a lesson through the list of lessons and
// the glossary, a flow through the standards it lists and its implementation
// record. And that a change to an entry the page does not show leaves it alone.
//
// Node strips the types from the file as it loads it; it imports nothing.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { datesFor, madeFrom } from "../../src/lib/page-sources.ts";

const site = {
  flows: [
    { slug: "dpop", standards: ["rfc9449", "rfc7519"] },
    { slug: "gnap", standards: ["rfc9635"] },
  ],
  lessons: [{ slug: "tokens", teaches: ["Access token", "Claim"] }],
  records: ["dpop"],
};
const day = (n) => `2026-11-${String(n).padStart(2, "0")}T12:00:00+00:00`;
/** The date a page gets when each named source last changed on the day given. */
const changed = (path, last) =>
  datesFor(
    madeFrom(path, site),
    Object.fromEntries(
      Object.entries(last).map(([name, n]) => [
        name,
        name.includes("#") ? { last: day(n) } : { first: day(1), last: day(n) },
      ]),
    ),
  );

test("a lesson is made from its page, its entry in the list of lessons and the terms it teaches", () => {
  assert.deepEqual(madeFrom("/learn/tokens/", site), [
    "src/pages/learn/tokens.astro",
    "src/data/learn/lessons.ts#tokens",
    "src/data/glossary.ts#Access token",
    "src/data/glossary.ts#Claim",
  ]);
});

test("a flow is made from its data, the standards it lists and its implementation record, where it has one", () => {
  assert.deepEqual(madeFrom("/flows/dpop/", site), [
    "src/data/flows/dpop.ts",
    "src/data/standards.ts#rfc9449",
    "src/data/standards.ts#rfc7519",
    "src/data/implementations/records.ts#dpop",
  ]);
  assert.deepEqual(madeFrom("/flows/gnap/", site), [
    "src/data/flows/gnap.ts",
    "src/data/standards.ts#rfc9635",
  ]);
});

test("a lesson's date moves when its title in the list of lessons does, or a term it teaches", () => {
  const page = { "src/pages/learn/tokens.astro": 11 };
  assert.equal(changed("/learn/tokens/", page).modified, day(11));
  const titled = changed("/learn/tokens/", {
    ...page,
    "src/data/learn/lessons.ts#tokens": 15,
  });
  assert.equal(titled.modified, day(15));
  assert.equal(titled.source, "src/data/learn/lessons.ts");
  assert.equal(
    changed("/learn/tokens/", { ...page, "src/data/glossary.ts#Claim": 13 })
      .modified,
    day(13),
  );
});

test("a flow's date moves when a standard it lists does, or its implementation record", () => {
  const flow = { "src/data/flows/dpop.ts": 12 };
  assert.equal(changed("/flows/dpop/", flow).modified, day(12));
  assert.equal(
    changed("/flows/dpop/", { ...flow, "src/data/standards.ts#rfc9449": 13 })
      .modified,
    day(13),
  );
  const evidence = changed("/flows/dpop/", {
    ...flow,
    "src/data/implementations/records.ts#dpop": 14,
  });
  assert.equal(evidence.modified, day(14));
  assert.equal(evidence.source, "src/data/implementations/records.ts");
});

test("a change to an entry a page does not show, or to the rest of a shared file, leaves its date alone", () => {
  const dates = changed("/flows/dpop/", {
    "src/data/flows/dpop.ts": 12,
    "src/data/standards.ts#rfc9635": 14,
    "src/data/implementations/records.ts#gnap": 14,
    "src/data/standards.ts": 14,
    "src/data/learn/lessons.ts#tokens": 15,
  });
  assert.equal(dates.modified, day(12));
});

test("a page was published when its own file was, however old the entries it shows", () => {
  const dates = datesFor(madeFrom("/flows/dpop/", site), {
    "src/data/flows/dpop.ts": { first: day(9), last: day(12) },
    "src/data/standards.ts#rfc9449": { last: day(3) },
  });
  assert.equal(dates.published, day(9));
  assert.equal(dates.modified, day(12));
  // and with no file of its own in the history, it has no dates at all
  assert.equal(
    datesFor(madeFrom("/flows/dpop/", site), {
      "src/data/standards.ts#rfc9449": { last: day(3) },
    }),
    undefined,
  );
});

test("an index that lists every entry is made from the whole file", () => {
  assert.ok(madeFrom("/standards/", site).includes("src/data/standards.ts"));
  assert.ok(madeFrom("/glossary/", site).includes("src/data/glossary.ts"));
  assert.ok(madeFrom("/learn/", site).includes("src/data/learn/lessons.ts"));
});
