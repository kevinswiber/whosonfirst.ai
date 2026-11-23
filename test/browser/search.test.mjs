// Reader-facing search on the standalone page and in the global dialog. The
// directory and index are real built assets; only the Cloudflare API is stubbed.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { catalogFor, guideSearch } from "../../src/search/search.ts";
import { frames, open, useBrowser } from "../support/browser.mjs";
import { sideways } from "../support/measure.mjs";
import { file } from "../support/site.mjs";

const site = useBrowser();
const quickIndex = "/search/quick-matches.json";
// A full search is a GET to /search, with the question in the query string.
const fullSearch = (url) => new URL(url).pathname === "/search";
const exampleName = "RFC 9449";
const passage = {
  href: "/standards/rfc9449/",
  title: "DPoP",
  section: "",
  type: "Standard",
  excerpt: "A proof bound to the sender.",
};

function submittedQueries(page) {
  const queries = [];
  page.on("request", (request) => {
    if (fullSearch(request.url())) {
      assert.equal(request.method(), "GET");
      queries.push(new URL(request.url()).searchParams.get("q"));
    }
  });
  return queries;
}

// Freeze after open() has measured its animation frames. Timer assertions
// advance browser time explicitly, including tests for requests that must
// never be sent when a timer is superseded or canceled.
async function pauseTimers(page) {
  const start = new Date("2026-01-01T00:00:00Z");
  await page.clock.install({ time: start });
  await page.clock.pauseAt(new Date(start.getTime() + 60_000));
}
const focused = (locator) =>
  locator.evaluate((node) => node === document.activeElement);

test("without scripts the header leads to a native form and browse links", async () => {
  const ctx = await site.context({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const sent = submittedQueries(page);
  await open(page, site.url("/guide/"));
  await page.locator('.site-header a[href="/search/"]:visible').click();
  const form = page.getByRole("search");
  assert.equal(page.url(), site.url("/search/"));
  assert.equal(await form.getAttribute("method"), "get");
  assert.equal(await form.getAttribute("action"), "/search");
  assert.equal(await page.locator('aside a[href="/guide/"]').isVisible(), true);
  await page.route(fullSearch, (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>Guide results</h1>" }),
  );
  await form.getByRole("searchbox").fill("Agent on a phone");
  await form.locator('button[type="submit"]').click();
  await page.getByRole("heading", { name: "Guide results" }).waitFor();
  assert.deepEqual(sent, ["Agent on a phone"]);
  await ctx.close();
});

test("deleting a query restored from the form's search address clears the server-rendered results", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const sent = submittedQueries(page);
  const record = {
    ...passage,
    key: "proof.md",
    text: passage.excerpt,
    aliases: [exampleName],
  };
  const render = guideSearch(
    catalogFor([record]),
    file("search/index.html"),
    {},
  );
  await page.route(fullSearch, async (route) => {
    const response = await render(new Request(route.request().url()), {
      SEARCH_LIMITER: { limit: async () => ({ success: true }) },
      SEARCH_BUDGET: {
        idFromName: (name) => name,
        get: () => ({ spend: async () => true }),
      },
      SEARCH_DAILY_BUDGET: "10",
      AI_SEARCH: { get: () => ({ search: async () => ({ chunks: [] }) }) },
    });
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    });
  });
  await open(page, site.url("/search/"));
  await Promise.all([
    page.waitForURL((url) => fullSearch(url)),
    page.getByRole("searchbox").evaluate((input, query) => {
      input.value = query;
      input.form.submit();
    }, exampleName),
  ]);
  const input = page.getByRole("searchbox");
  await page.locator(".search-results a").waitFor();
  assert.equal(await input.inputValue(), exampleName);
  await input.fill("");
  await page.locator(".search-examples").waitFor();
  assert.equal(await page.locator(".search-results a").count(), 0);
  assert.equal(await page.locator("#search-status-text").textContent(), "");
  assert.deepEqual(sent, [exampleName]);
  await ctx.close();
});

