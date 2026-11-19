// Back on a flow page. On a phone, opening the diagram adds one entry and Back
// closes it, at the step the reader reached; closing it with its own control
// leaves no entry behind. At a desk, stepping adds none and Back leaves the page.
import { assert, cleanup, describe, test } from "ubqtest";
import { open, useBrowser } from "../support/browser.mjs";
import { FLOW } from "../support/site.mjs";

const site = useBrowser();
const PHONE = { width: 390, height: 844 };
const WIDE = { width: 1280, height: 900 };

describe("phone flow", () => {
  let page;
  let ready;
  const setup = () =>
    (ready ??= (async () => {
      const ctx = await site.context({
        viewport: PHONE,
        isMobile: true,
        hasTouch: true,
        reducedMotion: "reduce",
      });
      page = await ctx.newPage();
    })());

  const settle = () => page.waitForTimeout(150);
  const now = () =>
    page.evaluate(() => {
      // after a Back that left the page, there is no diagram to ask about
      const s = document.querySelector(".flow-stage > summary");
      if (!s) return { path: location.pathname, hash: location.hash };
      const r = s.getBoundingClientRect();
      const step = /^#step-\d+$/.test(location.hash)
        ? document.querySelector(location.hash)?.getBoundingClientRect()
        : null;
      return {
        path: location.pathname,
        hash: location.hash,
        open: s.parentElement.open,
        onSummary: document.activeElement === s,
        summaryInView: r.top >= 0 && r.bottom <= innerHeight,
        stepInView: !!step && step.top >= 0 && step.top < innerHeight / 2,
      };
    });
  const pressStep = async (n) => {
    await page.evaluate((i) => {
      document
        .querySelector(`svg .step[data-step="${i}"] .hit`)
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }, n - 1);
    await settle();
  };
  const goTo = async (hash) => {
    await page.evaluate((h) => {
      location.hash = h;
    }, hash);
    await settle();
  };
  const back = async () => {
    await page.goBack();
    await settle();
  };
  const resize = async (size) => {
    await page.setViewportSize(size);
    await settle();
  };
  // Narrowed with the diagram open, the page closes it and then takes the
  // diagram's entry back off the history: a toggle event, then a step back
  // through the history, and neither is done when the window has its new
  // size. A Back pressed before they are would use up that entry itself and
  // leave the reader on the flow. So this waits for the entry to be gone, as
  // a reader would have: however long the page takes, and no longer.
  const narrow = async () => {
    await page.setViewportSize(PHONE);
    await page.waitForFunction(() => {
      const stage = document.querySelector(".flow-stage");
      return stage && !stage.open && !history.state?.diagram;
    });
    await settle();
  };
  // each from a fresh arrival, from the home page, with the diagram opened
  const arrive = async () => {
    await setup();
    await page.setViewportSize(PHONE);
    await open(page, site.url("/"));
    await open(page, site.url(FLOW));
    await page.click(".flow-stage > summary");
    await settle();
  };

  test("Back closes the opened diagram and stays at the step reached", async () => {
    await arrive();
    await pressStep(4);
    await back();
    const seen = await now();
    assert.match(seen, {
      path: FLOW,
      open: false,
      hash: "#step-4",
      stepInView: true,
    });
  });
  test("Forward after Back opens the diagram again", async () => {
    await arrive();
    await pressStep(4);
    await back();
    await page.goForward();
    await settle();
    const seen = await now();
    assert.match(seen, { path: FLOW, open: true });
  });
  test("a reload with the diagram open keeps it open, and Back still closes it", async () => {
    await arrive();
    await pressStep(4);
    await page.reload({ waitUntil: "load" });
    await settle();
    const reloaded = await now();
    await back();
    const after = await now();
    assert.match(
      { reloaded, after },
      {
        reloaded: { open: true },
        after: { path: FLOW, open: false, stepInView: true },
      },
    );
  });
  test("closing the diagram with its own control leaves no entry: the next Back leaves the page", async () => {
    await arrive();
    await page.click(".flow-back button");
    await settle();
    const closed = await now();
    await back();
    const left = page.url();
    assert.match(
      { closed, left },
      {
        closed: { open: false, onSummary: true, summaryInView: true },
        left: site.url("/"),
      },
    );
  });
  // opened on a phone, then widened (a phone turned on its side, a window
  // dragged wider): Back takes the entry, and the diagram, now beside the
  // panel with no control to open it, stays open
  test("widened after opening, Back leaves the diagram open beside the panel", async () => {
    await arrive();
    await resize(WIDE);
    await back();
    const widened = await now();
    assert.match(widened, { path: FLOW, open: true });
  });
  // a link to another step, followed with the diagram open, goes to that
  // step and is not taken for Back; Back then retraces both
  test("with the diagram open, a link to another step goes there, and Back retraces it", async () => {
    await arrive();
    await pressStep(4);
    await goTo("#step-6");
    const followed = await now();
    await back();
    await back();
    const retraced = await now();
    assert.match(
      { followed, retraced },
      {
        followed: { hash: "#step-6", open: true, stepInView: true },
        retraced: {
          path: FLOW,
          open: false,
          hash: "#step-4",
          stepInView: true,
        },
      },
    );
  });
  // and closed with its own control after such a link, the diagram leaves
  // nothing behind: the address keeps the step, and the next Back leaves
  test("closed with its own control after a link, the diagram leaves no entry behind", async () => {
    await arrive();
    await pressStep(4);
    await goTo("#step-6");
    await page.click(".flow-back button");
    await settle();
    const shut = await now();
    await back();
    const out = page.url();
    assert.match(
      { shut, out },
      {
        shut: { open: false, hash: "#step-6", onSummary: true },
        out: site.url("/"),
      },
    );
  });
  // widened after a link, Back, then narrowed again: closing the diagram on
  // the way back to a phone's width steps back one entry, not off the page
  test("widened after a link, Back, then narrowed: the reader is still on the flow, diagram closed", async () => {
    await arrive();
    await goTo("#step-6");
    await resize(WIDE);
    await back();
    await narrow();
    const narrowed = await now();
    assert.match(narrowed, { path: FLOW, open: false });
  });
  // widened, stepped with Next, narrowed: the entry the phone added is still
  // known for what it is, and Forward opens the diagram again
  test("widened, stepped, narrowed: Forward still opens the diagram", async () => {
    await arrive();
    await resize(WIDE);
    await page.click('[data-act="next"]');
    await settle();
    await narrow();
    await page.goForward();
    await settle();
    const stepped = await now();
    assert.match(stepped, { path: FLOW, open: true });
  });
  // widened, reloaded, narrowed: closing the diagram takes its entry, so Back leaves
  test("widened, reloaded, narrowed: the next Back leaves the page", async () => {
    await arrive();
    await page.setViewportSize(WIDE);
    await page.reload({ waitUntil: "load" });
    await settle();
    await narrow();
    await back();
    assert.equal(page.url(), site.url("/"));
  });
  // a link to a step still opens on that step, with the diagram closed
  test("a link to a step opens on that step", async () => {
    await setup();
    await open(page, site.url("/"));
    await open(page, site.url(`${FLOW}#step-6`));
    await settle();
    const linked = await now();
    assert.match(linked, {
      hash: "#step-6",
      open: (open) => !open,
      stepInView: true,
    });
  });
});

describe("desktop flow", () => {
  test("stepping adds no history: Back leaves the page", async () => {
    const ctx = await site.context({ viewport: WIDE, reducedMotion: "reduce" });
    cleanup(() => ctx.close());
    const page = await ctx.newPage();
    await open(page, site.url("/"));
    await open(page, site.url(FLOW));
    for (let i = 0; i < 3; i++) await page.click('[data-act="next"]');
    const at = await page.evaluate(() => location.hash);
    await page.goBack();
    await page.waitForTimeout(150);
    assert.deepEqual(
      { at, url: page.url() },
      { at: "#step-4", url: site.url("/") },
    );
  });
});
