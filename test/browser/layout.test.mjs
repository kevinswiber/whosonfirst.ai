// A flow page between a phone and a desk: the comparison as a table or as
// blocks, the stacked tablet layout as the narrative advances, and the selected
// step kept through expanding, collapsing and a change of width.
import { strict as assert } from "node:assert";
import { after, before, describe, test } from "node:test";
import { frames, open, useBrowser } from "../support/browser.mjs";
import { FLOW } from "../support/site.mjs";

const site = useBrowser();
const FLOWS = ["/flows/dpop/", FLOW];

// comparison on a flow page: a table where there is room, blocks of labeled fields where there
// is not. One of the two is shown, and only that one reaches assistive technology.
describe("comparison on /flows/workload-identity-federation/", () => {
  for (const [width, shown, hidden] of [
    [320, ".compare-narrow", ".compare-wide"],
    [375, ".compare-narrow", ".compare-wide"],
    [1280, ".compare-wide", ".compare-narrow"],
  ]) {
    test(`${width}px: one presentation shown and exposed, each value under its label`, async (t) => {
      const ctx = await site.context({ viewport: { width, height: 800 } });
      t.after(() => ctx.close());
      const page = await ctx.newPage();
      await open(page, site.url("/flows/workload-identity-federation/"));
      const seen = await page.evaluate(
        ([shown, hidden]) => {
          const box = (sel) => {
            const el = document.querySelector(sel);
            return {
              display: getComputedStyle(el).display,
              sideways: el.scrollWidth - el.clientWidth,
            };
          };
          const blocks = [...document.querySelectorAll(".compare-narrow .env")];
          return {
            shown: box(shown),
            hidden: box(hidden),
            rows: document.querySelectorAll(".compare tbody tr").length,
            blocks: blocks.length,
            // every value in a block sits under a label of its own
            unlabeled: blocks.filter((b) =>
              [...b.querySelectorAll("dl > div")].some(
                (d) =>
                  d.querySelectorAll("dt").length !== 1 ||
                  d.querySelectorAll("dd").length !== 1 ||
                  !d.querySelector("dt").textContent.trim(),
              ),
            ).length,
          };
        },
        [shown, hidden],
      );
      const tree = await page
        .locator('section[aria-labelledby="comparison"]')
        .ariaSnapshot();
      const tables = tree.split("- table").length - 1;
      const terms = tree.split("- term").length - 1;
      const narrow = shown === ".compare-narrow";
      assert.deepEqual(
        [
          seen.shown.display === "none" && `${shown} is not shown`,
          seen.hidden.display !== "none" && `${hidden} is also shown`,
          seen.shown.sideways > 1 &&
            `${shown} scrolls sideways by ${seen.shown.sideways}px`,
          seen.rows !== seen.blocks &&
            `${seen.rows} table rows but ${seen.blocks} blocks`,
          seen.unlabeled > 0 &&
            `${seen.unlabeled} blocks have a value without one label`,
          narrow && tables > 0 && "the hidden table is exposed",
          narrow && terms === 0 && "the blocks expose no labels",
          !narrow && terms > 0 && "the hidden blocks are exposed",
          !narrow && tables !== 1 && `${tables} tables exposed`,
        ].filter(Boolean),
        [],
      );
    });
  }
});

// The stacked tablet layout must keep its controls reachable as the complete
// narrative advances, including at either edge of its breakpoint.
for (const width of [768, 900, 1087]) {
  for (const path of FLOWS) {
    describe(`tablet ${width}px ${path}`, () => {
      let page;
      before(async () => {
        const ctx = await site.context({ viewport: { width, height: 900 } });
        page = await ctx.newPage();
        await open(page, site.url(path));
      });
      after(() => page.context().close());
      test("Next reaches the last step without scrolling controls off the page", async () => {
        await page.evaluate(() => {
          const panel = document.querySelector(".flow-panel");
          window.scrollBy(0, panel.getBoundingClientRect().top - 120);
        });
        const initialY = await page.evaluate(() => scrollY);
        const count = await page.locator(".flow-step").count();
        for (let i = 1; i < count; i++)
          await page.locator('[data-act="next"]').click();
        const seen = await page.evaluate(() => {
          const panel = document.querySelector(".flow-panel");
          const bar = document
            .querySelector(".flow-bar")
            .getBoundingClientRect();
          const heading = document
            .querySelector(".flow-step.is-current h3")
            .getBoundingClientRect();
          return {
            y: scrollY,
            scrolled: panel.scrollTop > 0,
            bounded: panel.clientHeight < panel.scrollHeight,
            controlsVisible: bar.top >= 100 && bar.bottom < innerHeight,
            headingVisible:
              heading.top >= bar.bottom && heading.bottom < innerHeight,
            readable: [...document.querySelectorAll(".flow-step")].every(
              (step) => step.checkVisibility({ visibilityProperty: true }),
            ),
          };
        });
        assert.ok(
          Math.abs(seen.y - initialY) <= 1 &&
            seen.scrolled &&
            seen.bounded &&
            seen.controlsVisible &&
            seen.headingVisible &&
            seen.readable,
          JSON.stringify({ initialY, ...seen }),
        );
      });
      // A diagram selection uses the same bounded narrative panel.
      test("diagram selection aligns its explanation inside the scrolling panel", async () => {
        await page.locator('svg .step[data-step="1"]').first().click();
        const selected = await page.evaluate(() => {
          const panel = document.querySelector(".flow-panel");
          const bar = document
            .querySelector(".flow-bar")
            .getBoundingClientRect();
          const heading = document
            .querySelector(".flow-step.is-current h3")
            .getBoundingClientRect();
          return {
            id: document.querySelector(".flow-step.is-current").id,
            scrolled: panel.scrollTop > 0,
            headingBelowControls: heading.top >= bar.bottom,
            headingInPanel:
              heading.bottom <= panel.getBoundingClientRect().bottom,
          };
        });
        assert.deepEqual(selected, {
          id: "step-2",
          scrolled: true,
          headingBelowControls: true,
          headingInPanel: true,
        });
      });
    });
  }
}

