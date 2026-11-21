// Search as the Worker runs it: the handler reads the catalog the build wrote
// beside the pages, and answers with this build's passages. The search
// service is a fixture. test/worker/search.test.mjs asks the running Worker.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { CATALOG, siteSearch } from "../../src/search/search.ts";
import { file } from "../support/site.mjs";

const marker = JSON.parse(file("search/release.json"));
const origin = "https://guide.example.test";

test("the build's release marker names the commit it was made from", () => {
  assert.equal(
    marker.commit,
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  );
  assert.match(marker.revision, /^[0-9a-f]{64}$/);
});

test("a search is answered from the build's own catalog, read once, and carries its release", async () => {
  const payload = file(CATALOG.slice(1));
  const record = JSON.parse(payload).records.find(
    ({ href }) => href === "/standards/rfc9449/",
  );
  let reads = 0;
  const env = {
    ASSETS: {
      fetch(request) {
        assert.equal(request.url, `${origin}${CATALOG}`);
        reads++;
        return new Response(payload);
      },
    },
    SEARCH_INSTANCE: "guide",
    SEARCH_LIMITER: { limit: () => ({ success: true }) },
    SEARCH_BUDGET: {
      idFromName: (name) => name,
      get: () => ({ spend: async () => true }),
    },
    SEARCH_DAILY_BUDGET: "10",
    AI_SEARCH: {
      get(instance) {
        assert.equal(instance, "guide");
        return {
          search: async () => ({ chunks: [{ item: { key: record.key } }] }),
        };
      },
    },
  };
  const search = siteSearch();
  for (const json of [true, false]) {
    const request = new Request(
      `${origin}/search?q=proof+of+possession${json ? "&format=json" : ""}`,
      { headers: { "Sec-Fetch-Site": "same-origin" } },
    );
    const response = await search(request, env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-Guide-Search-Commit"), marker.commit);
    assert.equal(
      response.headers.get("X-Guide-Search-Revision"),
      marker.revision,
    );
    if (json)
      assert.equal(
        (await response.json()).results[0].href,
        "/standards/rfc9449/",
      );
    else
      assert.match(await response.text(), /<a href="\/standards\/rfc9449\/"/);
  }
  assert.equal(reads, 1);
});