test("a short term gives local matches, followed by one remote query after typing pauses", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const sent = submittedQueries(page);
  const indexRequests = [];
  page.on("request", (r) => {
    if (r.url().includes(quickIndex)) indexRequests.push([r.method(), r.url()]);
  });
  const release = Promise.withResolvers();
  await page.route(fullSearch, async (route) => {
    await release.promise;
    await route.fulfill({ json: { results: [passage] } });
  });
  await open(page, site.url("/search/"));
  const input = page.getByRole("searchbox");
  const quick = page.locator(".quick-matches");
  await pauseTimers(page);
  await input.fill("r");
  await page.clock.fastForward(600);
  assert.deepEqual(indexRequests, []);
  await input.fill("rf");
  await quick.getByRole("link").first().waitFor();
  await page.clock.fastForward(600);
  assert.deepEqual(indexRequests, [["GET", site.url(quickIndex)]]);
  assert.deepEqual(sent, []);
  await input.fill("RFC");
  await page.clock.fastForward(250);
  await input.fill("RFC 9449");
  await quick.locator('a[href$="/standards/rfc9449/"]').waitFor();
  assert.equal(await focused(input), true);
  await page.clock.fastForward(350);
  assert.deepEqual(sent, []);
  const requested = page.waitForRequest((r) => fullSearch(r.url()));
  await page.clock.fastForward(150);
  await requested;
  await input.press("Enter");
  release.resolve();
  const result = page
    .locator(".search-results")
    .getByRole("link", { name: passage.title, exact: true });
  await result.waitFor();
  assert.equal(
    await quick.locator('a[href$="/standards/rfc9449/"]:visible').count(),
    0,
  );
  await input.press("Enter");
  await page.clock.fastForward(1000);
  assert.deepEqual(sent, ["RFC 9449"]);
  assert.equal(page.url(), site.url("/search/"));
  await ctx.close();
});

test("a quick match the results repeat stays while the reader is on it, then collapses when they move away", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  await open(page, site.url("/search/"));
  const input = page.getByRole("searchbox");
  const quick = page.locator(".quick-matches");
  const repeated = quick.locator('a[href$="/standards/rfc9449/"]:visible');
  // A question the box has not asked yet, so each one sends a search.
  for (const [reader, question] of [
    ["pointer", exampleName],
    ["keyboard", "DPoP"],
  ]) {
    const release = Promise.withResolvers();
    await page.unroute(fullSearch);
    await page.route(fullSearch, async (route) => {
      await release.promise;
      await route.fulfill({ json: { results: [passage] } });
    });
    await input.fill("");
    const requested = page.waitForRequest((r) => fullSearch(r.url()));
    await input.fill(question);
    await repeated.waitFor();
    await requested;
    if (reader === "pointer") await repeated.hover();
    else await repeated.focus();
    release.resolve();
    await page
      .locator(".search-results")
      .getByRole("link", { name: passage.title, exact: true })
      .waitFor();
    assert.equal(await repeated.count(), 1, `${reader}: left in place`);
    if (reader === "pointer") await page.mouse.move(0, 0);
    else await input.focus();
    await repeated.waitFor({ state: "detached" });
    assert.equal(await repeated.count(), 0, `${reader}: collapsed`);
  }
  await ctx.close();
});

test("each example searches immediately and clearing restores the examples", async () => {
  const ctx = await site.context({ viewport: { width: 320, height: 568 } });
  const page = await ctx.newPage();
  const sent = submittedQueries(page);
  await page.route(fullSearch, (route) =>
    route.fulfill({ json: { results: [passage] } }),
  );
  await open(page, site.url("/search/"));
  await pauseTimers(page);
  const examples = page.locator(".search-examples");
  const names = await examples
    .locator("button[data-query]")
    .evaluateAll((buttons) => buttons.map((button) => button.dataset.query));
  assert.ok(names.includes(exampleName) && names.length > 1);
  const input = page.getByRole("searchbox");
  for (const name of names) {
    await examples.getByRole("button", { name, exact: true }).click();
    await page.locator(".search-results a").waitFor();
    assert.equal(await input.inputValue(), name);
    assert.equal(await examples.isVisible(), false);
    await page.getByRole("button", { name: "Clear search" }).click();
    assert.equal(await focused(input), true);
    assert.equal(await input.inputValue(), "");
    await examples.waitFor();
    assert.equal(await page.locator(".search-results a").count(), 0);
    await page.clock.fastForward(1000);
  }
  assert.deepEqual(sent, names);
  assert.ok((await page.evaluate(sideways)).by <= 0);
  await ctx.close();
});

