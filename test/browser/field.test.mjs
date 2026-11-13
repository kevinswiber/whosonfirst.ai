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
  await open(page, site.url("/implementations/"));
  assert.equal(
    await page
      .getByRole("search", { name: "Implementation directory" })
      .count(),
    0,
  );
  const ids = await page
    .locator(records)
    .evaluateAll((rows) => rows.map((row) => row.id).sort());
  assert.deepEqual(ids, FLOWS.map((path) => path.split("/")[2]).sort());
  const dpop = page.locator("#dpop");
  assert.equal(await dpop.getByRole("heading").getByRole("link").count(), 0);
  assert.equal(await dpop.getByRole("link").count(), 2);
  assert.equal(
    await dpop
      .getByRole("link", { name: "View flow diagram for DPoP" })
      .getAttribute("href"),
    "/flows/dpop/#walkthrough",
  );
  const snapshot = await dpop.locator(".field-overview").textContent();
  assert.match(snapshot, /\d+ documented options/);
  assert.match(snapshot, /Examples: Keycloak · oauth4webapi/);
  assert.doesNotMatch(snapshot, /Spring Security/);
  await dpop
    .getByRole("link", { name: "View implementations for DPoP" })
    .click();
  assert.match(page.url(), /\/implementations\/dpop\/$/);
  assert.ok(
    await page
      .getByRole("heading", {
        level: 1,
        name: "DPoP implementations and deployment reports",
      })
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

  await page.getByRole("link", { name: "How DPoP works" }).click();
  assert.match(page.url(), /\/flows\/dpop\/$/);
  assert.ok(
    await page
      .getByRole("heading", { name: "Step by step", exact: true })
      .isVisible(),
  );
  const summary = page.locator("#in-the-field");
  assert.equal(
    await summary
      .getByRole("link", { name: "View implementations" })
      .getAttribute("href"),
    "/implementations/dpop/",
  );
  assert.doesNotMatch(await summary.textContent(), /Spring Security/);
  assert.equal(await page.locator("#field-dpop-spring").count(), 0);
});

test("search links to exact entries beyond the sample and keeps product and role together", async (t) => {
  const ctx = await site.context();
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(page, site.url("/implementations/"));
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
    "/implementations/ciba/#field-ciba-openid-client",
  );

  await input.fill("dpop spring resource-server verifier");
  assert.equal(await count.textContent(), "1 flow shown");
  assert.equal(await page.locator(records).first().getAttribute("id"), "dpop");
  await page
    .getByRole("link", { name: "Spring Security · Resource-server verifier" })
    .click();
  assert.match(page.url(), /\/implementations\/dpop\/#field-dpop-spring$/);
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
  await open(page, site.url("/implementations/"));
  const input = page.getByRole("searchbox", {
    name: "Search by flow, product or role",
  });
  const review = page.getByRole("combobox", { name: "Evidence review" });
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

test("search shows every matching entry, including when the query names the flow", async (t) => {
  const ctx = await site.context();
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(page, site.url("/implementations/"));
  const input = page.getByRole("searchbox", {
    name: "Search by flow, product or role",
  });
  await input.fill("dpop authorization server");
  const matches = page.locator("#dpop .field-matches");
  assert.deepEqual((await matches.getByRole("link").allTextContents()).sort(), [
    "Auth0 · Authorization server",
    "Curity Identity Server · Authorization server",
    "Keycloak · Authorization server",
  ]);
  await input.fill("dpop");
  for (const product of [
    "Keycloak",
    "oauth4webapi",
    "Spring Security",
    "Auth0",
    "Curity Identity Server",
    "Norsk helsenett",
  ]) {
    assert.ok(
      await matches
        .getByRole("link", { name: new RegExp(product) })
        .isVisible(),
      product,
    );
  }
});

test("flow sections and recommendation results lead to their implementation records", async (t) => {
  const ctx = await site.context();
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(page, site.url("/flows/dpop/"));
  await page.getByRole("button", { name: /Sections on this page/ }).click();
  await page
    .locator("#here-menu")
    .getByRole("link", {
      name: "DPoP implementations and deployment reports",
      exact: true,
    })
    .click();
  assert.match(page.url(), /#implementation-evidence$/);
  assert.ok((await page.locator(":target").getByRole("link").count()) === 0);
  await page
    .getByRole("region", {
      name: "DPoP implementations and deployment reports",
      exact: true,
    })
    .getByRole("link", { name: "View implementations" })
    .click();
  assert.match(page.url(), /\/implementations\/dpop\/$/);
  assert.equal(
    await page
      .getByRole("navigation", { name: "You are here" })
      .getByRole("link", { name: "Implementations", exact: true })
      .getAttribute("href"),
    "/implementations/",
  );
  await page
    .getByRole("link", { name: "Browse implementations", exact: true })
    .click();
  assert.match(page.url(), /\/implementations\/$/);

  // The workload guide already has its own implementation section and fragment.
  await open(
    page,
    site.url("/flows/workload-identity-federation/#implementations"),
  );
  assert.equal(await page.locator("#implementations").count(), 1);
  assert.equal(
    await page.locator("#implementations").textContent(),
    "Real implementations",
  );
  assert.equal(await page.locator("#implementation-evidence").count(), 1);

  await open(page, site.url("/guide/?principal=user"));
  const recommendation = page.locator(".dg-group li").filter({
    has: page.locator('a.dg-flow[href="/flows/authorization-code-pkce/"]'),
  });
  await recommendation
    .getByRole("link", { name: /See implementations for/ })
    .click();
  assert.match(page.url(), /\/implementations\/authorization-code-pkce\/$/);
});

test("home, flow cards and deployment next steps expose implementations without scripts", async (t) => {
  const ctx = await site.context({ javaScriptEnabled: false });
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(page, site.url("/"));
  await page
    .locator("main")
    .getByRole("link", { name: /^Implementations/ })
    .click();
  assert.match(page.url(), /\/implementations\/$/);
  await open(page, site.url("/flows/"));
  await page
    .locator("main")
    .getByRole("link", { name: "See implementations for DPoP", exact: true })
    .click();
  assert.match(page.url(), /\/implementations\/dpop\/$/);
  await open(page, site.url("/deployments/kubernetes/"));
  const next = page.locator(".way-on");
  const evidence = next.getByRole("link", { name: /See implementations for/ });
  assert.ok((await evidence.count()) > 0);
  assert.ok(await evidence.first().isVisible());
  await evidence.first().click();
  assert.match(page.url(), /\/implementations\/[^/]+\/$/);
});
