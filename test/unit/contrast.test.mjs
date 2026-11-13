/**
 * WCAG contrast audit of the site's colors, in both themes.
 *
 * Reads the color tokens straight from src/styles/tokens.css and checks each
 * text-on-surface pair the site actually uses against 4.5:1. The rendered
 * checks then measure what is actually drawn.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";

const AA = 4.5;
const css = readFileSync(
  new URL("../../src/styles/tokens.css", import.meta.url),
  "utf8",
);

const lum = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** { '--bg': { light: '#fff', dark: '#000' }, … } from the first rule block of the tokens file. */
const tokens = {};
{
  const block = css.slice(css.indexOf("{") + 1, css.indexOf("\n}"));
  for (const m of block.matchAll(
    /(--[\w-]+):\s*light-dark\(\s*(#[0-9a-fA-F]{3,8})\s*,\s*(#[0-9a-fA-F]{3,8})\s*\)/g,
  )) {
    tokens[m[1]] = { light: m[2], dark: m[3] };
  }
}

const HUES = ["red", "blue", "violet", "green", "amber"];
const GROUNDS = ["--bg", "--bg-raised", "--bg-sunken"];

/** [text token, ground token] pairs that carry text somewhere on the site. */
const PAIRS = [];
for (const g of GROUNDS)
  for (const t of ["--fg", "--fg-muted", "--fg-subtle", "--accent"])
    PAIRS.push([t, g]);
for (const h of HUES) {
  for (const g of GROUNDS) PAIRS.push([`--${h}`, g]); // hue as text or outline label
  PAIRS.push([`--${h}`, `--${h}-soft`]); // a role's label on its own tint
  PAIRS.push(["--fg", `--${h}-soft`]); // text inside a role box
}
PAIRS.push(["--fg", "--accent-soft"]); // targeted entry
PAIRS.push(["--on-accent", "--accent"]); // primary button

test("every token a pair names is declared, with a light and a dark value", () => {
  assert.deepEqual(
    [...new Set(PAIRS.flat())].filter((k) => !tokens[k]),
    [],
    "missing from the first rule block of src/styles/tokens.css",
  );
});

for (const theme of ["light", "dark"]) {
  describe(`${theme} theme: text at least ${AA}:1 on its ground`, () => {
    for (const [fg, bg] of PAIRS) {
      test(`${fg} on ${bg}`, (t) => {
        assert.ok(tokens[fg] && tokens[bg], "a token is missing");
        const r = ratio(tokens[fg][theme], tokens[bg][theme]);
        t.diagnostic(`${r.toFixed(2)}:1`);
        assert.ok(r >= AA, `${r.toFixed(2)}:1`);
      });
    }
  });
}
