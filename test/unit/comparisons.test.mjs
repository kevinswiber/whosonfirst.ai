// The comparisons under /compare/, in src/data/comparisons/: each is written
// by hand, as a lesson is, so this holds each to the shape the page draws and
// to the two flows it compares. What a comparison says is checked against its
// flows by whoever writes it; what can be checked by rule is checked here.
//
// Node strips the types from the files as it loads them; they import types only.
import { strict as assert } from "node:assert";
import { readdirSync } from "node:fs";
import { test } from "node:test";

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
  assert.ok(comparisons.length > 0);
  for (const { file, comparison } of comparisons)
    assert.equal(file, `${comparison.flows.join("-vs-")}.ts`);
});

test("each comparison answers its question and gives each flow the conditions that choose it", () => {
  for (const { file, comparison: c } of comparisons) {
    assert.match(c.question, /\?$/, `${file}: the heading is a question`);
    for (const text of [c.answer, c.description, c.shared])
      assert.ok(text.trim().length > 60, `${file}: an opening is missing`);
    assert.equal(c.choose.length, 2, file);
    for (const conditions of c.choose)
      assert.ok(
        conditions.length >= 2,
        `${file}: one condition is not a choice`,
      );
  }
});

test("a figure asks the same questions of both flows, and shows each flow's own listings", () => {
  for (const { file, comparison: c, flows } of comparisons) {
    const { cast, questions, sides } = c.figure;
    assert.ok(questions.length >= 3, `${file}: fewer than three questions`);
    assert.equal(sides.length, 2, file);
    sides.forEach((side, i) => {
      assert.equal(side.hops.length, cast.length - 1, `${file}: hops`);
      assert.equal(side.findings.length, questions.length, `${file}: findings`);
      assert.ok(side.shows.length > 0, `${file}: a side shows nothing`);
      for (const { step } of side.shows)
        assert.ok(
          flows[i].steps[step - 1]?.code,
          `${file}: step ${step} of ${flows[i].slug} has no listing to show`,
        );
      for (const finding of side.findings)
        assert.ok(
          finding.verdict in RANK,
          `${file}: an answer with no verdict`,
        );
    });
  }
});

// A figure in which one flow is never the better answer is not a comparison of
// two choices: it is an argument for one of them. Either each flow comes out
// ahead on some question, or the two are level on every one.
test("neither flow comes out ahead on every question that tells them apart", () => {
  for (const { file, comparison: c } of comparisons) {
    const [a, b] = c.figure.sides.map((s) =>
      s.findings.map((f) => RANK[f.verdict]),
    );
    const ahead = [
      a.some((rank, i) => rank > b[i]),
      b.some((rank, i) => rank > a[i]),
    ];
    assert.equal(ahead[0], ahead[1], `${file}: only one flow is ever ahead`);
  }
});

test("each point gives both flows' sides, and the steps it names are steps of those flows", () => {
  for (const { file, comparison: c, flows } of comparisons) {
    assert.ok(c.points.length >= 5, `${file}: fewer than five points`);
    for (const point of c.points) {
      assert.equal(point.values.length, 2, `${file}: ${point.on}`);
      for (const value of point.values)
        assert.ok(value.trim(), `${file}: ${point.on} has an empty side`);
      (point.steps ?? []).forEach((numbers, i) => {
        for (const n of numbers)
          assert.ok(
            flows[i].steps[n - 1],
            `${file}: ${point.on} names step ${n} of ${flows[i].slug}`,
          );
      });
    }
  }
});

// The site's prose uses typographic quotes and apostrophes; its code does not.
test("a comparison's prose is set as the site's is: no straight quote outside code", () => {
  const prose = (value) =>
    typeof value === "string"
      ? [value]
      : Array.isArray(value)
        ? value.flatMap(prose)
        : value && typeof value === "object"
          ? Object.values(value).flatMap(prose)
          : [];
  for (const { file, comparison } of comparisons)
    for (const text of prose(comparison)) {
      const outside = text.replace(/`[^`]*`/g, "");
      assert.doesNotMatch(outside, /['"]/, `${file}: “${text.slice(0, 60)}…”`);
      assert.doesNotMatch(outside, /—/, `${file}: “${text.slice(0, 60)}…”`);
    }
});
