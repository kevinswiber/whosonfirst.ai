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
        label: text(".launch-label").join(""),
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

  for (const width of [961, 1088, 1089, 1280, 1680]) {
    test(`${width}px: every section of the bar, in its groups, then search`, async (t) => {
      const got = await seen(await at(t, width));
      assert.deepEqual(got.bar, BAR);
      // the group names and what each section holds are for the menu
      assert.deepEqual([got.groups, got.notes, got.quick], [[], [], []]);
      assert.equal(got.menu, null, "a menu button beside the full bar");
      assert.equal(got.label, "Ask or search");
      assert.ok(
        got.brand.right <= got.nav.left &&
          got.nav.right <= got.search.left &&
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

  for (const width of [736, 900, 960]) {
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
      assert.ok(
        got.wordmark.right <= got.quickBox.left &&
          got.quickBox.right <= got.search.left &&
          got.search.right <= got.menu.left &&
          got.menu.right <= got.width,
        JSON.stringify(got),
      );
      assert.equal(got.sideways, 0);
    });
  }

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

  test("a section is marked on its own pages: in the bar, or in the menu if it waits there", async (t) => {
    const changes = await seen(await at(t, 1280, "/standards/changes/"));
    assert.deepEqual(changes.marked, ["/standards/"]);
    const flow = await seen(await at(t, 900, "/flows/dpop/"));
    assert.deepEqual(flow.quickMarked, ["/flows/"]);
    const page = await at(t, 900, "/implementations/");
    assert.deepEqual((await seen(page)).marked, []);
    await page.click(".menu-toggle");
    assert.deepEqual((await seen(page)).marked, ["/implementations/"]);
  });

  test("without scripts a narrow header lists the bar's sections and has no menu button", async (t) => {
    const got = await seen(await at(t, 390, "/", { javaScriptEnabled: false }));
    assert.deepEqual(got.bar, BAR);
    assert.deepEqual([got.menu, got.quick], [null, []]);
    assert.ok(got.search.right <= got.width, JSON.stringify(got));
    assert.equal(got.sideways, 0);
  });
});
