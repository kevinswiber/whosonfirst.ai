// The decision guide's rules and the names it gives to cases, in
// src/data/guide.ts and src/lib/guide-rules.ts: how one rule is chosen over
// another, that every combination of answers has exactly one name, and that a
// case's page, read before the other questions are answered, leaves out
// nothing the guide would say once they are.
//
// Node strips the types from the files as it loads them; they import types only.
import { strict as assert } from "node:assert";
import { readdirSync } from "node:fs";
import { test } from "node:test";
import { glossary } from "../../src/data/glossary.ts";
import { cases, cautions, questions, rules } from "../../src/data/guide.ts";
import {
  caseFor,
  compatible,
  matches,
  narrowable,
  possibleStarts,
  recommend,
} from "../../src/lib/guide-rules.ts";

// The questions under “More questions”, which the guide tells recommend about.
const FURTHER = questions.filter((q) => q.advanced).map((q) => q.id);

const answers = (id) =>
  questions.find((q) => q.id === id).options.map((o) => o.value);

/** Every way of answering all of these questions. */
const combinations = (ids) =>
  ids.reduce(
    (sets, id) =>
      sets.flatMap((a) => answers(id).map((v) => ({ ...a, [id]: v }))),
    [{}],
  );

test("a case is named from the first two questions, by one answer to each", () => {
  for (const s of cases) {
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
  // 2 × 3 × 4 × 3 × 5 × 3 for the six asked first, and 2 for each of the five more
  assert.equal(all.length, 1080 * 32);
  for (const a of all) {
    const expected = NAMES[`${a.principal} ${a.human}`];
    assert.ok(expected, `${a.principal} ${a.human}`);
    assert.equal(caseFor(cases, a)?.slug, expected, JSON.stringify(a));
    assert.equal(
      cases.filter((s) => matches(s.when, a, true)).length,
      1,
      JSON.stringify(a),
    );
  }
  assert.deepEqual(
    [...new Set(Object.values(NAMES))].sort(),
    cases.map((s) => s.slug).sort(),
  );
});

test("there is no name until the questions it comes from are answered", () => {
  assert.equal(caseFor(cases, {}), undefined);
  assert.equal(caseFor(cases, { principal: "user" }), undefined);
  assert.equal(caseFor(cases, { human: "absent" }), undefined);
  assert.equal(
    caseFor(cases, { target: "api", runtime: "k8s", risk: "read" }),
    undefined,
  );
  assert.equal(caseFor(cases, { principal: "self" })?.slug, "own-authority");
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
  const got = recommend(made, a, []);
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
    [],
  );
  assert.deepEqual(
    got.start.map((r) => r.flow),
    ["close", "heavy", "light"],
  );
});

// A case's page lists possibleStarts for the answers its name stands for.
const fixedFor = (s) =>
  Object.fromEntries(Object.entries(s.when).map(([q, v]) => [q, v[0]]));
const holds = (when, a) =>
  Object.entries(when).every(([q, values]) => values.includes(a[q]));

