#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
/**
 * Rendered checks: what the token audit cannot see.
 *
 * contrast-check.mjs proves that declared color pairs pass. This script opens
 * the built site in a browser and measures what is actually drawn: the diagram
 * in each of its states, the size labels end up at, how long lines of prose
 * run, whether anything overflows, and whether the pieces a reader depends on
 * are present and work.
 *
 *   npm run build && node scripts/rendered-check.mjs
 *   node scripts/rendered-check.mjs --verbose           list every measurement
 *
 * Needs Chromium for Playwright: `npx playwright install chromium`.
 * Exits 1 if any check fails.
 */
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const axePath = require.resolve("axe-core/axe.min.js");

const root = fileURLToPath(new URL("../dist/client/", import.meta.url));
if (!existsSync(join(root, "index.html"))) {
  console.error("dist/client/ is missing. Run `npm run build` first.");
  process.exit(1);
}
const verbose = process.argv.includes("--verbose");

/* ---------- thresholds ---------- */
const AA = 4.5; // text contrast
const MIN_LABEL = 12; // px a diagram label may be drawn at
const MIN_PROSE = 16; // px for running text
const MAX_MEASURE = 82; // characters per line of running text

/* ---------- a static server for dist/client/ ---------- */
const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".png": "image/png",
};
const server = createServer((req, res) => {
  let file = normalize(
    join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)),
  );
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory())
    file = join(file, "index.html");
  if (!existsSync(file)) return res.writeHead(404).end("not found");
  res
    .writeHead(200, {
      "content-type": TYPES[extname(file)] ?? "application/octet-stream",
    })
    .end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

/* ---------- what is looked at ---------- */
const FLOW = "/flows/mcp-authorization/";
const EXAMPLE = "/examples/support-agent/";
const PAGES = [
  { path: "/", name: "home" },
  { path: FLOW, name: "flow" },
  { path: "/standards/", name: "standards" },
  { path: "/concepts/", name: "concepts" },
  { path: "/flows/", name: "flows index" },
  { path: "/guide/", name: "decision guide" },
  { path: "/deployments/kubernetes/", name: "deployment guide" },
  { path: "/examples/", name: "examples index" },
  { path: EXAMPLE, name: "worked example" },
  { path: "/examples/invoice-agent/", name: "second worked example" },
];
const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "phone", width: 390, height: 844, isMobile: true, hasTouch: true },
];
const THEMES = ["light", "dark"];
// The narrowest window the site is held to: a small phone, or a desktop window
// zoomed to 400%. Only sideways overflow is measured there: on the pages above,
// on the About page, whose long addresses are the first thing to push a page
// past the window, and on every flow, since each flow brings its own
// credentials and labels.
const NARROW = { width: 320, height: 568 };
const NARROW_PAGES = [
  ...new Set([
    ...PAGES.map((p) => p.path),
    "/about/",
    ...readdirSync(join(root, "flows"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `/flows/${d.name}/`)
      .sort(),
  ]),
];

const results = []; // { where, check, ok, detail }
const record = (where, check, ok, detail = "") =>
  results.push({ where, check, ok, detail });

/* ---------- measurements that run in the page ---------- */

/** Contrast of every label in the sequence diagram as drawn: fill × opacity, over what is behind it. */
const diagramLabels = () => {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  const rgba = (css) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const over = (top, under) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1);
  };
  const lum = ([r, g, b]) => {
    const f = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const canvas = document.querySelector(".flow-canvas");
  const page = over(
    rgba(getComputedStyle(canvas).backgroundColor),
    rgba(getComputedStyle(document.body).backgroundColor),
  );
  const out = [];
  // the participant strip and the sequence are separate drawings at the same scale
  for (const el of canvas.querySelectorAll("svg text")) {
    const svg = el.ownerSVGElement;
    const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    const cs = getComputedStyle(el);
    let alpha = 1;
    for (let n = el; n && n !== canvas; n = n.parentElement)
      alpha *= Number(getComputedStyle(n).opacity);
    const group = el.closest(".step, .actor");
    // what is painted behind the label: the row band, a note pill, a filled badge or an actor box
    let ground = page;
    const band = group?.querySelector(".hit");
    if (band) ground = over(rgba(getComputedStyle(band).fill), ground);
    const cls = el.getAttribute("class") ?? "";
    const shape = cls.includes("note-label")
      ? ".note"
      : cls.includes("badge-num")
        ? ".badge"
        : cls.includes("actor-")
          ? ".actor-box"
          : null;
    if (shape)
      ground = over(
        rgba(getComputedStyle(group.querySelector(shape)).fill),
        ground,
      );
    const ink = rgba(cs.fill);
    ink[3] *= alpha;
    out.push({
      text: el.textContent.trim(),
      state: group?.classList.contains("is-active")
        ? "current"
        : group?.classList.contains("is-done")
          ? "done"
          : group?.classList.contains("is-todo")
            ? "to come"
            : "static",
      ratio: ratio(over(ink, ground), ground),
      px: parseFloat(cs.fontSize) * scale,
    });
  }
  return out;
};

/** Size and line length of running text. */
const prose = () => {
  const out = [];
  for (const p of document.querySelectorAll(
    "main .prose p, main .article > p, main .step-body p, main .lede, main .we-narrow, main .we-how p, main .opener-text",
  )) {
    if (!p.offsetParent) continue;
    const cs = getComputedStyle(p);
    const lines = Math.round(
      p.getBoundingClientRect().height / parseFloat(cs.lineHeight),
    );
    out.push({
      size: parseFloat(cs.fontSize),
      lines,
      perLine: lines >= 3 ? p.textContent.trim().length / lines : 0,
    });
  }
  return out;
};

