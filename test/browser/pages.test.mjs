// What every page of a kind is held to, in each theme, on a desktop and on a
// phone: no script error, the line under the header on a long read, nothing
// wider than the window, no accessibility violation, and running text big
// enough and short enough to read.
import { assert, describe, test } from "ubqtest";
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
const LINED = [
  "lesson",
  "flow",
  "comparison",
  "concepts",
  "deployment guide",
  "implementation record",
  "case",
];

const site = useBrowser();
const options = (theme, vp) =>
  device(vp, { colorScheme: theme, reducedMotion: "reduce" });

// Which pages have running text, and which a paragraph of three lines or
// more, read before the tests are made: a test with nothing to measure is
// skipped, and says why.
const has = {};
for (const theme of THEMES)
  for (const vp of VIEWPORTS) {
    const ctx = await site.context(options(theme, vp));
    const page = await ctx.newPage();
    for (const pg of PAGES) {
      await open(page, site.url(pg.path));
      const all = await page.evaluate(prose);
      has[`${theme} ${vp.name} ${pg.name}`] = {
        text: all.length > 0,
        paragraph: all.some((x) => x.perLine > 0),
      };
    }
    await ctx.close();
  }

describe("every kind of page", () => {
  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      describe(`${theme} ${vp.name}`, () => {
        let ready;
        const context = () => (ready ??= site.context(options(theme, vp)));
        // one page of this context open at a time
        let last;

        for (const pg of PAGES) {
          describe(pg.name, () => {
            const found = has[`${theme} ${vp.name} ${pg.name}`];
            let page;
            let made;
            const errors = [];
            const setup = async () => {
              if (made && !page.isClosed()) return made;
              made = (async () => {
                const ctx = await context();
                await last?.close();
                page = last = await ctx.newPage();
                page.on("pageerror", (e) => errors.push(String(e)));
                page.on("console", (m) => {
                  if (
                    m.type() === "error" &&
                    /Content Security Policy/i.test(m.text())
                  )
                    errors.push(m.text().slice(0, 140));
                });
                await open(page, site.url(pg.path));
              })();
              return made;
            };

            test("no script errors", async () => {
              await setup();
              assert.deepEqual(errors, []);
            });

            // It has to still say so halfway down, which is when it is needed.
            let measured;
            const line = () =>
              (measured ??= setup().then(() =>
                page.evaluate(async () => {
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
                    found.picked = pick.textContent;
                    found.current =
                      sec.querySelector(".here-sec-name").textContent;
                    const target = document.getElementById(pick.hash.slice(1));
                    const t = target.getBoundingClientRect().top;
                    found.went =
                      !menu.matches(":popover-open") &&
                      t >= 0 &&
                      t < innerHeight;
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
                }),
              ));
            if (LINED.includes(pg.name)) {
              test("halfway down, the header still says which page this is", async () => {
                const l = await line();
                assert(l); // no line
                assert(l.inView && l.nameShown, l.name);
              });
              test("its button lists the page’s sections, and choosing one goes there", async () => {
                const l = await line();
                assert(l?.button); // no button for the sections
                assert(
                  l.listed > 1 && l.menuFits && l.went && l.marked,
                  `${l.listed ?? 0} listed${l.menuFits ? "" : ", list off screen"}${l.went ? "" : ", did not arrive"}${l.marked ? "" : `, picked “${l.picked}” but marked “${l.current}”`}`,
                );
              });
              if (vp.name === "desktop")
                test("and, with room, which section", async () => {
                  const l = await line();
                  assert(l?.section); // no section named
                });
            } else {
              test("a page that is not a long read has no line under the header", async () => {
                const l = await line();
                assert.equal(l, null);
              });
            }

            test("no sideways overflow", async () => {
              await line();
              const overflow = await page.evaluate(
                () =>
                  document.documentElement.scrollWidth -
                  document.documentElement.clientWidth,
              );
              assert.lessThanOrEqual(overflow, 0);
            });

            test("axe: no WCAG A/AA violations", async () => {
              await setup();
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
            const measure = async () =>
              (text ??= await setup().then(() => page.evaluate(prose)));
            test(`running text at least ${MIN_PROSE}px`, {
              skip: !found.text && "no running text",
            }, async () => {
              const all = await measure();
              const small = Math.min(...all.map((x) => x.size));
              assert.greaterThanOrEqual(small, MIN_PROSE);
            });
            test(`at most ${MAX_MEASURE} characters a line`, {
              skip: !found.paragraph && "no paragraph of three lines or more",
            }, async () => {
              const long = Math.max(
                0,
                ...(await measure()).map((x) => x.perLine),
              );
              assert.lessThanOrEqual(long, MAX_MEASURE);
            });
          });
        }
      });
    }
  }
});
