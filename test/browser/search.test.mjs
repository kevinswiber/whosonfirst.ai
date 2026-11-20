// The local form is usable before enhancement. The enhanced page sends only
// submitted queries, and renders passages without putting the query in a URL.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { frames, open, useBrowser } from "../support/browser.mjs";
import { sideways } from "../support/measure.mjs";

const site = useBrowser();
const quickIndex = "/search/quick-matches.json";
const fullSearch = "/api/search/query";

// Record the destination and payload at the network boundary. Typing may
// load a shared index; only a submitted query belongs in the API request.
function searchTraffic(page) {
  const seen = [];
  page.on("request", (request) => {
    if (
      !["fetch", "xhr"].includes(request.resourceType()) &&
      !request.url().includes(fullSearch)
    )
      return;
    seen.push([request.method(), request.url(), request.postData()]);
  });
  return seen;
}

test("the form and browse links work without scripts", async () => {
  const ctx = await site.context({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await open(page, site.url("/search/"));
  const form = page.getByRole("search");
  const sent = searchTraffic(page);
  assert.equal(await form.getAttribute("method"), "post");
  assert.equal(await form.getAttribute("action"), "/api/search/query");
  assert.equal(await form.getByRole("searchbox").isVisible(), true);
  assert.equal(
    await page.locator("aside a").first().getAttribute("href"),
    "/guide/",
  );
  assert.equal(
    await page.getByRole("region", { name: "Quick matches" }).count(),
    0,
  );
  await page.route("**/api/search/query", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Guide results</h1>",
    }),
  );
  await form.getByRole("searchbox").fill("Agent on a phone");
  await form.getByRole("button", { name: "Search the whole guide" }).click();
  await page.getByRole("heading", { name: "Guide results" }).waitFor();
  assert.deepEqual(sent, [
    ["POST", site.url(fullSearch), "q=Agent+on+a+phone"],
  ]);
  await ctx.close();
});

test("each example runs a full search immediately on a narrow phone", async () => {
  const ctx = await site.context({ viewport: { width: 320, height: 568 } });
  const page = await ctx.newPage();
  const sent = searchTraffic(page);
  await page.route("**/api/search/query", async (route) => {
    await route.fulfill({
      json: {
        results: [
          {
            href: "/standards/rfc9449/",
            title: "DPoP",
            type: "Standard",
            section: "Where it stands",
            excerpt: "An excerpt from the standard’s page.",
          },
        ],
      },
    });
  });
  for (const example of [
    "My agent needs me to approve a payment on my phone",
    "Nobody is signed in when the overnight job runs",
    "RFC 9449",
  ]) {
    await open(page, site.url("/search/"));
    sent.length = 0;
    await page.getByRole("button", { name: example, exact: true }).click();
    const link = page.locator("#search-results a");
    await link.waitFor();
    assert.equal(
      await link.getAttribute("href"),
      site.url("/standards/rfc9449/"),
    );
    assert.equal(await page.getByRole("searchbox").inputValue(), example);
    assert.equal(
      await page.locator("#search-status-text").textContent(),
      `1 result for “${example}”.`,
    );
    assert.deepEqual(sent, [
      [
        "POST",
        site.url(fullSearch),
        new URLSearchParams({ q: example }).toString(),
      ],
    ]);
  }
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

test("typing looks up nearby destinations locally and a keyboard reader can open one", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const seen = searchTraffic(page);
  await open(page, site.url("/search/"));
  const input = page.getByRole("searchbox");
  const quick = page.getByRole("region", { name: "Quick matches" });
  await input.focus();
  await input.fill("r");
  assert.deepEqual(seen, []);
  await input.fill("RFC 9449");
  const standard = quick.locator('a[href$="/standards/rfc9449/"]');
  await standard.waitFor();
  assert.equal(
    await input.evaluate((node) => node === document.activeElement),
    true,
  );
  assert.deepEqual(seen, [["GET", site.url(quickIndex), null]]);
  // Use the real tab order, allowing for the form's submit button and other
  // relevant destinations. Focus must reach the standard without a mouse.
  const maxTabs = (await quick.getByRole("link").count()) + 2;
  for (
    let i = 0;
    i < maxTabs &&
    !(await standard.evaluate((node) => node === document.activeElement));
    i++
  ) {
    await page.keyboard.press("Tab");
  }
  assert.equal(
    await standard.evaluate((node) => node === document.activeElement),
    true,
  );
  await Promise.all([
    page.waitForURL(site.url("/standards/rfc9449/")),
    page.keyboard.press("Enter"),
  ]);
  assert.deepEqual(seen, [["GET", site.url(quickIndex), null]]);
  await ctx.close();
});

test("clearing or dismissing quick matches keeps the search local", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const seen = searchTraffic(page);
  await open(page, site.url("/search/"));
  const input = page.getByRole("searchbox");
  const quick = page.getByRole("region", { name: "Quick matches" });
  await input.fill("DPoP");
  await quick.getByRole("link").first().waitFor();
  await input.press("Escape");
  await quick.waitFor({ state: "hidden" });
  assert.equal(await input.inputValue(), "DPoP");
  await input.fill("unmatchablezzzy");
  await page.getByText("No quick matches.", { exact: true }).waitFor();
  assert.equal(
    await quick
      .getByRole("button", { name: "Search the whole guide" })
      .isEnabled(),
    true,
  );
  await input.fill("");
  await quick.waitFor({ state: "hidden" });
  assert.deepEqual(seen, [["GET", site.url(quickIndex), null]]);
  await ctx.close();
});

