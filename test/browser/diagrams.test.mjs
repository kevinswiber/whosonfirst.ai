// Every sequence diagram, beside its steps on a desktop and opened on a phone:
// its labels are drawn large enough, and no arrow label reaches into the
// heading of the phase its step opens.
import { strict as assert } from "node:assert";
import { after, before, describe, test } from "node:test";
import { device, open, useBrowser, VIEWPORTS } from "../support/browser.mjs";
import {
  diagramLabels,
  labelsOnHeadings,
  MIN_LABEL,
} from "../support/measure.mjs";
import { DIAGRAM_PAGES } from "../support/site.mjs";

const site = useBrowser();
let headed = 0;
let looked = 0;

// The desktop and the phone each have a context of its own, and nothing here
// waits on a clock, so the two run side by side.
describe("every diagram", { concurrency: true }, () => {
  for (const vp of VIEWPORTS) {
    describe(vp.name, { concurrency: 1 }, () => {
      let page;
      before(async () => {
        const ctx = await site.context(device(vp, { reducedMotion: "reduce" }));
        page = await ctx.newPage();
      });
      after(() => page.context().close());

      for (const path of DIAGRAM_PAGES) {
        describe(path, () => {
          before(async () => {
            await open(page, site.url(path));
            // on a phone a diagram stays closed until it is asked for
            for (const closed of await page
              .locator(".flow-stage:not([open]) > summary")
              .all())
              await closed.click();
          });
          // A wider cast can shrink text even when its arrows never overlap.
          // Measure every diagram, not just the representative flow.
          test(`every diagram keeps labels at ${MIN_LABEL}px or more`, async () => {
            const labels = await page.evaluate(diagramLabels);
            assert.ok(labels.length > 0, "no label drawn");
            const smallest = Math.min(...labels.map((label) => label.px));
            assert.ok(
              smallest >= MIN_LABEL - 0.05,
              `smallest ${smallest.toFixed(1)}px`,
            );
          });
          test("diagram: no arrow label overlaps a phase heading", async () => {
            const seen = await page.evaluate(labelsOnHeadings);
            headed += seen.headings;
            looked++;
            assert.ok(seen.labels > 0, "no arrow label drawn");
            assert.deepEqual(seen.on, []);
          });
        });
      }
    });
  }
});

test("some diagram has phase headings for a label to overlap", (t) => {
  if (!looked) return t.skip("no diagram was looked at");
  assert.ok(headed > 0, `${headed} headings`);
});
