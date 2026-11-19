// The narrowest window the site is held to: a small phone, or a desktop window
// zoomed to 400%. Only sideways overflow is measured there: on one page of each
// kind, on the About page, whose long addresses are the first thing to push a
// page past the window, and on every flow and every lesson, since each brings
// its own credentials, labels and figures.
import { assert, describe, test } from "ubqtest";
import { open, useBrowser } from "../support/browser.mjs";
import { sideways } from "../support/measure.mjs";
import { FLOWS, LESSONS, PAGES } from "../support/site.mjs";

const NARROW = { width: 320, height: 568 };
const NARROW_PAGES = [
  ...new Set([...PAGES.map((p) => p.path), "/about/", ...FLOWS, ...LESSONS]),
];

const site = useBrowser();

describe(`no sideways overflow at ${NARROW.width}px`, () => {
  let ready;
  const setup = () =>
    (ready ??= (async () => {
      const ctx = await site.context({
        viewport: NARROW,
        isMobile: true,
        hasTouch: true,
        reducedMotion: "reduce",
      });
      return ctx.newPage();
    })());

  for (const path of NARROW_PAGES) {
    test(path, async () => {
      const page = await setup();
      await open(page, site.url(path));
      const over = await page.evaluate(sideways);
      assert.match(over, { by: (px) => px <= 0 }); // shows what overflows
    });
  }
});
