// What src/worker.ts does with a request that is not for a page: a search, at
// /search, goes to the search Worker over its service binding. How it chooses
// between a page and its Markdown copy is in markdown-negotiation.test.mjs.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import worker from "../../src/worker.ts";

test("a search is handed to the search Worker unchanged, and nothing else is", async () => {
  const handed = [];
  const SEARCH = {
    fetch: async (request) => {
      handed.push(request);
      return new Response("answer", { headers: { "Cache-Control": "kept" } });
    },
  };
  const served = [];
  const ASSETS = {
    fetch: async (request) => {
      served.push(new URL(request.url).pathname);
      return new Response("page", { headers: { "Content-Type": "text/html" } });
    },
  };
  const search = new Request(
    "https://whosonfirst.ai/search?q=CIBA&format=json",
    {
      headers: {
        "Sec-Fetch-Site": "same-origin",
        "CF-Connecting-IP": "192.0.2.1",
      },
    },
  );
  const answer = await worker.fetch(search, { ASSETS, SEARCH });
  assert.equal(await answer.text(), "answer");
  assert.equal(answer.headers.get("Cache-Control"), "kept");
  assert.equal(handed[0], search, "the same request, with its headers");
  for (const path of ["/search/", "/search/quick-matches.json", "/searching/"])
    await worker.fetch(new Request(`https://whosonfirst.ai${path}`), {
      ASSETS,
      SEARCH,
    });
  assert.equal(handed.length, 1);

  const failing = {
    fetch: async () => {
      throw new Error("search Worker unreachable");
    },
  };
  const error = console.error;
  console.error = () => {};
  try {
    const fallback = await worker.fetch(
      new Request("https://whosonfirst.ai/search?q=CIBA"),
      { ASSETS, SEARCH: failing },
    );
    assert.equal(await fallback.text(), "page", "what is at the address");
  } finally {
    console.error = error;
  }
});