/** How far the page scrolls sideways and, if it does, what reaches furthest past its right edge. */
const sideways = () => {
  const doc = document.documentElement;
  const by = doc.scrollWidth - doc.clientWidth;
  let far = null;
  if (by > 0) {
    for (const el of document.querySelectorAll("body *")) {
      const right = el.getBoundingClientRect().right;
      if (right <= doc.clientWidth || (far && right < far.right)) continue;
      // what sits in a frame that scrolls or clips sideways does not widen the page
      let framed = false;
      for (
        let a = el.parentElement;
        a && a !== document.body && !framed;
        a = a.parentElement
      )
        framed = getComputedStyle(a).overflowX !== "visible";
      if (!framed) far = { el, right };
    }
  }
  const name = (el) => [el.localName, ...el.classList].join(".");
  return {
    by,
    what: far
      ? `${name(far.el)} “${far.el.textContent.trim().replace(/\s+/g, " ").slice(0, 48)}”`
      : "",
  };
};

/* ---------- run ---------- */
const browser = await chromium.launch();
for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
      colorScheme: theme,
      reducedMotion: "reduce",
    });
    for (const pg of PAGES) {
      const where = `${theme} ${vp.name} ${pg.name}`;
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.goto(`${origin}${pg.path}`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      record(where, "no script errors", errors.length === 0, errors.join("; "));
      if (pg.name === "home") {
        const dest = [
          "/guide/",
          "/examples/",
          "/flows/",
          "/concepts/",
          "/deployments/",
          "/standards/",
          "/glossary/",
        ];
        const visibleLinks = () =>
          page.evaluate(() =>
            [...document.querySelectorAll(".site-header a")]
              .filter((a) => {
                const r = a.getBoundingClientRect();
                return r.width > 0 && r.right <= innerWidth && r.left >= 0;
              })
              .map((a) => a.getAttribute("href")),
          );
        if (vp.name === "phone") {
          const closed = await visibleLinks();
          record(
            where,
            "header keeps the flow chooser in view",
            closed.includes("/guide/"),
            closed.join(" "),
          );
          await page.focus(".menu-toggle");
          await page.keyboard.press("Enter");
          const open = await visibleLinks();
          const size = await page.evaluate(() =>
            Math.min(
              ...[
                ...document.querySelectorAll(
                  ".site-header nav a, .menu-toggle",
                ),
              ].map((el) => el.getBoundingClientRect().height),
            ),
          );
          record(
            where,
            "menu opens from the keyboard and shows every destination",
            dest.every((d) => open.includes(d)),
            open.join(" "),
          );
          record(
            where,
            "menu targets are at least 44px tall",
            size >= 44,
            `smallest ${Math.round(size)}px`,
          );
          await page.keyboard.press("Tab");
          const focused = await page.evaluate(() => {
            const el = document.activeElement;
            const cs = getComputedStyle(el);
            return {
              href: el.getAttribute("href"),
              outline:
                cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2,
            };
          });
          record(
            where,
            "first menu link takes focus next, with a visible ring",
            focused.href === "/guide/" && focused.outline,
            JSON.stringify(focused),
          );
          await page.keyboard.press("Escape");
          const back = await page.evaluate(() => ({
            expanded: document
              .querySelector(".menu-toggle")
              .getAttribute("aria-expanded"),
            onToggle:
              document.activeElement === document.querySelector(".menu-toggle"),
          }));
          record(
            where,
            "Escape closes the menu and returns focus to its button",
            back.expanded === "false" && back.onToggle,
            JSON.stringify(back),
          );
        } else {
          const shown = await visibleLinks();
          record(
            where,
            "every destination is in the header",
            dest.every((d) => shown.includes(d)),
            shown.join(" "),
          );
        }
      }
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      record(
        where,
        "no sideways overflow",
        overflow <= 0,
        overflow > 0 ? `${overflow}px` : "",
      );

      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async () => {
        const r = await window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
          },
        });
        return r.violations.map(
          (v) => `${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(" ")}`,
        );
      });
      record(
        where,
        "axe: no WCAG A/AA violations",
        violations.length === 0,
        violations.join(" | "),
      );

      const text = await page.evaluate(prose);
      if (text.length) {
        const small = Math.min(...text.map((t) => t.size));
        record(
          where,
          `running text at least ${MIN_PROSE}px`,
          small >= MIN_PROSE,
          `smallest ${small.toFixed(1)}px`,
        );
        const long = Math.max(0, ...text.map((t) => t.perLine));
        if (long)
          record(
            where,
            `at most ${MAX_MEASURE} characters a line`,
            long <= MAX_MEASURE,
            `longest ${long.toFixed(0)}`,
          );
      }

      if (pg.name === "home") {
        // the opening: one situation, one idea, one next step, before anything asks the
        // reader to classify their own case
        const home = await page.evaluate(() => {
          const hero = document.querySelector(".hero");
          const text = (sel) =>
            hero.querySelector(sel)?.textContent.replace(/\s+/g, " ").trim() ??
            "";
          const top = (el) => el.getBoundingClientRect().top;
          const path = [...hero.querySelectorAll(".path li")];
          const primary = [...document.querySelectorAll("main .btn.primary")];
          const focusable = document.querySelector(
            "main a[href], main button, main input",
          );
          return {
            h1: text("h1"),
            idea: text(".idea"),
            names: path.map((li) => li.querySelector("b").textContent),
            oneRow: new Set(path.map((li) => Math.round(top(li)))).size === 1,
            primary: primary.length,
            primaryHref: primary[0]?.getAttribute("href"),
            firstFocusable: focusable?.getAttribute("href"),
            buttonBottom: primary[0]
              ? Math.round(primary[0].getBoundingClientRect().bottom + scrollY)
              : -1,
            headlineToButton: primary[0]
              ? Math.round(
                  primary[0].getBoundingClientRect().bottom -
                    top(hero.querySelector("h1")),
                )
              : -1,
            choices: document.querySelectorAll("main input").length,
            situations: [...document.querySelectorAll(".situations a")].map(
              (a) => a.getAttribute("href"),
            ),
            direct: [...document.querySelectorAll(".what a")].map((a) =>
              a.getAttribute("href"),
            ),
            screen: innerHeight,
          };
        });
        record(
          where,
          "home states the question and one takeaway, as settled",
          home.h1 === "Who’s acting, and what are they allowed to do?" &&
            home.idea ===
              "The records service has to enforce Dana’s limit, even when the agent asks for more. To do that, it needs a trustworthy way to know who the agent is acting for.",
          `${home.h1} / ${home.idea}`,
        );
        record(
          where,
          "home shows the request as one row: person, agent, records service",
          home.names.join(" > ") === "Dana > Support agent > Records service" &&
            home.oneRow,
          `${home.names.join(" > ")}${home.oneRow ? "" : ", not on one row"}`,
        );
        record(
          where,
          "home has one primary button, first in the tab order, leading into the first example",
          home.primary === 1 &&
            home.primaryHref === EXAMPLE &&
            home.firstFocusable === EXAMPLE &&
            home.choices === 0,
          `${home.primary} primary, to ${home.primaryHref}; first focusable ${home.firstFocusable}; ${home.choices} inputs`,
        );
        record(
          where,
          vp.name === "desktop"
            ? "home: the button is on the first screen"
            : "home: headline to button fits one screen",
          vp.name === "desktop"
            ? home.buttonBottom <= home.screen
            : home.headlineToButton <= home.screen,
          `button ends ${home.buttonBottom}px down, headline to button ${home.headlineToButton}px, screen ${home.screen}px`,
        );
        record(
          where,
          "home: situation links point at the part that answers them, and direct routes remain",
          home.situations.join(" ") ===
            "/examples/invoice-agent/ /examples/invoice-agent/#key-only-supplier /examples/invoice-agent/#payment-approval" &&
            [
              "/guide/",
              "/flows/",
              "/concepts/",
              "/deployments/",
              "/standards/",
              "/glossary/",
            ].every((h) => home.direct.includes(h)),
          `${home.situations.join(" ")} | ${home.direct.join(" ")}`,
        );
      }

      if (pg.name === "worked example") {
        // with the script running, the page shows the starting design, no variation, and one build path
        const ex = await page.evaluate(() => {
          const shown = (sel) =>
            [...document.querySelectorAll(sel)].filter((el) => el.offsetParent)
              .length;
          const svg = document.querySelector(".xd-canvas svg");
          const scale =
            svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
          return {
            variations: shown(".we-variation"),
            builds: shown(".bp"),
            controls: shown(".we-controls"),
            canvas: shown(".xd-canvas"),
            steps: shown(".xd-steps"),
            smallestLabel: svg.getBoundingClientRect().width
              ? Math.min(
                  ...[...svg.querySelectorAll("text")].map(
                    (t) => parseFloat(getComputedStyle(t).fontSize) * scale,
                  ),
                )
              : null,
            facts: document
              .querySelector(".page-head .doc-line")
              .textContent.replace(/\s+/g, " "),
          };
        });
        record(
          where,
          "example opens on the starting design: no variation, one build path",
          ex.variations === 0 && ex.builds === 1 && ex.controls === 1,
          `${ex.variations} variations, ${ex.builds} build panels shown`,
        );
        record(
          where,
          vp.name === "phone"
            ? "example on a phone: numbered steps stand in for the diagram"
            : `example diagram labels at least ${MIN_LABEL}px`,
          vp.name === "phone"
            ? ex.canvas === 0 && ex.steps >= 1
            : ex.smallestLabel >= MIN_LABEL,
          vp.name === "phone"
            ? `${ex.canvas} diagrams, ${ex.steps} step lists shown`
            : `smallest ${ex.smallestLabel?.toFixed(1)}px`,
        );
        record(
          where,
          "example says when its sources were read, and does not call itself reviewed or tested",
          /Sources read\s*\w+ \d{4}/i.test(ex.facts) &&
            /not a tested recipe/.test(ex.facts) &&
            !/reviewed/i.test(ex.facts),
          ex.facts.trim(),
        );
      }

      if (pg.name === "flow" || pg.name === "standards") {
        const facts = await page.evaluate(() => {
          const line = document.querySelector(".page-head .doc-line");
          const more = document.querySelector(".page-head .doc-details");
          return line
            ? {
                text: line.textContent.replace(/\s+/g, " "),
                links: [...line.querySelectorAll("a")].map((a) =>
                  a.getAttribute("href"),
                ),
                closed: more ? !more.open : null,
              }
            : null;
        });
        record(
          where,
          "review date is on the page\u2019s first line of facts",
          !!facts && /reviewed\s*\w+ \d{4}/i.test(facts.text),
          facts ? facts.text.trim() : "no page facts",
        );
        record(
          where,
          "supporting details start closed and open on request",
          !!facts &&
            facts.closed === true &&
            (await page.evaluate(() => {
              const d = document.querySelector(".page-head .doc-details");
              d.querySelector("summary").click();
              return d.open && d.querySelector("dl").offsetParent !== null;
            })),
        );
        if (pg.name === "flow")
          record(
            where,
            "specification is named and linked beside the review date",
            !!facts &&
              facts.links.some((h) => h.startsWith("/standards/#")) &&
              /based on/i.test(facts.text),
            facts?.links.join(" ") ?? "",
          );
        if (pg.name === "standards") {
          const lookup = await page.evaluate(() => ({
            search:
              document.querySelector(".sx-search input").getBoundingClientRect()
                .top + scrollY,
            first:
              document.querySelector(".sx-item").getBoundingClientRect().top +
              scrollY,
            moved:
              document.querySelector("#moved").getBoundingClientRect().top +
              scrollY,
          }));
          record(
            where,
            "search and the first entry are within the first two screens",
            lookup.first < vp.height * 2 && lookup.search < vp.height * 1.5,
            `search at ${Math.round(lookup.search)}px, first entry at ${Math.round(lookup.first)}px`,
          );
          record(
            where,
            "history sits after the lookup",
            lookup.moved > lookup.first,
          );
        }
      }

      if (pg.name === "flow") {
        const count = await page.evaluate(() =>
          Number(document.querySelector(".flow").dataset.count),
        );
        if (vp.name === "desktop") {
          // the stepper: measure the diagram at its first, a middle and its last step
          for (const step of [1, Math.ceil(count / 2), count]) {
            await page.evaluate((n) => {
              location.hash = `#step-${n}`;
            }, step);
            await page.waitForTimeout(80);
            const labels = await page.evaluate(diagramLabels);
            const worst = labels.reduce((a, b) => (b.ratio < a.ratio ? b : a));
            record(
              where,
              `diagram at step ${step}: every label at least ${AA}:1 as drawn`,
              worst.ratio >= AA,
              `lowest ${worst.ratio.toFixed(2)} (“${worst.text}”, ${worst.state})`,
            );
            const tiny = labels.reduce((a, b) => (b.px < a.px ? b : a));
            record(
              where,
              `diagram at step ${step}: labels drawn at ${MIN_LABEL}px or more`,
              tiny.px >= MIN_LABEL - 0.05,
              `smallest ${tiny.px.toFixed(1)}px (“${tiny.text}”)`,
            );
            const held = await page.evaluate(() => {
              const li = [...document.querySelectorAll(".flow-step")].find(
                (s) => !s.hidden,
              );
              return {
                shown: document.querySelectorAll(".flow-step:not([hidden])")
                  .length,
                route: li
                  ?.querySelector(".step-route")
                  ?.textContent.replace(/\s+/g, " ")
                  .trim(),
              };
            });
            record(
              where,
              `step ${step}: one step shown, with who is talking to whom`,
              held.shown === 1 && !!held.route,
              held.route ?? "",
            );
          }
          // keyboard: Left and Right step, Down is left to scrolling, and focus is never stranded
          // (the loop above ends on the last step, where Next is disabled and Previous is not)
          await page.focus('[data-act="prev"]');
          await page.keyboard.press("ArrowLeft");
          const afterLeft = await page.evaluate(
            () => document.querySelector(".flow-count").textContent,
          );
          await page.keyboard.press("ArrowDown");
          const afterDown = await page.evaluate(
            () => document.querySelector(".flow-count").textContent,
          );
          record(
            where,
            "arrow keys: Left steps back, Down does not change the step",
            afterLeft.includes(`${count - 1} of`) && afterDown === afterLeft,
            `${afterLeft} | ${afterDown}`,
          );
          await page.click('[data-act="next"]');
          const handed = await page.evaluate(() => ({
            disabled: document.querySelector('[data-act="next"]').disabled,
            onPrev:
              document.activeElement ===
              document.querySelector('[data-act="prev"]'),
          }));
          record(
            where,
            "last step: focus moves from the disabled Next to Previous",
            handed.disabled && handed.onPrev,
            JSON.stringify(handed),
          );
          const holders = await page.evaluate(
            () => document.querySelectorAll(".flow-step .held dt").length,
          );
          record(
            where,
            "steps say who holds which credential",
            holders > 0,
            `${holders} holder entries`,
          );
        } else {
          // the phone: a narrative of every step, with the diagram on demand at full size
          const state = await page.evaluate(() => ({
            shown: document.querySelectorAll(".flow-step:not([hidden])").length,
            open: document.querySelector(".flow-stage").open,
            summary: !!document.querySelector(".flow-stage > summary")
              ?.offsetParent,
          }));
          record(
            where,
            "every step is readable as a narrative",
            state.shown === count,
            `${state.shown} of ${count}`,
          );
          record(
            where,
            "diagram is offered on demand, not forced",
            !state.open && state.summary,
          );
          await page.click(".flow-stage > summary");
          await page.waitForTimeout(80);
          const labels = await page.evaluate(diagramLabels);
          const tiny = Math.min(...labels.map((l) => l.px));
          record(
            where,
            `opened diagram keeps labels at ${MIN_LABEL}px or more`,
            tiny >= MIN_LABEL - 0.05,
            `smallest ${tiny.toFixed(1)}px`,
          );
          const worst = labels.reduce((a, b) => (b.ratio < a.ratio ? b : a));
          record(
            where,
            `opened diagram: every label at least ${AA}:1 as drawn`,
            worst.ratio >= AA,
            `lowest ${worst.ratio.toFixed(2)} (“${worst.text}”)`,
          );
          const still = await page.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
          );
          record(
            where,
            "opened diagram scrolls inside its own frame",
            still <= 0,
            still > 0 ? `${still}px` : "",
          );
          await page.click(".flow-back button");
          await page.waitForTimeout(80);
          const left = await page.evaluate(() => {
            const s = document.querySelector(".flow-stage > summary");
            const r = s.getBoundingClientRect();
            return {
              open: document.querySelector(".flow-stage").open,
              focus: document.activeElement === s,
              inView: r.top >= 0 && r.bottom <= innerHeight,
            };
          });
          record(
            where,
            "leaving the diagram closes it and lands on its control, in view",
            !left.open && left.focus && left.inView,
            JSON.stringify(left),
          );
        }
      }
      await page.close();
    }
    await ctx.close();
  }
}
// the narrowest window: nothing scrolls sideways, on the pages above or on any flow
const ctx = await browser.newContext({
  viewport: NARROW,
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
});
const page = await ctx.newPage();
for (const path of NARROW_PAGES) {
  await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const over = await page.evaluate(sideways);
  record(
    `${NARROW.width}px ${path}`,
    `no sideways overflow at ${NARROW.width}px`,
    over.by <= 0,
    over.by > 0 ? `${over.by}px: ${over.what}` : "",
  );
}
await ctx.close();
// color theme: the page follows the system setting, live, and a theme picked
// with the header button lasts only until the system setting next changes
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: "light",
  });
  const page = await ctx.newPage();
  await page.goto(`${origin}/`, { waitUntil: "networkidle" });
  const settle = () =>
    page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
  const read = async () => {
    await settle();
    return page.evaluate(() => {
      const [r, g, b] = getComputedStyle(document.body)
        .backgroundColor.match(/[\d.]+/g)
        .map(Number);
      return {
        dark: r + g + b < 384,
        picked: document.documentElement.dataset.theme ?? null,
        stored: localStorage.getItem("theme"),
      };
    });
  };
  const steps = [];
  const step = async (name, want) => {
    const got = await read();
    const ok =
      got.dark === want.dark &&
      got.picked === want.picked &&
      got.stored === want.picked;
    steps.push(ok ? null : `${name}: ${JSON.stringify(got)}`);
  };
  await step("light system", { dark: false, picked: null });
  await page.emulateMedia({ colorScheme: "dark" });
  await step("system changes to dark", { dark: true, picked: null });
  await page.emulateMedia({ colorScheme: "light" });
  await page.click("button.theme");
  await step("button on a light system", { dark: true, picked: "dark" });
  await page.reload({ waitUntil: "networkidle" });
  await step("reload keeps the choice", { dark: true, picked: "dark" });
  await page.emulateMedia({ colorScheme: "dark" });
  await step("system changes to dark: choice dropped", {
    dark: true,
    picked: null,
  });
  await page.emulateMedia({ colorScheme: "light" });
  await step("system changes to light: page follows", {
    dark: false,
    picked: null,
  });
  const wrong = steps.filter(Boolean);
  record(
    "theme",
    "theme follows the system setting, and a picked theme ends when it changes",
    wrong.length === 0,
    wrong.join("; "),
  );
  await ctx.close();
}
// decision guide: after "Start over", an answer chosen before can be chosen again at once
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  const again = [];
  for (const url of ["/guide/", "/guide/?principal=user"]) {
    await page.goto(`${origin}${url}`, { waitUntil: "networkidle" });
    const answer = page.locator(
      'decision-guide input[name="principal"][value="user"]',
    );
    if (!(await answer.isChecked())) await answer.check({ force: true });
    await page.click('decision-guide .btn[type="reset"]');
    await answer.click({ force: true });
    await page.waitForTimeout(50);
    again.push(await answer.isChecked());
  }
  record(
    "decision guide",
    "an answer can be chosen again straight after Start over",
    again.every(Boolean),
    again.every(Boolean) ? "" : `selected after one click: ${again.join(", ")}`,
  );
  await ctx.close();
}
// worked examples: what the reader selects is what is shown, a link to a variation lands on
// it, a valid build path is always selected, and the way back from a flow page works
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  const state = () =>
    page.evaluate(() => {
      const shown = (sel) =>
        [...document.querySelectorAll(sel)].filter((el) => el.offsetParent);
      const text = (el) => el.textContent.replace(/\s+/g, " ").trim();
      const active = document.activeElement;
      return {
        variations: shown(".we-variation").map((v) => v.id),
        builds: shown(".bp-status").map(text),
        paths: shown(".we-path").map((b) => b.dataset.path),
        pressed: shown('.we-path[aria-pressed="true"]').map(
          (b) => b.dataset.path,
        ),
        chips: shown(".ev").map(text),
        gaps: shown(".ho .gap").map(text),
        moved: shown("[data-moved]").map(text).join(""),
        focus:
          active?.closest(".we-variation")?.id ?? active?.id ?? active?.tagName,
        focusTop: active
          ? Math.round(active.getBoundingClientRect().top)
          : null,
        search: location.search,
        live: text(
          document.querySelector("[data-live]") ?? document.body,
        ).slice(0, 200),
      };
    });
  const eg = (check, ok, detail = "") =>
    record("worked example", check, ok, detail);

  await page.goto(`${origin}${EXAMPLE}`, { waitUntil: "networkidle" });
  await page.focus("#v-base");
  await page.keyboard.press("ArrowDown");
  let st = await state();
  eg(
    "arrow keys choose a variation: it appears, with its own build rows and the Salesforce path",
    st.variations.join() === "separate-apps" &&
      st.builds.length === 1 &&
      /separate applications, on Okta/.test(st.builds[0]) &&
      st.paths.join() === "okta,auth0,entra,salesforce" &&
      st.search === "?variation=separate-apps",
    JSON.stringify(st),
  );
  await page.click('.we-path[data-path="salesforce"]');
  await page.focus("#v-separate");
  await page.keyboard.press("ArrowDown");
  st = await state();
  eg(
    "leaving the exchange variation with Salesforce selected leaves a valid, visible selection and says so",
    st.variations.join() === "unattended" &&
      st.paths.join() === "okta,auth0,entra" &&
      st.pressed.join() === "okta" &&
      /written up for the exchange variation only, so Okta is selected instead/.test(
        st.moved,
      ) &&
      /Okta is selected instead/.test(st.live),
    JSON.stringify(st),
  );
  eg(
    "the unattended variation's label names what is documented, what is composed and what is still to design",
    st.chips.join(" + ") ===
      "Capability documented: refresh tokens + Composed here + To design and verify: the trusted backend" &&
      st.gaps.length === 2 &&
      st.gaps.every((g) => g === "Yours to design and verify"),
    `${st.chips.join(" + ")} | ${st.gaps.join(" / ")}`,
  );
  const boundary = await page.evaluate(() => {
    const steps = [
      ...document.querySelectorAll("#unattended .xd-steps li"),
    ].map((li) => ({
      who: [...li.querySelectorAll(".xd-who")].map((w) => w.textContent),
      text: li.textContent.replace(/\s+/g, " "),
    }));
    return {
      toWorker: steps
        .filter((x) => x.who[1] === "Agent worker")
        .map((x) => x.text),
      fromWorker: steps
        .filter((x) => x.who[0] === "Agent worker")
        .map((x) => x.text),
      tokens: steps.filter(
        (x) =>
          x.who[0] === "Identity provider" && x.who[1] === "Trusted backend",
      ).length,
    };
  });
  eg(
    "unattended steps: the trusted backend gets the tokens, and the worker is only ever given an access token",
    boundary.tokens === 1 &&
      boundary.toWorker.length === 1 &&
      /never the refresh token/.test(boundary.toWorker[0]) &&
      boundary.fromWorker.every((t) => !/refresh token/.test(t)),
    JSON.stringify(boundary),
  );

  // a link that names a variation lands on it, with the build path it names
  await page.goto(`${origin}${EXAMPLE}?path=auth0#separate-apps`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(100);
  st = await state();
  eg(
    "a link to a variation selects it, lands on its heading and puts focus there",
    st.variations.join() === "separate-apps" &&
      st.pressed.join() === "auth0" &&
      st.focus === "separate-apps" &&
      st.focusTop >= 0 &&
      st.focusTop < 200,
    JSON.stringify(st),
  );

  // from the variation to a flow page, and back to where the reader left
  await page.click('#separate-apps .xd-steps a[href="/flows/token-exchange/"]');
  await page.waitForLoadState("networkidle");
  const trail = await page.evaluate(() => {
    const bar = document.querySelector("[data-trail]");
    return {
      shown: !!bar?.offsetParent,
      text: bar?.textContent.replace(/\s+/g, " ").trim(),
      href: bar?.querySelector("a")?.getAttribute("href"),
    };
  });
  eg(
    "a flow page reached from an example offers the way back to where the reader left",
    trail.shown &&
      /You were following A support agent, for the rep who asked/.test(
        trail.text,
      ) &&
      trail.href === "/examples/support-agent/?path=auth0#separate-apps",
    JSON.stringify(trail),
  );
  await page.click("[data-trail] a");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(100);
  st = await state();
  eg(
    "returning keeps the variation and build path, and arrives at the variation",
    st.variations.join() === "separate-apps" &&
      st.pressed.join() === "auth0" &&
      st.focus === "separate-apps" &&
      st.focusTop >= 0 &&
      st.focusTop < 200,
    JSON.stringify(st),
  );
  await page.goto(`${origin}/flows/token-exchange/`, {
    waitUntil: "networkidle",
  });
  eg(
    "a flow page opened any other way shows no way back, and lists the examples that use it",
    await page.evaluate(
      () =>
        !document.querySelector("[data-trail]").offsetParent &&
        [...document.querySelectorAll(".worked-examples a")].some(
          (a) =>
            a.getAttribute("href") === "/examples/support-agent/#separate-apps",
        ),
    ),
  );

  // the home page's situation links answer their question directly
  for (const [label, anchor, token] of [
    ["A service will only give you an API key", "key-only-supplier", "add-key"],
    [
      "A payment needs someone’s approval first",
      "payment-approval",
      "add-approval",
    ],
  ]) {
    await page.goto(`${origin}/`, { waitUntil: "networkidle" });
    await page.click(`.situations a:has-text("${label}")`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(100);
    st = await state();
    const there = await page.evaluate(
      ([id, input]) => {
        const v = document.getElementById(id);
        return {
          checked: document.getElementById(input).checked,
          context:
            v.querySelector(".we-context")?.textContent.replace(/\s+/g, " ") ??
            "",
          baseline:
            v.querySelector('.we-context a[href="#design"]')?.textContent ?? "",
          designTop: Math.round(
            v.querySelector(".xd").getBoundingClientRect().top,
          ),
          path: document.querySelectorAll('.we-path[aria-pressed="true"]')
            .length,
        };
      },
      [anchor, token],
    );
    eg(
      `home link “${label}” selects its variation, lands on its heading, and offers the starting design`,
      there.checked &&
        st.variations.join() === anchor &&
        st.focus === anchor &&
        st.focusTop >= 0 &&
        st.focusTop < 200 &&
        /An agent that reconciles invoices overnight/.test(there.context) &&
        there.baseline === "Read the starting design" &&
        there.designTop < 900 &&
        there.path === 1,
      JSON.stringify({ ...there, focus: st.focus, top: st.focusTop }),
    );
  }

  // the second example: a combination nobody wrote up says so, and builds nothing
  await page.goto(`${origin}/examples/invoice-agent/`, {
    waitUntil: "networkidle",
  });
  await page.check("#access-accountant");
  st = await state();
  eg(
    "accountant's access: an authored design whose trusted backend is still to design and verify",
    st.variations.join() === "accountants-access" &&
      st.chips.join(" + ") ===
        "Composed here + To design and verify: the trusted backend" &&
      st.gaps.length === 2 &&
      st.paths.length === 0,
    JSON.stringify(st),
  );
  await page.check("#add-approval");
  st = await state();
  eg(
    "a combination that was not written up says so, and offers nothing to build",
    st.variations.length === 0 &&
      st.builds.length === 0 &&
      (await page.evaluate(
        () =>
          !!document.querySelector(".we-notice").offsetParent &&
          /has not been written up/.test(
            document.querySelector(".we-notice").textContent,
          ),
      )),
    JSON.stringify(st),
  );
  await ctx.close();

  // without the script the whole example is on the page, in order, and a link to a variation still lands on it
  const plain = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    javaScriptEnabled: false,
    reducedMotion: "reduce",
  });
  const bare = await plain.newPage();
  await bare.goto(`${origin}${EXAMPLE}#unattended`, { waitUntil: "load" });
  const all = await bare.evaluate(() => {
    const shown = (sel) =>
      [...document.querySelectorAll(sel)].filter((el) => el.offsetParent)
        .length;
    return {
      variations: shown(".we-variation"),
      builds: shown(".bp"),
      controls: shown(".we-controls") + shown(".we-picker"),
      top: Math.round(
        document.getElementById("unattended").getBoundingClientRect().top,
      ),
    };
  });
  eg(
    "without JavaScript every variation and build path is shown, controls are not, and a variation link still lands",
    all.variations === 2 &&
      all.builds === 10 &&
      all.controls === 0 &&
      all.top >= 0 &&
      all.top < 200,
    JSON.stringify(all),
  );
  await plain.close();
}
// decision guide: "I’m not sure" explains how to find out and rules nothing in or out, a
// recommendation says what it rests on, and only an example's own link fills the guide in
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  const dg = (check, ok, detail = "") =>
    record("decision guide", check, ok, detail);
  const out = () =>
    page.evaluate(() => {
      const text = (el) => el?.textContent.replace(/\s+/g, " ").trim() ?? "";
      const group = (cls) =>
        [...document.querySelectorAll(`.dg-out .${cls} .dg-flow strong`)].map(
          text,
        );
      const shown = (sel) =>
        [...document.querySelectorAll(sel)].filter((el) => el.offsetParent);
      return {
        status: text(document.querySelector(".dg-status")),
        start: group("dg-start"),
        add: group("dg-add"),
        consider: group("dg-consider"),
        rests: text(document.querySelector(".dg-out .dg-if")),
        worked: [...document.querySelectorAll(".dg-out .dg-worked a")].map(
          (a) => a.getAttribute("href"),
        ),
        pending: text(document.querySelector(".dg-out .dg-pending")),
        hints: shown(".dg-unsure").map(text),
        banner: text(shown(".dg-from")[0]),
        because: shown(".dg-because").length,
        checked: document.querySelectorAll("decision-guide input:checked")
          .length,
        search: location.search,
      };
    });
  await page.goto(`${origin}/guide/`, { waitUntil: "networkidle" });
  let g = await out();
  dg(
    "opened from the navigation it is blank, with no example attached",
    g.checked === 0 && g.banner === "" && g.because === 0,
    JSON.stringify(g),
  );
  await page.check('decision-guide input[name="principal"][value="unsure"]', {
    force: true,
  });
  await page.check('decision-guide input[name="accept"][value="unsure"]', {
    force: true,
  });
  g = await out();
  dg(
    "“I’m not sure” says how to find out, counts as no answer, and lists both cases until you know",
    g.hints.length === 2 &&
      /whose name should the log show/.test(g.hints[0]) &&
      /If it only takes an API key/.test(g.pending) &&
      /If it only accepts its own sign-in/.test(g.pending) &&
      g.start.length === 0 &&
      /principal=unsure/.test(g.search),
    JSON.stringify(g),
  );
  await page.check('decision-guide input[name="principal"][value="user"]', {
    force: true,
  });
  await page.check('decision-guide input[name="accept"][value="key"]', {
    force: true,
  });
  g = await out();
  dg(
    "the accepted-credential question changes the outcome, and each recommendation says what it rests on",
    g.add.includes("Credential broker") &&
      /^You said Authority: A specific person’s/.test(g.rests) &&
      g.worked.includes("/examples/support-agent/#design") &&
      /^2 of 7 answered/.test(g.status),
    JSON.stringify(g),
  );
  await page.goto(
    `${origin}/guide/?principal=user&human=present&target=api&boundary=same&accept=tokens&runtime=k8s&risk=read&from=support-agent`,
    { waitUntil: "networkidle" },
  );
  g = await out();
  dg(
    "an example's own link fills the guide in, says which example, and gives the reason for each answer",
    /Filled in from A support agent, for the rep who asked/.test(g.banner) &&
      g.checked === 7 &&
      g.because === 7,
    JSON.stringify(g),
  );
  dg(
    "for that example the guide starts with sign-in, and offers token exchange as worth a look, not a step to add",
    g.start.includes("Authorization code + PKCE") &&
      !g.add.includes("Token exchange") &&
      g.consider.includes("Token exchange") &&
      g.worked.includes("/examples/support-agent/#separate-apps"),
    JSON.stringify(g),
  );
  await page.click(".dg-from-clear");
  await page.waitForTimeout(50);
  g = await out();
  dg(
    "“Start with a blank guide” clears the answers and the example",
    g.checked === 0 && g.banner === "" && g.search === "",
    JSON.stringify(g),
  );
  await ctx.close();
}
// comparison on a flow page: a table where there is room, blocks of labeled fields where there
// is not. One of the two is shown, and only that one reaches assistive technology.
{
  const url = "/flows/workload-identity-federation/";
  for (const [width, shown, hidden] of [
    [320, ".compare-narrow", ".compare-wide"],
    [375, ".compare-narrow", ".compare-wide"],
    [1280, ".compare-wide", ".compare-narrow"],
  ]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(`${origin}${url}`, { waitUntil: "networkidle" });
    const seen = await page.evaluate(
      ([shown, hidden]) => {
        const box = (sel) => {
          const el = document.querySelector(sel);
          return {
            display: getComputedStyle(el).display,
            sideways: el.scrollWidth - el.clientWidth,
          };
        };
        const blocks = [...document.querySelectorAll(".compare-narrow .env")];
        return {
          shown: box(shown),
          hidden: box(hidden),
          rows: document.querySelectorAll(".compare tbody tr").length,
          blocks: blocks.length,
          // every value in a block sits under a label of its own
          unlabeled: blocks.filter((b) =>
            [...b.querySelectorAll("dl > div")].some(
              (d) =>
                d.querySelectorAll("dt").length !== 1 ||
                d.querySelectorAll("dd").length !== 1 ||
                !d.querySelector("dt").textContent.trim(),
            ),
          ).length,
        };
      },
      [shown, hidden],
    );
    const tree = await page
      .locator('section[aria-labelledby="comparison"]')
      .ariaSnapshot();
    const tables = tree.split("- table").length - 1;
    const terms = tree.split("- term").length - 1;
    const narrow = shown === ".compare-narrow";
    const problems = [
      seen.shown.display === "none" && `${shown} is not shown`,
      seen.hidden.display !== "none" && `${hidden} is also shown`,
      seen.shown.sideways > 1 &&
        `${shown} scrolls sideways by ${seen.shown.sideways}px`,
      seen.rows !== seen.blocks &&
        `${seen.rows} table rows but ${seen.blocks} blocks`,
      seen.unlabeled > 0 &&
        `${seen.unlabeled} blocks have a value without one label`,
      narrow && tables > 0 && "the hidden table is exposed",
      narrow && terms === 0 && "the blocks expose no labels",
      !narrow && terms > 0 && "the hidden blocks are exposed",
      !narrow && tables !== 1 && `${tables} tables exposed`,
    ].filter(Boolean);
    record(
      `${width}px ${url}`,
      "comparison: one presentation shown and exposed, each value under its label",
      problems.length === 0,
      problems.join("; "),
    );
    await ctx.close();
  }
}
await browser.close();
server.close();

