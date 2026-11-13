// Every built page, loaded under the site's own headers and watched until it
// has sent nothing for half a second, for anything its content security
// policy refuses.
//
// The other browser tests open a page with open(), which waits for the load
// event, the fonts and a frame: enough to measure what is drawn. It is not
// enough here. A script can ask for something from another origin a moment
// after the page has loaded, and a request the policy refuses is never sent,
// so nothing on the network shows it; only the console does, and only once
// the script has asked. Network idle gives every page that half second.
// useBrowser() also watches every page the other tests open.
import { strict as assert } from "node:assert";
import { after, before, describe, test } from "node:test";
import { refusal, useBrowser } from "../support/browser.mjs";
import { built } from "../support/site.mjs";

const site = useBrowser();

// Each page has a tab of its own, and the wait is the same half second
// whatever else is open, so a few pages are watched at once.
describe("no page loads or runs anything its content security policy refuses", {
  concurrency: 4,
}, () => {
  let ctx;
  before(async () => {
    ctx = await site.context();
  });
  after(() => ctx.close());

  test("every page was built", () => {
    assert.ok(built.length > 0, "no page was built");
  });
  for (const p of built) {
    test(p.path, async () => {
      const page = await ctx.newPage();
      const refused = [];
      page.on("console", (m) => {
        if (refusal(m)) refused.push(m.text().slice(0, 160));
      });
      await page.goto(site.url(p.path), { waitUntil: "networkidle" });
      await page.close();
      assert.deepEqual(refused, []);
    });
  }
});
