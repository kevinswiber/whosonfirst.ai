// Two things a page does for a reader on the way in and on the way out: the
// next page is loaded ahead of the press that asks for it, and the page can be
// taken away as Markdown. Neither is needed to read the page, so each is
// checked both ways: with the script, and without it.
import { assert, describe, test } from "ubqtest";
import { open, useBrowser } from "../support/browser.mjs";
import { copyOf, FLOW, file, pageAt } from "../support/site.mjs";

const site = useBrowser();

describe("taking a page away as Markdown", () => {
  let ready;
  const setup = () =>
    (ready ??= (async () => {
      const ctx = await site.context({
        viewport: { width: 1280, height: 900 },
      });
      await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
      return ctx;
    })());

  test("the footer's button copies the page's Markdown copy, word for word, and says so", async () => {
    const ctx = await setup();
    const page = await ctx.newPage();
    await open(page, site.url(FLOW));
    const said = page.locator(".site-footer .as-text-said");
    assert.equal(await said.textContent(), "");
    await page.locator(".site-footer [data-copy]").click();
    await page.waitForFunction(
      () => document.querySelector(".site-footer .as-text-said")?.textContent,
    );
    assert.equal(await said.textContent(), "Copied");
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      file(copyOf(pageAt(FLOW))),
    );
    await page.close();
  });

  test("without the script there is no button, and the link to the same text is still there", async () => {
    const plain = await site.context({
      viewport: { width: 1280, height: 900 },
      javaScriptEnabled: false,
    });
    const page = await plain.newPage();
    await open(page, site.url(FLOW));
    assert.equal(
      await page.locator(".site-footer [data-copy]").isVisible(),
      false,
    );
    const link = page.locator('.site-footer a[type="text/markdown"]');
    assert.equal(await link.isVisible(), true);
    assert.equal(await link.getAttribute("href"), copyOf(pageAt(FLOW)));
    await plain.close();
  });
});

describe("loading the next page ahead of the press", () => {
  // The rules are an inline script of a kind the content security policy could
  // refuse. Chromium reports what it made of them over its debugging protocol:
  // a rule set it could not use carries an error. It also says what a pointer
  // resting on a link started. With a debugger attached it will not draw a
  // page ahead, and fetches it instead, which is enough to show the rule ran.
  test("the browser takes the page's rules under the site's headers, and a pointer resting on a link starts the page it leads to", async () => {
    const ctx = await site.context({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    const sets = [];
    const started = [];
    cdp.on("Preload.ruleSetUpdated", (e) => sets.push(e.ruleSet));
    for (const event of [
      "Preload.prefetchStatusUpdated",
      "Preload.prerenderStatusUpdated",
    ])
      cdp.on(event, (e) => started.push(new URL(e.key.url).pathname));
    await cdp.send("Preload.enable");
    await open(page, site.url(FLOW));
    assert.equal(sets.length, 1); // the page gives one set of rules
    assert(sets[0].errorType === undefined, sets[0].errorMessage);

    const link = page.locator('main a[href^="/flows/"]').first();
    const to = await link.getAttribute("href");
    await link.scrollIntoViewIfNeeded();
    await link.hover();
    const deadline = Date.now() + 5000;
    while (!started.includes(to) && Date.now() < deadline)
      await new Promise((r) => setTimeout(r, 50));
    assert(started.includes(to), `nothing was started for ${to}`);
    await ctx.close();
  });
});