/* ---------- report ---------- */
const failed = results.filter((r) => !r.ok);
const byCheck = new Map();
for (const r of results) {
  const key = r.check.replace(/step \d+/g, "step N");
  const row = byCheck.get(key) ?? { pass: 0, fail: 0 };
  row[r.ok ? "pass" : "fail"]++;
  byCheck.set(key, row);
}
if (verbose)
  for (const r of results)
    console.log(
      `${r.ok ? "✓" : "✗"} ${r.where.padEnd(44)} ${r.check}${r.detail ? `  — ${r.detail}` : ""}`,
    );
else
  for (const r of failed)
    console.log(
      `✗ ${r.where.padEnd(44)} ${r.check}${r.detail ? `  — ${r.detail}` : ""}`,
    );
console.log(
  `\n${PAGES.length} pages × ${VIEWPORTS.length} viewports × ${THEMES.length} themes, and ${NARROW_PAGES.length} pages at ${NARROW.width}px`,
);
for (const [check, { pass, fail }] of byCheck)
  console.log(
    `  ${fail ? "✗" : "✓"} ${String(pass).padStart(3)}/${String(pass + fail).padEnd(3)} ${check}`,
  );
console.log(`\n${results.length} rendered checks, ${failed.length} failed.`);
process.exit(failed.length ? 1 : 0);