test("clearing cancels both a scheduled query and an in-flight query", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  // A transport can still deliver a response after the reader clears a query.
  // Capture cancellation and then deliver that response to exercise both guards.
  await page.addInitScript(() => {
    const fetchOriginal = window.fetch;
    window.fetch = (input, init) => {
      if (new URL(String(input), location.href).pathname === "/search") {
        window.previousSearchSignal = init.signal;
        return fetchOriginal(input, { ...init, signal: undefined });
      }
      return fetchOriginal(input, init);
    };
  });
  const release = Promise.withResolvers();
  const sent = submittedQueries(page);
  await page.route(fullSearch, async (route) => {
    await release.promise;
    await route.fulfill({ json: { results: [passage] } });
  });
  await open(page, site.url("/search/"));
  await pauseTimers(page);
  const input = page.getByRole("searchbox");
  await input.fill("obsolete timer");
  await input.fill("");
  await page.clock.fastForward(1100);
  assert.deepEqual(sent, []);
  await input.fill("obsolete response");
  const requested = page.waitForRequest((r) => fullSearch(r.url()));
  await page.clock.fastForward(600);
  await requested;
  await input.fill("");
  assert.equal(
    await page.evaluate(() => window.previousSearchSignal.aborted),
    true,
  );
  const delivered = page.waitForEvent("requestfinished", (r) =>
    fullSearch(r.url()),
  );
  release.resolve();
  await delivered;
  await page.clock.resume();
  await frames(page);
  assert.equal(await page.locator(".search-results a").count(), 0);
  assert.equal(await page.locator(".quick-matches").isVisible(), false);
  assert.equal(await page.locator(".search-examples").isVisible(), true);
  assert.equal(await page.locator("#search-status-text").textContent(), "");
  assert.deepEqual(sent, ["obsolete response"]);
  await ctx.close();
});

test("a superseded query cannot replace results for the current input", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const release = Promise.withResolvers();
  await page.route(fullSearch, async (route) => {
    const query = new URL(route.request().url()).searchParams.get("q");
    if (query === "first query") await release.promise;
    await route.fulfill({ json: { results: [{ ...passage, title: query }] } });
  });
  await open(page, site.url("/search/"));
  await pauseTimers(page);
  const input = page.getByRole("searchbox");
  await input.fill("first query");
  const first = page.waitForRequest((r) => fullSearch(r.url()));
  await page.clock.fastForward(600);
  await first;
  await input.fill("second query");
  await page.clock.fastForward(600);
  const current = page.locator(".search-results a");
  await current.filter({ hasText: "second query" }).waitFor();
  release.resolve();
  await page.clock.resume();
  await frames(page);
  assert.equal(await current.textContent(), "second query");
  await ctx.close();
});

test("a stalled automatic search times out, keeps local matches, and can be retried", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const sent = submittedQueries(page);
  const first = Promise.withResolvers();
  let attempts = 0;
  await page.route(fullSearch, async (route) => {
    if (++attempts === 1) await first.promise;
    await route.fulfill({ json: { results: [passage] } });
  });
  await open(page, site.url("/search/"));
  await pauseTimers(page);
  const input = page.getByRole("searchbox");
  await input.fill("DPoP");
  await page.locator(".quick-matches a").first().waitFor();
  const started = page.waitForRequest((r) => fullSearch(r.url()));
  await page.clock.fastForward(600);
  await started;
  await page.clock.fastForward(13000);
  await page
    .locator("#search-status-text")
    .filter({ hasText: /took too long/i })
    .waitFor();
  assert.equal(
    await page.locator(".quick-matches a").first().isVisible(),
    true,
  );
  first.resolve();
  await page.getByRole("button", { name: "Try again" }).click();
  await page.locator(".search-results a").waitFor();
  assert.deepEqual(sent, ["DPoP", "DPoP"]);
  await ctx.close();
});

test("local index failure, unavailable service, rate limiting and zero results are recoverable", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const sent = submittedQueries(page);
  await page.route(site.url(quickIndex), (route) =>
    route.fulfill({ status: 503, body: "" }),
  );
  const replies = [
    { status: 503, body: "" },
    { status: 429, headers: { "Retry-After": "60" }, body: "" },
    { json: { results: [] } },
  ];
  await page.route(fullSearch, (route) => route.fulfill(replies.shift()));
  await open(page, site.url("/search/"));
  await pauseTimers(page);
  const input = page.getByRole("searchbox");
  const status = page.locator("#search-status-text");
  await input.fill("DPoP");
  await page
    .locator(".quick-matches")
    .getByText(/unavailable/i)
    .waitFor();
  await page.clock.fastForward(600);
  await status.filter({ hasText: /unavailable/i }).waitFor();
  await page.getByRole("button", { name: "Try again" }).click();
  await status.filter({ hasText: /60 seconds/i }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Try again" }).isVisible(),
    false,
  );
  await input.fill("a revised question");
  await page.clock.fastForward(1000);
  await input.press("Enter");
  assert.deepEqual(sent, ["DPoP", "DPoP"]);
  await page.clock.fastForward(60000);
  await input.press("Enter");
  await status.filter({ hasText: /No results found/i }).waitFor();
  assert.deepEqual(sent, ["DPoP", "DPoP", "a revised question"]);
  await ctx.close();
});