// Expanding removes the scroll constraint. Collapsing must restore the selected
// explanation, not leave the narrative at step 1 beside a later diagram step.
for (const width of [900, 1280]) {
  for (const path of FLOWS) {
    describe(`collapse ${width}px ${path}`, () => {
      let page;
      let count;
      let step;
      before(async () => {
        const ctx = await site.context({ viewport: { width, height: 900 } });
        page = await ctx.newPage();
        await open(page, site.url(path));
        count = await page.locator(".flow-step").count();
        step = count - 1;
        await open(page, site.url(`${path}#step-${step}`));
      });
      after(() => page.context().close());
      const toggle = () => page.locator('[data-act="all"]');
      for (const interaction of ["pointer", "keyboard", "reflow"]) {
        test(`collapsing expanded steps (${interaction}) restores the selected explanation without changing selection`, async () => {
          await toggle().click();
          // Let the expanded layout paint before collapsing, as a reader sees it.
          await frames(page);
          const expanded = await page
            .locator(".flow-panel")
            .evaluate((panel) => panel.scrollHeight <= panel.clientHeight + 1);
          if (interaction === "reflow") {
            await page.setViewportSize({
              width: width === 900 ? 1280 : 900,
              height: 900,
            });
            await frames(page);
          }
          if (interaction === "keyboard") {
            await toggle().focus();
            await page.keyboard.press("Enter");
          } else {
            await toggle().click();
          }
          const seen = await page.evaluate(() => {
            const panel = document.querySelector(".flow-panel");
            const bar = document
              .querySelector(".flow-bar")
              .getBoundingClientRect();
            const heading = document
              .querySelector(".flow-step.is-current h3")
              .getBoundingClientRect();
            return {
              step: document.querySelector(".flow-step.is-current").id,
              diagramStep:
                Number(
                  document.querySelector("svg .step.is-active").dataset.step,
                ) + 1,
              count: document.querySelector(".flow-count").textContent,
              hash: location.hash,
              headingInPanel:
                heading.top >= bar.bottom &&
                heading.bottom <= panel.getBoundingClientRect().bottom,
              readable: [...document.querySelectorAll(".flow-step")].every(
                (li) => li.checkVisibility({ visibilityProperty: true }),
              ),
            };
          });
          assert.deepEqual(
            { expanded, ...seen },
            {
              expanded: true,
              step: `step-${step}`,
              diagramStep: step,
              count: `Step ${step} of ${count}`,
              hash: `#step-${step}`,
              headingInPanel: true,
              readable: true,
            },
          );
        });
      }
      // Returning from a phone also changes line wrapping and the step’s offset.
      test("returning from phone layout restores the selected explanation", async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await frames(page);
        await page.setViewportSize({ width, height: 900 });
        await frames(page);
        const restored = await page.evaluate(() => {
          const panel = document
            .querySelector(".flow-panel")
            .getBoundingClientRect();
          const bar = document
            .querySelector(".flow-bar")
            .getBoundingClientRect();
          const current = document.querySelector(".flow-step.is-current");
          const heading = current.querySelector("h3").getBoundingClientRect();
          return {
            id: current.id,
            inPanel:
              heading.top >= bar.bottom && heading.bottom <= panel.bottom,
          };
        });
        assert.deepEqual(restored, { id: `step-${step}`, inPanel: true });
      });
    });
  }
}
