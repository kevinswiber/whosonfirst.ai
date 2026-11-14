// The decision guide's rules and the names it gives to situations, in
// src/data/guide.ts and src/lib/guide-rules.ts: how one rule is chosen over
// another, that every combination of answers has exactly one name, and that a
// situation's page, read before the other questions are answered, leaves out
// nothing the guide would say once they are.
//
// Node strips the types from the files as it loads them; they import types only.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { glossary } from "../../src/data/glossary.ts";
import {
  cautions,
  questions,
  rules,
  situations,
} from "../../src/data/guide.ts";
import {
  compatible,
  matches,
  possibleStarts,
  recommend,
  situationFor,
} from "../../src/lib/guide-rules.ts";

const answers = (id) =>
  questions.find((q) => q.id === id).options.map((o) => o.value);

/** Every way of answering all of these questions. */
const combinations = (ids) =>
  ids.reduce(
    (sets, id) =>
      sets.flatMap((a) => answers(id).map((v) => ({ ...a, [id]: v }))),
    [{}],
  );

test("a situation is named from the first two questions, by one answer to each", () => {
  for (const s of situations) {
    for (const [q, values] of Object.entries(s.when)) {
      assert.ok(["principal", "human"].includes(q), `${s.slug} names "${q}"`);
      assert.equal(values.length, 1, `${s.slug}: answers to "${q}"`);
      assert.ok(answers(q).includes(values[0]), `${s.slug}: ${q}=${values[0]}`);
    }
  }
});

// Written out, not worked out with the function under test.
const NAMES = {
  "user present": "person-present",
  "user reachable": "person-reachable",
  "user absent": "person-unavailable",
  "self present": "own-authority",
  "self reachable": "own-authority",
  "self absent": "own-authority",
};

test("every combination of answers has the one name its first two answers give it", () => {
  const all = combinations(questions.map((q) => q.id));
  assert.equal(all.length, 1080);
  for (const a of all) {
    const expected = NAMES[`${a.principal} ${a.human}`];
    assert.ok(expected, `${a.principal} ${a.human}`);
    assert.equal(
      situationFor(situations, a)?.slug,
      expected,
      JSON.stringify(a),
    );
    assert.equal(
      situations.filter((s) => matches(s.when, a, true)).length,
      1,
      JSON.stringify(a),
    );
  }
  assert.deepEqual(
    [...new Set(Object.values(NAMES))].sort(),
    situations.map((s) => s.slug).sort(),
  );
});

test("there is no name until the questions it comes from are answered", () => {
  assert.equal(situationFor(situations, {}), undefined);
  assert.equal(situationFor(situations, { principal: "user" }), undefined);
  assert.equal(situationFor(situations, { human: "absent" }), undefined);
  assert.equal(
    situationFor(situations, { target: "api", runtime: "k8s", risk: "read" }),
    undefined,
  );
  assert.equal(
    situationFor(situations, { principal: "self" })?.slug,
    "own-authority",
  );
});

// recommend, against rules made up for the purpose.
const rule = (flow, role, when, extra = {}) => ({
  flow,
  role,
  when,
  why: `${flow} ${role} ${JSON.stringify(when)}`,
  ...extra,
});

test("a rule needs one of its questions answered, and none answered against it", () => {
  const when = { principal: ["user"], target: ["api", "mcp"] };
  assert.equal(matches(when, {}), false);
  assert.equal(matches(when, { risk: "read" }), false);
  assert.equal(matches(when, { principal: "user" }), true);
  assert.equal(matches(when, { principal: "user", target: "web" }), false);
  assert.equal(matches(when, { principal: "user" }, true), false);
  assert.equal(matches(when, { principal: "user", target: "mcp" }, true), true);
  assert.equal(compatible(when, {}), true);
  assert.equal(compatible(when, { risk: "read" }), true);
  assert.equal(compatible(when, { target: "web" }), false);
});

test("a flow is listed once: the stronger heading, then more answers matched, then the earlier rule", () => {
  const a = { principal: "user", human: "absent", target: "api" };
  const made = [
    rule("x", "consider", {
      principal: ["user"],
      human: ["absent"],
      target: ["api"],
    }),
    rule("x", "add", { principal: ["user"] }),
    rule("y", "start", { principal: ["user"] }),
    rule("y", "start", { principal: ["user"], human: ["absent"] }),
    rule("z", "start", { principal: ["user"] }, { weight: 1 }),
    rule("z", "start", { human: ["absent"] }, { weight: 9 }),
  ];
  const got = recommend(made, a);
  assert.deepEqual(
    got.add.map((r) => r.why),
    [made[1].why],
    "a heading outranks a closer match",
  );
  assert.deepEqual(got.consider, []);
  assert.deepEqual(
    got.start.map((r) => r.why),
    [made[3].why, made[4].why],
    "more answers matched wins, and a tie keeps the earlier rule whatever its weight",
  );
});