test("a spent daily budget says so, sends nothing more, and searches again when the day is over", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const sent = submittedQueries(page);
  const replies = [
    { status: 503, headers: { "Retry-After": "3600" }, body: "" },
    { json: { results: [] } },
  ];
  await page.route(fullSearch, (route) => route.fulfill(replies.shift()));
  await open(page, site.url("/search/"));
  await pauseTimers(page);
  const input = page.getByRole("searchbox");
  const status = page.locator("#search-status-text");
  await input.fill("DPoP");
  await input.press("Enter");
  await status.filter({ hasText: /all it can for today/i }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Try again" }).isVisible(),
    false,
  );
  await input.fill("a revised question");
  await input.press("Enter");
  await status.filter({ hasText: /all it can for today/i }).waitFor();
  assert.deepEqual(sent, ["DPoP"]);
  await page.clock.fastForward(3600000);
  await input.press("Enter");
  await status.filter({ hasText: /No results found/i }).waitFor();
  assert.deepEqual(sent, ["DPoP", "a revised question"]);
  await ctx.close();
});

for (const [device, viewport] of [
  ["desktop", { width: 1280, height: 900 }],
  ["phone", { width: 320, height: 568 }],
]) {
  test(`the ${device} header opens an accessible dialog and returns focus to its launcher`, async () => {
    const ctx = await site.context({ viewport });
    const page = await ctx.newPage();
    const sent = submittedQueries(page);
    await open(page, site.url("/guide/"));
    await pauseTimers(page);
    const trigger = page.locator(".site-header [data-search-launch]:visible");
    assert.equal(await trigger.count(), 1);
    if (device === "phone") {
      const box = await trigger.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
      const name = await page.locator(".site-header .wordmark").boundingBox();
      const learn = await page.locator(".site-header .quick").boundingBox();
      assert.ok(name.x + name.width <= learn.x, "Learn overlaps the site name");
    }
    await trigger.focus();
    await page.keyboard.press(device === "phone" ? "Enter" : "Control+k");
    const dialog = page.getByRole("dialog", { name: "Search the guide" });
    await dialog.waitFor();
    const input = dialog.getByRole("searchbox");
    assert.equal(await focused(input), true);
    assert.equal(page.url(), site.url("/guide/"));
    await input.press("ArrowDown");
    assert.equal(
      await focused(dialog.locator(".search-examples button").first()),
      true,
    );
    await page.keyboard.press("ArrowUp");
    assert.equal(await focused(input), true);
    await input.fill("RFC 9449");
    const standard = dialog.locator(
      '.quick-matches a[href$="/standards/rfc9449/"]',
    );
    await standard.waitFor();
    for (let i = 0; i < 10 && !(await focused(standard)); i++) {
      await page.keyboard.press("Tab");
      assert.equal(
        await dialog.evaluate((node) => node.contains(document.activeElement)),
        true,
      );
    }
    assert.equal(await focused(standard), true);
    // A focused, nonempty search field has its own native Escape behavior.
    if (device === "phone") await input.focus();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await page.clock.fastForward(1000);
    assert.deepEqual(sent, []);
    assert.equal(await focused(trigger), true);
    await trigger.click();
    await dialog.waitFor();
    assert.equal(await input.inputValue(), "");
    assert.equal(await dialog.locator(".search-examples").isVisible(), true);
    assert.ok((await page.evaluate(sideways)).by <= 0);
    if (device === "desktop") {
      await dialog.getByRole("button", { name: "Close search" }).click();
      await dialog.waitFor({ state: "hidden" });
      assert.equal(await focused(trigger), true);
    } else {
      await input.fill("RFC 9449");
      await standard.waitFor();
      await input.press("ArrowDown");
      assert.equal(await focused(standard), true);
      await Promise.all([
        page.waitForURL(site.url("/standards/rfc9449/")),
        page.keyboard.press("Enter"),
      ]);
      assert.deepEqual(sent, []);
    }
    await ctx.close();
  });
}

