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
  const name = page.locator(".dg-sit-name");
  const more = page.locator(".dg-sit-more a");

  await open(page, site.url("/guide/?principal=user&target=api"));
  assert.equal(await name.count(), 0, "named from one answer");

  await page.getByRole("radio", { name: /^No\b/ }).check({ force: true });
  assert.equal(await name.textContent(), "Person away");
  assert.equal(await more.getAttribute("href"), "/guide/person-away/");
  // the answers the name does not stand for are beside it, in words
  assert.equal(await page.locator(".dg-sit-rest").textContent(), "An HTTP API");
  assert.match(
    await page.locator(".dg-sit-label").textContent(),
    /this site’s words/,
  );

  await page.getByRole("radio", { name: /Its own/ }).check({ force: true });
  assert.equal(await name.textContent(), "Own authority");
  assert.equal(
    await page.locator(".dg-sit-rest").textContent(),
    "No · An HTTP API",
  );
});

test("the result’s link can be copied with every answer in it", async (t) => {
  const ctx = await site.context({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  const url = site.url(
    "/guide/?principal=self&target=api&runtime=sandbox&risk=irreversible",
  );
  await open(page, url);
  await page.click(".dg-copy");
  await page.locator(".dg-copied", { hasText: "Copied" }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), url);
});

test("a situation’s page says what each start and each caution applies to, without a script", async (t) => {
  const ctx = await site.context({ javaScriptEnabled: false });
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await page.goto(site.url("/guide/"));
  const situations = await page
    .locator('#situations a.card[href^="/guide/"]')
    .evaluateAll((cards) => cards.map((a) => a.getAttribute("href")));
  assert.equal(situations.length, 4);

  for (const path of situations) {
    await page.goto(site.url(path));
    const entries = await page
      .locator(".sit-flows > li, .sit-warn > li")
      .evaluateAll((items) =>
        items.map((li) => ({
          flow: li.querySelector(".sit-flow")?.getAttribute("href") ?? "",
          applies:
            li.querySelector(".ga")?.textContent.replace(/\s+/g, " ").trim() ??
            "",
        })),
      );
    assert.ok(entries.length > 4, path);
    for (const e of entries)
      assert.match(e.applies, /^Applies (when|whatever)/, `${path} ${e.flow}`);
    const broker = entries.find((e) => e.flow === "/flows/credential-broker/");
    assert.match(
      broker?.applies ?? "",
      /Where does the agent run\? A sandbox that runs untrusted code$/,
      `${path}: what a sandbox needs`,
    );
  }

  await page.goto(site.url("/guide/own-authority/"));
  const own = await page
    .locator(
      '.sit-flows > li:has(.sit-flow[href="/flows/client-credentials/"]) .ga',
    )
    .allTextContents();
  assert.equal(
    own.length,
    2,
    "client credentials, for a server and for a local installation",
  );
  assert.ok(own.some((t) => /On the user’s machine/.test(t)));
});
