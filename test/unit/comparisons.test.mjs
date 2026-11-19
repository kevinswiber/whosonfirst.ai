// The comparisons under /compare/, in src/data/comparisons/: each is written
// by hand, as a lesson is, so this holds each to the shape the page draws and
// to the two flows it compares. What a comparison says is checked against its
// flows by whoever writes it; what can be checked by rule is checked here.
//
// Node strips the types from the files as it loads them; they import types only.

import { readdirSync } from "node:fs";
import { assert, test } from "ubqtest";

const dir = new URL("../../src/data/comparisons/", import.meta.url);
const files = readdirSync(dir).filter((name) => name.includes("-vs-"));
const only = (module) => Object.values(module)[0];
const comparisons = await Promise.all(
  files.map(async (file) => {
    const comparison = only(await import(new URL(file, dir)));
    const flows = await Promise.all(
      comparison.flows.map(async (slug) =>
        only(await import(new URL(`../flows/${slug}.ts`, dir))),
      ),
    );
    return { file, comparison, flows };
  }),
);
const RANK = { yes: 2, partly: 1, no: 0 };

test("there is a comparison to check, and each is in a file named for its two flows", () => {
  assert(comparisons.length > 0);
  for (const { file, comparison } of comparisons)
    assert.equal(file, `${comparison.flows.join("-vs-")}.ts`);
});

for (const { file, comparison: c, flows } of comparisons) {
  test(`${file} answers its question and gives each flow the conditions that choose it`, () => {
    assert.match(c.question, /\?$/);
    for (const text of [c.answer, c.description, c.shared])
      assert(text.trim().length > 60);
    assert(c.gist.trim().length > 30);
    assert.equal(c.choose.length, 2);
    for (const conditions of c.choose) assert(conditions.length >= 2);
  });

  test(`${file}: a figure asks the same questions of both flows, and shows each flow's own listings`, () => {
    const { cast, questions, sides } = c.figure;
    assert(questions.length >= 3);
    // a question heads a column of the figure's table, where a long one crowds the rest
    for (const question of questions) assert(question.length <= 52);
    assert.equal(sides.length, 2);
    sides.forEach((side, i) => {
      assert.equal(side.hops.length, cast.length - 1);
      assert.equal(side.findings.length, questions.length);
      assert(side.shows.length > 0);
      for (const { step } of side.shows) assert(flows[i].steps[step - 1]?.code);
      for (const finding of side.findings) assert(finding.verdict in RANK);
    });
  });

  // A figure in which one flow is never the better answer is not a comparison of
  // two choices: it is an argument for one of them. Either each flow comes out
  // ahead on some question, or the two are level on every one.
  test(`${file}: neither flow comes out ahead on every question that tells them apart`, () => {
    const [a, b] = c.figure.sides.map((s) =>
      s.findings.map((f) => RANK[f.verdict]),
    );
    const ahead = [
      a.some((rank, i) => rank > b[i]),
      b.some((rank, i) => rank > a[i]),
    ];
    assert.equal(ahead[0], ahead[1]);
  });

  test(`${file}: each point gives both flows' sides, and the steps it names are steps of those flows`, () => {
    assert(c.points.length >= 5);
    for (const point of c.points) {
      assert.equal(point.values.length, 2);
      for (const value of point.values) assert(value.trim());
      (point.steps ?? []).forEach((numbers, i) => {
        for (const n of numbers) assert(flows[i].steps[n - 1]);
      });
    }
  });

  // The site's prose uses typographic quotes and apostrophes; its code does not.
  test(`${file}: prose is set as the site's is, with no straight quote or dash outside code`, () => {
    const prose = (value) =>
      typeof value === "string"
        ? [value]
        : Array.isArray(value)
          ? value.flatMap(prose)
          : value && typeof value === "object"
            ? Object.values(value).flatMap(prose)
            : [];
    const outside = prose(c).map((text) => text.replace(/`[^`]*`/g, ""));
    assert.deepEqual(
      outside.filter((text) => /['"]/.test(text)),
      [],
    );
    assert.deepEqual(
      outside.filter((text) => /—/.test(text)),
      [],
    );
  });
}
