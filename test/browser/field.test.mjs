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
  assert.equal(
    await dpop
      .locator(".field-identity .field-actions")
      .getByRole("link")
      .count(),
    2,
  );
  assert.equal(
    await dpop
      .getByRole("link", { name: "See the flow for DPoP" })
      .getAttribute("href"),
    "/flows/dpop/",
  );
  const snapshot = await dpop.locator(".field-overview").textContent();
  assert.match(snapshot, /\d+ entries in this review/);
  assert.deepEqual(
    await dpop
      .getByRole("list", { name: "Implementations from the record" })
      .getByRole("link")
      .allTextContents()
      .then((names) => names.map((name) => name.trim())),
    ["Keycloak", "oauth4webapi"],
  );
  assert.doesNotMatch(snapshot, /Spring Security/);
  await dpop
    .getByRole("link", { name: "See the full record for DPoP" })
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
  const options = page.getByRole("region", { name: "Implementation evidence" });
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
      .getByRole("region", { name: "Deployment reports" })
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
      .getByRole("link", { name: "See the full record" })
      .getAttribute("href"),
    "/implementations/dpop/",
  );
  const springCard = summary.getByRole("link", {
    name: "Spring Security",
    exact: true,
  });
  assert.equal(
    await springCard.getAttribute("href"),
    "/implementations/dpop/#field-dpop-spring",
  );
  assert.equal(await page.locator("#field-dpop-spring").count(), 0);
  await springCard.click();
  assert.match(page.url(), /\/implementations\/dpop\/#field-dpop-spring$/);
  assert.ok(
    await page
      .locator(":target")
      .getByRole("heading", { name: "Spring Security", exact: true })
      .isVisible(),
  );
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

test("directory search resets from the keyboard and print shows the full overview", async (t) => {
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
  assert.equal(await page.getByRole("combobox").count(), 0);
  const count = page.getByRole("status");
  await input.fill("no matching implementation");
  assert.equal(await count.textContent(), "0 flows shown");
  await page.getByRole("button", { name: "Clear search" }).press("Enter");
  assert.equal(await count.textContent(), `${FLOWS.length} flows shown`);
  assert.equal(await input.inputValue(), "");
  assert.equal(await page.locator(".field-empty").isVisible(), false);
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
      name: "Implementations and deployment reports",
      exact: true,
    })
    .click();
  assert.match(page.url(), /#implementation-evidence$/);
  assert.ok((await page.locator(":target").getByRole("link").count()) === 0);
  await page
    .getByRole("region", {
      name: "Implementations and deployment reports",
      exact: true,
    })
    .getByRole("link", { name: "See the full record" })
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
    .getByRole("link", {
      name: "Browse implementations across all flows",
      exact: true,
    })
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

test("scriptless navigation keeps flow cards focused and exposes implementations elsewhere", async (t) => {
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
  assert.equal(await page.locator(".fl-cell a").count(), FLOWS.length);
  await page.locator('.flow-card[href="/flows/dpop/"]').click();
  assert.match(page.url(), /\/flows\/dpop\/$/);
  await open(page, site.url("/deployments/kubernetes/"));
  const next = page.locator(".way-on");
  const evidence = next.getByRole("link", { name: /See implementations for/ });
  assert.ok((await evidence.count()) > 0);
  assert.ok(await evidence.first().isVisible());
  await evidence.first().click();
  assert.match(page.url(), /\/implementations\/[^/]+\/$/);
});

test("flow evidence follows the standards and links to the full review beneath its heading", async (t) => {
  const ctx = await site.context({ javaScriptEnabled: false });
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  for (const slug of ["authorization-code-pkce", "dpop"]) {
    await open(page, site.url(`/flows/${slug}/`));
    const summary = page.getByRole("region", {
      name: "Implementations and deployment reports",
      exact: true,
    });
    assert.equal(await page.locator(".intro .field-summary").count(), 0);
    assert.ok(
      await summary.evaluate((section) => {
        const standards = document.querySelector(
          'section[aria-labelledby="standards"]',
        );
        const related = document.querySelector(
          'section[aria-labelledby="related"]',
        );
        return (
          Boolean(
            standards.compareDocumentPosition(section) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          ) &&
          Boolean(
            section.compareDocumentPosition(related) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          )
        );
      }),
    );
    const copy = await summary.textContent();
    assert.doesNotMatch(
      copy,
      /Reviewed examples from this record|Evidence reviewed|does not measure how widely|This record includes no/,
    );
    assert.ok(
      await summary.evaluate(
        (section) =>
          section.querySelector("h2").nextElementSibling.querySelector("a")
            ?.textContent === "See the full record",
      ),
    );
    assert.doesNotMatch(
      copy,
      /documented options|\d+ (entries|operators|named operators)/,
    );
    assert.match(copy, /Client library/);
    if (slug === "dpop") assert.match(copy, /Norsk helsenett/);
  }
  await open(page, site.url("/implementations/"));
  const pkce = await page
    .locator("#authorization-code-pkce .field-overview")
    .textContent();
  assert.match(pkce, /3 entries in this review/);
  assert.match(pkce, /No report included in this review/);
  assert.doesNotMatch(pkce, /None found|No production report found/);
});

test("example cards and compact lists keep roles visible and link to the exact entries without scripts", async (t) => {
  for (const width of [1280, 390]) {
    const ctx = await site.context({
      viewport: { width, height: 900 },
      javaScriptEnabled: false,
    });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    for (const [path, selector] of [
      ["/flows/mcp-authorization/", ".field-summary"],
      ["/implementations/", "#mcp-authorization"],
    ]) {
      await open(page, site.url(path));
      const examples = page.locator(selector);
      const products = examples.getByRole("list", {
        name: path.startsWith("/flows/")
          ? "Reviewed implementations and deployment reports"
          : "Implementations from the record",
      });
      assert.equal(
        await products
          .getByRole("link", { name: /^(Claude Code|Workers OAuth Provider)$/ })
          .count(),
        2,
      );
      const workers = products.getByRole("listitem").filter({
        has: page.getByRole("link", {
          name: "Workers OAuth Provider",
          exact: true,
        }),
      });
      assert.ok(
        await workers
          .getByText("Authorization and resource-server library", {
            exact: true,
          })
          .isVisible(),
      );
      assert.equal(
        await workers.getByRole("link").getAttribute("href"),
        "/implementations/mcp-authorization/#field-mcp-cloudflare",
      );
      const rolePosition = await workers
        .locator(".field-example-role")
        .boundingBox();
      const namePosition = await workers.getByRole("link").boundingBox();
      assert.ok(
        rolePosition.y >= namePosition.y + namePosition.height,
        "role reads beneath its product name",
      );
      if (path.startsWith("/flows/")) {
        const kind = workers.locator(".field-example-kind");
        assert.equal(await kind.textContent(), "Implementation");
        assert.ok(
          (await kind.boundingBox()).y >= rolePosition.y + rolePosition.height,
          "type follows the visible role",
        );
      }
      await products
        .getByRole("link", { name: "Claude Code", exact: true })
        .click();
      assert.match(
        page.url(),
        /\/implementations\/mcp-authorization\/#field-mcp-claude-code$/,
      );
      assert.ok(
        await page
          .locator(":target")
          .getByRole("heading", { name: "Claude Code", exact: true })
          .isVisible(),
      );

      await open(page, site.url(path));
      const report = page.locator(selector).getByRole("list", {
        name: path.startsWith("/flows/")
          ? "Reviewed implementations and deployment reports"
          : "Deployment report from the record",
      });
      assert.ok(
        await report
          .getByText("Hosted remote MCP service", { exact: true })
          .isVisible(),
      );
      await report.getByRole("link", { name: "Stripe", exact: true }).click();
      assert.match(
        page.url(),
        /\/implementations\/mcp-authorization\/#field-mcp-stripe$/,
      );
      assert.ok(
        await page
          .locator(":target")
          .getByRole("heading", { name: "Stripe", exact: true })
          .isVisible(),
      );
    }
  }
});

test("flow cards include every implementation and deployment entry from the full record", async (t) => {
  const ctx = await site.context({ javaScriptEnabled: false });
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  for (const slug of ["dpop", "device-authorization"]) {
    await open(page, site.url(`/implementations/${slug}/`));
    const entries = await page
      .locator(
        'section[aria-labelledby="field-implementations"] .field-entry, section[aria-labelledby="field-production"] .field-entry',
      )
      .evaluateAll((items) =>
        items.map((item) => ({
          id: item.id,
          name: item.querySelector("h3").textContent.trim(),
          kind:
            item.closest("section").getAttribute("aria-labelledby") ===
            "field-production"
              ? "Deployment report"
              : "Implementation",
        })),
      );
    await open(page, site.url(`/flows/${slug}/`));
    const cards = page.locator(".field-summary .field-examples li");
    const actual = await cards.evaluateAll((items) =>
      items.map((item) => ({
        id: item.querySelector("a").hash.slice(1),
        name: item.querySelector("a").textContent.trim(),
        kind: item.querySelector(".field-example-kind").textContent.trim(),
      })),
    );
    assert.deepEqual(actual, entries, slug);
    await cards.last().getByRole("link").click();
    assert.equal(new URL(page.url()).hash, `#${entries.at(-1).id}`);
    assert.ok(
      await page
        .locator(":target")
        .getByRole("heading", { name: entries.at(-1).name, exact: true })
        .isVisible(),
    );
  }
});
