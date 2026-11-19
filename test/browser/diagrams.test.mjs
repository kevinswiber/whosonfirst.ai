// Every sequence diagram, beside its steps on a desktop and opened on a phone:
// its labels are drawn large enough, and no arrow label reaches into the
// heading of the phase its step opens.
import { assert, describe, test } from "ubqtest";
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

describe("every diagram", () => {
  for (const vp of VIEWPORTS) {
    describe(vp.name, () => {
      let ready;
      const setup = () =>
        (ready ??= (async () => {
          const ctx = await site.context(
            device(vp, { reducedMotion: "reduce" }),
          );
          return ctx.newPage();
        })());

      for (const path of DIAGRAM_PAGES) {
        describe(path, () => {
          // the page, at this path, with every diagram open
          const at = async () => {
            const page = await setup();
            if (page.url() !== site.url(path)) {
              await open(page, site.url(path));
              // on a phone a diagram stays closed until it is asked for
              for (const closed of await page
                .locator(".flow-stage:not([open]) > summary")
                .all())
                await closed.click();
            }
            return page;
          };
          // A wider cast can shrink text even when its arrows never overlap.
          // Measure every diagram, not just the representative flow.
          test(`every diagram keeps labels at ${MIN_LABEL}px or more`, async () => {
            const page = await at();
            const labels = await page.evaluate(diagramLabels);
            assert(labels.length > 0); // no label drawn
            const smallest = Math.min(...labels.map((label) => label.px));
            assert.greaterThanOrEqual(smallest, MIN_LABEL - 0.05);
          });
          test("diagram: no arrow label overlaps a phase heading", async () => {
            const page = await at();
            const seen = await page.evaluate(labelsOnHeadings);
            headed += seen.headings;
            looked++;
            assert(seen.labels > 0); // no arrow label drawn
            assert.deepEqual(seen.on, []);
          });
        });
      }
    });
  }
});

// Run after the tests above, it counts what they saw. Run by itself, it looks
// at the diagrams on a desktop until one has a heading.
test("some diagram has phase headings for a label to overlap", async () => {
  if (!looked) {
    const ctx = await site.context(
      device(VIEWPORTS[0], { reducedMotion: "reduce" }),
    );
    const page = await ctx.newPage();
    for (const path of DIAGRAM_PAGES) {
      await open(page, site.url(path));
      headed += (await page.evaluate(labelsOnHeadings)).headings;
      if (headed) break;
    }
    await ctx.close();
  }
  assert.greaterThan(headed, 0);
});
