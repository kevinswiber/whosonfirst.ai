// What a reader gets without interacting: every step of every flow in the
// page, in order, with scripts or without, and every alternative in a
// comparison readable without choosing it. Reader extractors inspect the live
// DOM, so selection must never remove the narrative with hidden, aria-hidden
// or display: none. This is a content-availability contract, not an emulation
// of any browser's Reader.
import { strict as assert } from "node:assert";
import { after, before, describe, test } from "node:test";
import { open, useBrowser } from "../support/browser.mjs";
import { FLOWS } from "../support/site.mjs";

const site = useBrowser();

// With and without scripts, each has a context of its own, and nothing here
// waits on a clock, so the two run side by side.
describe("every flow read in place", { concurrency: true }, () => {
  for (const javaScriptEnabled of [false, true]) {
    describe(`reader content ${javaScriptEnabled ? "after stepping" : "without JavaScript"}`, {
      concurrency: 1,
    }, () => {
      let page;
      before(async () => {
        const ctx = await site.context({
          javaScriptEnabled,
          viewport: { width: 1280, height: 900 },
        });
        page = await ctx.newPage();
      });
      after(() => page.context().close());

      for (const path of FLOWS) {
        test(`${path}: all step headings, messages, examples and holdings remain available in order`, async () => {
          await open(page, site.url(path));
          if (javaScriptEnabled) await page.click('[data-act="next"]');
          const seen = await page.evaluate(() => {
            const flow = document.querySelector("flow-diagram");
            const steps = [...flow.querySelectorAll(".flow-step")];
            const problems = [];
            if (
              flow.querySelectorAll(".step-phase").length !==
              flow.querySelectorAll(".phase-start").length
            )
              problems.push("phase introductions are repeated or missing");
            if (flow.querySelector(".flow-step:not(.phase-start) .step-phase"))
              problems.push("a phase introduction repeats inside the phase");
            if (
              [...document.querySelectorAll(".ov-n, .step-num")].some(
                (n) => n.getAttribute("aria-hidden") !== "true",
              )
            )
              problems.push(
                "a visual badge duplicates ordered-list numbering for assistive technology",
              );
            const article = document.querySelector("main > article");
            if (
              !article?.contains(flow) ||
              !article?.querySelector(".intro .doc-line")
            )
              problems.push("flow provenance is outside its article narrative");
            for (const [i, step] of steps.entries()) {
              if (step.id !== `step-${i + 1}`)
                problems.push(`step ${i + 1}: out of order`);
              if (!step.querySelector("h3")?.textContent.trim())
                problems.push(`step ${i + 1}: no heading`);
              if (!step.querySelector(".step-body")?.textContent.trim())
                problems.push(`step ${i + 1}: no message`);
              for (const node of [
                step,
                ...step.querySelectorAll(".step-body, pre, .held"),
              ]) {
                if (
                  node.closest('[hidden], [aria-hidden="true"]') ||
                  !node.checkVisibility({ visibilityProperty: true })
                )
                  problems.push(
                    `step ${i + 1}: narrative removed from the reading tree`,
                  );
              }
            }
            return {
              count: Number(flow.dataset.count),
              steps: steps.length,
              problems,
            };
          });
          assert.equal(
            seen.steps,
            seen.count,
            "steps listed against the count",
          );
          assert.deepEqual(seen.problems, []);
        });
      }
    });
  }
});

