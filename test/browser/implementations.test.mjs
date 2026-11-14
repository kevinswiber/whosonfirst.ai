// The directory shows every reviewed summary. Search and group filters narrow
// the view, while scripts-off and print readers keep all the summaries.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { publishProfile } from "../../src/data/implementations/model.ts";
import { profiles } from "../../src/data/implementations/records.ts";
import { open, useBrowser } from "../support/browser.mjs";
import { FLOWS } from "../support/site.mjs";

const site = useBrowser();
const records = ".evidence-record:visible";

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
    await dpop.locator(".evidence-actions").getByRole("link").count(),
    2,
  );
  assert.equal(
    await dpop
      .getByRole("link", { name: "See the flow for DPoP" })
      .getAttribute("href"),
    "/flows/dpop/",
  );
  // Check all entries, including products and reports that used to be omitted.
  const actual = await page
    .locator(".evidence-overview .evidence-examples li")
    .evaluateAll((items) =>
      items
        .map((item) => ({
          href: item.querySelector("a").getAttribute("href"),
          summary: item
            .querySelector(".evidence-example-summary")
            .textContent.trim(),
        }))
        .sort((a, b) => a.href.localeCompare(b.href)),
    );
  const expected = profiles
    .map(publishProfile)
    .flatMap((profile) =>
      [...profile.implementations, ...profile.deployments].map((entry) => ({
        href: `/implementations/${profile.slug}/#field-${entry.id}`,
        summary: entry.summary,
      })),
    )
    .sort((a, b) => a.href.localeCompare(b.href));
  assert.deepEqual(actual, expected);
  assert.doesNotMatch(
    await dpop.textContent(),
    /examples shown|entries reviewed/,
  );
  await dpop
    .getByRole("link", { name: "Sources and review details for DPoP" })
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
      .getByRole("link", { name: "Sources and review details" })
      .getAttribute("href"),
    "/implementations/dpop/",
  );
  const springCard = summary.getByRole("link", {
    name: /^Spring Security\b/,
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

test("search links to exact entries and keeps product and role together", async (t) => {
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
    await page.locator(".evidence-empty:visible").textContent(),
    /No flows match/,
  );

  // A role in the flow’s description must not become a product’s role.
  await input.fill("ciba openid-client authorization server");
  assert.equal(await count.textContent(), "0 flows shown");
  await input.fill("ciba openid-client client library");
  assert.equal(await count.textContent(), "1 flow shown");
  assert.equal(
    await page
      .getByRole("link", { name: "openid-client", exact: true })
      .getAttribute("href"),
    "/implementations/ciba/#field-ciba-openid-client",
  );

  await input.fill("dpop spring resource-server verifier");
  assert.equal(await count.textContent(), "1 flow shown");
  assert.equal(await page.locator(records).first().getAttribute("id"), "dpop");
  await page
    .getByRole("link", { name: "Spring Security", exact: true })
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
  await page.locator(".evidence-facets summary").press("Enter");
  await page.getByRole("checkbox", { name: /^Cross-cutting/ }).check();
  await page.getByRole("button", { name: "Clear filters" }).press("Enter");
  assert.equal(await count.textContent(), `${FLOWS.length} flows shown`);
  assert.equal(await input.inputValue(), "");
  assert.equal(await page.locator(".evidence-empty").isVisible(), false);
  assert.ok(await input.evaluate((el) => el === document.activeElement));

  await page.getByRole("checkbox", { name: /^Cross-cutting/ }).check();
  await input.fill("dpop spring");
  assert.equal(await page.locator(records).count(), 1);
  assert.equal(await page.locator(".evidence-matches:visible").count(), 1);
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator(records).count(), FLOWS.length);
  assert.equal(await page.locator(".evidence-matches:visible").count(), 0);
  assert.equal(
    await page.locator(".evidence-overview:visible").count(),
    FLOWS.length,
  );
  assert.equal(
    await page
      .locator(".evidence-overview .evidence-examples li:visible")
      .count(),
    profiles
      .map(publishProfile)
      .reduce(
        (total, profile) =>
          total + profile.implementations.length + profile.deployments.length,
        0,
      ),
  );
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
  const matches = page.locator("#dpop .evidence-matches");
  assert.deepEqual(
    (await matches.getByRole("link").allTextContents())
      .map((name) => name.trim())
      .sort(),
    publishProfile(profiles.find((p) => p.slug === "dpop"))
      .implementations.filter((e) => /authorization server/i.test(e.role))
      .map((e) => e.product)
      .sort(),
  );
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
    .getByRole("link", { name: "Sources and review details" })
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
    assert.equal(await page.locator(".intro .evidence-summary").count(), 0);
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
            ?.textContent === "Sources and review details",
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
  const unreported = profiles
    .map(publishProfile)
    .find((p) => p.deployments.length === 0 && p.implementations.length > 0);
  assert.ok(unreported, "a reviewed flow with no deployment report");
  const overview = await page
    .locator(`#${unreported.slug} .evidence-overview`)
    .textContent();
  assert.ok(overview.includes(unreported.implementations[0].product));
  assert.match(overview, /No report included in this review/);
  assert.doesNotMatch(overview, /None found|No production report found/);
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
      ["/flows/mcp-authorization/", ".evidence-summary"],
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
          .getByRole("link", {
            name: /^(Claude Code|Workers OAuth Provider)\b/,
          })
          .count(),
        2,
      );
      const workers = products.getByRole("listitem").filter({
        has: page.getByRole("link", {
          name: /^Workers OAuth Provider\b/,
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
        .locator(".evidence-example-role")
        .boundingBox();
      const namePosition = await workers
        .locator(".evidence-example-name")
        .boundingBox();
      assert.ok(
        rolePosition.y >= namePosition.y + namePosition.height,
        "role reads beneath its product name",
      );
      if (path.startsWith("/flows/")) {
        const kind = workers.locator(".evidence-example-kind");
        assert.equal(await kind.textContent(), "Implementation");
        assert.ok(
          (await kind.boundingBox()).y >= rolePosition.y + rolePosition.height,
          "type follows the visible role",
        );
      }
      await products.getByRole("link", { name: /^Claude Code\b/ }).click();
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
          : "Deployment reports from the record",
      });
      assert.ok(
        await report
          .getByText("Hosted remote MCP service", { exact: true })
          .isVisible(),
      );
      await report.getByRole("link", { name: /^Stripe\b/ }).click();
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
        'section[aria-labelledby="field-implementations"] .evidence-entry, section[aria-labelledby="field-production"] .evidence-entry',
      )
      .evaluateAll((items) =>
        items.map((item) => ({
          id: item.id,
          name: item.querySelector("h3").textContent.trim(),
          summary: item
            .querySelector(".evidence-entry-summary")
            .textContent.trim(),
          kind:
            item.closest("section").getAttribute("aria-labelledby") ===
            "field-production"
              ? "Deployment report"
              : "Implementation",
        })),
      );
    await open(page, site.url(`/flows/${slug}/`));
    const cards = page.locator(".evidence-summary .evidence-examples li");
    const actual = await cards.evaluateAll((items) =>
      items.map((item) => ({
        id: item.querySelector("a").hash.slice(1),
        name: item.querySelector(".evidence-example-name").textContent.trim(),
        summary: item
          .querySelector(".evidence-example-summary")
          .textContent.trim(),
        kind: item.querySelector(".evidence-example-kind").textContent.trim(),
      })),
    );
    assert.deepEqual(actual, entries, slug);
    await cards.last().locator(".evidence-example-summary").click();
    assert.equal(new URL(page.url()).hash, `#${entries.at(-1).id}`);
    assert.ok(
      await page
        .locator(":target")
        .getByRole("heading", { name: entries.at(-1).name, exact: true })
        .isVisible(),
    );
  }
});

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`${viewport.width}px: group filters combine selections, intersect search and restore from the URL`, async (t) => {
    const ctx = await site.context({ viewport });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url("/implementations/"));
    const facets = page.locator(".evidence-facets");
    const input = page.getByRole("searchbox", {
      name: "Search by flow, product or role",
    });
    const groupIds = async () =>
      page
        .locator(".evidence-group:visible")
        .evaluateAll((groups) => groups.map((group) => group.dataset.group));
    assert.equal(await groupIds().then((ids) => ids.length), 6);
    if (viewport.width < 986) {
      assert.equal(await facets.getAttribute("open"), null);
      assert.ok(await input.isVisible());
      await facets.locator("summary").press("Enter");
    }
    assert.equal(await facets.getByRole("checkbox").count(), 6);
    const groupCounts = () =>
      facets
        .locator("[data-count-for]")
        .evaluateAll((counters) =>
          Object.fromEntries(
            counters.map((counter) => [
              counter.dataset.countFor,
              Number(
                counter.querySelector(".evidence-group-total").textContent,
              ),
            ]),
          ),
        );
    const totals = await groupCounts();
    const onlyDpop = Object.fromEntries(
      Object.keys(totals).map((group) => [
        group,
        group === "cross-cutting" ? 1 : 0,
      ]),
    );
    await input.fill("dpop");
    assert.ok((await page.locator("#dpop .evidence-matches li").count()) > 1);
    assert.deepEqual(
      await groupCounts(),
      onlyDpop,
      "several matching entries count as one flow",
    );
    assert.equal(
      await facets.getByRole("checkbox").count(),
      6,
      "zero-count groups stay visible",
    );
    assert.equal(await facets.locator("input:disabled").count(), 0);
    await input.fill("");
    assert.deepEqual(await groupCounts(), totals);
    await page
      .getByRole("checkbox", { name: /^Get access on behalf of a user/ })
      .check();
    assert.deepEqual(await groupIds(), ["human-present"]);
    await page.getByRole("checkbox", { name: /^Cross-cutting/ }).check();
    assert.deepEqual(await groupIds(), ["human-present", "cross-cutting"]);
    await input.fill("dpop spring");
    assert.equal(await page.locator(records).count(), 1);
    assert.deepEqual(await groupIds(), ["cross-cutting"]);
    assert.deepEqual(await groupCounts(), onlyDpop);
    assert.deepEqual(new URL(page.url()).searchParams.getAll("group"), [
      "human-present",
      "cross-cutting",
    ]);
    assert.equal(new URL(page.url()).searchParams.get("q"), "dpop spring");
    await open(page, page.url());
    assert.equal(await input.inputValue(), "dpop spring");
    assert.deepEqual(
      await groupCounts(),
      onlyDpop,
      "counts restore with the saved search",
    );
    assert.ok(
      await page
        .getByRole("checkbox", { name: /^Get access on behalf of a user/ })
        .isChecked(),
    );
    assert.ok(
      await page.getByRole("checkbox", { name: /^Cross-cutting/ }).isChecked(),
    );
    assert.equal(await page.locator(records).count(), 1);
    if (viewport.width < 986)
      assert.notEqual(await facets.getAttribute("open"), null);
    await page.getByRole("checkbox", { name: /^Cross-cutting/ }).uncheck();
    assert.equal(await page.locator(records).count(), 0);
    assert.ok(await page.locator(".evidence-empty").isVisible());
    assert.deepEqual(
      await groupCounts(),
      onlyDpop,
      "an unselected group retains its search count",
    );
    await input.fill("");
    assert.deepEqual(
      await groupCounts(),
      totals,
      "clearing only the text restores every group total",
    );
    assert.deepEqual(await groupIds(), ["human-present"]);
    await input.fill("no matching implementation");
    assert.ok(Object.values(await groupCounts()).every((count) => count === 0));
    assert.equal(await facets.getByRole("checkbox").count(), 6);
    await page.getByRole("button", { name: "Clear filters" }).press("Enter");
    assert.deepEqual(await groupCounts(), totals);
    assert.equal(await input.inputValue(), "");
    assert.equal(await facets.locator("input:checked").count(), 0);
    assert.equal(await page.locator(records).count(), FLOWS.length);
    assert.equal(new URL(page.url()).search, "");
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  });

  test(`${viewport.width}px: product search replaces summaries with qualified matches and restores them when cleared`, async (t) => {
    const ctx = await site.context({ viewport });
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url("/implementations/"));
    await page
      .getByRole("searchbox", { name: "Search by flow, product or role" })
      .fill("keycloak");
    const mcp = page.locator("#mcp-authorization");
    assert.ok(!(await mcp.locator(".evidence-overview").isVisible()));
    assert.equal(
      await mcp.getByRole("link", { name: "Claude Code", exact: true }).count(),
      0,
    );
    assert.equal(
      await mcp.getByRole("link", { name: "Stripe", exact: true }).count(),
      0,
    );
    assert.ok(
      await mcp
        .getByRole("link", { name: "See the flow for MCP authorization" })
        .isVisible(),
    );
    assert.ok(
      await mcp
        .getByRole("link", {
          name: "Sources and review details for MCP authorization",
        })
        .isVisible(),
    );
    const match = mcp.locator(".evidence-matches");
    assert.equal(await match.getByRole("link").count(), 1);
    assert.ok(
      await match.locator(".evidence-example-qualification").isVisible(),
    );
    assert.match(
      await match.textContent(),
      /Keycloak[\s\S]*Authorization server[\s\S]*Experimental/,
    );
    await match.getByRole("link", { name: "Keycloak", exact: true }).click();
    assert.match(
      page.url(),
      /\/implementations\/mcp-authorization\/#field-mcp-keycloak$/,
    );
    assert.match(await page.locator(":target").textContent(), /Experimental/);

    await open(page, site.url("/implementations/"));
    const input = page.getByRole("searchbox", {
      name: "Search by flow, product or role",
    });
    await input.fill("keycloak");
    if (viewport.width < 986)
      await page.locator(".evidence-facets summary").click();
    await page.getByRole("button", { name: "Clear filters" }).click();
    assert.equal(await page.locator(records).count(), FLOWS.length);
    assert.equal(await page.locator(".evidence-matches:visible").count(), 0);
    assert.ok(
      await mcp
        .getByRole("link", { name: "Claude Code", exact: true })
        .isVisible(),
    );
    assert.ok(
      await mcp.getByRole("link", { name: "Stripe", exact: true }).isVisible(),
    );
    assert.equal(await mcp.getAttribute("data-matching"), null);
  });
}