test("under a heading, flows are ordered by answers matched and then by weight", () => {
  const got = recommend(
    [
      rule("light", "start", { principal: ["user"] }, { weight: 1 }),
      rule("heavy", "start", { principal: ["user"] }, { weight: 9 }),
      rule("close", "start", { principal: ["user"], human: ["absent"] }),
    ],
    { principal: "user", human: "absent" },
  );
  assert.deepEqual(
    got.start.map((r) => r.flow),
    ["close", "heavy", "light"],
  );
});

// A situation's page lists possibleStarts for the answers its name stands for.
const fixedFor = (s) =>
  Object.fromEntries(Object.entries(s.when).map(([q, v]) => [q, v[0]]));
const holds = (when, a) =>
  Object.entries(when).every(([q, values]) => values.includes(a[q]));

test("a situation’s page has every flow the guide starts with, however the other questions are answered, and each reason it gives", () => {
  for (const s of situations) {
    const fixed = fixedFor(s);
    const listed = possibleStarts(rules, fixed);
    const rest = questions.map((q) => q.id).filter((q) => !(q in fixed));
    for (const others of combinations(rest)) {
      const a = { ...fixed, ...others };
      const mine = listed.filter((r) => holds(r.when, a));
      const guide = recommend(rules, a).start;
      assert.deepEqual(
        [...new Set(mine.map((r) => r.flow))].sort(),
        guide.map((r) => r.flow).sort(),
        `${s.slug} ${JSON.stringify(others)}`,
      );
      for (const g of guide) {
        assert.ok(
          mine.some((r) => r.flow === g.flow && r.why === g.why),
          `${s.slug} ${JSON.stringify(others)}: the guide’s reason for ${g.flow} is not on the page`,
        );
      }
    }
  }
});

test("a situation’s page lists no rule that never applies, and none twice", () => {
  for (const s of situations) {
    const fixed = fixedFor(s);
    const listed = possibleStarts(rules, fixed);
    assert.equal(new Set(listed).size, listed.length);
    const rest = questions.map((q) => q.id).filter((q) => !(q in fixed));
    const all = combinations(rest).map((o) => ({ ...fixed, ...o }));
    for (const r of listed) {
      assert.ok(
        all.some(
          (a) =>
            holds(r.when, a) &&
            recommend(rules, a).start.some((g) => g.why === r.why),
        ),
        `${s.slug}: the guide never gives this reason for ${r.flow}`,
      );
    }
  }
});

test("what a partly answered guide leaves out is on the situation’s page", () => {
  const starts = (slug) =>
    possibleStarts(rules, fixedFor(situations.find((s) => s.slug === slug)));
  for (const s of situations) {
    assert.ok(
      starts(s.slug).some(
        (r) =>
          r.flow === "credential-broker" && r.when.runtime.join() === "sandbox",
      ),
      `${s.slug}: nothing for a sandbox`,
    );
  }
  // one flow, two rules for different answers: both are kept
  const own = starts("own-authority").filter(
    (r) => r.flow === "client-credentials",
  );
  assert.deepEqual(own.map((r) => r.when.runtime.join()).sort(), [
    "headless,k8s,managed,sandbox",
    "local",
  ]);
  // one flow, a rule that replaces another when no one is there: only that one
  const away = starts("person-unavailable").filter(
    (r) => r.flow === "cross-app-access",
  );
  assert.equal(away.length, 1);
  assert.deepEqual(away[0].when.human, ["absent"]);

  const warned = (slug) => {
    const fixed = fixedFor(situations.find((s) => s.slug === slug));
    return cautions.filter((c) => compatible(c.when, fixed));
  };
  for (const s of situations) {
    assert.ok(
      warned(s.slug).some((c) => c.when.runtime?.join() === "local"),
      `${s.slug}: no caution for a local agent`,
    );
  }
  assert.ok(
    warned("own-authority").some(
      (c) => c.when.risk?.join() === "irreversible" && c.when.human,
    ),
    "own-authority: no caution for irreversible actions with no one there",
  );
  assert.ok(
    !warned("own-authority").some((c) => c.when.principal?.join() === "user"),
    "own-authority: a caution about a person’s authority",
  );
});

test("no two situations share a name or an address, and none is a glossary term", () => {
  const terms = new Set(
    glossary
      .flatMap((t) => [t.term, ...(t.aka ?? [])])
      .map((t) => t.toLowerCase()),
  );
  const seen = new Set();
  for (const s of situations) {
    assert.match(s.slug, /^[a-z]+(-[a-z]+)*$/, s.slug);
    for (const key of [s.slug, s.name.toLowerCase()]) {
      assert.ok(!seen.has(key), `"${key}" is used twice`);
      seen.add(key);
    }
    assert.ok(
      !terms.has(s.name.toLowerCase()),
      `“${s.name}” is a term the glossary defines`,
    );
    assert.ok(s.title.startsWith(`${s.name}: `), `${s.slug}: title`);
  }
});
