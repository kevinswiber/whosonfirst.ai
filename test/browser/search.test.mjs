// The local form is usable before enhancement. The enhanced page sends only
// submitted queries, and renders passages without putting the query in a URL.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { open, useBrowser } from "../support/browser.mjs";
import { sideways } from "../support/measure.mjs";

const site = useBrowser();

test("the form and browse links work without scripts", async () => {
  const ctx = await site.context({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await open(page, site.url("/search/"));
  const form = page.getByRole("search");
  assert.equal(await form.getAttribute("method"), "post");
  assert.equal(await form.getAttribute("action"), "/api/search/query");
  assert.equal(await form.getByRole("searchbox").isVisible(), true);
  assert.equal(
    await page.locator("aside a").first().getAttribute("href"),
    "/guide/",
  );
  await ctx.close();
});

test("examples can be edited before submitting once on a narrow phone", async () => {
  const ctx = await site.context({ viewport: { width: 320, height: 568 } });
  const page = await ctx.newPage();
  const sent = [];
  await page.route("**/api/search/query", async (route) => {
    const request = route.request();
    sent.push([request.method(), request.postData()]);
    await route.fulfill({
      json: {
        results: [
          {
            href: "/standards/dpop/",
            title: "DPoP",
            type: "Standard",
            section: "Where it stands",
            excerpt: "An excerpt from the standard’s page.",
          },
        ],
      },
    });
  });
  await open(page, site.url("/search/"));
  await page.getByRole("button", { name: "RFC 9449" }).click();
  const input = page.getByRole("searchbox");
  assert.equal(await input.inputValue(), "RFC 9449");
  await input.fill("RFC9449");
  assert.deepEqual(sent, []);
  await input.press("Enter");
  const link = page.locator("#search-results a");
  await link.waitFor();
  assert.equal(await link.getAttribute("href"), site.url("/standards/dpop/"));
  assert.match(
    await page.getByRole("status").textContent(),
    /1 matching passage/,
  );
  assert.deepEqual(sent, [["POST", "q=RFC9449"]]);
  assert.equal(page.url(), site.url("/search/"));
  assert.ok((await page.evaluate(sideways)).by <= 0);
  const header = page.locator(".site-header");
  const search = await header
    .getByRole("link", { name: "Search the guide", exact: true })
    .boundingBox();
  assert.ok(search && search.width >= 44 && search.height >= 44);
  const wordmark = await header.locator(".wordmark").boundingBox();
  const learn = await header.locator(".quick").boundingBox();
  assert.ok(
    wordmark.x + wordmark.width <= learn.x,
    "Learn overlaps the site name",
  );
  await ctx.close();
});

test("outage, rate limit, and zero matches give different outcomes", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const replies = [
    { status: 503, body: "" },
    { status: 429, headers: { "Retry-After": "60" }, body: "" },
    { json: { results: [] } },
  ];
  await page.route("**/api/search/query", (route) =>
    route.fulfill(replies.shift()),
  );
  await open(page, site.url("/search/"));
  const input = page.getByRole("searchbox");
  await input.fill("An unfamiliar situation");
  for (const expected of [
    /unavailable/,
    /60 seconds/,
    /No matching passages/,
  ]) {
    await input.press("Enter");
    await page.getByRole("status").filter({ hasText: expected }).waitFor();
    assert.equal(await input.inputValue(), "An unfamiliar situation");
  }
  await ctx.close();
});

test("a revised search supersedes an unfinished request", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  let releaseFirst;
  const waitForSecond = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  await page.route("**/api/search/query", async (route) => {
    const query = new URLSearchParams(route.request().postData()).get("q");
    if (query === "first") await waitForSecond;
    await route.fulfill({
      json: {
        results: [
          {
            href: "/guide/",
            title: query,
            section: "",
            type: "Guide",
            excerpt: "Guide passage",
          },
        ],
      },
    });
  });
  await open(page, site.url("/search/"));
  const input = page.getByRole("searchbox");
  await input.fill("first");
  const firstSent = page.waitForRequest("**/api/search/query");
  await input.press("Enter");
  await firstSent;
  await input.fill("second");
  await input.press("Enter");
  await page.getByRole("status").filter({ hasText: "second" }).waitFor();
  releaseFirst();
  assert.equal(await page.locator("#search-results a").textContent(), "second");
  await ctx.close();
});

test("a directory filter links to an empty site search without submitting its text", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const searches = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/search/")) searches.push(request.url());
  });
  for (const directory of [
    "flows",
    "glossary",
    "implementations",
    "standards",
  ]) {
    await open(page, site.url(`/${directory}/`));
    await page.getByRole("searchbox").fill("unrepresented-query-zzzz");
    await page.getByRole("link", { name: "Search the whole guide" }).click();
    assert.equal(page.url(), site.url("/search/"));
    assert.equal(await page.getByRole("searchbox").inputValue(), "");
  }
  assert.deepEqual(searches, []);
  await ctx.close();
});
