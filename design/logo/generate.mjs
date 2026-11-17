#!/usr/bin/env node
/**
 * The site's mark, an owl, drawn by this script.
 *
 *   node design/logo/generate.mjs
 *
 * Writes:
 *  - public/favicon.svg, the one drawing the site reads;
 *  - design/logo/owl/, the mark in every form, for Adobe Illustrator.
 *    owl-master.svg holds them all on one artboard, a named layer each;
 *  - design/logo/sheet.html, a page that shows the mark at the sizes it has
 *    to work at. It is not committed.
 *
 * The files in design/logo/owl/ are written for Illustrator to open and edit:
 *  - every shape carries its own fill and stroke as attributes. There is no
 *    style sheet, class, currentColor, <use>, mask, clip path or transform;
 *  - coordinates are final. A lockup's mark is drawn where it sits, not
 *    moved, and the owl's head is tilted by turning each of its points;
 *  - strokes stay live, so a weight can still be changed. They are centred,
 *    the only alignment SVG has;
 *  - letters are outlines, taken from the site's own IBM Plex Mono, so no
 *    font has to be installed;
 *  - each part is a <g> with an id, which Illustrator shows as a named layer.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { create } from "fontkitten";

const here = fileURLToPath(new URL("./", import.meta.url));
const fontFile = (weight, ext = "woff") =>
  fileURLToPath(
    new URL(
      `../../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-${weight}-normal.${ext}`,
      import.meta.url,
    ),
  );
const FONT = create(readFileSync(fontFile(600)));

/** The grounds the mark is put on, and the name's colors there. From src/styles/tokens.css. */
const LIGHT = {
  name: "light",
  bg: "#ffffff",
  ink: "#15171a",
  muted: "#434850",
};
const DARK = { name: "dark", bg: "#0e0f11", ink: "#e9e9e7", muted: "#b3b5b2" };
/** One ink: what is left when there is no second color to print. */
const MONO = { name: "mono", bg: "#ffffff", ink: "#15171a", muted: "#15171a" };
/** One ink, reversed: for a dark ground. */
const WHITE = {
  name: "white",
  bg: "#15171a",
  ink: "#ffffff",
  muted: "#ffffff",
};
/** An app icon's ground. */
const TILE = { name: "tile", bg: "#15171a" };

const n = (v) => String(+v.toFixed(2));

/**
 * A pen that draws at an offset and a scale and writes the result as final
 * coordinates, so the file needs no transform.
 */
function pen(ox = 0, oy = 0, s = 1) {
  const X = (x) => n(ox + x * s);
  const Y = (y) => n(oy + y * s);
  const L = (v) => n(v * s);
  return {
    /** A filled shape with straight sides. */
    shape: (pts, fill) =>
      `<polygon points="${pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")}" fill="${fill}"/>`,
    rect: (x, y, w, h, fill) =>
      `<rect x="${X(x)}" y="${Y(y)}" width="${L(w)}" height="${L(h)}" fill="${fill}"/>`,
    /**
     * A path of M, L, A (circular arc: r, large, sweep, x, y) and Z. Given
     * a stroke it is a line; given `{ fill }` it is a shape, and a closed
     * part drawn inside another is a hole in it.
     */
    path: (cmds, st) =>
      `<path d="${cmds
        .map(([c, ...a]) => {
          if (c === "Z") return "Z";
          if (c === "A")
            return `A${L(a[0])} ${L(a[0])} 0 ${a[1]} ${a[2]} ${X(a[3])} ${Y(a[4])}`;
          return `${c}${X(a[0])} ${Y(a[1])}`;
        })
        .join("")}" ${
        st.fill
          ? `fill="${st.fill}" fill-rule="evenodd"`
          : `fill="none" stroke="${st.stroke}" stroke-width="${L(st.w)}" stroke-linecap="butt" stroke-linejoin="miter"`
      }/>`,
    /** Letters as outlines. `x` is the left edge and `y` the baseline. */
    text: (str, x, y, size, fill, tracking) => {
      const k = size / FONT.unitsPerEm;
      let cx = x;
      let d = "";
      for (const ch of str) {
        const g = FONT.glyphForCodePoint(ch.codePointAt(0));
        for (const { command, args } of g.path.commands) {
          const p = [];
          for (let i = 0; i < args.length; i += 2)
            p.push(`${X(cx + args[i] * k)} ${Y(y - args[i + 1] * k)}`);
          d +=
            {
              moveTo: "M",
              lineTo: "L",
              quadraticCurveTo: "Q",
              bezierCurveTo: "C",
              closePath: "Z",
            }[command] + p.join(" ");
        }
        cx += g.advanceWidth * k + tracking * size;
      }
      return `<path d="${d}" fill="${fill}"/>`;
    },
  };
}

