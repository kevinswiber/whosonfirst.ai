// Search only changes the screen view. The full catalog is available with
// scripts off and on paper, even after a reader has narrowed the results.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { open, useBrowser } from "../support/browser.mjs";
import { FLOWS } from "../support/site.mjs";

const site = useBrowser();
const records = ".field-record:visible";

test("the complete catalog and evidence links work without JavaScript", async (t) => {
  const ctx = await site.context({ javaScriptEnabled: false });
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(page, site.url("/field/"));
  assert.equal(
    await page.getByRole("search", { name: "Field directory" }).count(),
    0,
  );
  const ids = await page
    .locator(records)
    .evaluateAll((rows) => rows.map((row) => row.id).sort());
  assert.deepEqual(ids, FLOWS.map((path) => path.split("/")[2]).sort());
  assert.match(
    await page.locator("#device-authorization").textContent(),
    /Not reviewed/,
  );
  const dpop = page.locator("#dpop");
  assert.match(await dpop.textContent(), /Spring Security/);
  await dpop.getByRole("link", { name: "DPoP" }).click();
  const evidence = page.getByRole("region", { name: "In the field" });
  assert.match(page.url(), /\/flows\/dpop\/#in-the-field$/);
  assert.match(await evidence.textContent(), /Norsk helsenett/);
  assert.match(await evidence.textContent(), /Limits\./);
});

test("search and review status filter together, clear by keyboard, and print all flows", async (t) => {
  const ctx = await site.context({
    viewport: { width: 320, height: 650 },
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(page, site.url("/field/"));
  const input = page.getByRole("searchbox", {
    name: "Search by flow, product or role",
  });
  const review = page.getByRole("combobox", { name: "Field review" });
  const count = page.getByRole("status");
  await input.fill("spring resource-server verifier");
  assert.equal(await count.textContent(), "1 flow shown");
  assert.equal(await page.locator(records).first().getAttribute("id"), "dpop");

  await review.selectOption("unreviewed");
  assert.equal(await count.textContent(), "0 flows shown");
  assert.match(
    await page.locator(".field-empty:visible").textContent(),
    /No flows match/,
  );
  await page.getByRole("button", { name: "Clear filters" }).press("Enter");
  assert.equal(await count.textContent(), `${FLOWS.length} flows shown`);
  assert.equal(await input.inputValue(), "");
  assert.equal(await review.inputValue(), "");
  assert.ok(await input.evaluate((el) => el === document.activeElement));

  await input.fill("spring resource-server verifier");
  assert.equal(await page.locator(records).count(), 1);
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator(records).count(), FLOWS.length);
  assert.equal(await input.isVisible(), false);
  assert.equal(await count.isVisible(), false);
});
