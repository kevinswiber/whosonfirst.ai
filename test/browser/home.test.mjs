// The home page, in each theme, on a desktop and on a phone: the header and its
// menu, the figure in the hero, the question of whose authority, and the ways in.
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
        test("header keeps the lessons in view", async () => {
          const closed = await visibleLinks();
          assert.ok(closed.includes("/learn/"), closed.join(" "));
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

      // The figure in the hero is lesson 1's comparison, with nothing to choose:
      // every credential against every question, on screen as the page arrives.
      const figure = () =>
        page.evaluate(() => {
          const fig = document.querySelector(".hero .ag");
          const box = fig.getBoundingClientRect();
          const seen = (el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.left >= box.left && r.right <= box.right;
          };
          return {
            controls: fig.querySelectorAll("input, button, select").length,
            // each party is tinted where the sentence over the table first names it
            parties: [...fig.querySelectorAll(".ag-setup .ag-who")].map((w) =>
              [...w.classList].find((c) => c.startsWith("role-")),
            ),
            // a verdict's cell is tinted, and no two verdicts share a tint
            tints: Object.fromEntries(
              [...fig.querySelectorAll("tbody td")].map((td) => [
                td.textContent.trim(),
                getComputedStyle(td).backgroundColor,
              ]),
            ),
            panel: getComputedStyle(fig).backgroundColor,
            rows: [...fig.querySelectorAll("tbody tr")].map((tr) => ({
              name: tr.querySelector(".ag-name").textContent.trim(),
              sends: tr.querySelectorAll(".ag-sends").length,
              marks: [...tr.querySelectorAll(".ag-mark")]
                .filter(seen)
                .map((m) => m.textContent.trim()),
            })),
            so: fig.querySelector(".ag-so").textContent.trim().length,
            more: fig.querySelector(".ag-more a").getAttribute("href"),
            height: box.height,
            pageWider: document.documentElement.scrollWidth > innerWidth,
          };
        });
      test("figure shows every credential against every question, with nothing to click", async () => {
        const f = await figure();
        assert.equal(f.controls, 0, "the figure has a control");
        assert.deepEqual(
          f.rows.map((r) => [r.marks.length, r.sends > 0]),
          [
            [3, true],
            [3, true],
            [3, true],
          ],
          JSON.stringify(f.rows),
        );
        assert.ok(f.so > 0, "no conclusion under the table");
      });
      test("figure has color: each party tinted as in the lessons, each verdict in a tint of its own", async () => {
        const f = await figure();
        assert.deepEqual(f.parties, [
          "role-human",
          "role-agent",
          "role-resource",
        ]);
        const tints = Object.values(f.tints);
        assert.ok(
          tints.length === 3 &&
            new Set(tints).size === 3 &&
            !tints.includes(f.panel),
          JSON.stringify(f.tints),
        );
      });
      test("figure ends on the credential that answers all three, and leads to lesson 1", async () => {
        const f = await figure();
        assert.deepEqual(f.rows.at(-1).marks, ["Yes", "Yes", "Yes"]);
        assert.equal(f.more, LESSON_ORDER[0]);
      });
      // beside the text on a wide screen it fits the window; on a phone, where
      // each credential is a block of its own, it may run a little past one
      test("figure fits in about one screen, and inside the page", async () => {
        const f = await figure();
        const room = vp.name === "phone" ? vp.height * 1.3 : vp.height;
        assert.ok(
          f.height <= room,
          `${Math.round(f.height)}px, allowed ${Math.round(room)}px`,
        );
        assert.ok(!f.pageWider, "the page scrolls sideways");
      });

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
