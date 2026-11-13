// A flow page on paper: every step in order, each with its text, no control,
// light ink whatever the reader's theme, and a diagram that fits on one sheet.
// A drawing is not split between pages, and a browser cuts off what does not
// fit. Printed from a desktop, the page has been stepping through; printed from
// a phone, it reads as a narrative with the diagram closed.
import { strict as assert } from "node:assert";
import { after, before, describe, test } from "node:test";
import { device, open, useBrowser, VIEWPORTS } from "../support/browser.mjs";
import { FLOWS } from "../support/site.mjs";

const SHEET = { width: 718, height: 979 }; // px at 96 to the inch
const look = () => {
  // a closed disclosure keeps its content laid out, only not drawn
  const shown = (e) => e.checkVisibility({ visibilityProperty: true });
  const flow = document.querySelector("flow-diagram");
  const count = Number(flow.dataset.count);
  const steps = [...flow.querySelectorAll(".flow-step")];
  const tops = steps.map((li) => li.getBoundingClientRect().top);
  const sheet = flow.querySelector(".flow-sheet").getBoundingClientRect();
  const ink = (sel) =>
    new Set(
      [...flow.querySelectorAll(sel)].map(
        (e) => `${getComputedStyle(e).fill} ${getComputedStyle(e).fontWeight}`,
      ),
    ).size;
  const rgb = (c) =>
    c
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map(Number);
  const sum = (c) => rgb(c).reduce((a, b) => a + b, 0);
  return {
    count,
    steps: steps.length,
    shown: steps.filter(shown).length,
    ordered: tops.every((t, i) => i === 0 || t > tops[i - 1]),
    untitled: steps.filter(
      (li) =>
        !shown(li.querySelector("h3")) ||
        !li.querySelector("h3").textContent.trim(),
    ).length,
    buttons: [...document.querySelectorAll("button")]
      .filter(shown)
      .map((b) => b.textContent.trim() || b.className),
    paper: sum(getComputedStyle(document.body).backgroundColor),
    text: sum(getComputedStyle(document.body).color),
    diagram: shown(flow.querySelector(".flow-lines")),
    arrows: flow.querySelectorAll("svg .step").length,
    labelInks: ink("svg .step :is(.arrow-label, .note-label)"),
    sheet: { width: sheet.width, height: sheet.height },
  };
};

const site = useBrowser();

// The desktop and the phone each have a context of its own, and nothing here
// waits on a clock, so the two run side by side.
describe("every flow on paper", { concurrency: true }, () => {
  for (const vp of VIEWPORTS) {
    describe(`print from ${vp.name}`, { concurrency: 1 }, () => {
      let page;
      before(async () => {
        const ctx = await site.context(
          device(vp, { colorScheme: "dark", reducedMotion: "reduce" }),
        );
        page = await ctx.newPage();
      });
      after(() => page.context().close());

      for (const path of FLOWS) {
        test(`${path}: every step in order with its text, no controls, light, the diagram on one sheet`, async () => {
          await page.emulateMedia({ media: "screen", colorScheme: "dark" });
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await open(page, site.url(path));
          // a reader on the second step, in the dark theme picked by hand
          if (!vp.isMobile) await page.click('flow-diagram [data-act="next"]');
          await page.evaluate(() => {
            document.documentElement.dataset.theme = "dark";
          });
          await page.emulateMedia({ media: "print", colorScheme: "dark" });
          // first as the page stands when the reader prints it, then at the width
          // a Letter or A4 page leaves inside its default margins
          const problems = [];
          for (const size of [null, SHEET]) {
            if (size) await page.setViewportSize(size);
            const seen = await page.evaluate(look);
            problems.push(
              ...[
                seen.steps !== seen.count &&
                  `${seen.steps} steps listed of ${seen.count}`,
                seen.shown !== seen.count &&
                  `${seen.shown} of ${seen.count} steps printed`,
                !seen.ordered && "steps out of order",
                seen.untitled && `${seen.untitled} steps without a heading`,
                seen.buttons.length &&
                  `buttons printed: ${seen.buttons.join(", ")}`,
                (seen.paper < 700 || seen.text > 300) &&
                  "prints in the dark theme",
                !seen.diagram && "diagram left out",
                seen.arrows !== seen.count &&
                  `${seen.arrows} steps drawn of ${seen.count}`,
                seen.labelInks !== 1 &&
                  "one step in the diagram is drawn apart from the rest",
                seen.sheet.width > SHEET.width &&
                  `diagram ${Math.round(seen.sheet.width)}px wide`,
                seen.sheet.height > SHEET.height &&
                  `diagram ${Math.round(seen.sheet.height)}px tall`,
              ].filter(Boolean),
            );
          }
          assert.deepEqual([...new Set(problems)], []);
        });
      }
    });
  }
});
