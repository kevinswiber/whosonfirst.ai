import assert from "node:assert/strict";
import { test } from "node:test";
import {
  answeredBy,
  deployArguments,
  failureReport,
  missingFromSearch,
  releasable,
  sameRelease,
  servedBy,
  siteOrigin,
  WHO_ANSWERS,
} from "../../scripts/release.ts";
import { catalogFor, guideSearch } from "../../src/search/search.ts";

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

test("a deployment replaces what was set in the dashboard only when it is told to", () => {
  const commit = "a".repeat(40);
  assert.deepEqual(deployArguments(commit, false), [
    "deploy",
    "--prebuilt",
    "--message",
    `Guide at ${commit}`,
  ]);
  assert.deepEqual(deployArguments(commit, true).slice(-1), ["--force"]);
});

test("a failed deployment says what the CLI said, without what names the account", () => {
  const id = "a4cfb9a304047b872fa17279ace30697";
  const said = failureReport(
    [
      "\u001b[31m✘ [ERROR]\u001b[0m A request to the Cloudflare API failed.   ",
      "",
      `  GET /accounts/${id}/workers/services/guide [code: 10000]`,
      "  Authentication error for someone@example.com",
    ].join("\n"),
  );
  assert.equal(
    said,
    [
      "✘ [ERROR] A request to the Cloudflare API failed.",
      "  GET /accounts/<id>/workers/services/guide [code: 10000]",
      "  Authentication error for <address>",
    ].join("\n"),
  );
  // The end of a long report, where the error is.
  const long = failureReport(
    Array.from({ length: 100 }, (_, i) => `line ${i + 1}`).join("\n"),
  );
  assert.equal(long.split("\n").length, 40);
  assert.ok(long.endsWith("line 100"));
  assert.equal(failureReport("\n  \n"), "");
});

test("the site serves a release when its marker has the same commit and passages", () => {
  assert.equal(sameRelease(marker, { ...marker }), true);
  for (const live of [
    undefined,
    null,
    {},
    { ...marker, commit: "c".repeat(40) },
    { ...marker, revision: "c".repeat(64) },
    { commit: marker.commit },
  ])
    assert.equal(sameRelease(marker, live), false);
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

test("the release can ask which build answers a search without a search being made, counted or kept", async () => {
  const headers = {
    "X-Guide-Search-Commit": marker.commit,
    "X-Guide-Search-Revision": marker.revision,
  };
  const search = guideSearch(
    catalogFor([]),
    '<form><input name="q"></form><span id="search-status-text"></span><ol id="search-results"></ol>',
    headers,
  );
  const asked = [];
  const note = (what) => () => {
    asked.push(what);
    throw new Error(`${what} was asked`);
  };
  const answer = await search(new Request(`${origin}${WHO_ANSWERS}`), {
    SEARCH_INSTANCE: "guide",
    SEARCH_LIMITER: { limit: note("the limit") },
    SEARCH_BUDGET: { idFromName: note("the budget"), get: note("the budget") },
    AI_SEARCH: { get: note("the search") },
  });
  assert.equal(answer.status, 400);
  assert.equal(answer.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(asked, []);
  assert.equal(servedBy(marker, answer), true);
  assert.equal(
    servedBy({ ...marker, commit: "c".repeat(40) }, answer),
    false,
    "another build's answer",
  );
  assert.equal(servedBy(marker, new Response("page")), false);
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
