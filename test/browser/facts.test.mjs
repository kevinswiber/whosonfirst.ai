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