test("material qualifications accompany product and report names without JavaScript", async (t) => {
  const ctx = await site.context({ javaScriptEnabled: false });
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  for (const path of ["/flows/web-bot-auth/", "/implementations/"]) {
    await open(page, site.url(path));
    const scope = path.startsWith("/flows/")
      ? page.locator(".evidence-summary")
      : page.locator("#web-bot-auth");
    const cloudflare = scope.getByRole("listitem").filter({
      has: page.getByRole("link", {
        name: /^Cloudflare Verified Bots\b/,
      }),
    });
    assert.ok(
      await cloudflare.locator(".evidence-example-qualification").isVisible(),
    );
    assert.match(
      await cloudflare.textContent(),
      /Rejects the format this guide illustrates/,
    );
    const google = scope.getByRole("listitem").filter({
      has: page.getByRole("link", { name: /^Google-Agent\b/ }),
    });
    assert.ok(
      await google.locator(".evidence-example-qualification").isVisible(),
    );
    assert.match(await google.textContent(), /Experimental signing/);
    assert.match(
      await google.textContent(),
      /Uses an origin where this guide uses the key-set URL/,
    );
  }
  await open(page, site.url("/flows/gnap/"));
  assert.match(
    await page.locator(".evidence-summary").textContent(),
    /No HTTP Message Signatures, key-bound access tokens or RFC 9767 introspection/,
  );
  await open(page, site.url("/flows/agent-to-agent/"));
  const eon = page
    .locator(".evidence-summary li")
    .filter({ has: page.getByRole("link", { name: /^Eon\b/ }) });
  assert.match(await eon.textContent(), /Eon reported using A2A 0.3/);
});

test("a flow fragment reveals a record excluded by saved filters", async (t) => {
  const ctx = await site.context();
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(
    page,
    site.url("/implementations/?group=human-present&q=cognito#dpop"),
  );
  assert.ok(await page.locator("#dpop").isVisible());
  assert.equal(
    await page.locator(".evidence-controls input:checked").count(),
    0,
  );
  assert.equal(new URL(page.url()).search, "");
  assert.equal(new URL(page.url()).hash, "#dpop");
});
