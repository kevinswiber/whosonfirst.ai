// The site's mark is drawn inside its box. A shape that runs past the edge is
// cut off flat there: in the tab, on every card, and in every picture made from
// it. Drawn large on nothing, the mark must leave the outermost pixels untouched.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { open, useBrowser } from "../support/browser.mjs";

const site = useBrowser();

test("the site's mark is drawn inside its box, with nothing cut off at an edge", async (t) => {
  const ctx = await site.context();
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(page, site.url("/styleguide/"));
  const edge = await page.evaluate(async () => {
    const img = new Image();
    img.src = "/favicon.svg";
    await img.decode();
    const n = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = n;
    const g = canvas.getContext("2d");
    g.drawImage(img, 0, 0, n, n);
    const px = g.getImageData(0, 0, n, n).data;
    const drawn = (x, y) => px[(y * n + x) * 4 + 3] > 0;
    const sides = { top: 0, right: 0, bottom: 0, left: 0 };
    for (let i = 0; i < n; i++) {
      if (drawn(i, 0)) sides.top++;
      if (drawn(n - 1, i)) sides.right++;
      if (drawn(i, n - 1)) sides.bottom++;
      if (drawn(0, i)) sides.left++;
    }
    return Object.entries(sides)
      .filter(([, count]) => count > 0)
      .map(([side]) => side);
  });
  assert.deepEqual(edge, [], `it runs past the ${edge.join(", ")}`);
});