test("a case’s page has every flow the guide starts with, however the other questions are answered, and each reason it gives", () => {
  for (const s of cases) {
    const fixed = fixedFor(s);
    const listed = possibleStarts(rules, fixed);
    const rest = questions.map((q) => q.id).filter((q) => !(q in fixed));
    for (const others of combinations(rest)) {
      const a = { ...fixed, ...others };
      const mine = listed.filter((r) => holds(r.when, a));
      const guide = recommend(rules, a, FURTHER).start;
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

test("a case’s page lists no rule that never applies, and none twice", () => {
  for (const s of cases) {
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
            recommend(rules, a, FURTHER).start.some((g) => g.why === r.why),
        ),
        `${s.slug}: the guide never gives this reason for ${r.flow}`,
      );
    }
  }
});

test("what a partly answered guide leaves out is on the case’s page", () => {
  const starts = (slug) =>
    possibleStarts(rules, fixedFor(cases.find((s) => s.slug === slug)));
  for (const s of cases) {
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
    const fixed = fixedFor(cases.find((s) => s.slug === slug));
    return cautions.filter((c) => compatible(c.when, fixed));
  };
  for (const s of cases) {
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

test("no two cases share a name or an address, and none is a glossary term", () => {
  const terms = new Set(
    glossary
      .flatMap((t) => [t.term, ...(t.aka ?? [])])
      .map((t) => t.toLowerCase()),
  );
  const seen = new Set();
  for (const s of cases) {
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

// ── what the guide can bring up, and what the further questions do ──

const first = questions.filter((q) => !q.advanced).map((q) => q.id);
const further = questions.filter((q) => q.advanced).map((q) => q.id);
const flowsIn = (groups) =>
  new Set(Object.values(groups).flatMap((list) => list.map((r) => r.flow)));

// Every flow in the catalog, read from its own file, as the comparisons test does.
const catalog = async () => {
  const dir = new URL("../../src/data/flows/", import.meta.url);
  const slugs = [];
  for (const file of readdirSync(dir).filter(
    (f) => f.endsWith(".ts") && f !== "index.ts",
  )) {
    const mod = await import(new URL(file, dir));
    for (const v of Object.values(mod)) if (v?.slug) slugs.push(v.slug);
  }
  return slugs.sort();
};

// A flow the guide never brings up, and why. None today: every flow on the
// site is a recommendation for some way of answering the first six questions.
// One added here needs a reason a reader can check against its page.
const NEVER = {};

test("every flow on the site is one the guide brings up for some answers to the first six questions, unless it says why not", async () => {
  const slugs = await catalog();
  assert.ok(slugs.length > 20, `only ${slugs.length} flows found`);
  const reached = new Set();
  for (const a of combinations(first))
    for (const f of flowsIn(recommend(rules, a, FURTHER))) reached.add(f);
  for (const slug of slugs) {
    if (slug in NEVER) {
      assert.ok(!reached.has(slug), `${slug} is listed as never reached`);
      assert.ok(NEVER[slug].length > 20, `${slug}: say why`);
    } else assert.ok(reached.has(slug), `the guide never recommends ${slug}`);
  }
});

test("the further questions are asked after the first six and change no name", () => {
  assert.deepEqual(first, [
    "principal",
    "human",
    "target",
    "boundary",
    "runtime",
    "risk",
  ]);
  assert.equal(
    questions.findIndex((q) => q.advanced),
    first.length,
    "a further question comes before one asked first",
  );
  for (const s of cases)
    for (const q of Object.keys(s.when)) assert.ok(first.includes(q), q);
  for (const c of cautions)
    for (const q of Object.keys(c.when))
      assert.ok(first.includes(q), `a caution waits on ${q}`);
});

test("an answer to a further question never changes where to start and never adds a flow", () => {
  const extras = combinations(further);
  for (const a of combinations(first)) {
    const before = recommend(rules, a, FURTHER);
    const shown = flowsIn(before);
    for (const extra of extras) {
      const after = recommend(rules, { ...a, ...extra }, FURTHER);
      assert.deepEqual(
        after.start.map((r) => [r.flow, r.why]),
        before.start.map((r) => [r.flow, r.why]),
        `${JSON.stringify(a)} ${JSON.stringify(extra)}`,
      );
      for (const f of flowsIn(after))
        assert.ok(
          shown.has(f),
          `${f} appears only after ${JSON.stringify(extra)}`,
        );
    }
  }
});

// Written out: each further question asks a fact these flows’ reasons depend on.
const TAKES_OUT = {
  onward: ["biscuit-delegation", "token-exchange", "transaction-tokens"],
  revoke: ["access-revocation"],
  cert: ["oauth-mtls"],
  gateway: ["wimse-workload-tokens"],
  buys: ["agent-payments"],
};

test("each further question takes out the flows whose reasons wait on it, and no others", () => {
  assert.deepEqual(Object.keys(TAKES_OUT), further);
  const out = Object.fromEntries(further.map((q) => [q, new Set()]));
  for (const a of combinations(first)) {
    const shown = flowsIn(recommend(rules, a, FURTHER));
    for (const q of further)
      for (const v of answers(q)) {
        const after = flowsIn(recommend(rules, { ...a, [q]: v }, FURTHER));
        for (const f of shown) if (!after.has(f)) out[q].add(f);
      }
  }
  for (const q of further)
    assert.deepEqual([...out[q]].sort(), TAKES_OUT[q], q);
  // answering yes keeps each one, and moves it up its list: it matches one more answer
  for (const [q, slugs] of Object.entries(TAKES_OUT))
    for (const slug of slugs)
      assert.ok(
        rules.some((r) => r.flow === slug && r.when[q]?.join() === "yes"),
        `${slug}: no rule for ${q}=yes`,
      );
});

test("a handoff to another agent keeps token exchange, whatever is said about the work going further", () => {
  for (const onward of [undefined, "yes", "no"]) {
    const a = {
      principal: "user",
      boundary: "same",
      target: "agent",
      ...(onward ? { onward } : {}),
    };
    assert.ok(
      flowsIn(recommend(rules, a, FURTHER)).has("token-exchange"),
      onward,
    );
  }
  assert.ok(
    !flowsIn(
      recommend(
        rules,
        {
          principal: "user",
          boundary: "same",
          target: "api",
          onward: "no",
        },
        FURTHER,
      ),
    ).has("token-exchange"),
  );
});

test("the guide counts what one more answer could take out, and nothing it could not", () => {
  const asks = questions.filter((q) => q.advanced);
  const a = {
    principal: "user",
    human: "present",
    target: "agent",
    boundary: "same",
    runtime: "k8s",
    risk: "irreversible",
  };
  assert.deepEqual([...narrowable(rules, asks, a)].sort(), [
    "access-revocation",
    "agent-payments",
    "biscuit-delegation",
    "oauth-mtls",
    "transaction-tokens",
    "wimse-workload-tokens",
  ]);
  // once those are answered, nothing is left to take out
  const all = {
    ...a,
    onward: "no",
    revoke: "no",
    cert: "no",
    gateway: "no",
    buys: "no",
  };
  assert.equal(narrowable(rules, asks, all).size, 0);
  // answered yes, the flow stays, and is not counted again
  assert.ok(!narrowable(rules, asks, { ...a, cert: "yes" }).has("oauth-mtls"));
  assert.equal(narrowable(rules, asks, {}).size, 0);
});

// Every way of answering some, all or none of these questions.
const partial = (ids) =>
  ids.reduce(
    (sets, id) =>
      sets.flatMap((a) => [a, ...answers(id).map((v) => ({ ...a, [id]: v }))]),
    [{}],
  );

test("every rule is brought up by one of the first six questions, not by a further one alone", () => {
  for (const r of rules)
    assert.ok(
      Object.keys(r.when).some((q) => first.includes(q)),
      `${r.flow}: ${JSON.stringify(r.when)}`,
    );
  // a rule that waits on a further answer is not brought up by it
  const made = [rule("x", "consider", { target: ["api"], cert: ["yes"] })];
  const shown = (a) => flowsIn(recommend(made, a, ["cert"]));
  assert.equal(shown({ principal: "self", cert: "yes" }).size, 0);
  assert.equal(shown({ target: "api" }).size, 1);
  assert.equal(shown({ target: "api", cert: "no" }).size, 0);
  assert.equal(shown({ target: "api", cert: "yes" }).size, 1);
});

test("with the first six answered in part or not at all, a further answer never adds a flow, or changes the start, the name or the cautions", () => {
  // one further answer at a time, and every way of answering all five
  const extras = [
    ...further.flatMap((q) => answers(q).map((v) => ({ [q]: v }))),
    ...combinations(further),
  ];
  const warned = (a) =>
    cautions.filter((c) => matches(c.when, a, true)).map((c) => c.text);
  for (const a of partial(first)) {
    const before = recommend(rules, a, FURTHER);
    const shown = flowsIn(before);
    for (const extra of extras) {
      const b = { ...a, ...extra };
      const after = recommend(rules, b, FURTHER);
      const at = `${JSON.stringify(a)} ${JSON.stringify(extra)}`;
      for (const f of flowsIn(after))
        assert.ok(shown.has(f), `${f} appears only after ${at}`);
      assert.deepEqual(
        after.start.map((r) => [r.flow, r.why]),
        before.start.map((r) => [r.flow, r.why]),
        at,
      );
      assert.equal(caseFor(cases, b)?.slug, caseFor(cases, a)?.slug, at);
      assert.deepEqual(warned(b), warned(a), at);
    }
  }
});

test("what one more answer could take out is counted with the first six answered in part", () => {
  const asks = questions.filter((q) => q.advanced);
  assert.ok(!narrowable(rules, asks, { principal: "self" }).has("oauth-mtls"));
  assert.ok(
    narrowable(rules, asks, { principal: "self", target: "api" }).has(
      "oauth-mtls",
    ),
  );
  // each one counted is shown, and taken out by some one answer
  const gone = (a, f) =>
    asks.some((q) =>
      q.options.some(
        (o) =>
          !flowsIn(recommend(rules, { ...a, [q.id]: o.value }, FURTHER)).has(f),
      ),
    );
  for (const a of partial(["principal", "human", "target", "boundary"])) {
    const shown = flowsIn(recommend(rules, a, FURTHER));
    for (const f of narrowable(rules, asks, a))
      assert.ok(shown.has(f) && gone(a, f), `${JSON.stringify(a)}: ${f}`);
  }
});
