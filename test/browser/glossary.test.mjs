// Glossary terms in the text: each is a link that works however it is
// followed, with or without scripts, and the words that mean something else in
// ordinary speech are linked only where an author meant the technical sense.
// An RFC number is a link of the same kind, to its entry in the standards tracker.
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

// "RFC 7519" says nothing to most readers. Where the text names a document by
// its number, or links to its tracker entry, the reader can see in place which
// document it is, how settled it is and what it defines, and the link goes to
// its entry in the tracker, with or without scripts.
for (const javaScriptEnabled of [false, true]) {
  describe(`a document named in a flow ${javaScriptEnabled ? "with" : "without"} JavaScript`, () => {
    for (const [selector, name, status, ref, id] of [
      // step 4 names the specification by number: the number is not repeated in the preview
      [
        '#step-4 a.spec[href="/standards/#rfc7519"]',
        "JSON Web Token (JWT)",
        "RFC",
        null,
        "rfc7519",
      ],
      // an authored link by name: the preview adds the identifier
      [
        'main p a.spec[href="/standards/#wag"]',
        "Workload Authorization Grant",
        "Individual draft",
        "draft-carleton-workload-authz-grant",
        "wag",
      ],
    ]) {
      test(`${name} previews its tracker entry and leads to it`, async (t) => {
        const ctx = await site.context({
          javaScriptEnabled,
          reducedMotion: "reduce",
        });
        t.after(() => ctx.close());
        const page = await ctx.newPage();
        await open(page, site.url("/flows/workload-identity-federation/"));
        const link = page.locator(selector).first();
        assert.equal(await link.count(), 1, `nothing matches ${selector}`);
        assert.equal(await link.getAttribute("data-term"), name);
        if (javaScriptEnabled)
          await t.test("hovering it shows the document in place", async () => {
            await link.scrollIntoViewIfNeeded();
            await page.mouse.move(0, 0);
            await frames(page);
            await link.hover();
            const tip = page.locator("#term-tip");
            assert.ok(await isOpen(tip), "no preview");
            assert.equal(
              await tip.locator(".term-tip-name").textContent(),
              name,
            );
            assert.equal(
              await tip.locator(".term-tip-meta .chip").textContent(),
              status,
            );
            assert.equal(
              (await tip.locator(".term-tip-ref").count()) > 0
                ? await tip.locator(".term-tip-ref").textContent()
                : null,
              ref,
            );
            assert.ok(
              ((await tip.locator(".term-tip-def").textContent()) ?? "")
                .length > 20,
              "the preview does not say what the document defines",
            );
            assert.equal(
              await tip.locator(".term-tip-more").getAttribute("href"),
              `/standards/#${id}`,
            );
          });
        await t.test("activating it reaches the tracker entry", async () => {
          await Promise.all([
            page.waitForURL(site.url(`/standards/#${id}`)),
            link.press("Enter"),
          ]);
          assert.equal(await page.locator(`[id="${id}"]`).count(), 1);
        });
      });
    }
  });
}

// A glossary term that names one specification, such as "token exchange", is
// still the glossary's: one preview for one word. That preview says which
// document defines it and how settled the document is, and leads to both.
describe("a term that names a specification", () => {
  test("its preview shows the document's status and links to the glossary and the tracker", async (t) => {
    const ctx = await site.context({ reducedMotion: "reduce" });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url("/flows/workload-identity-federation/"));
    const term = page
      .locator('main a.term[href="/glossary/#token-exchange"]')
      .first();
    await term.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await frames(page);
    await term.hover();
    const tip = page.locator("#term-tip");
    assert.ok(await isOpen(tip), "no preview");
    assert.equal(
      await tip.locator(".term-tip-meta .chip").textContent(),
      "RFC",
    );
    assert.equal(await tip.locator(".term-tip-ref").textContent(), "RFC 8693");
    assert.deepEqual(
      await tip
        .locator(".term-tip-more")
        .evaluateAll((links) => links.map((a) => a.getAttribute("href"))),
      ["/glossary/#token-exchange", "/standards/#rfc8693"],
    );
  });

  test("the glossary shows the document's status and links to it, without scripts", async (t) => {
    const ctx = await site.context({ javaScriptEnabled: false });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url("/glossary/"));
    const std = page.locator("#dpop .std");
    assert.equal(await std.locator(".chip").textContent(), "RFC");
    const link = std.locator('a[href="/standards/#rfc9449"]');
    assert.equal(await link.textContent(), "RFC 9449");
    await Promise.all([
      page.waitForURL(site.url("/standards/#rfc9449")),
      link.click(),
    ]);
    assert.equal(await page.locator('[id="rfc9449"]').count(), 1);
  });
});

// A specification named in words that are not a glossary term is marked as a
// document when it is written as the tracker writes it, and its number, if it
// follows, is not marked a second time.
describe("a document named in words", () => {
  test("HTTP Message Signatures previews RFC 9421, once", async (t) => {
    const ctx = await site.context({ reducedMotion: "reduce" });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url("/flows/dpop/"));
    const named = page.locator('main a.spec[href="/standards/#rfc9421"]');
    assert.equal(await named.count(), 1);
    assert.equal(await named.textContent(), "HTTP Message Signatures");
    await named.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await frames(page);
    await named.hover();
    const tip = page.locator("#term-tip");
    assert.ok(await isOpen(tip), "no preview");
    assert.equal(await tip.locator(".term-tip-ref").textContent(), "RFC 9421");
  });
});
