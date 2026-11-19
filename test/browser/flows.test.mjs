import { assert, test } from "ubqtest";
import { device, open, useBrowser, VIEWPORTS } from "../support/browser.mjs";

const site = useBrowser();

for (const viewport of VIEWPORTS) {
  test(`the flow search and comparison stay in sync on ${viewport.name}`, async () => {
    const context = await site.context(
      device(viewport, { reducedMotion: "reduce" }),
    );
    const page = await context.newPage();
    await open(page, site.url("/flows/#all"));

    const cards = page.locator(".fl-cell:visible");
    const comparison = page.getByRole("region", { name: "Side by side" });
    const rows = comparison.locator("tbody tr:visible");
    const paths = (items) =>
      items
        .getByRole("link")
        .evaluateAll((links) => links.map((link) => link.pathname).sort());
    const all = await paths(cards);

    const search = page.getByRole("searchbox");
    await search.fill("OAuth");
    const matches = await paths(cards);
    assert(matches.length > 0 && matches.length < all.length);
    assert(matches.includes("/flows/dpop/")); // finds DPoP through its standards
    assert.deepEqual(await paths(rows), matches);

    if (viewport.name === "phone")
      await page.getByText("Filters", { exact: true }).click();
    await page.getByRole("checkbox", { name: /^Cross-cutting/ }).check();
    const narrowed = await paths(cards);
    assert(narrowed.length > 0 && narrowed.length < matches.length);
    assert.deepEqual(await paths(rows), narrowed);
    assert(
      await comparison.getByText(/Search “OAuth” · Cross-cutting/).isVisible(),
    );

    await search.fill("no-matching-flow-zzzz");
    assert.equal(await rows.count(), 0);
    assert(await comparison.getByText(/^No flows match/).isVisible());

    await page.emulateMedia({ media: "print" });
    assert.deepEqual(await paths(rows), all);
    await page.emulateMedia({ media: "screen" });

    await comparison.getByRole("button", { name: "Clear filters" }).click();
    assert.equal(await search.inputValue(), "");
    assert.deepEqual(await paths(rows), all);
    const heading = comparison.getByRole("heading");
    assert(
      await heading.evaluate((element) => {
        const { top, bottom } = element.getBoundingClientRect();
        return (
          element === document.activeElement &&
          top >= 0 &&
          bottom <= innerHeight
        );
      }),
    );
  });
}
