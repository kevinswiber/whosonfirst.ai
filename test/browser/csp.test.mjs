// Every built page, loaded once under the site's own headers. useBrowser()
// watches every page each browser test opens for the same thing; this is the
// one pass that opens them all.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { open, refusal, useBrowser } from "../support/browser.mjs";
import { built } from "../support/site.mjs";

const site = useBrowser();

test("no page loads or runs anything its content security policy refuses", async () => {
  const ctx = await site.context();
  const page = await ctx.newPage();
  const refused = [];
  let at = "";
  page.on("console", (m) => {
    if (refusal(m)) refused.push(`${at} ${m.text().slice(0, 140)}`);
  });
  for (const p of built) {
    at = p.path;
    await open(page, site.url(p.path));
  }
  assert.ok(built.length > 0, "no page was built");
  assert.deepEqual(refused, [], `${built.length} pages`);
  await ctx.close();
});
