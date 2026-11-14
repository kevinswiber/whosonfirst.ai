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

const facts = (page) =>
  page
    .locator(".dg-facts > div")
    .evaluateAll((rows) =>
      rows.map((r) => [
        r.querySelector("dt").textContent,
        r.querySelector("dd").textContent,
      ]),
    );

test("the case is named once the first two questions are answered, and not before", async (t) => {
  const ctx = await site.context();
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  const name = page.locator(".dg-answers .dg-flow strong");

  // one of the two answered: no name, and the answers there are, each with its word
  await open(page, site.url("/guide/?principal=user&target=api"));
  assert.equal(await name.count(), 0, "named from one answer");
  assert.deepEqual(await facts(page), [
    ["Authority", "A person’s"],
    ["Calls", "HTTP API"],
  ]);

  await page.getByRole("radio", { name: /^No\b/ }).check({ force: true });
  assert.equal(await name.textContent(), "Person unavailable");
  // the name leads to its page, and says how much of the result it stands for
  const link = page.locator(".dg-answers .dg-flow");
  assert.equal(await link.getAttribute("href"), "/guide/person-unavailable/");
  assert.equal(
    await link.locator(".dg-meta").textContent(),
    "First two answers",
  );
  // the answers the name does not stand for are beside it
  assert.deepEqual(await facts(page), [["Calls", "HTTP API"]]);

  await page.getByRole("radio", { name: /Its own/ }).check({ force: true });
  assert.equal(await name.textContent(), "Own authority");
  assert.deepEqual(await facts(page), [
    ["Person", "Unavailable"],
    ["Calls", "HTTP API"],
  ]);

  // Start over takes the name and the answers with it
  await page.click('decision-guide button[type="reset"]');
  await page.locator(".dg-empty").waitFor();
  assert.equal(await name.count(), 0);
  assert.equal(await page.locator(".dg-facts").count(), 0);
  assert.equal(page.url(), site.url("/guide/"));
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

test("on a phone, the results are one step from the questions and back, and an answer moves nothing", async (t) => {
  const ctx = await site.context({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(page, site.url("/guide/"));
  const jump = page.locator(".dg-jump");
  assert.equal((await jump.textContent()).trim(), "View results");

  // answering does not scroll the page or take the focus away
  const answer = page.locator('input[name="principal"][value="user"]');
  await answer.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await answer.check();
  assert.match(await jump.textContent(), /^View results · \d+ matches$/);
  assert.equal(await page.evaluate(() => scrollY), before, "the page moved");
  assert.ok(
    await answer.evaluate((el) => document.activeElement === el),
    "the focus moved",
  );

  // the way down stays on screen while the questions are
  const inView = (locator) =>
    locator.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= innerHeight;
    });
  assert.ok(await inView(jump), "the way to the results is off screen");
  await jump.click();
  assert.ok(
    await inView(page.locator(".dg-kicker")),
    "did not reach the results",
  );
  await page.locator(".dg-edit").click();
  assert.ok(
    await inView(page.locator("#questions legend").first()),
    "did not get back to the questions",
  );
});

test("a case’s page says what each start and each caution applies to, without a script", async (t) => {
  const ctx = await site.context({ javaScriptEnabled: false });
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(page, site.url("/guide/"));
  const cases = await page
    .locator('#cases a.card[href^="/guide/"]')
    .evaluateAll((cards) => cards.map((a) => a.getAttribute("href")));
  assert.equal(cases.length, 4);

  for (const path of cases) {
    await open(page, site.url(path));
    const entries = await page
      .locator(".case-flows > li, .case-warn > li")
      .evaluateAll((items) =>
        items.map((li) => ({
          flow: li.querySelector(".case-flow")?.getAttribute("href") ?? "",
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

  await open(page, site.url("/guide/own-authority/"));
  const own = await page
    .locator(
      '.case-flows > li:has(.case-flow[href="/flows/client-credentials/"]) .ga',
    )
    .allTextContents();
  assert.equal(
    own.length,
    2,
    "client credentials, for a server and for a local installation",
  );
  assert.ok(own.some((t) => /On the user’s machine/.test(t)));
});
