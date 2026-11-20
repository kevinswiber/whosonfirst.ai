// Two things a page does for a reader on the way in and on the way out: the
// next page is loaded ahead of the press that asks for it, and the page can be
// taken away as Markdown. Neither is needed to read the page, so each is
// checked both ways: with the script, and without it.
import { strict as assert } from "node:assert";
import { after, before, describe, test } from "node:test";
import { open, useBrowser } from "../support/browser.mjs";
import { copyOf, FLOW, file, pageAt } from "../support/site.mjs";

const site = useBrowser();

describe("taking a page away as Markdown", { concurrency: 1 }, () => {
  let ctx;
  before(async () => {
    ctx = await site.context({ viewport: { width: 1280, height: 900 } });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
  });
  after(() => ctx.close());

  test("the footer's button copies the page's Markdown copy, word for word, and says so", async () => {
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

const GUIDES = [
  "/deployments/agent-platforms/",
  "/deployments/gateways/",
  "/deployments/kubernetes/",
  "/deployments/local/",
  "/deployments/sandboxes/",
  "/deployments/web-apps/",
];

describe("taking a deployment checklist away as a task list", {
  concurrency: 1,
}, () => {
  let ctx;
  before(async () => {
    ctx = await site.context({ viewport: { width: 390, height: 844 } });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
  });
  after(() => ctx.close());

  for (const path of GUIDES) {
    test(`${path}: the button copies the list as the page's Markdown copy has it, under the guide's name and address`, async () => {
      const page = await ctx.newPage();
      await open(page, site.url(path));
      const shown = await page.locator(".article ul.checklist li").count();
      assert.ok(shown > 0, "the page has a checklist");
      assert.equal(await page.locator(".checklist-copy button").count(), 1);
      const said = page.locator(".checklist-said");
      assert.equal(await said.textContent(), "");
      await page.locator(".checklist-copy button").click();
      await page.waitForFunction(
        () => document.querySelector(".checklist-said")?.textContent,
      );
      assert.match(await said.textContent(), /^Copied/);
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      const title = await page.locator("h1").textContent();
      const heading = await page
        .locator(".article h2:has(+ ul.checklist)")
        .textContent();
      const [first, blank, ...tasks] = copied.trimEnd().split("\n");
      assert.equal(
        first,
        `**${heading.trim()}**, from [${title.trim()}](${new URL(path, site.url("/")).href})`,
      );
      assert.equal(blank, "");
      const markdown = file(copyOf(pageAt(path)))
        .split("\n")
        .filter((l) => l.startsWith("- [ ] "));
      assert.deepEqual(tasks, markdown);
      assert.equal(tasks.length, shown);
      // The words are the page's: each item's text, with links as Markdown.
      const words = await page
        .locator(".article ul.checklist li")
        .allTextContents();
      for (const [i, task] of tasks.entries())
        assert.equal(
          task
            .slice(6)
            .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
            .replace(/\\(?=[*_`[\]<>#])/g, ""),
          words[i].trim().replace(/\s+/g, " "),
        );
      await page.close();
    });
  }

  test("a link in an item stays a Markdown link, with the whole address", async () => {
    const page = await ctx.newPage();
    const withLink = [];
    for (const path of GUIDES) {
      await open(page, site.url(path));
      if (await page.locator(".article ul.checklist li a").count()) {
        await page.locator(".checklist-copy button").click();
        await page.waitForFunction(
          () => document.querySelector(".checklist-said")?.textContent,
        );
        const copied = await page.evaluate(() =>
          navigator.clipboard.readText(),
        );
        withLink.push(path);
        assert.match(copied, /\[[^\]]+\]\(https?:\/\/[^)\s]+\)/);
      }
    }
    await page.close();
    assert.ok(withLink.length, "some guide's checklist has a link");
  });

  test("when the Markdown copy cannot be fetched, nothing is copied and the button says so", async () => {
    const page = await ctx.newPage();
    await page.route("**/index.md", (route) => route.abort());
    await open(page, site.url(GUIDES[0]));
    await page.evaluate(() => navigator.clipboard.writeText("before"));
    await page.locator(".checklist-copy button").click();
    await page.waitForFunction(
      () => document.querySelector(".checklist-said")?.textContent,
    );
    assert.match(
      await page.locator(".checklist-said").textContent(),
      /^Not copied/,
    );
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      "before",
    );
    await page.close();
  });

  test("the live region is polite, and the button is not printed", async () => {
    const page = await ctx.newPage();
    await open(page, site.url(GUIDES[0]));
    assert.equal(
      await page.locator(".checklist-said").getAttribute("aria-live"),
      "polite",
    );
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator(".checklist-copy").isVisible(), false);
    assert.equal(
      await page.locator(".article ul.checklist li").first().isVisible(),
      true,
    );
    await page.close();
  });

  test("without the script there is no button, and the list and the link to the Markdown copy are still there", async () => {
    const plain = await site.context({
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
    });
    const page = await plain.newPage();
    await open(page, site.url(GUIDES[0]));
    assert.equal(await page.locator(".checklist-copy").count(), 0);
    assert.ok((await page.locator(".article ul.checklist li").count()) > 0);
    assert.equal(
      await page.locator('.site-footer a[type="text/markdown"]').isVisible(),
      true,
    );
    await plain.close();
  });
});

describe("loading the next page ahead of the press", { concurrency: 1 }, () => {
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
    assert.equal(sets.length, 1, "the page gives one set of rules");
    assert.equal(sets[0].errorType, undefined, sets[0].errorMessage);

    const link = page.locator('main a[href^="/flows/"]').first();
    const to = await link.getAttribute("href");
    await link.scrollIntoViewIfNeeded();
    await link.hover();
    const deadline = Date.now() + 5000;
    while (!started.includes(to) && Date.now() < deadline)
      await new Promise((r) => setTimeout(r, 50));
    assert.ok(started.includes(to), `nothing was started for ${to}`);
    await ctx.close();
  });
});
