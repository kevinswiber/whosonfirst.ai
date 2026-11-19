// A flow page, in each theme, on a desktop and on a phone: the overview and
// how it agrees with the diagram, a glossary term's definition in place, the
// stepper beside the diagram at a desk, and the narrative with the diagram on
// demand on a phone.
import { assert, describe, test } from "ubqtest";
import {
  device,
  open,
  THEMES,
  useBrowser,
  VIEWPORTS,
} from "../support/browser.mjs";
import { AA, diagramLabels, MIN_LABEL } from "../support/measure.mjs";
import { FLOW } from "../support/site.mjs";

const site = useBrowser();
const stepText = (page) =>
  page.evaluate(() => document.querySelector(".flow-count").textContent);

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    describe(`${theme} ${vp.name} flow`, () => {
      let page;
      let count;
      let ready;
      const setup = () =>
        (ready ??= (async () => {
          const ctx = await site.context(
            device(vp, { colorScheme: theme, reducedMotion: "reduce" }),
          );
          page = await ctx.newPage();
          await open(page, site.url(FLOW));
          // with the supporting details open, as a reader who has read them has it
          await page.click("main .doc-details summary");
          count = await page.evaluate(() =>
            Number(document.querySelector(".flow").dataset.count),
          );
        })());

      // The overview: the steps in a few parts that between them cover every step,
      // each party's part under its name, and both before the diagram.
      let read;
      const ov = () =>
        (read ??= setup().then(() =>
          page.evaluate(() => {
            const top = (sel) =>
              document.querySelector(sel).getBoundingClientRect().top + scrollY;
            const starts = [...document.querySelectorAll(".ov-phases a")].map(
              (a) => Number(a.getAttribute("href").replace("#step-", "")),
            );
            const parties = [
              ...document.querySelectorAll(".ov-parts > div"),
            ].map((d) => ({
              name: d.querySelector("dt").textContent.trim(),
              words: d.querySelector("dd > span").textContent.trim().length,
              steps: d.querySelectorAll(".ov-steps a").length,
            }));
            return {
              starts,
              parties,
              before: top("#in-short") < top("#walkthrough"),
              bands: [...document.querySelectorAll("svg .phase")].map((g) => [
                Number(g.dataset.first) + 1,
                Number(g.dataset.last) + 1,
              ]),
            };
          }),
        ));
      test("overview: a few parts, in order, starting at step 1, before the diagram", async () => {
        const { before, starts } = await ov();
        assert(before); // the overview is after the diagram
        assert.greaterThanOrEqual(starts.length, 2);
        assert.equal(starts[0], 1);
        assert(starts.every((n, i) => i === 0 || n > starts[i - 1])); // in order
        assert.lessThanOrEqual(starts.at(-1), count);
      });
      test("overview: each party's part is said, with the steps it takes part in", async () => {
        const { parties } = await ov();
        assert.greaterThanOrEqual(parties.length, 2);
        assert.deepEqual(
          parties.filter((p) => !(p.words > 20 && p.steps > 0)),
          [],
        ); // a party with too few words or no steps
      });
      test("diagram is divided into the same parts, and they cover every step", async () => {
        const { bands, starts } = await ov();
        await setup();
        assert.deepEqual(
          bands,
          starts.map((first, i) => [first, (starts[i + 1] ?? count + 1) - 1]),
        );
      });

      // A glossary term in the text shows its definition in place, and goes away again.
      test("enhanced glossary terms retain link semantics and definition destinations", async () => {
        await setup();
        const terms = page.locator("main a.term");
        const n = await terms.count();
        assert(n > 0); // no glossary term is marked
        assert.equal(
          await page.locator("main").getByRole("link").and(terms).count(),
          n,
        ); // a marked term is not exposed as a link
        assert(
          await terms.evaluateAll((links) =>
            links.every((a) =>
              a.getAttribute("href")?.startsWith("/glossary/#"),
            ),
          ),
        ); // a marked term does not lead to the glossary
      });
      // Focuses the first term in the introduction, and says what its preview shows.
      const preview = async () => {
        await setup();
        return page.evaluate(async () => {
          const settle = () => new Promise((r) => setTimeout(r, 60));
          const a = document.querySelector(".intro a.term");
          if (!a) return null;
          a.scrollIntoView({ block: "center" });
          await settle();
          a.focus({ preventScroll: true });
          await settle();
          const tip = document.querySelector("#term-tip");
          const r = tip.getBoundingClientRect();
          return {
            shown: tip.matches(":popover-open"),
            says: tip.querySelector(".term-tip-def")?.textContent.length ?? 0,
            expanded: a.getAttribute("aria-expanded"),
            inWindow:
              r.left >= 0 &&
              r.right <= innerWidth + 0.5 &&
              r.top >= 0 &&
              r.bottom <= innerHeight + 0.5,
            more: tip.querySelector("a")?.getAttribute("href"),
            href: a.getAttribute("href"),
            terms: document.querySelectorAll("main a.term").length,
          };
        });
      };
      test("focusing a glossary term previews its definition inside the window", async () => {
        const term = await preview();
        assert(term); // no term marked in the introduction
        assert(term.shown); // the definition is not shown
        assert.greaterThan(term.says, 20);
        assert.equal(term.expanded, "true");
        assert(term.inWindow); // the definition runs out of the window
        assert.equal(term.more, term.href);
      });
      test("Escape dismisses the definition without moving focus", async () => {
        const term = await preview();
        assert(term?.shown); // the definition was not shown to begin with
        await page.keyboard.press("Escape");
        await page.waitForTimeout(80);
        const dismissed = await page.evaluate(() => ({
          closed: !document
            .querySelector("#term-tip")
            ?.matches(":popover-open"),
          collapsed: document
            .querySelector(".intro a.term")
            ?.getAttribute("aria-expanded"),
          focused:
            document.activeElement === document.querySelector(".intro a.term"),
        }));
        assert.deepEqual(dismissed, {
          closed: true,
          collapsed: "false",
          focused: true,
        });
      });

      if (vp.name === "desktop") {
        // the stepper: measure the diagram at its first, a middle and its last step
        const at = async (n) => {
          await setup();
          await page.evaluate((n) => {
            location.hash = `#step-${n}`;
          }, n);
        };
        for (const [label, step] of [
          ["its first", () => 1],
          ["a middle", () => Math.ceil(count / 2)],
          ["its last", () => count],
        ]) {
          describe(`at ${label} step`, () => {
            const go = async () => {
              await setup();
              await at(step());
              await page.waitForTimeout(80);
            };
            let measured;
            const measure = () =>
              (measured ??= go().then(() => page.evaluate(diagramLabels)));
            test(`every label at least ${AA}:1 as drawn`, async () => {
              const labels = await measure();
              const worst = labels.reduce((a, b) =>
                b.ratio < a.ratio ? b : a,
              );
              assert.deepEqual(worst.ratio >= AA ? [] : [worst], []); // the label with the lowest contrast
            });
            test(`labels drawn at ${MIN_LABEL}px or more`, async () => {
              const labels = await measure();
              const tiny = labels.reduce((a, b) => (b.px < a.px ? b : a));
              assert.deepEqual(tiny.px >= MIN_LABEL - 0.05 ? [] : [tiny], []); // the smallest label
            });
            test("every step remains readable, with the selected route marked", async () => {
              await go();
              const held = await page.evaluate(() => {
                const li = document.querySelector(".flow-step.is-current");
                return {
                  shown: document.querySelectorAll(".flow-step:not([hidden])")
                    .length,
                  route: li
                    ?.querySelector(".step-route")
                    ?.textContent.replace(/\s+/g, " ")
                    .trim(),
                };
              });
              assert.equal(held.shown, count);
              assert(held.route); // no route marked
            });
          });
        }

        // a link to a step (from the overview, or from elsewhere) brings the diagram into view
        test("a part's link shows its first step, with the diagram in view and the part marked", async () => {
          const { starts } = await ov();
          await at(1);
          await page.waitForTimeout(80);
          await page.evaluate(() => scrollTo(0, 0));
          await page.click(".ov-phases li:nth-child(2) a");
          await page.waitForTimeout(150);
          const linked = await page.evaluate(() => {
            const r = document.querySelector(".flow").getBoundingClientRect();
            return {
              count: document.querySelector(".flow-count").textContent,
              inView: r.top < innerHeight * 0.5 && r.bottom > 0,
              phase: document
                .querySelector(".flow-step.is-current .step-phase-n")
                ?.textContent.trim(),
              active: document.querySelectorAll("svg .phase.is-active").length,
            };
          });
          assert.match(linked, {
            inView: true,
            count: (c) => c.startsWith(`Step ${starts[1]} `),
            phase: /^Part 2 of/,
            active: 1,
          });
        });
        // the last part starts a screen or more down the diagram: its row has to be
        // brought into view too, not only the top of the diagram
        test("a link to a late part leaves that step’s row in view in the diagram", async () => {
          const { starts } = await ov();
          await at(1);
          await page.waitForTimeout(80);
          await page.evaluate(() => scrollTo(0, 0));
          await page.click(".ov-phases li:last-child a");
          await page.waitForTimeout(200);
          const late = await page.evaluate(() => {
            const row = document
              .querySelector("svg .step.is-active .hit")
              .getBoundingClientRect();
            const canvas = document
              .querySelector(".flow-canvas")
              .getBoundingClientRect();
            const header = document
              .querySelector(".site-header")
              .getBoundingClientRect().bottom;
            const top = Math.max(header, canvas.top);
            const bottom = Math.min(innerHeight, canvas.bottom);
            return {
              count: document.querySelector(".flow-count").textContent,
              inView: row.top >= top - 1 && row.bottom <= bottom + 1,
              row: [Math.round(row.top), Math.round(row.bottom)],
              window: [Math.round(top), Math.round(bottom)],
            };
          });
          assert.match(late, {
            inView: true,
            count: (c) => c.startsWith(`Step ${starts.at(-1)} `),
          });
        });
        // an address that names a late step is a link people paste: opened fresh,
        // it has to leave that step's row in view, as pressing the step does
        // (leave the page first: a reload would restore the scroll position it had)
        test("an address that names a late step opens with that step’s row in view in the diagram", async () => {
          await at(count);
          await page.waitForTimeout(80);
          const flowUrl = page.url();
          await page.goto("about:blank");
          await open(page, flowUrl);
          await page.waitForTimeout(300);
          const addressed = await page.evaluate(() => {
            const row = document
              .querySelector("svg .step.is-active .hit")
              .getBoundingClientRect();
            const header = document
              .querySelector(".site-header")
              .getBoundingClientRect().bottom;
            return {
              count: document.querySelector(".flow-count").textContent,
              hash: location.hash,
              inView: row.top >= header - 1 && row.bottom <= innerHeight + 1,
              row: [Math.round(row.top), Math.round(row.bottom)],
              window: [Math.round(header), innerHeight],
            };
          });
          assert.match(addressed, {
            inView: true,
            count: (c) => c.startsWith(`Step ${count} `),
          });
        });
        // keyboard: Left and Right step, Down is left to scrolling, and focus is never stranded
        test("arrow keys: Left steps back, Down does not change the step", async () => {
          // from the last step, where Next is disabled and Previous is not
          await at(count);
          await page.waitForTimeout(80);
          await page.focus('[data-act="prev"]');
          await page.keyboard.press("ArrowLeft");
          const afterLeft = await stepText(page);
          await page.keyboard.press("ArrowDown");
          const afterDown = await stepText(page);
          assert.contains(afterLeft, `${count - 1} of`);
          assert.equal(afterDown, afterLeft);
        });
        test("last step: focus moves from the disabled Next to Previous", async () => {
          await at(count - 1);
          await page.waitForTimeout(80);
          await page.click('[data-act="next"]');
          const handed = await page.evaluate(() => ({
            disabled: document.querySelector('[data-act="next"]').disabled,
            onPrev:
              document.activeElement ===
              document.querySelector('[data-act="prev"]'),
          }));
          assert.deepEqual(handed, { disabled: true, onPrev: true });
        });
        // A glossary link inside a step must not keep focus after an arrow
        // scrolls that step out of the narrative panel.
        test("arrow navigation returns focus from a scrolled-away step to a control", async () => {
          await at(1);
          await page.waitForTimeout(80);
          await page.locator(".flow-step.is-current a").first().focus();
          await page.keyboard.press("ArrowRight");
          const focus = await page.evaluate(() => ({
            step: document.querySelector(".flow-step.is-current")?.id,
            control: document.activeElement?.matches(
              ".flow-controls button:not(:disabled)",
            ),
          }));
          assert.deepEqual(focus, { step: "step-2", control: true });
        });
        test("steps say who holds which credential", async () => {
          await setup();
          const holders = await page.evaluate(
            () => document.querySelectorAll(".flow-step .held dt").length,
          );
          assert.greaterThan(holders, 0);
        });
      } else {
        // the phone: a narrative of every step, with the diagram on demand at full size
        let read;
        const state = () =>
          (read ??= setup().then(() =>
            page.evaluate(() => ({
              shown: document.querySelectorAll(".flow-step:not([hidden])")
                .length,
              open: document.querySelector(".flow-stage").open,
              summary: !!document.querySelector(".flow-stage > summary")
                ?.offsetParent,
            })),
          ));
        test("every step is readable as a narrative", async () => {
          const s = await state();
          assert.equal(s.shown, count);
        });
        test("diagram is offered on demand, not forced", async () => {
          const s = await state();
          assert.deepEqual(
            { open: s.open, summary: s.summary },
            { open: false, summary: true },
          );
        });
        describe("with the diagram opened", () => {
          // the diagram open, once the closed page has been read
          const opened = async () => {
            await state();
            if (
              !(await page.evaluate(
                () => document.querySelector(".flow-stage").open,
              ))
            ) {
              await page.click(".flow-stage > summary");
              await page.waitForTimeout(80);
            }
          };
          let measured;
          const measure = () =>
            (measured ??= opened().then(() => page.evaluate(diagramLabels)));
          test(`opened diagram keeps labels at ${MIN_LABEL}px or more`, async () => {
            const labels = await measure();
            const tiny = Math.min(...labels.map((l) => l.px));
            assert.greaterThanOrEqual(tiny, MIN_LABEL - 0.05);
          });
          test(`opened diagram: every label at least ${AA}:1 as drawn`, async () => {
            const labels = await measure();
            const worst = labels.reduce((a, b) => (b.ratio < a.ratio ? b : a));
            assert.deepEqual(worst.ratio >= AA ? [] : [worst], []); // the label with the lowest contrast
          });
          test("opened diagram scrolls inside its own frame", async () => {
            await opened();
            const still = await page.evaluate(
              () =>
                document.documentElement.scrollWidth -
                document.documentElement.clientWidth,
            );
            assert.lessThanOrEqual(still, 0);
          });
          test("leaving the diagram closes it and lands on its control, in view", async () => {
            await opened();
            await page.click(".flow-back button");
            await page.waitForTimeout(80);
            const left = await page.evaluate(() => {
              const s = document.querySelector(".flow-stage > summary");
              const r = s.getBoundingClientRect();
              return {
                open: document.querySelector(".flow-stage").open,
                focus: document.activeElement === s,
                inView: r.top >= 0 && r.bottom <= innerHeight,
              };
            });
            assert.deepEqual(left, { open: false, focus: true, inView: true });
          });
        });
      }
    });
  }
}
