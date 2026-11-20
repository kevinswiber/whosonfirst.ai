// The home page, in each theme, on a desktop and on a phone: the header and its
// menu, the hero, the question of whose authority, and the ways in. Then the
// header at the widths between, where its layout changes.
import { strict as assert } from "node:assert";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  device,
  open,
  THEMES,
  useBrowser,
  VIEWPORTS,
} from "../support/browser.mjs";
import { LESSON_ORDER } from "../support/site.mjs";

const DESTINATIONS = [
  "/learn/",
  "/guide/",
  "/flows/",
  "/deployments/",
  "/standards/",
  "/glossary/",
  "/search/",
];

const site = useBrowser();

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    describe(`${theme} ${vp.name} home`, () => {
      let ctx;
      let page;
      before(async () => {
        ctx = await site.context(
          device(vp, { colorScheme: theme, reducedMotion: "reduce" }),
        );
        page = await ctx.newPage();
      });
      after(() => ctx.close());
      // Each test starts from the page as it arrives, and does its own steps.
      beforeEach(() => open(page, site.url("/")));

      const visibleLinks = () =>
        page.evaluate(() =>
          [...document.querySelectorAll(".site-header a")]
            .filter((a) => {
              const r = a.getBoundingClientRect();
              return r.width > 0 && r.right <= innerWidth && r.left >= 0;
            })
            .map((a) => a.getAttribute("href")),
        );

      const openMenu = async () => {
        await page.focus(".menu-toggle");
        await page.keyboard.press("Enter");
      };

      if (vp.name === "phone") {
        test("header keeps lessons and search in view", async () => {
          const closed = await visibleLinks();
          assert.ok(closed.includes("/learn/"), closed.join(" "));
          assert.ok(closed.includes("/search/"), closed.join(" "));
        });
        test("menu opens from the keyboard and shows every destination", async () => {
          await openMenu();
          const shown = await visibleLinks();
          assert.deepEqual(
            DESTINATIONS.filter((d) => !shown.includes(d)),
            [],
            shown.join(" "),
          );
        });
        test("menu targets are at least 44px tall", async () => {
          await openMenu();
          const size = await page.evaluate(() =>
            Math.min(
              ...[
                ...document.querySelectorAll(
                  ".site-header nav a, .menu-toggle",
                ),
              ].map((el) => el.getBoundingClientRect().height),
            ),
          );
          assert.ok(size >= 44, `smallest ${Math.round(size)}px`);
        });
        test("first menu link takes focus next, with a visible ring", async () => {
          await openMenu();
          await page.keyboard.press("Tab");
          const focused = await page.evaluate(() => {
            const el = document.activeElement;
            const cs = getComputedStyle(el);
            return {
              href: el.getAttribute("href"),
              outline:
                cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2,
            };
          });
          assert.deepEqual(focused, { href: "/learn/", outline: true });
        });
        test("Escape closes the menu and returns focus to its button", async () => {
          // from the first link in the open menu
          await openMenu();
          await page.keyboard.press("Tab");
          await page.keyboard.press("Escape");
          const back = await page.evaluate(() => ({
            expanded: document
              .querySelector(".menu-toggle")
              .getAttribute("aria-expanded"),
            onToggle:
              document.activeElement === document.querySelector(".menu-toggle"),
          }));
          assert.deepEqual(back, { expanded: "false", onToggle: true });
        });
      } else {
        test("every destination is in the header", async () => {
          const shown = await visibleLinks();
          assert.deepEqual(
            DESTINATIONS.filter((d) => !shown.includes(d)),
            [],
            shown.join(" "),
          );
        });
      }

      // The hero is the question, what it means, and the three ways in. Nothing in
      // it is a figure or a control, and nothing in it is set heavier than the question.
      const hero = () =>
        page.evaluate(() => {
          const el = document.querySelector(".hero");
          const box = (s) => el.querySelector(s).getBoundingClientRect();
          const weight = (n) => Number(getComputedStyle(n).fontWeight);
          const size = (n) => parseFloat(getComputedStyle(n).fontSize);
          const h1 = el.querySelector("h1");
          return {
            extras: el.querySelectorAll(
              "figure, table, input, button, select, .btn",
            ).length,
            louder: [...el.querySelectorAll("*")].filter(
              (n) =>
                n !== h1 &&
                n.textContent.trim() &&
                (size(n) > size(h1) ||
                  (size(n) === size(h1) && weight(n) >= weight(h1))),
            ).length,
            h1: box("h1"),
            routes: box(".routes ul"),
            bottom: el.getBoundingClientRect().bottom,
            pageWider: document.documentElement.scrollWidth > innerWidth,
          };
        });
      test("hero has no figure and no control, and nothing in it is set as large as the question", async () => {
        const h = await hero();
        assert.deepEqual(
          { extras: h.extras, louder: h.louder },
          { extras: 0, louder: 0 },
        );
        assert.ok(!h.pageWider, "the page scrolls sideways");
      });
      if (vp.name === "desktop") {
        test("the ways in sit beside the question, starting level with it, and the hero fits the window", async () => {
          const h = await hero();
          assert.ok(
            h.routes.left >= h.h1.right &&
              Math.abs(h.routes.top - h.h1.top) <= 16,
            `question at ${Math.round(h.h1.top)}px, ways in at ${Math.round(h.routes.top)}px`,
          );
          assert.ok(h.bottom <= vp.height, `${Math.round(h.bottom)}px`);
        });
      } else {
        test("the ways in follow the question, and the first is on the first screen", async () => {
          const h = await hero();
          const first = await page.evaluate(
            () =>
              document
                .querySelector(".hero .routes li > a")
                .getBoundingClientRect().bottom,
          );
          assert.ok(
            h.routes.top >= h.h1.bottom && first <= vp.height,
            `first way in ends at ${Math.round(first)}px`,
          );
        });
      }

      // both answers to "whose authority" are on screen together, before either list of flows
      const authority = () =>
        page.evaluate(() => {
          const choices = [
            ...document.querySelectorAll(".au-choices label"),
          ].map((l) => l.getBoundingClientRect());
          const branch = [...document.querySelectorAll(".au-branch")].find(
            (b) => b.offsetParent,
          );
          return {
            n: choices.length,
            lastChoiceBottom: Math.max(...choices.map((r) => r.bottom)),
            firstChoiceTop: Math.min(...choices.map((r) => r.top)),
            branchTop: branch?.getBoundingClientRect().top ?? 0,
            shown: [...document.querySelectorAll(".au-branch")]
              .filter((b) => b.offsetParent)
              .map((b) => b.dataset.authority),
          };
        });
      test("both authority answers shown before either branch", async () => {
        const au = await authority();
        assert.ok(
          au.n === 2 &&
            au.lastChoiceBottom <= au.branchTop &&
            au.lastChoiceBottom - au.firstChoiceTop <= vp.height,
          `${Math.round(au.lastChoiceBottom - au.firstChoiceTop)}px for both`,
        );
      });
      test("one branch at a time, switched by the answer", async () => {
        const au = await authority();
        await page.check('.au-choices input[value="agent"]', { force: true });
        const shown = await page.evaluate(() =>
          [...document.querySelectorAll(".au-branch")]
            .filter((b) => b.offsetParent)
            .map((b) => b.dataset.authority),
        );
        assert.deepEqual(
          { before: au.shown, after: shown },
          { before: ["person"], after: ["agent"] },
        );
      });

      test("three ways in: lessons, guide, flows", async () => {
        const routes = await page.evaluate(() =>
          [...document.querySelectorAll(".routes li > a")].map((a) =>
            a.getAttribute("href"),
          ),
        );
        assert.deepEqual(
          ["/learn/", "/guide/", "/flows/"].filter((h) => !routes.includes(h)),
          [],
          routes.join(" "),
        );
      });
      test("every lesson is listed, in order", async () => {
        const path = await page.evaluate(() =>
          [...document.querySelectorAll("ol.path a")].map((a) =>
            a.getAttribute("href"),
          ),
        );
        assert.ok(LESSON_ORDER.length > 0, "the lessons index lists none");
        assert.deepEqual(path, LESSON_ORDER);
      });
    });
  }
}

