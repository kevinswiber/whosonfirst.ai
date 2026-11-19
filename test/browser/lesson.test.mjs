// A lesson, in each theme, on a desktop and on a phone: its figure, its
// questions, and the shape every lesson shares.
import { assert, describe, test } from "ubqtest";
import {
  device,
  open,
  THEMES,
  useBrowser,
  VIEWPORTS,
} from "../support/browser.mjs";
import { pathClean } from "../support/measure.mjs";
import { LESSON, LESSON_ORDER } from "../support/site.mjs";

const site = useBrowser();

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    describe(`${theme} ${vp.name} lesson`, () => {
      let page;
      let ready;
      // Each test starts from the page as it arrives, and does its own steps.
      let measured;
      let answered;
      let shaped;
      const setup = async () => {
        ready ??= (async () => {
          const ctx = await site.context(
            device(vp, { colorScheme: theme, reducedMotion: "reduce" }),
          );
          page = await ctx.newPage();
        })();
        await ready;
        measured = answered = shaped = undefined;
        await open(page, site.url(LESSON));
      };

      // the figure: a complete first state, every variation in the table beneath,
      // and a choice that changes what is shown
      const fig = () =>
        (measured ??= page.evaluate(() => {
          const sc = document.querySelector(".lesson .sc");
          const shown = () =>
            [...sc.querySelectorAll(".sc-panel")]
              .filter((p) => p.offsetParent)
              .map((p) => p.dataset.option);
          const options = [...sc.querySelectorAll(".sc-choices input")].map(
            (i) => i.value,
          );
          return {
            options,
            first: shown(),
            findings: [...sc.querySelectorAll(".sc-panel")]
              .find((p) => p.offsetParent)
              .querySelectorAll(".sc-findings tbody tr").length,
            glanceRows: sc.querySelectorAll(".sc-glance tbody tr").length,
            glanceMarks: sc.querySelectorAll(".sc-glance .sc-mark").length,
            questions: sc.querySelectorAll(".sc-glance thead th").length - 1,
          };
        }));
      test("figure shows one complete variation before anything is chosen", async () => {
        await setup();
        const f = await fig();
        assert.equal(f.first.length, 1);
        assert.greaterThan(f.findings, 0);
      });
      test("every variation is in the table beneath, so nothing depends on clicking", async () => {
        await setup();
        const f = await fig();
        assert.equal(f.glanceRows, f.options.length);
        assert.equal(f.glanceMarks, f.options.length * f.questions);
      });
      const chooseLast = async () => {
        const last = (await fig()).options.at(-1);
        await page.check(`.lesson .sc input[value="${last}"]`, { force: true });
        return last;
      };
      test("choosing a variation shows it, and only it", async () => {
        await setup();
        const last = await chooseLast();
        const after = await page.evaluate(() =>
          [...document.querySelectorAll(".lesson .sc-panel")]
            .filter((p) => p.offsetParent)
            .map((p) => p.dataset.option),
        );
        assert.deepEqual(after, [last]);
      });
      test("figure path: no label overlaps a box or another label, or leaves the figure", async () => {
        await setup();
        await chooseLast();
        const clean = await page.evaluate(pathClean, ".lesson .sc");
        assert.equal(clean, 0);
      });

      // check yourself: nothing is given away until an answer is chosen, and the
      // explanation that then appears is the chosen answer's own
      const quiz = () =>
        (answered ??= page.evaluate(() => {
          const q = document.querySelector(".ck.closing fieldset");
          const open = () =>
            [...q.querySelectorAll(".ck-why")].filter((w) => w.offsetParent)
              .length;
          const before = open();
          const wrong = q.querySelector("li.is-wrong input");
          wrong.click();
          const afterWrong = [...q.querySelectorAll("li")]
            .filter((li) => li.querySelector(".ck-why").offsetParent)
            .map((li) => li.className);
          q.querySelector("li.is-right input").click();
          const afterRight = [...q.querySelectorAll("li")]
            .filter((li) => li.querySelector(".ck-why").offsetParent)
            .map((li) => li.className);
          return {
            before,
            afterWrong,
            afterRight,
            questions: document.querySelectorAll(".ck.closing fieldset").length,
            right: document.querySelectorAll(".ck.closing li.is-right").length,
          };
        }));
      test("check yourself: no explanation shows until an answer is chosen", async () => {
        await setup();
        const q = await quiz();
        assert.equal(q.before, 0);
      });
      test("check yourself: the chosen answer, and only it, is explained", async () => {
        await setup();
        const q = await quiz();
        assert.deepEqual(
          { afterWrong: q.afterWrong, afterRight: q.afterRight },
          { afterWrong: ["is-wrong"], afterRight: ["is-right"] },
        );
      });
      test("check yourself: each question has exactly one right answer", async () => {
        await setup();
        const q = await quiz();
        assert.greaterThan(q.questions, 0);
        assert.equal(q.right, q.questions);
      });

      // the shape every lesson shares
      const shape = () =>
        (shaped ??= page.evaluate(() => {
          const top = (sel) => {
            const el = document.querySelector(sel);
            return el ? el.getBoundingClientRect().top + scrollY : null;
          };
          return {
            order: [
              top(".lesson .sc"),
              top("#check-yourself"),
              top("#keep"),
              top("#names"),
              top("#deeper"),
              top(".pager"),
            ],
            here: document
              .querySelector(".path a[aria-current='page']")
              ?.getAttribute("href"),
            steps: document.querySelectorAll(".path a").length,
            next: document.querySelector(".pager .next")?.getAttribute("href"),
          };
        }));
      test("lesson runs in its order: figure, questions, what to keep, names, go deeper, next", async () => {
        await setup();
        const { order } = await shape();
        // where each part starts, or "missing"
        const tops = order.map((y) => (y === null ? "missing" : y));
        assert(
          order.every((y) => y !== null) &&
            order.every((y, i) => i === 0 || y > order[i - 1]),
          tops.join(" "),
        );
      });
      test("lesson says where it sits among the others, and what comes next", async () => {
        await setup();
        const s = await shape();
        assert.deepEqual(
          { here: s.here, steps: s.steps, next: s.next },
          {
            here: LESSON,
            steps: LESSON_ORDER.length,
            next: LESSON_ORDER[LESSON_ORDER.indexOf(LESSON) + 1],
          },
        );
      });
    });
  }
}
