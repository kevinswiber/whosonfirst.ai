// The directory is a bounded view of the evidence. Search reaches the full
// record, while scripts-off and print readers keep the full overview.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { open, useBrowser } from "../support/browser.mjs";
import { FLOWS } from "../support/site.mjs";

const site = useBrowser();
const records = ".field-record:visible";

test("the compact directory, full record and flow guide connect without JavaScript", async (t) => {
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
  const unreviewed = page.locator("#credential-broker");
  assert.match(await unreviewed.textContent(), /Not reviewed/);
  assert.equal(
    await unreviewed.getByRole("link").getAttribute("href"),
    "/flows/credential-broker/",
  );

  const dpop = page.locator("#dpop");
  const snapshot = await dpop.locator(".field-overview").textContent();
  assert.match(snapshot, /\d+ documented options/);
  assert.match(snapshot, /Examples: Keycloak · oauth4webapi/);
  assert.doesNotMatch(snapshot, /Spring Security/);
  await dpop.getByRole("link", { name: "Full field record for DPoP" }).click();
  assert.match(page.url(), /\/field\/dpop\/$/);
  assert.ok(
    await page
      .getByRole("heading", { level: 1, name: "DPoP in the field" })
      .isVisible(),
  );
  const options = page.getByRole("region", { name: "Implementation options" });
  const spring = options.locator("#field-dpop-spring");
  assert.ok(
    await spring
      .getByRole("heading", { level: 3, name: "Spring Security" })
      .isVisible(),
  );
  assert.match(await spring.textContent(), /Limits\./);
  assert.ok(
    await spring
      .getByRole("link", { name: "DPoPAuthenticationProvider" })
      .isVisible(),
  );
  assert.match(
    await page
      .getByRole("region", { name: "Production reports" })
      .textContent(),
    /Norsk helsenett/,
  );

  await page.getByRole("link", { name: "Read the flow guide" }).click();
  assert.match(page.url(), /\/flows\/dpop\/$/);
  const summary = page.locator("#in-the-field");
  assert.equal(
    await summary
      .getByRole("link", { name: "In the field" })
      .getAttribute("href"),
    "/field/dpop/",
  );
  assert.doesNotMatch(await summary.textContent(), /Spring Security/);
  assert.equal(await page.locator("#field-dpop-spring").count(), 0);
});

test("search links to exact entries beyond the sample and keeps product and role together", async (t) => {
  const ctx = await site.context();
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(page, site.url("/field/"));
  const input = page.getByRole("searchbox", {
    name: "Search by flow, product or role",
  });
  const count = page.getByRole("status");

  await input.fill("dpop keycloak client library");
  assert.equal(await count.textContent(), "0 flows shown");
  assert.match(
    await page.locator(".field-empty:visible").textContent(),
    /No flows match/,
  );

  // A role in the flow’s description must not become a product’s role.
  await input.fill("ciba openid-client authorization server");
  assert.equal(await count.textContent(), "0 flows shown");
  await input.fill("ciba openid-client client library");
  assert.equal(await count.textContent(), "1 flow shown");
  assert.equal(
    await page
      .getByRole("link", { name: "openid-client · Client library" })
      .getAttribute("href"),
    "/field/ciba/#field-ciba-openid-client",
  );

  await input.fill("dpop spring resource-server verifier");
  assert.equal(await count.textContent(), "1 flow shown");
  assert.equal(await page.locator(records).first().getAttribute("id"), "dpop");
  await page
    .getByRole("link", { name: "Spring Security · Resource-server verifier" })
    .click();
  assert.match(page.url(), /\/field\/dpop\/#field-dpop-spring$/);
  assert.ok(
    await page
      .locator(":target")
      .getByRole("heading", { name: "Spring Security" })
      .isVisible(),
  );
});

test("review status filters search, keyboard reset restores all, and print shows the overview", async (t) => {
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
  await input.fill("dpop spring");
  await review.selectOption("unreviewed");
  assert.equal(await count.textContent(), "0 flows shown");
  await page.getByRole("button", { name: "Clear filters" }).press("Enter");
  assert.equal(await count.textContent(), `${FLOWS.length} flows shown`);
  assert.equal(await input.inputValue(), "");
  assert.equal(await review.inputValue(), "");
  assert.ok(await input.evaluate((el) => el === document.activeElement));

  await input.fill("dpop spring");
  assert.equal(await page.locator(records).count(), 1);
  assert.equal(await page.locator(".field-matches:visible").count(), 1);
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator(records).count(), FLOWS.length);
  assert.equal(await page.locator(".field-matches:visible").count(), 0);
  assert.equal(await input.isVisible(), false);
  assert.equal(await count.isVisible(), false);
});