// The header at each of its layouts. The widths are the edges of each: one
// pixel more or less and the next layout takes over.
describe("header by width", () => {
  const BAR = [
    "/learn/",
    "/guide/",
    "/flows/",
    "/deployments/",
    "/standards/",
    "/glossary/",
  ];
  const GROUPS = ["Start here", "In practice", "Reference"];
  // the least space between the last link in view and the search field
  const AIR = 8;

  const at = async (t, width, path = "/", options = {}) => {
    const ctx = await site.context({
      viewport: { width, height: 800 },
      reducedMotion: "reduce",
      ...options,
    });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url(path));
    return page;
  };

  // What of the header is drawn, and where.
  const seen = (page) =>
    page.evaluate(() => {
      const box = (el) => el.getBoundingClientRect();
      const shown = (el) => {
        const r = box(el);
        return r.width > 0 && r.height > 0;
      };
      const header = document.querySelector(".site-header");
      const one = (sel) => {
        const el = header.querySelector(sel);
        if (!el || !shown(el)) return null;
        const r = box(el);
        return { left: Math.round(r.left), right: Math.round(r.right) };
      };
      const hrefs = (sel) =>
        [...header.querySelectorAll(sel)]
          .filter(shown)
          .map((a) => a.getAttribute("href"));
      const text = (sel) =>
        [...header.querySelectorAll(sel)]
          .filter(shown)
          .map((el) => el.textContent.trim());
      return {
        bar: hrefs("#site-nav a"),
        quick: hrefs(".quick a"),
        groups: text(".nav-group-name"),
        notes: text(".nav-note"),
        marked: hrefs('#site-nav a[aria-current="page"]'),
        quickMarked: hrefs('.quick a[aria-current="page"]'),
        // every link that says it is the current page, shown or not
        current: [...header.querySelectorAll('nav a[aria-current="page"]')].map(
          (a) => a.getAttribute("href"),
        ),
        // links that carry a rule or a bar, as the current one does
        ruled: [...header.querySelectorAll("#site-nav a")]
          .filter((a) => shown(a) && getComputedStyle(a).boxShadow !== "none")
          .map((a) => a.getAttribute("href")),
        label: text(".launch-label").join(""),
        // the field's words are on its one line, and not on the one out of sight
        labelInView: (() => {
          const field = box(header.querySelector(".search-launch"));
          const words = box(header.querySelector(".launch-label"));
          return (
            words.width > 0 &&
            words.top >= field.top &&
            words.bottom <= field.bottom
          );
        })(),
        // where the last link in view ends: a link can run past the box it is in
        lastLink: Math.round(
          Math.max(
            ...[...header.querySelectorAll(".quick a, #site-nav a")]
              .filter(shown)
              .map((a) => box(a).right),
          ),
        ),
        brand: one(".brand"),
        wordmark: one(".wordmark"),
        quickBox: one(".quick"),
        nav: one("#site-nav"),
        search: one(".search-launch"),
        menu: one(".menu-toggle"),
        page: Math.round(
          box(document.querySelector("main .wrap")).left +
            parseFloat(
              getComputedStyle(document.querySelector("main .wrap"))
                .paddingLeft,
            ),
        ),
        width: innerWidth,
        sideways:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      };
    });

  for (const width of [1009, 1136, 1137, 1280, 1680]) {
    test(`${width}px: every section of the bar, in its groups, then search`, async (t) => {
      const got = await seen(await at(t, width));
      assert.deepEqual(got.bar, BAR);
      // the group names and what each section holds are for the menu
      assert.deepEqual([got.groups, got.notes, got.quick], [[], [], []]);
      assert.equal(got.menu, null, "a menu button beside the full bar");
      assert.equal(got.label, "Ask or search");
      assert.equal(got.labelInView, true, "the field has lost its words");
      assert.ok(
        got.brand.right <= got.nav.left &&
          got.lastLink + AIR <= got.search.left &&
          got.search.right <= got.width,
        JSON.stringify(got),
      );
      // the name stands over the page's left edge
      assert.ok(Math.abs(got.brand.left - got.page) <= 1, JSON.stringify(got));
      assert.equal(got.sideways, 0);
    });
  }

  test("the bar has three groups, told apart by a rule between them", async (t) => {
    const page = await at(t, 1280);
    const rules = await page.evaluate(() =>
      [...document.querySelectorAll("#site-nav .nav-group")].map((g) => {
        const rule = getComputedStyle(g, "::before");
        return rule.content !== "none" && parseFloat(rule.width) >= 1;
      }),
    );
    assert.deepEqual(rules, [false, true, true]);
  });

  for (const width of [768, 900, 1008]) {
    test(`${width}px: the home page's three ways in stay in the bar, beside search and the menu`, async (t) => {
      const page = await at(t, width);
      const got = await seen(page);
      const ways = await page.evaluate(() =>
        [...document.querySelectorAll(".hero .routes li > a")].map((a) =>
          a.getAttribute("href"),
        ),
      );
      assert.deepEqual(got.quick, ways);
      assert.deepEqual(got.bar, [], "the full list beside the menu button");
      assert.equal(got.label, "Ask or search");
      assert.equal(got.labelInView, true, "the field has lost its words");
      assert.ok(
        got.wordmark.right <= got.quickBox.left &&
          got.lastLink + AIR <= got.search.left &&
          got.search.right <= got.menu.left &&
          got.menu.right <= got.width,
        JSON.stringify(got),
      );
      assert.equal(got.sideways, 0);
    });
  }

  // Type is drawn wider on some systems than on the one the tests run on, and
  // a layout that only just fits here would lay search over a link there. The
  // field is made to give way first. Here every word in the header is set
  // wider than any system draws it, at the narrowest width of each layout.
  for (const width of [768, 1009, 1137]) {
    test(`${width}px, in wider type: search gives up its words before it covers a section`, async (t) => {
      const page = await at(t, width);
      await page.addStyleTag({
        content:
          ".site-header a, .site-header .wordmark { letter-spacing: 0.05em !important }",
      });
      const got = await seen(page);
      assert.ok(
        got.lastLink + AIR <= got.search.left &&
          got.search.right <= (got.menu?.left ?? got.width) &&
          got.search.right - got.search.left >= 44,
        JSON.stringify(got),
      );
      assert.equal(got.sideways, 0);
      // it is still named for what it does
      assert.equal(
        await page
          .getByRole("link", { name: /^Ask or search/ })
          .first()
          .isVisible(),
        true,
      );
    });
  }

  test("below the three ways in, a narrow header keeps the first, and nothing is covered", async (t) => {
    const got = await seen(await at(t, 767));
    assert.deepEqual(got.quick, ["/learn/"]);
    assert.ok(
      got.wordmark.right <= got.quickBox.left &&
        got.lastLink <= got.search.left &&
        got.search.right <= got.menu.left,
      JSON.stringify(got),
    );
    assert.equal(got.sideways, 0);
  });

  for (const width of [390, 900]) {
    test(`${width}px: the open menu names each group and says what each section holds`, async (t) => {
      const page = await at(t, width);
      await page.click(".menu-toggle");
      const got = await seen(page);
      assert.deepEqual(got.groups, GROUPS);
      // the bar's six, and the sections the bar has no room for
      assert.deepEqual(
        [...BAR, "/concepts/", "/compare/", "/implementations/"].filter(
          (href) => !got.bar.includes(href),
        ),
        [],
        got.bar.join(" "),
      );
      assert.equal(got.notes.length, got.bar.length, got.notes.join(" | "));
      assert.deepEqual(
        got.notes.filter((note) => note.length < 12),
        [],
      );
      assert.equal(got.sideways, 0);
    });
  }

  test("one section is the current page, and the bar shows the section around it", async (t) => {
    // The timeline is under the standards. The bar has no room for it, so the
    // rule goes under the standards. Only the timeline says it is the page.
    const bar = await seen(await at(t, 1280, "/standards/timeline/"));
    assert.deepEqual(
      [bar.current, bar.ruled],
      [["/standards/timeline/"], ["/standards/"]],
    );
    // The menu lists both, and marks the timeline alone.
    const narrow = await at(t, 390, "/standards/timeline/", {
      isMobile: true,
      hasTouch: true,
    });
    await narrow.click(".menu-toggle");
    const menu = await seen(narrow);
    assert.deepEqual(
      [menu.current, menu.marked, menu.ruled],
      [
        ["/standards/timeline/"],
        ["/standards/timeline/"],
        ["/standards/timeline/"],
      ],
    );
    // a page of a section with no entry of its own marks the section
    const entry = await seen(await at(t, 1280, "/standards/changes/"));
    assert.deepEqual(
      [entry.current, entry.ruled],
      [["/standards/"], ["/standards/"]],
    );
    const flow = await seen(await at(t, 900, "/flows/dpop/"));
    assert.deepEqual(flow.quickMarked, ["/flows/"]);
    const page = await at(t, 900, "/implementations/");
    assert.deepEqual((await seen(page)).marked, []);
    await page.click(".menu-toggle");
    assert.deepEqual((await seen(page)).marked, ["/implementations/"]);
  });

  test("the open menu closes when focus goes on into the page, which it would cover", async (t) => {
    const page = await at(t, 390, "/standards/timeline/", {
      isMobile: true,
      hasTouch: true,
    });
    await page.focus(".menu-toggle");
    await page.keyboard.press("Enter");
    // from the header's last control, one more Tab is the page's first
    await page.focus(".site-header .search-launch");
    await page.keyboard.press("Tab");
    const after = await page.evaluate(() => {
      const el = document.activeElement;
      const r = el.getBoundingClientRect();
      const at = document.elementFromPoint(
        r.left + r.width / 2,
        r.top + r.height / 2,
      );
      return {
        expanded: document
          .querySelector(".menu-toggle")
          .getAttribute("aria-expanded"),
        inHeader: Boolean(el.closest(".site-header")),
        inPage: Boolean(el.closest("main")),
        // what is drawn where the focused link is, is the link
        uncovered: at === el || el.contains(at),
      };
    });
    assert.deepEqual(after, {
      expanded: "false",
      inHeader: false,
      inPage: true,
      uncovered: true,
    });
  });

  test("without scripts a narrow header lists the bar's sections and has no menu button", async (t) => {
    const got = await seen(await at(t, 390, "/", { javaScriptEnabled: false }));
    assert.deepEqual(got.bar, BAR);
    assert.deepEqual([got.menu, got.quick], [null, []]);
    assert.ok(got.search.right <= got.width, JSON.stringify(got));
    assert.equal(got.sideways, 0);
  });
});

