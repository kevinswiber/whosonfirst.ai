// The link beside each section heading: it is in the page without a script and
// goes to the section, it can be found with a keyboard, a pointer and a finger,
// it says which section it is for without changing what the heading says, and
// with a script it also copies the address and says that it has. It is not on
// the print, and not where it would be wrong: in a card, in a menu or in a
// flow's own steps.
import { strict as assert } from "node:assert";
import { after, before, describe, test } from "node:test";
import { open, useBrowser } from "../support/browser.mjs";
import { FLOW, LESSON } from "../support/site.mjs";

const site = useBrowser();

/** A page, a heading on it, and the words that heading says. */
const SECTIONS = [
  { path: LESSON, id: "keep", words: "What to keep" },
  { path: FLOW, id: "standards", words: "Standards in play" },
  { path: "/about/", id: "how-flows-are-rated", words: "How flows are rated" },
  {
    path: "/deployments/gateways/",
    id: "the-mcp-gateway",
    words: "The MCP gateway",
  },
  {
    path: "/standards/rfc9449/",
    id: "where-it-stands",
    words: "Where it stands",
  },
];
const linkFor = (page, id) => page.locator(`main :is(h2, h3)#${id} a`);
/** What is written beside the chain: the content of the link's ::after. */
const label = async (link) =>
  (await link.evaluate((a) => getComputedStyle(a, "::after").content)).replace(
    /^"(.*?)"( \/ "")?$/,
    "$1",
  );
const heightOf = (page, id) =>
  page.locator(`#${id}`).evaluate((h) => h.getBoundingClientRect().height);

describe("without a script", { concurrency: 1 }, () => {
  let page;
  before(async () => {
    const ctx = await site.context({
      javaScriptEnabled: false,
      viewport: { width: 1280, height: 900 },
    });
    page = await ctx.newPage();
  });
  after(() => page.context().close());

  for (const { path, id, words } of SECTIONS) {
    test(`${path}: the link beside “${words}” goes to it, and is named for it`, async () => {
      await open(page, site.url(path));
      const link = linkFor(page, id);
      assert.equal(await link.count(), 1);
      assert.equal(await link.getAttribute("href"), `#${id}`);
      assert.equal(
        await link.getAttribute("aria-label"),
        `Link to this section: ${words}`,
      );
      // the heading's own name is its words: the link adds nothing to it
      assert.equal(
        await page.getByRole("heading", { name: words, exact: true }).count(),
        1,
      );
      assert.equal(
        await page.locator(`#${id}`).evaluate((h) => h.textContent.trim()),
        words,
      );
      // a press only goes to the section here, so nothing says it copies
      await page.locator(`#${id}`).hover();
      await link.hover({ force: true });
      assert.equal(await label(link), "none");
      await link.evaluate((a) => a.click());
      assert.equal(new URL(page.url()).hash, `#${id}`);
      const top = await page
        .locator(`#${id}`)
        .evaluate((h) => h.getBoundingClientRect().top);
      assert.ok(
        top >= 0 && top < 400,
        `the section is at the top of the window (${top}px)`,
      );
    });
  }
});

