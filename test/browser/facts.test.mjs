// A flow's and the tracker's first line of facts, in each theme, on a desktop
// and on a phone: the review date and the specification up front, and the rest
// behind a disclosure.
import { strict as assert } from "node:assert";
import { after, before, describe, test } from "node:test";
import {
  device,
  open,
  THEMES,
  useBrowser,
  VIEWPORTS,
} from "../support/browser.mjs";
import { FLOW } from "../support/site.mjs";

const site = useBrowser();

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    for (const [name, path] of [
      ["flow", FLOW],
      ["standards", "/standards/"],
    ]) {
      describe(`${theme} ${vp.name} ${name}`, () => {
        let ctx;
        let page;
        before(async () => {
          ctx = await site.context(
            device(vp, { colorScheme: theme, reducedMotion: "reduce" }),
          );
          page = await ctx.newPage();
          await open(page, site.url(path));
        });
        after(() => ctx.close());

        let read;
        const facts = () =>
          (read ??= page.evaluate(() => {
            const line = document.querySelector("main .doc-line");
            const more = document.querySelector("main .doc-details");
            return line
              ? {
                  text: line.textContent.replace(/\s+/g, " "),
                  links: [...line.querySelectorAll("a")].map((a) =>
                    a.getAttribute("href"),
                  ),
                  closed: more ? !more.open : null,
                }
              : null;
          }));

        test("review date is on the page’s first line of facts", async () => {
          const f = await facts();
          assert.ok(f, "no page facts");
          assert.match(f.text, /reviewed:\s*\w+ \d{4}/i);
        });
        test("supporting details start closed and open on request", async () => {
          const f = await facts();
          assert.equal(f?.closed, true, "the details are not closed");
          assert.ok(
            await page.evaluate(() => {
              const d = document.querySelector("main .doc-details");
              d.querySelector("summary").click();
              return d.open && d.querySelector("dl").offsetParent !== null;
            }),
            "the details do not open",
          );
        });
        test("review values and notes remain separate paragraphs with literal spacing", async () => {
          assert.ok(
            await page.locator("main .doc-details dd").evaluateAll((items) =>
              items.every((dd) => {
                const value = dd.querySelector(".doc-value");
                const note = dd.querySelector(".doc-note");
                return (
                  !note ||
                  (value?.tagName === "P" &&
                    note.tagName === "P" &&
                    dd.textContent.includes(
                      `${value.textContent} ${note.textContent}`,
                    ))
                );
              }),
            ),
          );
        });
        if (name === "flow")
          test("specification is named and linked beside the review date", async () => {
            const f = await facts();
            assert.ok(
              !!f &&
                f.links.some((h) => h.startsWith("/standards/#")) &&
                /based on/i.test(f.text),
              f?.links.join(" ") ?? "",
            );
          });
      });
    }
  }
}

for (const vp of VIEWPORTS) {
  test(`${vp.name}: review details keep the specification basis together and read down each group without scripts`, async (t) => {
    const ctx = await site.context(device(vp, { javaScriptEnabled: false }));
    t.after(() => ctx.close());
    const page = await ctx.newPage();
    for (const [slug, references] of [
      [
        "authorization-code-pkce",
        ["OAuth 2.0 Authorization Framework", "PKCE"],
      ],
      ["dpop", ["DPoP"]],
    ]) {
      await open(page, site.url(`/flows/${slug}/`));
      await page.locator(".doc-details summary").click();
      const about = page.getByRole("group", {
        name: "About this guide",
        exact: true,
      });
      const basis = page.getByRole("group", {
        name: "Specification basis",
        exact: true,
      });
      assert.match(await about.textContent(), /Implementation guide/);
      assert.match(await about.textContent(), /Flow maturity/);
      assert.equal(await about.locator('a[href^="/standards/"]').count(), 0);
      assert.deepEqual(
        await basis.locator('a[href^="/standards/"]').allTextContents(),
        references,
      );
      assert.doesNotMatch(await basis.textContent(), /Basis \d+ of/);
      const positions = await page
        .locator(".doc-groups .doc-group")
        .evaluateAll((groups) =>
          groups.map((group) => {
            const { x, y, right, bottom } = group.getBoundingClientRect();
            const items = [...group.querySelectorAll("dl > div")].map(
              (item) => {
                const { x, y, bottom } = item.getBoundingClientRect();
                return { x, y, bottom };
              },
            );
            return { x, y, right, bottom, items };
          }),
        );
      assert.equal(positions.length, 2);
      for (const group of positions) {
        assert.ok(
          group.items.every(
            (item, i) =>
              i === 0 ||
              (Math.abs(item.x - group.items[0].x) < 1 &&
                item.y >= group.items[i - 1].bottom),
          ),
          slug,
        );
      }
      if (vp.name === "desktop") {
        assert.ok(positions[1].x >= positions[0].right, slug);
        assert.ok(Math.abs(positions[1].y - positions[0].y) < 1, slug);
      } else {
        assert.ok(positions[1].y >= positions[0].bottom, slug);
      }
    }
  });
}
