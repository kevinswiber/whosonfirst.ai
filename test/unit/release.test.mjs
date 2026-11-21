import assert from "node:assert/strict";
import { test } from "node:test";
import {
  answeredBy,
  missingFromSearch,
  releasable,
  siteOrigin,
} from "../../scripts/release.ts";

const marker = { commit: "a".repeat(40), revision: "b".repeat(64) };
const origin = "https://guide.example.test";

test("a release needs a build made from a commit, with the digest of its passages", () => {
  assert.equal(releasable(marker), true);
  for (const other of [
    undefined,
    {},
    { ...marker, commit: null },
    { ...marker, commit: "abc" },
    { ...marker, revision: "b".repeat(63) },
  ])
    assert.equal(releasable(other), false);
});

test("a build without search is not released, and what it lacks is named", () => {
  const config = {
    env: {
      ASSETS: { type: "assets" },
      AI_SEARCH: { type: "ai-search-namespace", namespace: "guide" },
      SEARCH_INSTANCE: { type: "text", value: "guide" },
      SEARCH_LIMITER: { type: "rate-limit", namespace: "1" },
      SEARCH_DAILY_BUDGET: { type: "secret" },
    },
    exports: {
      default: { type: "worker", cache: { enabled: false } },
      Search: { type: "worker", cache: { enabled: true } },
      SearchBudget: { type: "durable-object", storage: "sqlite" },
    },
  };
  assert.deepEqual(missingFromSearch(config), []);
  assert.deepEqual(
    missingFromSearch({ ...config, env: { ASSETS: config.env.ASSETS } }),
    ["AI_SEARCH", "SEARCH_INSTANCE", "SEARCH_LIMITER", "SEARCH_DAILY_BUDGET"],
  );
  assert.deepEqual(
    missingFromSearch({
      ...config,
      exports: { Search: { type: "worker", cache: { enabled: false } } },
    }),
    ["Search", "SearchBudget"],
  );
  assert.equal(missingFromSearch(undefined).length, 6);
});

test("the site's address is the one its own sitemap gives", () => {
  assert.equal(
    siteOrigin(
      `<urlset><url><loc>${origin}/</loc></url><url><loc>${origin}/about/</loc></url></urlset>`,
    ),
    origin,
  );
  assert.throws(() => siteOrigin("<urlset></urlset>"));
});

test("a search answers for a release only with its commit, its passages and a result on the site", async () => {
  const answer = (results, headers = {}, status = 200) =>
    new Response(JSON.stringify({ results }), {
      status,
      headers: {
        "X-Guide-Search-Commit": marker.commit,
        "X-Guide-Search-Revision": marker.revision,
        ...headers,
      },
    });
  const found = [{ href: "/flows/device-authorization/" }];
  assert.equal(await answeredBy(marker, origin, answer(found)), true);
  for (const other of [
    answer(found, { "X-Guide-Search-Commit": "c".repeat(40) }),
    answer(found, { "X-Guide-Search-Revision": "c".repeat(64) }),
    answer(found, {}, 503),
    answer([]),
    answer([{ href: "//elsewhere.example/" }]),
    answer([{ href: "https://elsewhere.example/" }]),
  ])
    assert.equal(await answeredBy(marker, origin, other), false);
});