test("the keyboard legend stays in view and a click on result padding opens the link", async () => {
  const ctx = await site.context({ viewport: { width: 840, height: 480 } });
  const page = await ctx.newPage();
  await page.route(fullSearch, (route) =>
    route.fulfill({ json: { results: [passage] } }),
  );
  await open(page, site.url("/"));
  await page.locator("[data-search-launch]").click();
  const dialog = page.getByRole("dialog");
  const keys = dialog.locator("kbd");
  assert.deepEqual(await keys.allTextContents(), ["↑", "↓", "Enter", "Esc"]);
  await dialog.getByRole("button", { name: exampleName }).click();
  const row = dialog.locator(".search-results li").first();
  await row.scrollIntoViewIfNeeded();
  const legend = dialog.locator(".search-keys");
  assert.ok(
    await legend.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return document.elementFromPoint(box.x + 4, box.y + 4) === el;
    }),
  );
  const box = await row.boundingBox();
  const position = { x: box.width - 6, y: box.height - 7 };
  await row.hover({ position });
  const hovered = await row.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  assert.notEqual(hovered, "rgba(0, 0, 0, 0)");
  await page.mouse.move(0, 0);
  await dialog.getByRole("searchbox").press("ArrowDown");
  assert.equal(await focused(row.getByRole("link")), true);
  assert.equal(
    await row.evaluate((el) => getComputedStyle(el).backgroundColor),
    hovered,
  );
  await Promise.all([
    page.waitForURL(site.url(passage.href)),
    row.click({ position }),
  ]);
  await ctx.close();
});

test("the Search key puts a touch keyboard away and leaves a hardware keyboard in the field", async () => {
  const ctx = await site.context({ viewport: { width: 820, height: 1180 } });
  const page = await ctx.newPage();
  await page.route(fullSearch, (route) =>
    route.fulfill({ json: { results: [passage] } }),
  );
  await open(page, site.url("/"));
  await page.locator("[data-search-launch]").click();
  const dialog = page.getByRole("dialog");
  const input = dialog.getByRole("searchbox");
  const results = dialog.locator(".guide-results");
  const link = dialog.locator(".search-results a").first();
  await input.fill("proof of possession");
  await input.press("Enter");
  await link.waitFor();
  assert.equal(await focused(input), true);
  // An on-screen keyboard takes the bottom of the visual viewport.
  await page.evaluate(() => {
    const full = window.innerHeight;
    Object.defineProperty(window.visualViewport, "height", {
      configurable: true,
      get: () => full - 400,
    });
  });
  await input.fill("sender constrained tokens");
  await input.press("Enter");
  await link.waitFor();
  assert.equal(await focused(results), true);
  assert.equal(
    await results.evaluate((el) => getComputedStyle(el).outlineStyle),
    "none",
  );
  // The first match, a quick one or a guide result, is next.
  await page.keyboard.press("ArrowDown");
  const first = dialog
    .locator(".quick-matches li:visible a, .search-results a")
    .first();
  assert.equal(await focused(first), true);
  await page.keyboard.press("ArrowUp");
  assert.equal(await focused(input), true);
  // An empty field is refused where it is, with the keyboard still up.
  await input.fill("");
  await input.press("Enter");
  assert.equal(await focused(input), true);
  await ctx.close();
});

test("the four directory filters stay local and open a fresh site-search dialog", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const sent = submittedQueries(page);
  for (const directory of [
    "flows",
    "glossary",
    "implementations",
    "standards",
  ]) {
    await open(page, site.url(`/${directory}/`));
    await page.getByRole("searchbox").fill("unrepresented-query-zzzz");
    const jump = page.getByRole("link", { name: "Search the whole guide" });
    await jump.waitFor();
    const directoryURL = page.url();
    await jump.click();
    const dialog = page.getByRole("dialog", { name: "Search the guide" });
    await dialog.waitFor();
    assert.equal(page.url(), directoryURL);
    assert.equal(await dialog.getByRole("searchbox").inputValue(), "");
    await dialog.getByRole("button", { name: "Close search" }).click();
    assert.equal(
      await page.getByRole("searchbox").inputValue(),
      "unrepresented-query-zzzz",
    );
  }
  assert.deepEqual(sent, []);
  await ctx.close();
});
