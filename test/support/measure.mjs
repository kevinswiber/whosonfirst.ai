/**
 * Measurements made inside a page, passed to page.evaluate(). Each runs in the
 * browser, so it can use nothing from this file but its own body.
 */

/* ---------- thresholds ---------- */
export const AA = 4.5; // text contrast
export const MIN_LABEL = 12; // px a diagram label may be drawn at
export const MIN_PROSE = 16; // px for running text
export const MAX_MEASURE = 82; // characters per line of running text

/** Contrast of every label in the sequence diagram as drawn: fill × opacity, over what is behind it. */
export const diagramLabels = () => {
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
    const group = el.closest(".step, .actor, .phase");
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
          : cls.includes("phase-")
            ? ".phase-band"
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

/**
 * Every sequence diagram on the page: how many arrow labels it draws, how many
 * phase headings, and which labels reach into a heading. A label is its text and
 * the backing drawn behind it. One on two lines stands taller than its row, and
 * the row that opens a phase has the phase's heading directly above it.
 */
export const labelsOnHeadings = () => {
  const hit = (a, c) =>
    a.left < c.right - 0.5 &&
    c.left < a.right - 0.5 &&
    a.top < c.bottom - 0.5 &&
    c.top < a.bottom - 0.5;
  let labels = 0;
  let headings = 0;
  const on = new Set();
  for (const svg of document.querySelectorAll(".flow-lines")) {
    const bands = [...svg.querySelectorAll(".phase-band")].map((b) =>
      b.getBoundingClientRect(),
    );
    headings += bands.length;
    for (const step of svg.querySelectorAll(".step:not(.kind-self)")) {
      labels++;
      const parts = [...step.querySelectorAll(".arrow-label, .label-bg")].map(
        (e) => e.getBoundingClientRect(),
      );
      if (parts.some((r) => !r.height)) on.add("a diagram that is not shown");
      else if (parts.some((r) => bands.some((b) => hit(r, b))))
        on.add(
          `step ${Number(step.dataset.step) + 1} “${[
            ...step.querySelectorAll(".arrow-label"),
          ]
            .map((t) => t.textContent.trim())
            .join(" ")}”`,
        );
    }
  }
  return { labels, headings, on: [...on] };
};

/** Size and line length of running text. */
export const prose = () => {
  const out = [];
  for (const p of document.querySelectorAll(
    "main .prose p, main .article > p, main .lesson > p, main .step-body p, main .lede",
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
export const sideways = () => {
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

/**
 * A scenario figure's path, in the variation showing: how many of its labels overlap
 * a box or another label, or reach outside the figure.
 */
export const pathClean = (figure) => {
  const panel = [...document.querySelectorAll(`${figure} .sc-panel`)].find(
    (e) => e.offsetParent,
  );
  const chain = panel.querySelector(".sc-chain");
  const box = chain.getBoundingClientRect();
  const rects = (sel) =>
    [...chain.querySelectorAll(sel)].map((e) => e.getBoundingClientRect());
  const hit = (a, c) =>
    a.left < c.right - 0.5 &&
    c.left < a.right - 0.5 &&
    a.top < c.bottom - 0.5 &&
    c.top < a.bottom - 0.5;
  let bad = 0;
  const labels = rects(".sc-hop");
  labels.forEach((l, i) => {
    for (const n of rects(".sc-node")) if (hit(l, n)) bad++;
    labels.forEach((o, j) => {
      if (j > i && hit(l, o)) bad++;
    });
    if (l.left < box.left - 0.5 || l.right > box.right + 0.5) bad++;
  });
  return bad;
};
