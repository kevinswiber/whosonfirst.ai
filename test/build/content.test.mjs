// What the built pages say, read as text: words that run together, lesson
// questions that can be passed by habit, and a figure choice that must not be
// built but is not marked as such everywhere.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { built, LESSONS, main, some } from "../support/site.mjs";

// A line break in a template between a word and an inline element loses its
// space, and the two run together on the page ("calls thisclient credentials").
test("no word runs into the inline element after it", () => {
  const run = [];
  for (const p of built)
    for (const m of main(p).matchAll(
      /[A-Za-z,.;:](<(?:strong|em|a|code)\b[^>]*>[^<]{0,24})/g,
    ))
      run.push(`${p.path} “…${m[0].replace(/<[^>]+>/, "|")}”`);
  assert.deepEqual(some(run), []);
});

// A reader who has learned nothing should not be able to pass the lessons'
// questions by habit: "pick the middle one" or "pick the longest one". Across
// every question with three or more options, the right answer sits in no one
// place, and is neither the longest nor the shortest, more than half the time.
const words = (h) =>
  h
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
const place = [];
let total = 0;
let longest = 0;
let shortest = 0;
for (const p of built.filter((b) => LESSONS.includes(b.path))) {
  for (const q of p.html.split(/<fieldset[^>]*class="[^"]*\bck-q\b/).slice(1)) {
    const options = [
      ...q
        .split("</fieldset>")[0]
        .matchAll(
          /<li[^>]*class="[^"]*\b(is-right|is-wrong)\b[^>]*>[\s\S]*?class="[^"]*\bck-text\b[^>]*>([\s\S]*?)<\/span>\s*<\/label>/g,
        ),
    ];
    if (options.length < 3) continue;
    const lengths = options.map((m) => words(m[2]).length);
    const right = options.findIndex((m) => m[1] === "is-right");
    total++;
    place[right] = (place[right] ?? 0) + 1;
    if (lengths[right] === Math.max(...lengths)) longest++;
    if (lengths[right] === Math.min(...lengths)) shortest++;
  }
}

test("the right answer to a question cannot be guessed from its place in the list", () => {
  assert.ok(total > 0, "no lesson has a question with three or more answers");
  const most = Math.max(0, ...place.filter(Boolean));
  assert.ok(
    most <= total / 2,
    `of ${total} questions, the right answer is ${[...place].map((n, i) => `${n ?? 0} times in place ${i + 1}`).join(", ")}`,
  );
});

test("the right answer to a question cannot be guessed from its length", () => {
  assert.ok(total > 0, "no lesson has a question with three or more answers");
  assert.ok(
    longest <= total / 2 && shortest <= total / 2,
    `of ${total} questions, the right answer is the longest in ${longest} and the shortest in ${shortest}`,
  );
});

// A figure choice that must not be built is marked three times over: a warning
// sign on its button, the words and the reason at the head of its panel, and its
// row in the comparison table. Lesson 5's forwarded token is one, so this check
// always has something to look at.
test("a figure choice that must not be built is marked on its button, in its panel and in its table", () => {
  const count = (html, re) => (html.match(re) ?? []).length;
  const flagged = built
    .map((p) => ({
      path: p.path,
      panels: count(p.html, /class="[^"]*\bsc-avoid\b/g),
      buttons: count(
        p.html,
        /<span class="[^"]*\bsc-flag\b[^"]*"[^>]*\btitle=/g,
      ),
      rows: count(
        p.html,
        /<span class="[^"]*\bsc-flag\b[^"]*"(?![^>]*\btitle=)/g,
      ),
      table: /class="[^"]*\bsc-glance\b/.test(p.html),
    }))
    .filter((p) => p.panels > 0);
  assert.ok(flagged.length > 0, "no figure marks a choice at all");
  assert.deepEqual(
    flagged
      .filter((p) => p.buttons !== p.panels || (p.table && p.rows !== p.panels))
      .map(
        (p) =>
          `${p.path}: ${p.panels} panels, ${p.buttons} buttons, ${p.rows} rows`,
      ),
    [],
  );
});