/** How wide a run of letters is, in the units of the drawing. */
function textWidth(str, size, tracking) {
  const k = size / FONT.unitsPerEm;
  return (
    [...str].reduce(
      (sum, ch) =>
        sum +
        FONT.glyphForCodePoint(ch.codePointAt(0)).advanceWidth * k +
        tracking * size,
      0,
    ) -
    tracking * size
  );
}

/** A circle as part of a path. */
const circle = (cx, cy, r) => [
  ["M", cx - r, cy],
  ["A", r, 0, 1, cx + r, cy],
  ["A", r, 0, 1, cx - r, cy],
  ["Z"],
];

/**
 * How the owl is colored on each ground. Its eyes are the lightest thing in
 * every one: turn the whole owl pale on a dark ground and it is a ghost.
 *
 *  fill  body, eyes, pupils and beak each have a color
 *  cut   one ink: the eyes and the beak are holes in the body
 *  line  one ink on a dark ground: the owl in outline, with solid eyes
 *
 * On a dark ground the body is a grey light enough to stand 3 to 1 against
 * the page and the raised surface. The eyes are white, the strongest thing
 * that can be put on a dark body, and the pupils are the links' blue.
 * src/styles/tokens.css has the same values as --mark-, and
 * test/unit/contrast.test.mjs holds them to that rule.
 */
const fill = (body, eye, pupil, beak) => ({
  mode: "fill",
  body,
  eye,
  pupil,
  beak,
});
const SCHEMES = {
  light: fill("#15171a", "#ffffff", "#0b3fc4", "#ffffff"),
  dark: fill("#6a6f79", "#ffffff", "#0b3fc4", "#e9e9e7"),
  mono: { mode: "cut", ink: "#15171a" },
  white: { mode: "line", ink: "#ffffff", beak: "#ffffff" },
};
SCHEMES.tile = SCHEMES.dark;

/**
 * The owl, as one drawing with settings, so a change to it is a number and
 * not a path.
 *
 *  l r t b   the box the head fills, before it is tilted
 *  stroke    the weight of the outline, where the owl is drawn in line
 *  dip       how far the brow comes down in the middle, from the tufts
 *  eye       the radius of an eye; bridge, the gap between the two
 *  pupil     its radius; look, how far it is turned to the right; drop, down
 *  beak      [half its width, its length], hung from beakY
 *  tilt      how far the head is turned, in degrees, clockwise
 */
function owl(p, o, scheme) {
  const line = scheme.mode === "line";
  const w = o.stroke;
  // An outline is drawn inside the box, so every form is the same size.
  const [l, r, t, b] = line
    ? [o.l + w / 2, o.r - w / 2, o.t + w / 2, o.b - w / 2]
    : [o.l, o.r, o.t, o.b];
  const mid = (o.l + o.r) / 2;
  const half = (r - l) / 2;
  // The head is tilted by turning every point of it, so the file has no transform.
  const angle = (o.tilt * Math.PI) / 180;
  const [ox, oy] = [mid, (o.t + o.b) / 2];
  const spin = (x, y) => [
    ox + (x - ox) * Math.cos(angle) - (y - oy) * Math.sin(angle),
    oy + (x - ox) * Math.sin(angle) + (y - oy) * Math.cos(angle),
  ];
  const turn = (cmds) =>
    cmds.map(([cmd, ...a]) => {
      if (cmd === "Z") return [cmd];
      if (cmd === "A") return [cmd, a[0], a[1], a[2], ...spin(a[3], a[4])];
      return [cmd, ...spin(a[0], a[1])];
    });
  const head = turn([
    ["M", l, t],
    ["L", mid, t + o.dip],
    ["L", r, t],
    ["L", r, b - half],
    ["A", half, 0, 1, l, b - half],
    ["Z"],
  ]);
  const at = [mid - o.bridge / 2 - o.eye, mid + o.bridge / 2 + o.eye];
  const eyes = at.map((cx) => turn(circle(cx, o.eyeY, o.eye)));
  const pupils = at.map((cx) =>
    turn(circle(cx + o.look, o.eyeY + o.drop, o.pupil)),
  );
  const beak = [
    [mid - o.beak[0], o.beakY],
    [mid + o.beak[0], o.beakY],
    [mid, o.beakY + o.beak[1]],
  ].map(([x, y]) => spin(x, y));
  if (scheme.mode === "cut")
    return [
      [
        "body",
        [
          p.path(
            [
              ...head,
              ...eyes.flat(),
              ["M", ...beak[0]],
              ["L", ...beak[1]],
              ["L", ...beak[2]],
              ["Z"],
            ],
            { fill: scheme.ink },
          ),
        ],
      ],
      ["pupils", pupils.map((d) => p.path(d, { fill: scheme.ink }))],
    ];
  if (line)
    return [
      ["body", [p.path(head, { stroke: scheme.ink, w })]],
      // Solid eyes with the pupils cut out of them: the eyes stay the lightest thing.
      [
        "eyes",
        eyes.map((d, i) => p.path([...d, ...pupils[i]], { fill: scheme.ink })),
      ],
      ["beak", [p.shape(beak, scheme.beak)]],
    ];
  return [
    ["body", [p.path(head, { fill: scheme.body })]],
    ["eyes", eyes.map((d) => p.path(d, { fill: scheme.eye }))],
    ["pupils", pupils.map((d) => p.path(d, { fill: scheme.pupil }))],
    ["beak", [p.shape(beak, scheme.beak)]],
  ];
}