// The six things a reader may be building are a short list. A reader whose own
// is not on it is told, under the list, that search takes a description.
describe("building something else", () => {
  const LINE = ".building-more a";

  test("the line under the list opens search over the page, and gives focus back", async (t) => {
    const ctx = await site.context({ viewport: { width: 1280, height: 900 } });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url("/"));
    const placed = await page.evaluate((sel) => {
      const list = document.querySelector("ul.building");
      const line = document.querySelector(sel);
      return {
        under:
          line.getBoundingClientRect().top >=
          list.getBoundingClientRect().bottom,
        sameSection: line.closest("section") === list.closest("section"),
        words: line.closest("p").textContent.replace(/\s+/g, " ").trim(),
      };
    }, LINE);
    assert.deepEqual(placed, {
      under: true,
      sameSection: true,
      words:
        "Building something else? Describe it in your own words, and search the guide.",
    });
    const dialog = page.getByRole("dialog", { name: "Search the guide" });
    await page.locator(LINE).click();
    await dialog.waitFor();
    assert.equal(page.url(), site.url("/"));
    assert.equal(
      await dialog
        .getByRole("searchbox")
        .evaluate((el) => el === document.activeElement),
      true,
    );
    // what a description looks like is shown before the reader types one
    assert.equal(await dialog.locator(".search-examples").isVisible(), true);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(
      await page.locator(LINE).evaluate((el) => el === document.activeElement),
      true,
    );
  });

  test("without scripts the line leads to the search page", async (t) => {
    const ctx = await site.context({
      viewport: { width: 1280, height: 900 },
      javaScriptEnabled: false,
    });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url("/"));
    await page.locator(LINE).click();
    await page.getByRole("search").waitFor();
    assert.equal(page.url(), site.url("/search/"));
  });
});
