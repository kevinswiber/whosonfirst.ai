// The decision guide's answers, recommendations and shared URLs.
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

test("the same HTTP API target can be inside or outside the shared identity system", async (t) => {
  const ctx = await site.context();
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(
    page,
    site.url(
      "/guide/?principal=user&human=present&target=api&boundary=same&runtime=k8s&risk=write",
    ),
  );

  const result = (slug) => page.locator(`.dg-flow[href="/flows/${slug}/"]`);
  for (const slug of [
    "spiffe-workload-identity",
    "transaction-tokens",
    "gnap",
    "biscuit-delegation",
    "oauth-mtls",
    "access-revocation",
  ]) {
    assert.equal(await result(slug).count(), 1, slug);
  }

  await page
    .getByRole("radio", { name: /It uses a separate identity system/ })
    .check({ force: true });
  assert.ok(await page.getByRole("radio", { name: /An HTTP API/ }).isChecked());
  assert.equal(await result("spiffe-workload-identity").count(), 0);
  assert.equal(await result("transaction-tokens").count(), 0);
  assert.equal(await result("authorization-code-pkce").count(), 1);
});

test("an older internal-target link restores shared identity without guessing an interface", async (t) => {
  const ctx = await site.context();
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(
    page,
    site.url("/guide/?principal=user&target=internal&runtime=k8s"),
  );
  assert.ok(
    await page
      .getByRole("radio", { name: /We run it and share an identity system/ })
      .isChecked(),
  );
  assert.equal(await page.locator('input[name="target"]:checked').count(), 0);
  assert.equal(
    await page.locator('.dg-flow[href="/flows/transaction-tokens/"]').count(),
    1,
  );
});

test("the situation is named once the first two questions are answered, and not before", async (t) => {
  const ctx = await site.context();
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  const name = page.locator(".dg-sit-name a");

  await open(page, site.url("/guide/?principal=user&target=api"));
  assert.equal(await name.count(), 0, "named from one answer");

  await page.getByRole("radio", { name: /^No\b/ }).check({ force: true });
  assert.equal(await name.textContent(), "Standing order");
  assert.equal(await name.getAttribute("href"), "/guide/standing-order/");

  await page.getByRole("radio", { name: /Its own/ }).check({ force: true });
  assert.equal(await name.textContent(), "As itself");
});

test("each situation’s page starts with the flows the guide gives for the same answers", async (t) => {
  const ctx = await site.context();
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(page, site.url("/guide/"));
  const situations = await page
    .locator('#situations a.card[href^="/guide/"]')
    .evaluateAll((cards) => cards.map((a) => a.getAttribute("href")));
  assert.equal(situations.length, 4);

  for (const path of situations) {
    await open(page, site.url(path));
    const targets = await page.locator(".sit-target").evaluateAll((sections) =>
      sections.map((s) => ({
        link: s.querySelector(".sit-more a").getAttribute("href"),
        flows: [...s.querySelectorAll(".sit-flow")].map((a) =>
          a.getAttribute("href"),
        ),
      })),
    );
    assert.equal(targets.length, 4, path);
    for (const target of targets) {
      await open(page, site.url(target.link));
      assert.equal(
        await page.locator(".dg-sit-name a").getAttribute("href"),
        path,
        target.link,
      );
      assert.deepEqual(
        await page
          .locator(".dg-start .dg-flow")
          .evaluateAll((flows) => flows.map((a) => a.getAttribute("href"))),
        target.flows,
        `${path}, ${target.link}`,
      );
    }
  }
});
