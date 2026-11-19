// The home page, in each theme, on a desktop and on a phone: the header and its
// menu, the hero, the question of whose authority, and the ways in.
import { assert, describe, test } from "ubqtest";
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
];

const site = useBrowser();

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    describe(`${theme} ${vp.name} home`, () => {
      let page;
      let ready;
      // Each test starts from the page as it arrives, and does its own steps.
      const setup = async () => {
        ready ??= (async () => {
          const ctx = await site.context(
            device(vp, { colorScheme: theme, reducedMotion: "reduce" }),
          );
          page = await ctx.newPage();
        })();
        await ready;
        await open(page, site.url("/"));
      };

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
        test("header keeps the lessons in view", async () => {
          await setup();
          const closed = await visibleLinks();
          assert.contains(closed, "/learn/");
        });
        test("menu opens from the keyboard and shows every destination", async () => {
          await setup();
          await openMenu();
          const shown = await visibleLinks();
          assert.deepEqual(
            DESTINATIONS.filter((d) => !shown.includes(d)),
            [],
          );
        });
        test("menu targets are at least 44px tall", async () => {
          await setup();
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
          assert.greaterThanOrEqual(size, 44);
        });
        test("first menu link takes focus next, with a visible ring", async () => {
          await setup();
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
          await setup();
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
          await setup();
          const shown = await visibleLinks();
          assert.deepEqual(
            DESTINATIONS.filter((d) => !shown.includes(d)),
            [],
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
        await setup();
        const h = await hero();
        assert.deepEqual(
          { extras: h.extras, louder: h.louder },
          { extras: 0, louder: 0 },
        );
        assert(!h.pageWider); // the page scrolls sideways
      });
      if (vp.name === "desktop") {
        test("the ways in sit beside the question, starting level with it, and the hero fits the window", async () => {
          await setup();
          const h = await hero();
          assert.greaterThanOrEqual(h.routes.left, h.h1.right);
          // the question's top and the ways in's top, in px
          assert.lessThanOrEqual(Math.abs(h.routes.top - h.h1.top), 16);
          assert.lessThanOrEqual(h.bottom, vp.height);
        });
      } else {
        test("the ways in follow the question, and the first is on the first screen", async () => {
          await setup();
          const h = await hero();
          const first = await page.evaluate(
            () =>
              document
                .querySelector(".hero .routes li > a")
                .getBoundingClientRect().bottom,
          );
          assert.greaterThanOrEqual(h.routes.top, h.h1.bottom);
          assert.lessThanOrEqual(first, vp.height); // where the first way in ends
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
        await setup();
        const au = await authority();
        assert.equal(au.n, 2);
        assert.lessThanOrEqual(au.lastChoiceBottom, au.branchTop);
        // px for both answers
        assert.lessThanOrEqual(
          au.lastChoiceBottom - au.firstChoiceTop,
          vp.height,
        );
      });
      test("one branch at a time, switched by the answer", async () => {
        await setup();
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
        await setup();
        const routes = await page.evaluate(() =>
          [...document.querySelectorAll(".routes li > a")].map((a) =>
            a.getAttribute("href"),
          ),
        );
        assert.deepEqual(
          ["/learn/", "/guide/", "/flows/"].filter((h) => !routes.includes(h)),
          [],
        );
      });
      test("every lesson is listed, in order", async () => {
        await setup();
        const path = await page.evaluate(() =>
          [...document.querySelectorAll("ol.path a")].map((a) =>
            a.getAttribute("href"),
          ),
        );
        assert(LESSON_ORDER.length > 0); // the lessons index lists none
        assert.deepEqual(path, LESSON_ORDER);
      });
    });
  }
}
