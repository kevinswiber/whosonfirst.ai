// A comparison under /compare/ quotes what one flow's page says about another.
// This checks the quoting, in src/lib/compare.ts: that a passage is found
// wherever a flow's text links to the other flow, that it is taken whole and
// unchanged, and that nothing is found where there is no link.
//
// Node strips the types from the file as it loads it; it imports types only.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { passages } from "../../src/lib/compare.ts";

const flow = (over) => ({
  slug: "one",
  short: "One",
  summary: "",
  fits: [],
  watchOut: [],
  steps: [],
  ...over,
});
const other = flow({ slug: "two", short: "Two" });

test("a paragraph that links to the other flow is quoted whole, and its neighbors are not", () => {
  const from = flow({
    summary:
      "First paragraph, about One.\n\nSecond, which says [Two](/flows/two/) differs. It has a second sentence.\n\nThird, about [Three](/flows/three/).",
  });
  assert.deepEqual(passages(from, other), [
    {
      where: "In its opening",
      text: "Second, which says [Two](/flows/two/) differs. It has a second sentence.",
    },
  ]);
});

test("passages come from every part of a flow's page, each headed by where it is from, in the page's order", () => {
  const from = flow({
    fits: ["When [Two](/flows/two/) cannot be used.", "Unrelated."],
    steps: [
      { title: "Ask", body: "Nothing here." },
      { title: "Answer", body: "As in [Two](/flows/two/#step-3)." },
    ],
    watchOut: ["Do not confuse it with [Two](/flows/two/)."],
    notes: [
      { title: "One or Two?", body: "Use [Two](/flows/two/) when in doubt." },
    ],
    sections: [
      {
        id: "more",
        title: "Variations",
        intro: "Some.",
        parts: [{ title: "With Two", body: "See [Two](/flows/two/)." }],
      },
    ],
  });
  assert.deepEqual(
    passages(from, other).map((p) => p.where),
    [
      "Under “Use it when”",
      "In step 2, “Answer”",
      "Under “Variations”, in “With Two”",
      "Under “Watch out for”",
      "Under “One or Two?”",
    ],
  );
});

test("a flow that says it is another with a difference has that sentence quoted with both names in it", () => {
  const from = flow({ like: { flow: "two", except: "it runs twice." } });
  assert.deepEqual(passages(from, other), [
    {
      where: "Where it says what it resembles",
      text: "One is the same as [Two](/flows/two/), except that it runs twice.",
    },
  ]);
  // the same sentence says nothing about a third flow
  assert.deepEqual(passages(from, flow({ slug: "three", short: "Three" })), []);
});

test("a flow that names the other without a link to it is not quoted", () => {
  const from = flow({
    summary: "Two is mentioned, and so is /flows/twofold/, but not linked.",
  });
  assert.deepEqual(passages(from, other), []);
});