// Comparisons and their annotations explain each alternative without interaction.
for (const javaScriptEnabled of [false, true]) {
  describe(`comparisons ${javaScriptEnabled ? "with" : "without"} JavaScript`, () => {
    let page;
    before(async () => {
      const ctx = await site.context({
        javaScriptEnabled,
        reducedMotion: "reduce",
      });
      page = await ctx.newPage();
    });
    after(() => page.context().close());

    for (const [path, selector] of [
      ["/concepts/", ".ti-panel"],
      ["/deployments/kubernetes/", ".km-panel"],
    ]) {
      test(`${path}: every comparison alternative remains readable without selection`, async () => {
        await open(page, site.url(path));
        const seen = await page.locator(selector).evaluateAll((panels) => ({
          total: panels.length,
          readable: panels.filter(
            (p) =>
              !p.closest('[hidden], [aria-hidden="true"]') &&
              p.checkVisibility({ visibilityProperty: true }),
          ).length,
        }));
        assert.ok(
          seen.total > 1 && seen.readable === seen.total,
          JSON.stringify(seen),
        );
      });
    }

    describe("/concepts/", () => {
      before(() => open(page, site.url("/concepts/")));
      let read;
      const structure = () =>
        (read ??= page.evaluate(() => {
          const article = document.querySelector("main > article");
          const heading = article?.querySelector("h1");
          const intro = article?.querySelector(".page-head .lede");
          const facts = article?.querySelector(".page-facts");
          const comparisons = [...document.querySelectorAll(".lh-panel")];
          const modes = [...document.querySelectorAll("#human .modes .card")];
          return {
            opening:
              !!heading &&
              !!intro &&
              !!facts &&
              !!(
                intro.compareDocumentPosition(facts) &
                Node.DOCUMENT_POSITION_FOLLOWING
              ),
            comparisons: comparisons.length,
            modes: modes.length,
            complete: [...comparisons, ...modes].every(
              (p) =>
                p.querySelector("h3")?.textContent.trim() &&
                p.checkVisibility({ visibilityProperty: true }) &&
                [...p.querySelectorAll("h3, p, table")].every((el) =>
                  el.checkVisibility({ visibilityProperty: true }),
                ),
            ),
          };
        }));
      test("the article opens with its heading and introduction before review facts", async () => {
        assert.ok((await structure()).opening);
      });
      test("all five delegation and three human-involvement comparisons have readable headings and explanations", async () => {
        const s = await structure();
        assert.deepEqual(
          {
            comparisons: s.comparisons,
            modes: s.modes,
            complete: s.complete,
          },
          { comparisons: 5, modes: 3, complete: true },
        );
      });
      test("each chain exposes all three ordered hops with both endpoints and the credential", async () => {
        const chains = await page.locator(".lh-panel").evaluateAll((panels) =>
          panels.map((panel) => {
            const nodes = [...panel.querySelectorAll(".lh-node")].map(
              (node) =>
                `${node.querySelector("strong").textContent} (${node.querySelector("span").textContent})`,
            );
            const credentials = [...panel.querySelectorAll(".lh-cred")].map(
              (el) => el.textContent,
            );
            const items = [...panel.querySelectorAll(".lh-path li")];
            return {
              expected: credentials.map(
                (credential, i) =>
                  `${nodes[i]} to ${nodes[i + 1]}: ${credential}.`,
              ),
              actual: items.map((el) => el.textContent),
              visible: items.every((el) =>
                el.checkVisibility({ visibilityProperty: true }),
              ),
            };
          }),
        );
        const chainText = await page.locator(".lh").ariaSnapshot();
        assert.equal(chains.length, 5, "chains drawn");
        for (const { expected, actual, visible } of chains) {
          assert.ok(visible, "a hop is not visible");
          assert.equal(expected.length, 3, "hops in a chain");
          assert.deepEqual(actual, expected);
          for (const text of expected)
            assert.ok(chainText.includes(text), `not exposed: ${text}`);
        }
      });
      test("decorative chain boxes do not duplicate the accessible hop narrative", async () => {
        const diagrams = await Promise.all(
          (await page.locator(".lh-chain").all()).map((el) =>
            el.ariaSnapshot(),
          ),
        );
        assert.equal(diagrams.length, 5, "chains drawn");
        assert.deepEqual(
          diagrams.filter((text) => text.trim()),
          [],
        );
      });
      test("a delegation navigation link reaches its visible section heading", async () => {
        await page.locator('.lh-modes a[href="#lh-bound"]').click();
        const target = await page.locator("#lh-bound h3").boundingBox();
        assert.equal(new URL(page.url()).hash, "#lh-bound");
        assert.ok(
          !!target && target.y >= 90 && target.y + target.height < 720,
          JSON.stringify(target),
        );
      });
      test("every claim explanation is visible and exposed without opening a disclosure", async () => {
        const notes = page.locator(".claim-note");
        const visible = await notes.evaluateAll((items) =>
          items.every(
            (n) =>
              !n.closest('[hidden], [aria-hidden="true"]') &&
              n.checkVisibility({ visibilityProperty: true }),
          ),
        );
        const snapshots = await Promise.all(
          (await notes.all()).map((n) => n.ariaSnapshot()),
        );
        assert.ok(snapshots.length > 0, "no claim explanation");
        assert.ok(visible, "a claim explanation is hidden");
        assert.ok(
          snapshots.every((s) => s.trim().length > 0),
          "a claim explanation is not exposed",
        );
      });
    });
  });
}

// Reader modes discard CSS gaps, so fields set side by side need a separator
// in the text itself.
describe("adjacent metadata and source references have literal separators", () => {
  for (const [path, selector] of [
    ["/standards/", ".sx-item > .chips"],
    ["/concepts/", ".ti-sources .chips"],
  ]) {
    test(path, async (t) => {
      const ctx = await site.context();
      t.after(() => ctx.close());
      const page = await ctx.newPage();
      await open(page, site.url(path));
      const rows = await page.locator(selector).evaluateAll((items) =>
        items.map((row) => ({
          fields: row.children.length,
          separators: row.textContent.match(/ · /g)?.length ?? 0,
        })),
      );
      assert.ok(rows.length > 0, "no such row");
      assert.deepEqual(
        rows.filter((r) => r.separators !== Math.max(0, r.fields - 1)),
        [],
      );
    });
  }
});
