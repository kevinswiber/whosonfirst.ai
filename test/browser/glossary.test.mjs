// Glossary terms in the text: each is a link that works however it is
// followed, with or without scripts, and the words that mean something else in
// ordinary speech are linked only where an author meant the technical sense.
import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { frames, open, useBrowser } from "../support/browser.mjs";
import { FLOW } from "../support/site.mjs";

const site = useBrowser();
const isOpen = (tip) => tip.evaluate((el) => el.matches(":popover-open"));

// Reader may activate the original page's link. No activation path should be
// intercepted to open a preview that is invisible in the extracted article.
describe("a term in a flow's introduction", () => {
  for (const activation of ["click", "Enter", "touch", "programmatic click"]) {
    test(`${activation} follows a term to its glossary definition`, async (t) => {
      const ctx = await site.context({
        hasTouch: activation === "touch",
        reducedMotion: "reduce",
      });
      t.after(() => ctx.close());
      const page = await ctx.newPage();
      await open(page, site.url(FLOW));
      const term = page.locator(".intro a.term").first();
      const href = await term.getAttribute("href");
      if (activation === "click")
        await t.test(
          "a hover preview stays available while the pointer moves onto it",
          async () => {
            await term.hover();
            const tip = page.locator("#term-tip");
            await tip.hover();
            assert.ok(await isOpen(tip));
          },
        );
      await Promise.all([
        page.waitForURL(site.url(href)),
        activation === "Enter"
          ? term.press("Enter")
          : activation === "touch"
            ? term.tap()
            : activation === "programmatic click"
              ? term.evaluate((a) => {
                  if (a instanceof HTMLAnchorElement) a.click();
                })
              : term.click(),
      ]);
      assert.ok(
        await page.evaluate(
          () =>
            !!document.getElementById(
              decodeURIComponent(location.hash.slice(1)),
            ),
        ),
        `${href} names nothing on the glossary`,
      );
    });
  }
});

// Authored glossary links use the same preview as automatic terms, in both
// data-file Markdown and MDX prose. Activation must still work without scripts.
for (const javaScriptEnabled of [false, true]) {
  for (const [path, selector] of [
    ["/flows/aauth/", '.credentials > p a[href="/glossary/#claim"]'],
    ["/deployments/local/", 'main p a[href="/glossary/#claim"]'],
  ]) {
    describe(`${path} ${javaScriptEnabled ? "with" : "without"} JavaScript`, () => {
      test("explicit claims links retain their label and glossary treatment with or without scripts", async (t) => {
        const ctx = await site.context({
          javaScriptEnabled,
          reducedMotion: "reduce",
        });
        t.after(() => ctx.close());
        const page = await ctx.newPage();
        await open(page, site.url(path));
        const term = page.locator(selector).first();
        const definition = await term.getAttribute("data-def");
        assert.equal(await term.textContent(), "claims");
        assert.equal(await term.getAttribute("data-term"), "Claim");
        assert.ok(
          definition?.startsWith("One named statement inside a token"),
          definition ?? "no definition",
        );
        assert.ok(
          await term.evaluate((el) => el.classList.contains("term")),
          "not marked as a term",
        );
        if (javaScriptEnabled) {
          const tip = page.locator("#term-tip");
          await t.test(
            "hovering an explicit glossary link previews its definition",
            async () => {
              // Scrolling intentionally dismisses a preview. Bring this deep link into
              // view and let scroll events finish before testing a pointer entering it.
              await term.scrollIntoViewIfNeeded();
              await page.mouse.move(0, 0);
              await frames(page);
              await term.hover();
              assert.ok(await isOpen(tip), "no preview");
              assert.equal(
                await tip.locator(".term-tip-def").textContent(),
                definition,
              );
            },
          );
          await t.test(
            "focusing an explicit glossary link previews its definition",
            async () => {
              await page.keyboard.press("Escape");
              await term.focus();
              assert.ok(await isOpen(tip), "no preview");
              assert.equal(
                await tip.locator(".term-tip-def").textContent(),
                definition,
              );
            },
          );
        }
        await t.test(
          "activating an explicit glossary term reaches its definition with or without scripts",
          async () => {
            await Promise.all([
              page.waitForURL(site.url("/glossary/#claim")),
              term.press("Enter"),
            ]);
            assert.equal(await page.locator("#claim").count(), 1);
          },
        );
      });
    });
  }
}

// Ambiguous words need an author's link, not a vocabulary match. Ordinary
// claims and task states must not send readers to JWT or OAuth definitions.
describe("claim and state links refer to their technical meanings", () => {
  for (const [path, selector, expected] of [
    [
      FLOW,
      '#step-8 a[href="/glossary/#claim"], #step-13 a[href="/glossary/#state"]',
      false,
    ],
    ["/flows/agent-to-agent/", 'a[href="/glossary/#state"]', false],
    ["/deployments/kubernetes/", 'a[href="/glossary/#claim"]', false],
    ["/flows/token-exchange/", 'a[href="/glossary/#claim"]', true],
    [
      "/flows/authorization-code-pkce/",
      'a.term[href="/glossary/#state"] code',
      true,
    ],
  ]) {
    test(`${path}: ${expected ? "linked" : "not linked"} where ${selector}`, async (t) => {
      const ctx = await site.context();
      t.after(() => ctx.close());
      const page = await ctx.newPage();
      await open(page, site.url(path));
      assert.equal((await page.locator(selector).count()) > 0, expected);
    });
  }
});