test("the reader can still submit once when the quick-match index fails", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const seen = searchTraffic(page);
  await page.route("**/search/quick-matches.json", (route) =>
    route.fulfill({ status: 503, body: "" }),
  );
  await page.route("**/api/search/query", (route) =>
    route.fulfill({ json: { results: [] } }),
  );
  await open(page, site.url("/search/"));
  const input = page.getByRole("searchbox");
  await input.fill("My agent needs to call another service");
  await page
    .getByText("Quick matches are unavailable.", { exact: true })
    .waitFor();
  assert.deepEqual(seen, [["GET", site.url(quickIndex), null]]);
  await input.press("Enter");
  await page
    .locator("#search-status-text")
    .filter({ hasText: "No results found" })
    .waitFor();
  assert.deepEqual(seen, [
    ["GET", site.url(quickIndex), null],
    ["POST", site.url(fullSearch), "q=My+agent+needs+to+call+another+service"],
  ]);
  assert.equal(page.url(), site.url("/search/"));
  await ctx.close();
});

test("a slow quick lookup cannot reopen the list over submitted results", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  let release;
  const wait = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/search/quick-matches.json", async (route) => {
    await wait;
    await route.fulfill({
      json: [
        {
          href: "/flows/dpop/",
          title: "DPoP",
          type: "Flow",
          summary: "An HTTP proof",
          aliases: [],
        },
      ],
    });
  });
  await page.route("**/api/search/query", (route) =>
    route.fulfill({ json: { results: [] } }),
  );
  await open(page, site.url("/search/"));
  const input = page.getByRole("searchbox");
  const requested = page.waitForRequest(site.url(quickIndex));
  await input.fill("DPoP");
  await requested;
  await page
    .getByRole("region", { name: "Quick matches" })
    .getByRole("button", { name: "Search the whole guide" })
    .click();
  await page
    .locator("#search-status-text")
    .filter({ hasText: "No results found" })
    .waitFor();
  const delivered = page.waitForEvent(
    "requestfinished",
    (req) => req.url() === site.url(quickIndex),
  );
  release();
  await delivered;
  await frames(page);
  assert.equal(
    await page.getByRole("region", { name: "Quick matches" }).isVisible(),
    false,
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
  for (const expected of [/unavailable/, /60 seconds/, /No results found/]) {
    await input.press("Enter");
    await page
      .locator("#search-status-text")
      .filter({ hasText: expected })
      .waitFor();
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
  await page
    .locator("#search-status-text")
    .filter({ hasText: "second" })
    .waitFor();
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