/** The owl, on a square of 64. */
const OWL = {
  l: 7,
  r: 57,
  t: 9,
  b: 57,
  stroke: 3.25,
  dip: 11,
  eye: 10.5,
  bridge: 2.5,
  eyeY: 33,
  pupil: 5,
  look: 2.75,
  drop: -2,
  beakY: 38.5,
  beak: [4.75, 9.5],
  tilt: 10,
};
/** And on a square of 16, for a tab: the same owl with less room around it. */
const OWL_SMALL = {
  l: 1.75,
  r: 14.25,
  t: 2.5,
  b: 14.5,
  stroke: 1.25,
  dip: 2.75,
  eye: 2.7,
  bridge: 0.5,
  eyeY: 8.2,
  pupil: 1.4,
  look: 0.7,
  drop: -0.5,
  beakY: 9.5,
  beak: [1.35, 2.7],
  tilt: 10,
};

const WORD_SIZE = 37;
const TRACKING = -0.02;
const GAP = 16;
const LOCKUP_WIDTH =
  64 + GAP + textWidth("whosonfirst.ai", WORD_SIZE, TRACKING);

function svg(width, height, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(width)}" height="${n(height)}" viewBox="0 0 ${n(width)} ${n(height)}">
<title>${title}</title>
${body}
</svg>
`;
}

/** Parts as named groups. In a file that holds several drawings, `prefix` keeps the names apart. */
const groups = (parts, indent = "", prefix = "") =>
  parts
    .map(
      ([id, els]) =>
        `${indent}<g id="${prefix}${id}">\n${els.map((e) => `${indent}  ${e}`).join("\n")}\n${indent}</g>`,
    )
    .join("\n");

/** The mark alone, on a square of 64. */
function mark(c) {
  return svg(
    64,
    64,
    `<g id="mark">\n${groups(owl(pen(), OWL, SCHEMES[c.name]), "  ")}\n</g>`,
    `Who, ${c.name}`,
  );
}

/** The mark as it is drawn for 16 pixels. */
function small(c) {
  return svg(
    16,
    16,
    `<g id="mark">\n${groups(owl(pen(), OWL_SMALL, SCHEMES[c.name]), "  ")}\n</g>`,
    `Who at 16 pixels, ${c.name}`,
  );
}

/** An app icon: the mark on a dark ground, inside the part a mask leaves. */
function icon() {
  return svg(
    512,
    512,
    `<g id="background">\n  ${pen().rect(0, 0, 512, 512, TILE.bg)}\n</g>\n<g id="mark">\n${groups(owl(pen(96, 96, 5), OWL, SCHEMES.tile), "  ")}\n</g>`,
    "Who, app icon",
  );
}

/** The mark with the site's name beside it, as groups, drawn by `p`. */
function lockupBody(c, p, prefix = "") {
  // The cap height of Plex Mono is 0.698 em; the letters sit centred on the mark.
  const baseline = 32 + (0.698 * WORD_SIZE) / 2;
  const name = p.text(
    "whosonfirst",
    64 + GAP,
    baseline,
    WORD_SIZE,
    c.ink,
    TRACKING,
  );
  const tld = p.text(
    ".ai",
    64 +
      GAP +
      textWidth("whosonfirst", WORD_SIZE, TRACKING) +
      TRACKING * WORD_SIZE,
    baseline,
    WORD_SIZE,
    c.muted,
    TRACKING,
  );
  return `<g id="${prefix}mark">\n${groups(owl(p, OWL, SCHEMES[c.name]), "  ", prefix)}\n</g>\n<g id="${prefix}wordmark">\n  <g id="${prefix}name">\n    ${name}\n  </g>\n  <g id="${prefix}tld">\n    ${tld}\n  </g>\n</g>`;
}

function lockup(c) {
  return svg(
    LOCKUP_WIDTH,
    64,
    lockupBody(c, pen()),
    `Who with whosonfirst.ai, ${c.name}`,
  );
}

/**
 * Every form of the mark on a single artboard, for Illustrator: one file to
 * open, with a named layer for each form.
 */
function master() {
  const ground = (x, y, w, h, color) => pen().rect(x, y, w, h, color);
  const panel = (id, x, c, backed) =>
    `<g id="${id}">\n${backed ? `  ${ground(x, 40, 160, 160, c.bg)}\n` : ""}${groups(owl(pen(x + 24, 64, 1.75), OWL, SCHEMES[c.name]), "  ", `${id}-`)}\n</g>`;
  const word = (id, x, y, c, backed) =>
    `<g id="${id}">\n${backed ? `${ground(x - 16, y - 16, LOCKUP_WIDTH + 32, 96, c.bg)}\n` : ""}${lockupBody(c, pen(x, y), `${id}-`)}\n</g>`;
  const body = [
    panel("mark-light", 40, LIGHT, false),
    panel("mark-dark", 240, DARK, true),
    panel("mark-black", 440, MONO, false),
    panel("mark-white", 640, WHITE, true),
    word("lockup-light", 40, 256, LIGHT, false),
    word("lockup-dark", 496, 256, DARK, true),
    word("lockup-black", 40, 384, MONO, false),
    `<g id="small-16">\n${groups(owl(pen(496, 408), OWL_SMALL, SCHEMES.light), "  ", "small-16-")}\n</g>`,
    `<g id="small-32">\n${groups(owl(pen(536, 400, 0.5), OWL, SCHEMES.light), "  ", "small-32-")}\n</g>`,
    `<g id="app-icon">\n  ${ground(600, 368, 96, 96, TILE.bg)}\n${groups(owl(pen(618, 386, 60 / 64), OWL, SCHEMES.tile), "  ", "app-icon-")}\n</g>`,
  ].join("\n");
  return svg(920, 504, body, "Who: every form");
}

const files = {
  "mark-light": mark(LIGHT),
  "mark-dark": mark(DARK),
  "mark-mono": mark(MONO),
  "mark-white": mark(WHITE),
  "small-light": small(LIGHT),
  "small-dark": small(DARK),
  "small-mono": small(MONO),
  icon: icon(),
  "lockup-light": lockup(LIGHT),
  "lockup-dark": lockup(DARK),
  "lockup-mono": lockup(MONO),
  "lockup-white": lockup(WHITE),
  master: master(),
};
const out = join(here, "owl");
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const [name, text] of Object.entries(files))
  writeFileSync(join(out, `owl-${name}.svg`), text);

/**
 * The site's icon, public/favicon.svg: the owl on a 32 square, colored by a
 * style sheet that follows the reader's color scheme. This one file is not
 * for Illustrator. The header, the cards and the icons the build makes all
 * read it, and give each class its color themselves.
 */
{
  const parts = ["body", "eye", "pupil", "beak"];
  const marked = Object.fromEntries(
    parts.map((part, i) => [part, `#00000${i}`]),
  );
  const drawn = owl(pen(0, 0, 0.5), OWL, { mode: "fill", ...marked })
    .flatMap(([, els]) => els)
    .map((el) =>
      el.replace(
        /fill="(#00000\d)"/,
        (_, hex) => `class="owl-${parts[Number(hex.at(-1))]}"`,
      ),
    )
    .join("\n  ");
  const rules = (scheme) =>
    parts.map((part) => `.owl-${part} { fill: ${scheme[part]} }`).join(" ");
  writeFileSync(
    fileURLToPath(new URL("../../public/favicon.svg", import.meta.url)),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <!-- An owl with its head on one side, looking up and across. Written by
       design/logo/generate.mjs: change the drawing there, not here. Its body
       is dark on every ground and its eyes are the lightest thing in it.
       Everything is drawn inside the box. -->
  <style>
    ${rules(SCHEMES.light)}
    @media (prefers-color-scheme: dark) { ${rules(SCHEMES.dark)} }
  </style>
  ${drawn}
</svg>
`,
  );
}

/* ---- the sheet ---------------------------------------------------- */

/** A drawing for the page: the ids that name its layers would repeat there. */
const inline = (text) => text.replace(/ id="[^"]+"/g, "");
const sized = (text, px) =>
  inline(text).replace(
    /width="[^"]+" height="[^"]+"/,
    `width="${px}" height="${px}"`,
  );
const tall = (text, px) => {
  const [, w, h] = text.match(/viewBox="0 0 (\S+) (\S+)"/);
  return inline(text).replace(
    /width="[^"]+" height="[^"]+"/,
    `width="${n((w / h) * px)}" height="${px}"`,
  );
};
const font64 = (weight) =>
  readFileSync(fontFile(weight, "woff2")).toString("base64");
const NAV = ["Learn", "Choose a flow", "Flows", "Standards", "Glossary"];

const bar = (theme) => `
      <div class="bar ${theme}">
        <span class="brand">${sized(files[`mark-${theme}`], 28)}<span class="wordmark">Who’s on First</span></span>
        <span class="nav">${NAV.map((label, i) => `<span${i === 2 ? ' class="here"' : ""}>${label}</span>`).join("")}</span>
      </div>`;

const tab = (theme) => `
        <span class="tab ${theme}">${sized(files[`small-${theme}`], 16)}<span>DPoP · Who’s on First</span></span>`;

/*
 * The page has no <html> or <body> of its own: it is also published as it is
 * to a host that wraps it in them, and a browser opening the file supplies
 * the same. Its own colors follow the reader's theme; a swatch that shows the
 * mark in one theme keeps that theme's colors whatever the page is in.
 */
const sheet = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<title>whosonfirst.ai logos</title>
<style>
@font-face { font-family: "Plex Mono"; font-weight: 500; src: url(data:font/woff2;base64,${font64(500)}) format("woff2"); }
@font-face { font-family: "Plex Mono"; font-weight: 600; src: url(data:font/woff2;base64,${font64(600)}) format("woff2"); }
/* one column: the mark large, then at its sizes, then where it is used */
:root {
  --bg: #ffffff; --fg: #15171a; --muted: #434850; --border: #cfd2d7; --accent: #0b3fc4;
  --light-bg: #ffffff; --light-fg: #15171a; --light-border: #cfd2d7; --light-tab: #f3f4f6;
  --dark-bg: #0e0f11; --dark-fg: #e9e9e7; --dark-border: #32343a; --dark-tab: #23252a;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --bg: #0e0f11; --fg: #e9e9e7; --muted: #b3b5b2; --border: #32343a; --accent: #93b5ff; color-scheme: dark; }
}
:root[data-theme="dark"] { --bg: #0e0f11; --fg: #e9e9e7; --muted: #b3b5b2; --border: #32343a; --accent: #93b5ff; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.5 "Plex Mono", ui-monospace, Menlo, monospace; }
main { max-width: 1180px; margin: 0 auto; padding-block: 32px 64px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 4px; text-wrap: balance; }
.lede { color: var(--muted); margin: 0 0 24px; max-width: 74ch; }
section { border-top: 1px solid var(--border); padding: 24px 0 32px; }
h2 { font-size: 13px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 4px; }
.note { color: var(--muted); margin: 0 0 20px; max-width: 78ch; font-size: 14px; }
.grid { display: grid; grid-template-columns: 200px 200px 1fr; gap: 16px; align-items: start; }
.grid > .cell { aspect-ratio: 1; }
.cell { border: 1px solid var(--border); border-radius: 2px; display: flex; align-items: center; justify-content: center; padding: 20px; }
.light { background: var(--light-bg); color: var(--light-fg); border-color: var(--light-border); }
.dark { background: var(--dark-bg); color: var(--dark-fg); border-color: var(--dark-border); }
.col { display: grid; gap: 16px; min-width: 0; }
.sizes { display: flex; align-items: flex-end; gap: 22px; padding: 14px 20px; justify-content: flex-start; flex-wrap: wrap; }
svg { display: block; flex: none; }
.bar { display: flex; align-items: center; gap: 24px; min-height: 56px; padding: 0 20px; border: 1px solid var(--border); border-radius: 2px; overflow: hidden; }
.brand { display: inline-flex; align-items: center; gap: 9px; margin-right: auto; }
.wordmark { font-weight: 600; font-size: 15.7px; letter-spacing: -0.02em; white-space: nowrap; }
.nav { display: flex; gap: 18px; font-size: 11.8px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; }
.nav span { opacity: 0.75; white-space: nowrap; }
.nav .here { opacity: 1; box-shadow: inset 0 -2px 0 #0b3fc4; padding-bottom: 6px; }
.bar.dark .nav .here { box-shadow: inset 0 -2px 0 #93b5ff; }
.tabs { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
.tab { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px 7px 10px; border-radius: 8px 8px 0 0; font: 12px/1 system-ui, sans-serif; border: 1px solid var(--border); border-bottom: 0; white-space: nowrap; }
.tab.light { background: var(--light-tab); }
.tab.dark { background: var(--dark-tab); }
.app { display: inline-flex; overflow: hidden; border-radius: 22.5%; }
.label { font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
.zoom { border: 1px solid var(--light-border); background: var(--light-bg); }
.row { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 16px; }
.row > .cell { flex: 1 1 320px; justify-content: flex-start; overflow: hidden; }
.row > .cell svg { max-width: 100%; height: auto; }
.wide { overflow-x: auto; justify-content: flex-start; }
@media (max-width: 860px) {
  .grid { grid-template-columns: 1fr 1fr; }
  .col { grid-column: 1 / -1; }
  .nav { display: none; }
}
</style>
<main>
<h1>The owl</h1>
<p class="lede">The mark of whosonfirst.ai: an owl, because an owl says who, and because an owl is what a field guide is for. Its head is on one side and it is looking up and across.</p>
<section>
  <h2>In both themes, and at its sizes</h2>
  <p class="note">Its body is dark on every ground, and a grey on a dark one. Its eyes are white and its pupils are the links’ blue. Then in one ink, and as an app icon.</p>
  <div class="grid">
    <div class="cell light">${sized(files["mark-light"], 128)}</div>
    <div class="cell dark">${sized(files["mark-dark"], 128)}</div>
    <div class="col">
      <div class="cell light sizes">${[64, 48, 32, 24].map((px) => sized(files["mark-light"], px)).join("")}${sized(files["small-light"], 16)}<span style="width:12px"></span>${[48, 32].map((px) => sized(files["mark-mono"], px)).join("")}${sized(files["small-mono"], 16)}<span style="width:12px"></span><span class="app">${sized(files.icon, 60)}</span><span class="app">${sized(files.icon, 29)}</span></div>
      <div class="cell dark sizes">${[64, 48, 32, 24].map((px) => sized(files["mark-dark"], px)).join("")}${sized(files["small-dark"], 16)}<span style="width:12px"></span>${[48, 32].map((px) => sized(files["mark-white"], px)).join("")}</div>
    </div>
  </div>
</section>
<section>
  <h2>In the header and in a tab</h2>
  <p class="note">The header shows it at 28 pixels. A tab shows the drawing made for 16.</p>
  <div class="col">${bar("light")}${bar("dark")}
    <div class="tabs">${tab("light")}${tab("dark")}
      <span class="label">16 px, × 6</span>${sized(files["small-light"], 96).replace("<svg", '<svg class="zoom"')}
    </div>
  </div>
</section>
<section>
  <h2>Beside the name</h2>
  <div class="row">
    <div class="cell light">${tall(files["lockup-light"], 44)}</div>
    <div class="cell dark">${tall(files["lockup-dark"], 44)}</div>
  </div>
</section>
<section>
  <h2>Every form, on one artboard</h2>
  <p class="note">design/logo/owl/owl-master.svg, the file to open in Illustrator.</p>
  <div class="cell light wide">${inline(files.master)}</div>
</section>
</main>
`;
writeFileSync(join(here, "sheet.html"), sheet);
console.log(
  `${Object.keys(files).length} files in design/logo/owl/, public/favicon.svg, and sheet.html`,
);
