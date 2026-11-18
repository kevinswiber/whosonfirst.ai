// What the built pages say, read as text: words that run together, lesson
// questions that can be passed by habit, and a figure choice that must not be
// built but is not marked as such everywhere.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  built,
  FLOWS,
  file,
  LESSONS,
  main,
  pageAt,
  some,
} from "../support/site.mjs";

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

// The menu under the header lists a page's second-level headings. On the style
// guide those are its sections, and a sample of a component shown inside one
// takes a lower level, so the menu does not list it as a section of its own.
test("the style guide's second-level headings are its sections and nothing else", () => {
  const html = main(pageAt("/styleguide/"));
  const sections = html.match(/<section class="section"/g) ?? [];
  const headings = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
    words(m[1]),
  );
  assert.ok(sections.length > 1, "the style guide has no sections");
  assert.equal(
    headings.length,
    sections.length,
    `${sections.length} sections, but these headings: ${headings.join(", ")}`,
  );
});

// A flow's implementation record is read entry by entry: a reader often
// arrives at one from a link to it. So each entry marks every specification it
// names, once, whether or not the flow lists it; a number after a term that
// names it is left to that term. General glossary terms are the vocabulary all
// its entries share, and are marked once on the page. The directory and the
// flow cards mark nothing: they are summaries that link to the record, and a
// card is itself a link.
test("implementation records mark each specification in every entry, and a general term once", () => {
  const tracked = new Set(
    [
      ...readFileSync(
        new URL("../../src/data/standards.ts", import.meta.url),
        "utf8",
      ).matchAll(/ref: "RFC (\d+)"/g),
    ].map((m) => m[1]),
  );
  const wrong = [];
  let marks = 0;
  for (const p of built.filter((p) =>
    /^\/implementations\/[^/]+\/$/.test(p.path),
  )) {
    const terms = new Set();
    for (const [entry, id] of main(p).matchAll(
      /<li class="evidence-entry" id="([^"]+)"[\s\S]*?<div class="evidence-sources"/g,
    )) {
      const named = new Set();
      for (const [, kind, rest, text] of entry.matchAll(
        /<a class="(term|spec)"([^>]*)>([^<]*)<\/a>/g,
      )) {
        marks++;
        const spec =
          kind === "spec"
            ? rest.match(/href="\/standards\/#([^"]+)"/)?.[1]
            : rest.match(/data-standard="\/standards\/#([^"]+)"/)?.[1];
        const key = spec ?? rest.match(/href="([^"]+)"/)?.[1];
        const where = spec ? named : terms;
        if (where.has(key)) wrong.push(`${p.path}#${id} marks “${text}” again`);
        where.add(key);
      }
      const words = entry
        .replace(/<a [^>]*>[^<]*<\/a>/g, " ")
        .replace(/<[^>]+>/g, " ");
      for (const [, n] of words.matchAll(/RFC (\d{4,5})/g))
        if (tracked.has(n) && !named.has(`rfc${n}`))
          wrong.push(`${p.path}#${id} leaves RFC ${n} unmarked`);
    }
  }
  assert.ok(marks > 0, "no implementation record marks anything");
  assert.deepEqual(some(wrong), []);
  const summaries = [pageAt("/implementations/"), ...FLOWS.map(pageAt)].flatMap(
    (p) =>
      [...main(p).matchAll(/<ul class="evidence-examples[\s\S]*?<\/ul>/g)]
        .filter((m) => /class="(term|spec)"/.test(m[0]))
        .map(() => p.path),
  );
  assert.deepEqual(some(summaries), []);
});

// A comparison is written, and its figure shows each flow's own messages.
// Those are not written twice: the page takes them from the flows' data, and
// this checks that they arrived, so a figure cannot show a message that the
// flow's own page does not.
const copy = (path) => file(`${path}index.md`);
const listings = (markdown) =>
  [...markdown.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)].map((m) =>
    m[1].trim(),
  );
test("every listing in a comparison's figure is one of its two flows' own, and both flows link to the comparison", () => {
  const pairs = built.filter((p) => /^\/compare\/[^/]+\/$/.test(p.path));
  assert.ok(pairs.length > 0, "no comparison was built");
  const wrong = [];
  for (const p of pairs) {
    const flows = p.path
      .split("/")[2]
      .split("-vs-")
      .map((slug) => `/flows/${slug}/`);
    // a flow sends its reader to the comparison twice: in its opening, for
    // the reader who arrives with the question, and beside its related flows,
    // for the one who has read to the end
    for (const flow of flows) {
      const html = pageAt(flow)?.html ?? "";
      const opening = /<ul class="ways-in"[\s\S]*?<\/ul>/.exec(html)?.[0] ?? "";
      const related = html.slice(html.indexOf('id="related"'));
      if (!opening.includes(`href="${p.path}"`))
        wrong.push(`${flow} does not link to ${p.path} in its opening`);
      if (!new RegExp(`<a class="card"[^>]*href="${p.path}"`).test(related))
        wrong.push(
          `${flow} has no card for ${p.path} beside its related flows`,
        );
    }
    const own = new Set(flows.flatMap((flow) => listings(copy(flow))));
    const shown = listings(copy(p.path));
    if (shown.length < 2) wrong.push(`${p.path} shows no listing for a flow`);
    for (const listing of shown)
      if (!own.has(listing))
        wrong.push(
          `${p.path} shows a listing neither flow has: ${listing.slice(0, 50)}…`,
        );
  }
  assert.deepEqual(some(wrong), []);
});

// A word the glossary defines can be part of a longer name that means
// something else. A "client certificate" is a TLS client's, not the OAuth
// client's, so "client" is not marked as the glossary's term there.
test("no page marks the OAuth client inside “client certificate”", () => {
  const marked = [];
  for (const p of built)
    for (const m of p.html.matchAll(
      /<a class="term" href="\/glossary\/#client"[^>]*>clients?<\/a>[\s-]+certificate/gi,
    ))
      marked.push(`${p.path} “${m[0].replace(/<[^>]+>/g, "")}”`);
  assert.deepEqual(some(marked), []);
  // and the term is still marked where it stands for itself
  assert.ok(
    built.some((p) =>
      /<a class="term" href="\/glossary\/#client"/.test(p.html),
    ),
    "the client is no longer marked anywhere",
  );
});

// The comparisons are a section of the site, and a reader on any page can
// reach it: from the footer, and from the lessons that teach what a pair of
// flows share.
test("every page's footer links to the comparisons, and a lesson that leads to both flows of a comparison leads to it too", () => {
  const wrong = [];
  for (const p of built) {
    const footer = p.html.slice(p.html.indexOf('<footer class="site-footer"'));
    if (!footer.includes('href="/compare/"'))
      wrong.push(`${p.path} has no link to /compare/ in its footer`);
  }
  const pairs = built
    .map((p) => /^\/compare\/([^/]+)\/$/.exec(p.path)?.[1])
    .filter(Boolean);
  for (const path of LESSONS) {
    const html = pageAt(path).html;
    const deeper = html.slice(html.indexOf('id="deeper"'));
    for (const pair of pairs)
      if (
        pair
          .split("-vs-")
          .every((slug) => deeper.includes(`href="/flows/${slug}/"`)) &&
        !deeper.includes(`href="/compare/${pair}/"`)
      )
        wrong.push(`${path} leads to both flows of ${pair} and not to it`);
  }
  assert.deepEqual(some(wrong), []);
});
