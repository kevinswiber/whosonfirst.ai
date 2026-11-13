// What every page of a kind is held to, in each theme, on a desktop and on a
// phone: no script error, the line under the header on a long read, nothing
// wider than the window, no accessibility violation, and running text big
// enough and short enough to read.
import { strict as assert } from "node:assert";
import { after, before, describe, test } from "node:test";
import {
  axePath,
  device,
  open,
  THEMES,
  useBrowser,
  VIEWPORTS,
} from "../support/browser.mjs";
import { MAX_MEASURE, MIN_PROSE, prose } from "../support/measure.mjs";
import { PAGES } from "../support/site.mjs";

// The long pages say where the reader is on a line under the bar. The home
// page and the index pages are short, or are lists, and have none.
const LINED = ["lesson", "flow", "concepts", "deployment guide"];

const site = useBrowser();

// Each theme and window has a context of its own, and nothing here waits on a
// clock, so the four run side by side.
describe("every kind of page", { concurrency: true }, () => {
  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      describe(`${theme} ${vp.name}`, { concurrency: 1 }, () => {
        let ctx;
        before(async () => {
          ctx = await site.context(
            device(vp, { colorScheme: theme, reducedMotion: "reduce" }),
          );
        });
        after(() => ctx.close());

        for (const pg of PAGES) {
          describe(pg.name, () => {
            let page;
            const errors = [];
            before(async () => {
              page = await ctx.newPage();
              page.on("pageerror", (e) => errors.push(String(e)));
              page.on("console", (m) => {
                if (
                  m.type() === "error" &&
                  /Content Security Policy/i.test(m.text())
                )
                  errors.push(m.text().slice(0, 140));
              });
              await open(page, site.url(pg.path));
            });
            after(() => page.close());

            test("no script errors", () => {
              assert.deepEqual(errors, []);
            });

            // It has to still say so halfway down, which is when it is needed.
            let measured;
            const line = () =>
              (measured ??= page.evaluate(async () => {
                const nav = document.querySelector(".here-nav");
                if (!nav) return null;
                const frame = () =>
                  new Promise((r) =>
                    requestAnimationFrame(() => requestAnimationFrame(r)),
                  );
                scrollTo(0, document.documentElement.scrollHeight * 0.5);
                await frame();
                const box = nav.getBoundingClientRect();
                const name = nav.querySelector(".here-page");
                const n = name.getBoundingClientRect();
                const sec = nav.querySelector(".here-sec");
                const found = {
                  name: name.textContent.trim(),
                  inView: box.top >= 0 && box.bottom <= innerHeight / 3,
                  nameShown: n.width >= 40 && n.right <= innerWidth,
                  section:
                    sec && !sec.hidden && sec.offsetParent
                      ? sec.querySelector(".here-sec-name").textContent
                      : "",
                  button: !!sec && !sec.hidden && !!sec.offsetParent,
                };
                // pressing the button lists the sections, and choosing one goes there
                if (found.button) {
                  sec.click();
                  await frame();
                  const menu = document.querySelector(
                    ".site-header .here-menu",
                  );
                  const links = [...menu.querySelectorAll("a")];
                  const m = menu.getBoundingClientRect();
                  found.listed = links.length;
                  found.menuFits =
                    menu.matches(":popover-open") &&
                    m.left >= 0 &&
                    m.right <= innerWidth &&
                    m.top >= 0;
                  const pick = links[Math.min(2, links.length - 1)];
                  pick.click();
                  await frame();
                  const target = document.getElementById(pick.hash.slice(1));
                  const t = target.getBoundingClientRect().top;
                  found.went =
                    !menu.matches(":popover-open") && t >= 0 && t < innerHeight;
                  // and the list then marks that section, not the one before it
                  found.marked =
                    menu.querySelector("a[aria-current]") === pick &&
                    sec.querySelector(".here-sec-name").textContent ===
                      pick.textContent;
                  history.replaceState(null, "", location.pathname);
                }
                scrollTo(0, 0);
                await frame();
                return found;
              }));
            if (LINED.includes(pg.name)) {
              test("halfway down, the header still says which page this is", async () => {
                const l = await line();
                assert.ok(l, "no line");
                assert.ok(l.inView && l.nameShown, l.name);
              });
              test("its button lists the page’s sections, and choosing one goes there", async () => {
                const l = await line();
                assert.ok(l?.button, "no button for the sections");
                assert.ok(
                  l.listed > 1 && l.menuFits && l.went && l.marked,
                  `${l.listed ?? 0} listed${l.menuFits ? "" : ", list off screen"}${l.went ? "" : ", did not arrive"}${l.marked ? "" : ", wrong section marked"}`,
                );
              });
              if (vp.name === "desktop")
                test("and, with room, which section", async () => {
                  const l = await line();
                  assert.ok(l?.section, "no section named");
                });
            } else {
              test("a page that is not a long read has no line under the header", async () => {
                const l = await line();
                assert.equal(l, null, l?.name);
              });
            }

            test("no sideways overflow", async () => {
              await line();
              const overflow = await page.evaluate(
                () =>
                  document.documentElement.scrollWidth -
                  document.documentElement.clientWidth,
              );
              assert.ok(overflow <= 0, `${overflow}px`);
            });

            test("axe: no WCAG A/AA violations", async () => {
              await page.addScriptTag({ path: axePath });
              const violations = await page.evaluate(async () => {
                const r = await window.axe.run(document, {
                  runOnly: {
                    type: "tag",
                    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
                  },
                });
                return r.violations.map(
                  (v) =>
                    `${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(" ")}`,
                );
              });
              assert.deepEqual(violations, []);
            });

            let text;
            const measure = async () => (text ??= await page.evaluate(prose));
            test(`running text at least ${MIN_PROSE}px`, async (t) => {
              const all = await measure();
              if (!all.length) return t.skip("no running text");
              const small = Math.min(...all.map((x) => x.size));
              assert.ok(small >= MIN_PROSE, `smallest ${small.toFixed(1)}px`);
            });
            test(`at most ${MAX_MEASURE} characters a line`, async (t) => {
              const long = Math.max(
                0,
                ...(await measure()).map((x) => x.perLine),
              );
              if (!long) return t.skip("no paragraph of three lines or more");
              assert.ok(long <= MAX_MEASURE, `longest ${long.toFixed(0)}`);
            });
          });
        }
      });
    }
  }
});
