// The narrowest window the site is held to: a small phone, or a desktop window
// zoomed to 400%. Only sideways overflow is measured there: on one page of each
// kind, on the About page, whose long addresses are the first thing to push a
// page past the window, and on every flow and every lesson, since each brings
// its own credentials, labels and figures.
import { strict as assert } from "node:assert";
import { after, before, describe, test } from "node:test";
import { open, useBrowser } from "../support/browser.mjs";
import { sideways } from "../support/measure.mjs";
import { FLOWS, LESSONS, PAGES } from "../support/site.mjs";

const NARROW = { width: 320, height: 568 };
const NARROW_PAGES = [
  ...new Set([...PAGES.map((p) => p.path), "/about/", ...FLOWS, ...LESSONS]),
];

const site = useBrowser();

describe(`no sideways overflow at ${NARROW.width}px`, () => {
  let page;
  before(async () => {
    const ctx = await site.context({
      viewport: NARROW,
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    page = await ctx.newPage();
  });
  after(() => page.context().close());

  for (const path of NARROW_PAGES) {
    test(path, async () => {
      await open(page, site.url(path));
      const over = await page.evaluate(sideways);
      assert.ok(over.by <= 0, `${over.by}px: ${over.what}`);
    });
  }
});