describe("with a script, on a desktop", { concurrency: 1 }, () => {
  let page;
  let ctx;
  before(async () => {
    ctx = await site.context({ viewport: { width: 1280, height: 900 } });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: site.origin,
    });
    page = await ctx.newPage();
  });
  after(() => ctx.close());

  const opacity = (link) =>
    link.evaluate((a) => Number(getComputedStyle(a.parentElement).opacity));

  test("it is there when the heading is pointed at or reached by keyboard, and not before", async () => {
    await open(page, site.url(LESSON));
    const link = linkFor(page, "keep");
    await page.mouse.move(0, 500);
    assert.equal(await opacity(link), 0, "not shown until it is wanted");
    await page.locator("#keep").hover();
    await page.waitForTimeout(250);
    assert.equal(await opacity(link), 1, "shown over its heading");
    assert.equal(
      await label(link),
      "none",
      "and says nothing until it is itself the target",
    );
    const height = await heightOf(page, "keep");
    await link.hover();
    assert.equal(await label(link), "Copy link", "says what a press does");
    assert.equal(
      await heightOf(page, "keep"),
      height,
      "and is no taller for it",
    );
    await page.mouse.move(0, 500);
    await link.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    assert.equal(
      await link.evaluate((a) => a === document.activeElement),
      true,
    );
    await page.waitForTimeout(250);
    assert.equal(await opacity(link), 1, "shown when it has focus");
    assert.equal(await label(link), "Copy link", "and says what a press does");
    assert.equal(
      await link.evaluate((a) => getComputedStyle(a).outlineStyle),
      "solid",
      "and marked as focused",
    );
  });

  test("pressing it copies the page's address with the section's, and says so", async () => {
    await open(page, site.url(LESSON));
    await linkFor(page, "keep").click();
    assert.equal(new URL(page.url()).hash, "#keep");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(copied, `${site.origin}${LESSON}#keep`);
    await page.waitForFunction(
      () =>
        document.querySelector('[role="status"].visually-hidden')?.textContent,
    );
    assert.equal(
      await page.locator('[role="status"].visually-hidden').textContent(),
      "Link to “What to keep” copied.",
    );
    assert.equal(
      await page.locator("section-link[data-copied]").count(),
      1,
      "and shows it beside the link",
    );
    assert.equal(await label(linkFor(page, "keep")), "Copied");
    await page.waitForFunction(
      () => !document.querySelector("section-link[data-copied]"),
    );
    await page.mouse.move(0, 500);
    assert.equal(
      await label(linkFor(page, "keep")),
      "none",
      "and puts it away",
    );
  });

  test("the list of the page's sections names the headings and nothing more", async () => {
    await open(page, site.url("/about/"));
    const listed = await page.evaluate(() => {
      const links = [...document.querySelectorAll(".here-menu a")];
      const heads = [...document.querySelectorAll("main h2")];
      return {
        links: links.map((a) => a.textContent.trim()),
        heads: heads.map((h) => h.textContent.trim()),
        toc: [...document.querySelectorAll(".article-toc a")].map((a) =>
          a.textContent.trim(),
        ),
      };
    });
    assert.deepEqual(
      listed.links,
      listed.heads.filter((h) => h),
    );
    assert.ok(!listed.heads.some((h) => h.includes("#") || /Link to/.test(h)));
    assert.ok(listed.toc.every((t) => listed.heads.includes(t)));
  });

  test("a press with a modifier, or no clipboard, leaves it to the browser", async () => {
    await open(page, site.url(LESSON));
    await page.evaluate(() => navigator.clipboard.writeText("before"));
    await linkFor(page, "keep")
      .click({ modifiers: ["Shift"] })
      .catch(() => {});
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      "before",
    );
    const bare = await site.context({ viewport: { width: 1280, height: 900 } });
    const p = await bare.newPage();
    await p.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { value: undefined });
    });
    await open(p, site.url(LESSON));
    await linkFor(p, "keep").click();
    assert.equal(
      new URL(p.url()).hash,
      "#keep",
      "it still goes to the section",
    );
    assert.equal(
      await p.locator('[role="status"].visually-hidden').textContent(),
      "",
      "and says nothing of a copy",
    );
    await bare.close();
  });

  test("it is not on a page that is printed", async () => {
    await open(page, site.url(LESSON));
    await page.emulateMedia({ media: "print" });
    const shown = await page.evaluate(
      () =>
        [...document.querySelectorAll("section-link")].filter(
          (e) => e.getClientRects().length,
        ).length,
    );
    assert.equal(shown, 0);
    await page.emulateMedia({ media: "screen" });
  });
});

describe("with a script, on a phone", { concurrency: 1 }, () => {
  test("it is shown without a pointer, and large enough to press", async (t) => {
    const ctx = await site.context({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: site.origin,
    });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url(LESSON));
    const link = linkFor(page, "keep");
    assert.equal(
      await link.evaluate((a) =>
        Number(getComputedStyle(a.parentElement).opacity),
      ),
      1,
    );
    const box = await link.boundingBox();
    assert.ok(
      box.width >= 24 && box.height >= 24,
      `${box.width} by ${box.height}`,
    );
    assert.equal(
      await label(link),
      "none",
      "no label where nothing is pointed at",
    );
    const height = await heightOf(page, "keep");
    await link.tap();
    assert.equal(await label(link), "Copied", "but a press says it copied");
    assert.equal(await heightOf(page, "keep"), height);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "and widens nothing",
    );
    // and the heading is no taller for it: the room to press is in the margin
    const heading = await page.locator("#keep").boundingBox();
    assert.ok(heading.height < 60, `${heading.height}px`);
  });
});

