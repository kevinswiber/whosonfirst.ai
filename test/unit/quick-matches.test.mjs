import { strict as assert } from "node:assert";
import { test } from "node:test";
import { quickMatches } from "../../src/lib/quick-matches.mjs";

const record = (title, aliases = [], summary = "") => ({
  href: `/example/${encodeURIComponent(title)}/`,
  title,
  type: "Page",
  aliases,
  summary,
});

test("identifiers ignore punctuation and space, and rank ahead of mentions", () => {
  const reference = record("Proof of possession", ["RFC 9449"]);
  const mention = record(
    "Access tokens",
    [],
    "RFC 9449 binds the token to a key.",
  );
  for (const query of ["rfc9449", "RFC 9449", "RFC-9449", " RFC.9449 "])
    assert.equal(quickMatches([mention, reference], query)[0], reference);
  assert.equal(quickMatches([mention, reference], "rfc944")[0], reference);
});

test("quick matches put exact aliases, leading names and other name tokens before summaries", () => {
  const exact = record("Device authorization", ["Device"]);
  const leading = record("Device flow");
  const inside = record("OAuth device grant");
  const summary = record("Headless sign-in", [], "Use a second device.");
  const inputs = [summary, inside, leading, exact];
  assert.deepEqual(quickMatches(inputs, "device"), [
    exact,
    leading,
    inside,
    summary,
  ]);
  assert.deepEqual(quickMatches(inputs, "oauth dev"), [inside]);
  assert.deepEqual(quickMatches(inputs, "dev grant"), [inside]);
  assert.deepEqual(quickMatches(inputs, "less"), []);
  assert.deepEqual(quickMatches(inputs, "oauth missing"), []);
  assert.deepEqual(quickMatches(inputs, "dveice"), []);
});

test("quick matches return five at most, preserve tied order and ignore blank input", () => {
  const inputs = Array.from({ length: 8 }, (_, i) => record(`OAuth case ${i}`));
  assert.deepEqual(quickMatches(inputs, "oau"), inputs.slice(0, 5));
  for (const query of ["", "  ", "?!"])
    assert.deepEqual(quickMatches(inputs, query), []);
});
