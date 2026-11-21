// A search, asked of the site as it is deployed: the Workers runtime hands
// /search from the page handler to the Search entrypoint, which reads the
// catalog the build wrote and counts against the day's budget. No account is
// reached from here, so the search itself finds nothing to ask and says that
// it is unavailable. What a found answer looks like is in
// test/build/site-search.test.mjs and test/unit/guide-search.test.mjs.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { WORKER_BUILD } from "../../scripts/built-site.mjs";
import { file, SITE_HEADERS } from "../support/site.mjs";
import { startWorker } from "../support/worker.mjs";

const marker = JSON.parse(file("search/release.json"));
/** Whether this build was given a limiter, and so has search. */
const hasSearch = Boolean(
  JSON.parse(readFileSync(join(WORKER_BUILD, "worker.config.json"), "utf8")).env
    .SEARCH_LIMITER,
);

let site;
before(async () => {
  // A cap no run of these tests reaches: the count is kept between runs.
  site = await startWorker({ SEARCH_DAILY_BUDGET: "1000000" });
});
after(async () => {
  await site?.stop();
});

const ask = (path, headers = {}) =>
  fetch(`${site.origin}${path}`, { headers, redirect: "manual" });

test("a search with no question goes to the search page, and another spelling to the one address", async () => {
  const empty = await ask("/search");
  assert.equal(empty.status, 302);
  assert.equal(empty.headers.get("location"), "/search/");
  const spelled = await ask("/search?q=%20DPoP%20%20proof&utm=1");
  assert.equal(spelled.status, 308);
  assert.equal(spelled.headers.get("location"), "/search?q=DPoP+proof");
  const page = await ask("/search/");
  assert.equal(page.status, 200);
  assert.match(await page.text(), /id="search-results"/);
});

test("the Search entrypoint answers from this build's catalog, with the site's headers, and is not kept when it fails", async () => {
  const answer = await ask("/search?q=DPoP&format=json");
  assert.equal(answer.status, 503);
  assert.equal(answer.headers.get("cache-control"), "no-store");
  assert.equal(answer.headers.get("x-robots-tag"), "noindex");
  assert.equal(answer.headers.get("x-guide-search-commit"), marker.commit);
  assert.equal(answer.headers.get("x-guide-search-revision"), marker.revision);
  for (const name of ["content-security-policy", "x-content-type-options"])
    assert.equal(answer.headers.get(name), SITE_HEADERS[name], name);
  assert.match((await answer.json()).error, /unavailable/);

  const page = await ask("/search?q=DPoP");
  assert.equal(page.status, 503);
  const html = await page.text();
  assert.match(html, /<input value="DPoP"/);
  assert.match(html, /id="search-status-text"[^>]*>Search is temporarily/);
});

test("a search passes the limit for its address and is counted against the day before it is asked", {
  skip: !hasSearch && "this build has no search",
}, async () => {
  const answer = await ask("/search?q=token+exchange&format=json");
  assert.equal(answer.status, 503);
  assert.match(
    answer.headers.get("server-timing"),
    /^limit;dur=\d+, budget;dur=\d+, search;dur=\d+$/,
  );
});