// The icon hangs in the margin to the left of its heading. Wherever a page
// has one, it is inside the window, in front of nothing else, behind nothing,
// level with the heading's first line, and the heading's text is where it was.
describe("the icon in the margin", { concurrency: true }, () => {
  const PAGES = [
    "/",
    "/learn/",
    LESSON,
    FLOW,
    "/flows/",
    "/about/",
    "/standards/",
    "/standards/rfc9449/",
    "/standards/changes/",
    "/deployments/gateways/",
    "/compare/dpop-vs-oauth-mtls/",
    "/concepts/",
    "/guide/",
    "/implementations/dpop/",
  ];
  const WIDTHS = [
    { width: 1280, height: 900 },
    { width: 768, height: 900 },
    { width: 375, height: 667, touch: true },
    { width: 320, height: 568, touch: true },
  ];
  for (const w of WIDTHS) {
    test(`${w.width} wide: every icon is in the window, in the clear and level with its first line`, async (t) => {
      const ctx = await site.context({
        viewport: { width: w.width, height: w.height },
        isMobile: w.touch,
        hasTouch: w.touch,
      });
      t.after(() => ctx.close());
      const page = await ctx.newPage();
      const wrong = [];
      let seen = 0;
      for (const path of PAGES) {
        await open(page, site.url(path));
        const found = await page.evaluate(() => {
          const out = {
            n: 0,
            wrong: [],
            wide: document.documentElement.scrollWidth > innerWidth,
          };
          for (const e of document.querySelectorAll("section-link")) {
            const h = e.closest("h2, h3");
            if (!h.getClientRects().length) continue;
            out.n++;
            h.scrollIntoView({ block: "center", behavior: "instant" });
            const svg = e.querySelector("svg").getBoundingClientRect();
            const head = h.getBoundingClientRect();
            const at = (x, y) => document.elementFromPoint(x, y);
            const hit = at(svg.left + svg.width / 2, svg.top + svg.height / 2);
            // the text of the heading, with and without the link
            const range = document.createRange();
            const text = [...h.childNodes].find(
              (n) => n.nodeType === 3 && n.textContent.trim(),
            );
            let moved = 0;
            if (text) {
              range.selectNodeContents(text);
              const before = range.getBoundingClientRect();
              e.style.display = "none";
              range.selectNodeContents(text);
              const after = range.getBoundingClientRect();
              e.style.display = "";
              moved =
                Math.abs(before.left - after.left) +
                Math.abs(before.top - after.top);
            }
            const line = Number.parseFloat(getComputedStyle(h).lineHeight);
            const first =
              svg.top +
              svg.height / 2 -
              (head.top +
                Number.parseFloat(getComputedStyle(h).paddingTop) +
                Number.parseFloat(getComputedStyle(h).borderTopWidth));
            const problems = [];
            if (svg.left < 0 || svg.right > head.left + 1)
              problems.push(
                `icon at ${Math.round(svg.left)} to ${Math.round(svg.right)}, heading at ${Math.round(head.left)}`,
              );
            if (!hit?.closest("section-link"))
              problems.push(`covered by ${hit?.tagName}.${hit?.className}`);
            if (moved > 0.5) problems.push(`the text moved ${moved}px`);
            if (Number.isFinite(line) && Math.abs(first - line / 2) > 3)
              problems.push(
                `not level with the first line (${Math.round(first)} of ${Math.round(line)})`,
              );
            if (problems.length)
              out.wrong.push(
                `${h.id || h.textContent.trim().slice(0, 24)}: ${problems.join("; ")}`,
              );
          }
          return out;
        });
        seen += found.n;
        if (found.wide) wrong.push(`${path} is wider than the window`);
        for (const m of found.wrong.slice(0, 3)) wrong.push(`${path} ${m}`);
      }
      assert.deepEqual(wrong.slice(0, 12), []);
      assert.ok(seen > 50, `${seen} icons checked`);
    });
  }

  test("the label goes under the icon and widens nothing", async (t) => {
    const ctx = await site.context({ viewport: { width: 390, height: 844 } });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url(FLOW));
    const link = linkFor(page, "standards");
    await link.scrollIntoViewIfNeeded();
    const height = await heightOf(page, "standards");
    await link.hover();
    assert.equal(await label(link), "Copy link");
    assert.equal(await heightOf(page, "standards"), height);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  });
});

describe("where there is none", { concurrency: 1 }, () => {
  test("no heading inside a card, a menu, a dialog, a list item or a flow's own steps has one", async (t) => {
    const ctx = await site.context({ viewport: { width: 1280, height: 900 } });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    for (const path of [
      "/",
      FLOW,
      LESSON,
      "/flows/",
      "/guide/",
      "/concepts/",
      "/standards/",
      "/search/",
    ]) {
      await open(page, site.url(path));
      const wrong = await page.evaluate(() =>
        [...document.querySelectorAll("section-link")]
          .filter((e) =>
            e.closest(
              "a, button, dialog, nav, li, summary, form, flow-diagram, .card, header.site-header",
            ),
          )
          .map((e) => e.closest("h2, h3")?.textContent.trim()),
      );
      assert.deepEqual(wrong, [], path);
    }
    await open(page, site.url("/search/"));
    assert.equal(
      await page.locator("section-link").count(),
      0,
      "none on the search page",
    );
  });

  test("a section link on a flow page leaves the step the page is at as it was", async (t) => {
    const ctx = await site.context({ viewport: { width: 1280, height: 900 } });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url(`${FLOW}#step-4`));
    const step = () =>
      page
        .locator("flow-diagram .flow-step.is-current")
        .evaluateAll((e) => e.map((s) => s.id));
    const before = await step();
    assert.deepEqual(before, ["step-4"]);
    await linkFor(page, "standards").click();
    assert.equal(new URL(page.url()).hash, "#standards");
    assert.deepEqual(await step(), before);
  });
});
