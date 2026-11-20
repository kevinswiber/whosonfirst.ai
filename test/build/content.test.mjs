// What the built pages say, read as text: words that run together, lesson
// questions that can be passed by habit, and a figure choice that must not be
// built but is not marked as such everywhere.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  built,
  copyOf,
  FLOWS,
  file,
  LESSONS,
  main,
  pageAt,
  plain,
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

// The guide's sections are listed twice on every page, in the same groups
// under the same names: in the header, whose menu shows the names, and in the
// footer. The footer adds a group of its own for the guide itself.
const text = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const listed = (html, item, name) =>
  html
    .split(item)
    .slice(1)
    .map((part) => ({
      name: text(
        new RegExp(`${name}[^>]*>([\\s\\S]*?)</`).exec(part)?.[1] ?? "",
      ),
      links: [...part.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]),
    }));
const headerGroups = (p) => {
  const nav = /<nav id="site-nav"[\s\S]*?<\/nav>/.exec(p.html)?.[0] ?? "";
  return listed(nav, 'class="nav-group"', 'class="nav-group-name"');
};
const footerGroups = (p) => {
  const map = /<nav class="foot-map"[\s\S]*?<\/nav>/.exec(p.html)?.[0] ?? "";
  return listed(map, "<div", 'class="foot-head"');
};

test("every page's footer lists the sections in the header's groups, then the guide's own", () => {
  const wrong = [];
  for (const p of built) {
    const header = headerGroups(p);
    const footer = footerGroups(p);
    if (header.map((g) => g.name).join() !== "Start here,In practice,Reference")
      wrong.push(
        `${p.path}: the header's groups are ${header.map((g) => g.name)}`,
      );
    if (JSON.stringify(footer.slice(0, -1)) !== JSON.stringify(header))
      wrong.push(`${p.path}: the footer's groups are not the header's`);
    const own = footer.at(-1);
    if (
      own?.name !== "This guide" ||
      !["/about/", "/search/", "/standards/changes/"].every((href) =>
        own.links.includes(href),
      )
    )
      wrong.push(`${p.path}: “This guide” has ${own?.links}`);
  }
  assert.deepEqual(some(wrong), []);
});

// What the menu says each section holds is a claim about the site, with a
// number in it. Each number is counted here from the pages that were built.
test("the numbers the menu gives for a section are the number of its pages", () => {
  const notes = Object.fromEntries(
    [
      ...(pageAt("/")?.html ?? "").matchAll(
        /<a href="([^"]+)"[^>]*>\s*<span class="nav-label"[^>]*>[^<]*<\/span>\s*<span class="nav-note"[^>]*>([^<]*)</g,
      ),
    ].map((m) => [m[1], m[2]]),
  );
  const pages = (section, not = []) =>
    built.filter(
      (p) =>
        new RegExp(`^/${section}/[^/]+/$`).test(p.path) &&
        !not.includes(p.path),
    ).length;
  const terms = (pageAt("/glossary/")?.html ?? "").split("<dt").length - 1;
  // Each line that gives a number, and what that number has to be. A line that
  // is missing, or that has lost its number, fails as one that is wrong does.
  const counted = {
    "/learn/": LESSONS.length,
    "/flows/": FLOWS.length,
    "/deployments/": pages("deployments"),
    "/standards/": pages("standards", [
      "/standards/changes/",
      "/standards/timeline/",
    ]),
    "/glossary/": terms,
  };
  const said = Object.fromEntries(
    Object.keys(counted).map((href) => {
      const number = /\d+/.exec(notes[href] ?? "")?.[0];
      return [href, number === undefined ? null : Number(number)];
    }),
  );
  assert.deepEqual(said, counted, JSON.stringify(notes));
  for (const count of Object.values(counted)) assert.ok(count > 0);
  for (const [href, note] of Object.entries(notes))
    assert.ok(note.trim().length >= 12, `${href} says only “${note}”`);
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

// Each section heading has a link to itself, put there when the page is built.
// It goes to its own heading, no id is on a page twice, the heading's name is
// still its own words, and the page's copy in Markdown has no trace of it.
test("a section link goes to its own heading, which is named by its words, and no id is taken twice", () => {
  const wrong = [];
  for (const p of built) {
    const ids = [...p.html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    for (const m of p.html.matchAll(
      /<(h[23])\b([^>]*)>((?:(?!<\/\1>)[\s\S])*?)<section-link class="section-link"><a href="#([^"]+)" aria-label="([^"]*)"><svg [^>]*aria-hidden="true"[^>]*>(?:(?!<\/svg>)[\s\S])*<\/svg><\/a><\/section-link><\/\1>/g,
    )) {
      const [, , attrs, inner, href, label] = m;
      const id = /\sid="([^"]+)"/.exec(attrs)?.[1];
      const name = /\saria-label="([^"]*)"/.exec(attrs)?.[1];
      if (id !== href) wrong.push(`${p.path}: a link to #${href} in #${id}`);
      if (ids.filter((x) => x === id).length > 1)
        wrong.push(`${p.path} has #${id} twice`);
      if (plain(name ?? "") !== plain(inner))
        wrong.push(`${p.path}#${id} is named “${name}”, not “${plain(inner)}”`);
      if (plain(label) !== `Link to this section: ${plain(inner)}`)
        wrong.push(`${p.path}#${id}: the link says “${label}”`);
    }
    const copy = copyOf(p) && file(copyOf(p));
    if (/Link to this section|section-link/.test(copy))
      wrong.push(`${p.path}: its Markdown copy has a section link`);
  }
  assert.deepEqual(some(wrong), []);
  // and they are made: a long page of each kind has them
  for (const path of [
    "/about/",
    LESSONS[0],
    FLOWS[0],
    "/deployments/gateways/",
  ])
    assert.ok(
      /<section-link/.test(pageAt(path).html),
      `${path} has no section link`,
    );
});

// The timeline reaches back before the day recording began, and says so under
// its oldest entry, with dates read from the log: it does not claim that
// nothing earlier is there.
test("the timeline says where its record is incomplete, under its oldest entry", async () => {
  const { history } = await import("../../src/data/history/index.ts");
  const { recordBegan, spellDate, timeline } = await import(
    "../../src/lib/history.ts"
  );
  const groups = timeline(history);
  const html = main(pageAt("/standards/timeline/"));
  const text = words(html);
  assert.ok(
    !text.includes("most of what came before is not here"),
    "the page opening says the record began later than its oldest entry",
  );
  const began = spellDate(recordBegan(history));
  const note = text.indexOf(
    `The timeline is not complete before this point. This site began recording on ${began}`,
  );
  assert.ok(note >= 0, "the note under the oldest entry is missing");
  const oldest = html.lastIndexOf(`id="g-${groups.at(-1).key}"`);
  assert.ok(
    oldest >= 0 && html.indexOf("tl-end") > oldest,
    "the note is not after the oldest group",
  );
});
