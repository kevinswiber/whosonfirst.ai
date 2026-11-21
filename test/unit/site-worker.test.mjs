// What src/worker.ts does with a request that is not for a page: a search, at
// /search, goes to Search, another entrypoint of the same Worker. How it
// chooses between a page and its Markdown copy is in
// markdown-negotiation.test.mjs, and test/worker/search.test.mjs asks the
// running Worker, where the runtime makes the hand-off.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { CATALOG, siteSearch } from "../../src/search/search.ts";
import worker from "../../src/worker.ts";

const entrypoints = (fetch) => ({ exports: { Search: { fetch } } });

test("a search is handed to the Search entrypoint unchanged, and nothing else is", async () => {
  const handed = [];
  const ctx = entrypoints(async (request) => {
    handed.push(request);
    return new Response("answer", { headers: { "Cache-Control": "kept" } });
  });
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
  const answer = await worker.fetch(search, { ASSETS }, ctx);
  assert.equal(await answer.text(), "answer");
  assert.equal(answer.headers.get("Cache-Control"), "kept");
  assert.equal(handed[0], search, "the same request, with its headers");
  for (const path of ["/search/", "/search/quick-matches.json", "/searching/"])
    await worker.fetch(
      new Request(`https://whosonfirst.ai${path}`),
      { ASSETS },
      ctx,
    );
  assert.equal(handed.length, 1);

  const error = console.error;
  console.error = () => {};
  try {
    const fallback = await worker.fetch(
      new Request("https://whosonfirst.ai/search?q=CIBA"),
      { ASSETS },
      entrypoints(async () => {
        throw new Error("Search could not be reached");
      }),
    );
    assert.equal(await fallback.text(), "page", "what is at the address");
  } finally {
    console.error = error;
  }
});

test("a build that goes back to two Workers hands a search to the other one, and nothing else", async () => {
  const handed = [];
  const SEARCH = {
    fetch: async (request) => {
      handed.push(request);
      return new Response("from the other Worker");
    },
  };
  const ASSETS = { fetch: async () => new Response("page") };
  const own = entrypoints(async () => new Response("from this Worker"));
  const search = new Request("https://whosonfirst.ai/search?q=CIBA");
  const answer = await worker.fetch(search, { ASSETS, SEARCH }, own);
  assert.equal(await answer.text(), "from the other Worker");
  assert.equal(handed[0], search, "the same request, with its headers");
  const page = await worker.fetch(
    new Request("https://whosonfirst.ai/search/"),
    { ASSETS, SEARCH },
    own,
  );
  assert.equal(await page.text(), "page");
  assert.equal(handed.length, 1);
});

test("a search with no catalog to read says so, is not kept, and reads again next time", async () => {
  let reads = 0;
  const search = siteSearch();
  const env = {
    ASSETS: {
      fetch: async (request) => {
        assert.equal(new URL(request.url).pathname, CATALOG);
        reads++;
        return new Response("not found", { status: 404 });
      },
    },
  };
  for (const _ of [1, 2]) {
    const answer = await search(
      new Request("https://whosonfirst.ai/search?q=CIBA"),
      env,
    );
    assert.equal(answer.status, 503);
    assert.equal(answer.headers.get("Cache-Control"), "no-store");
  }
  assert.equal(reads, 2);
});
