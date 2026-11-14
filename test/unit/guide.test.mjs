// The names the decision guide gives to situations, in src/data/guide.ts: every
// pair of answers to the questions a name comes from has exactly one, and no
// name is a word the site already uses for something else.
//
// Node strips the types from the files as it loads them; they import types only.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { glossary } from "../../src/data/glossary.ts";
import { questions, situations } from "../../src/data/guide.ts";
import { matches, situationFor } from "../../src/lib/guide-rules.ts";

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

test("every combination of answers has exactly one name", () => {
  const all = combinations(questions.map((q) => q.id));
  assert.equal(all.length, 1080);
  for (const a of all) {
    const named = situations.filter((s) => matches(s.when, a, true));
    assert.equal(
      named.length,
      1,
      `${JSON.stringify(a)}: ${named.map((s) => s.name).join(", ") || "no name"}`,
    );
    assert.equal(situationFor(situations, a), named[0]);
  }
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
    "as-itself",
  );
  assert.equal(
    situationFor(situations, { principal: "user", human: "absent" })?.slug,
    "standing-order",
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
