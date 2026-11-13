// The standards tracker, in each theme, on a desktop and on a phone: the lookup
// comes first, every related document is linked, and the names people type
// find what they mean.
import { strict as assert } from "node:assert";
import { after, before, describe, test } from "node:test";
import {
  device,
  open,
  THEMES,
  useBrowser,
  VIEWPORTS,
} from "../support/browser.mjs";

/**
 * What people type into the tracker's lookup, and how many entries it must
 * show at least. The first group is what the entries' own text already gave;
 * the second is what only an entry's `otherNames` give. Add a name here when
 * you give an entry one.
 */
const TYPED_NAMES = [
  ["mutual TLS", 5],
  ["RFC9728", 1],
  ["OAuth2.1", 4],
  ["CIMD", 1],
  ["DPoP", 4],
  ["mTLS", 3],
  ["JAR", 1],
  ["PRM", 1],
  ["DCR", 1],
  ["PAR", 1],
  ["RAR", 1],
  ["device flow", 1],
];

const site = useBrowser();

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    describe(`${theme} ${vp.name} standards`, () => {
      let ctx;
      let page;
      before(async () => {
        ctx = await site.context(
          device(vp, { colorScheme: theme, reducedMotion: "reduce" }),
        );
        page = await ctx.newPage();
        await open(page, site.url("/standards/"));
        // with the supporting details open, which pushes the lookup furthest down
        await page.click("main .doc-details summary");
      });
      after(() => ctx.close());

      let measured;
      const lookup = () =>
        (measured ??= page.evaluate(() => ({
          search:
            document.querySelector(".sx-search input").getBoundingClientRect()
              .top + scrollY,
          first:
            document.querySelector(".sx-item").getBoundingClientRect().top +
            scrollY,
          moved:
            document.querySelector("#moved").getBoundingClientRect().top +
            scrollY,
        })));
      test("search and the first entry are within the first two screens", async () => {
        const l = await lookup();
        assert.ok(
          l.first < vp.height * 2 && l.search < vp.height * 1.5,
          `search at ${Math.round(l.search)}px, first entry at ${Math.round(l.first)}px`,
        );
      });
      test("history sits after the lookup", async () => {
        const l = await lookup();
        assert.ok(l.moved > l.first);
      });

      // A fact about another document is shown with its link: to that
      // document, or to its own entry on this page.
      test("each related document is a link, to its source or to its entry here", async () => {
        const related = await page.evaluate(() => {
          const links = [...document.querySelectorAll(".sx-related a")];
          const broken = links
            .map((a) => a.getAttribute("href") ?? "")
            .filter((h) =>
              h.startsWith("#")
                ? !document
                    .getElementById(h.slice(1))
                    ?.classList.contains("sx-item")
                : !h.startsWith("https://"),
            );
          const unlinked = [
            ...document.querySelectorAll(".sx-related li"),
          ].filter(
            (li) => !li.querySelector("a") || li.textContent.trim().length < 12,
          ).length;
          return { count: links.length, broken, unlinked };
        });
        assert.ok(related.count > 0, "no related document is linked");
        assert.deepEqual(
          { broken: related.broken, unlinked: related.unlinked },
          { broken: [], unlinked: 0 },
        );
      });

      for (const [typed, atLeast] of TYPED_NAMES) {
        test(`lookup finds an entry for "${typed}"`, async () => {
          const found = await page.evaluate((q) => {
            const input = document.querySelector(".sx-search input");
            input.value = q;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            return document.querySelectorAll(".sx-item:not([hidden])").length;
          }, typed);
          assert.ok(
            found >= atLeast,
            `${found} shown, at least ${atLeast} expected`,
          );
        });
      }
      test("an entry's other names are not shown in its text", async () => {
        const leaked = await page.evaluate(() => {
          const input = document.querySelector(".sx-search input");
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          const item = document.querySelector("#rfc9126");
          return /\bPAR\b/.test(item.textContent);
        });
        assert.equal(leaked, false);
      });
    });
  }
}
