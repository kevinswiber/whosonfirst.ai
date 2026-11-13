// The decision guide: after "Start over", an answer chosen before can be
// chosen again at once, whether it was chosen by hand or by the address.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { open, useBrowser } from "../support/browser.mjs";

const site = useBrowser();

for (const url of ["/guide/", "/guide/?principal=user"]) {
  test(`${url}: an answer can be chosen again straight after Start over`, async (t) => {
    const ctx = await site.context({ viewport: { width: 1280, height: 900 } });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url(url));
    const answer = page.locator(
      'decision-guide input[name="principal"][value="user"]',
    );
    if (!(await answer.isChecked())) await answer.check({ force: true });
    await page.click('decision-guide button[type="reset"]');
    await answer.click({ force: true });
    await page.waitForTimeout(50);
    assert.ok(await answer.isChecked(), "not selected after one click");
  });
}
