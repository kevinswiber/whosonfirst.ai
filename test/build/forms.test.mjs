// The other forms of a page: the card shown where its link is shared, its copy
// in Markdown, and what it tells a search engine about itself. Each is made
// from the page when the site is built (src/integrations/), and each is named
// in the page's own head, so the head is where this starts.
import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { faults, kind } from "../support/mermaid.mjs";
import {
  attr,
  built,
  copyOf,
  exists,
  file,
  head,
  indexed,
  main,
  ORIGIN,
  plain,
  root,
  some,
  withCopy,
} from "../support/site.mjs";

// A card: a PNG of the size every service expects, at the address the page gives.
test("every page has a card: a 1200 × 630 PNG under 300 kB, at the address its head gives", () => {
  assert.ok(indexed.length > 0, "no page may be listed by a search engine");
  const cards = [];
  for (const p of indexed) {
    const src = attr(p, /property="og:image"/, "content");
    const at = src && join(root, new URL(src).pathname);
    if (!at || !existsSync(at)) {
      cards.push(`${p.path} (no card at ${src})`);
      continue;
    }
    const png = readFileSync(at);
    const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
    if (png.toString("latin1", 1, 4) !== "PNG" || w !== 1200 || h !== 630)
      cards.push(`${p.path} (${w} × ${h})`);
    else if (png.length > 300_000)
      cards.push(`${p.path} (${Math.round(png.length / 1024)} kB)`);
    if (attr(p, /name="twitter:card"/, "content") !== "summary_large_image")
      cards.push(`${p.path} (does not ask for the large card)`);
  }
  assert.deepEqual(some(cards), []);
});

// Icons: the ones a page names, and the one that is asked for by its address
// alone, by a browser that does not read the SVG or by a service drawing a
// link to the site.
test("every icon a page names is in the build, and /favicon.ico with it", () => {
  const icons = new Set();
  for (const p of built)
    for (const [tag] of head(p).matchAll(
      /<link\b[^>]*\brel="(?:icon|apple-touch-icon)"[^>]*>/g,
    )) {
      const href = /\shref="([^"]*)"/.exec(tag)?.[1];
      if (!href || !exists(href))
        icons.add(`${p.path} names ${href}, which is not in the build`);
    }
  const ico = join(root, "favicon.ico");
  // an .ico file opens with two zero bytes and the number 1
  if (!existsSync(ico) || readFileSync(ico).readUInt32LE(0) !== 0x00010000)
    icons.add("there is no /favicon.ico");
  assert.deepEqual(some([...icons]), []);
});

// Markdown: the page's own title and sections, and none of its markup.
test("every page's Markdown copy opens with its title, has each of its sections, carries no markup and gives its address", () => {
  assert.ok(withCopy.length > 0, "no page names a copy of itself");
  const copies = [];
  for (const p of withCopy) {
    const href = copyOf(p);
    if (!exists(href)) {
      copies.push(`${p.path} (no file at ${href})`);
      continue;
    }
    const md = file(href);
    const body = main(p);
    const h1 = plain(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(body)?.[1] ?? "");
    if (!md.startsWith(`# ${h1}\n`))
      copies.push(`${p.path} (does not open with the page's title)`);
    if (body.includes('class="flow-steps"')) {
      const count = [...body.matchAll(/class="flow-step\s/g)].length;
      const numbered = [...md.matchAll(/^### (\d+)\. /gm)].map((m) =>
        Number(m[1]),
      );
      if (numbered.length !== count || numbered.some((n, i) => n !== i + 1))
        copies.push(
          `${p.path} (flow step numbering is not complete and sequential)`,
        );
    }
    // outside code samples, nothing of the page's markup comes through
    const prose = md
      .replace(/^\s*```[\s\S]*?^\s*```/gm, "")
      .replace(/`[^`\n]*`/g, "");
    const tag =
      /<\/?(div|span|p|a|svg|button|script|style|table|li|ul|ol|h[1-6])\b[^>]*>/.exec(
        prose,
      );
    if (tag) copies.push(`${p.path} (markup in the text: ${tag[0]})`);
    // Three things a conversion leaves behind when it has gone wrong: a
    // character no one sees where a space should be, a list entry whose term
    // is missing, and one heading printed twice.
    if (/[​‌⁠]/.test(md))
      copies.push(`${p.path} (an invisible character in the text)`);
    if (/^- : /m.test(md)) copies.push(`${p.path} (an entry with no term)`);
    const headings = md.match(/^#{2,3} .+$/gm) ?? [];
    const twice = headings.find((h, i) => headings.indexOf(h) !== i);
    if (twice) copies.push(`${p.path} (a heading printed twice: ${twice})`);
    // every section of the page is a section of the copy
    const sections = [...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
      plain(m[1]),
    );
    const lines = md.split("\n");
    const lost = sections.filter(
      (t) =>
        !lines.some(
          (l) =>
            /^#{2,4} /.test(l) &&
            l.replace(/[\\*_`]/g, "").includes(t.replace(/[*_`]/g, "")),
        ),
    );
    if (lost.length)
      copies.push(
        `${p.path} (sections missing: ${lost.slice(0, 3).join(", ")})`,
      );
    if (!md.includes(`${ORIGIN}${p.path}`))
      copies.push(`${p.path} (does not give the page's address)`);
    // the footer is left out of a copy, and what it says about the review is not
    const month = /Standards status last reviewed ([A-Z][a-z]+ \d{4})/.exec(
      p.html,
    )?.[1];
    if (!month || !md.includes(`last reviewed ${month}`))
      copies.push(`${p.path} (does not say when the site was last reviewed)`);
  }
  assert.deepEqual(some(copies), []);
});

// A sequence diagram is the one drawing with a form in text: Mermaid, written
// from the drawing when the copy is made. The steps in words are beside it on
// the page and under it in the copy, so each is checked against the other.
test("every sequence diagram is in its page's Markdown copy as Mermaid that parses, with each party and each step as the page's list of steps has it", () => {
  const wrong = [];
  let seen = 0;
  for (const p of withCopy) {
    const body = main(p);
    const drawn = body.split("<flow-diagram").length - 1;
    if (!drawn) continue;
    const md = file(copyOf(p));
    const blocks = [...md.matchAll(/^```mermaid\n([\s\S]*?)^```$/gm)].map(
      (m) => m[1],
    );
    if (blocks.length !== drawn) {
      wrong.push(
        `${p.path} (${drawn} sequence diagrams on the page, ${blocks.length} in the copy)`,
      );
      continue;
    }
    // one diagram to a page is all the site has, and all this reads
    if (drawn > 1) continue;
    seen++;
    const [source] = blocks;
    const said =
      kind(source) === "sequence" ? faults(source) : ["not a sequence diagram"];
    if (said.length) wrong.push(`${p.path} (${said[0]})`);

    const parties = [
      ...body.matchAll(/<text class="actor-label"[^>]*>([\s\S]*?)<\/text>/g),
    ].map((m) => plain(m[1]));
    const named = new Map(
      [...source.matchAll(/^ {4}participant (\w+) as (.+)$/gm)].map((m) => [
        m[1],
        m[2].replace(/#(\d+);/g, (_, c) => String.fromCharCode(c)),
      ]),
    );
    const names = [...named.values()];
    if (
      names.length !== parties.length ||
      parties.some((label, i) => !names[i].startsWith(label))
    )
      wrong.push(
        `${p.path} (the page draws ${parties.join(", ")}; the copy has ${names.join(", ")})`,
      );

    // each step of the list: its kind, and who acts on whom
    const steps = body
      .split(/<li class="flow-step /)
      .slice(1)
      .map((li) => ({
        kind: /^kind-(\w+)/.exec(li)?.[1],
        who: [
          ...li
            .slice(0, li.indexOf("<h3"))
            .matchAll(/<span class="who [^>]*>([\s\S]*?)<\/span>/g),
        ].map((m) => plain(m[1])),
      }));
    const lines = [
      ...source.matchAll(
        /^ {4}(?:Note over (\w+)|(\w+)(-->>|->>|--\)|-\))(\w+)): (\d+)\. \S/gm,
      ),
    ].map(([, alone, from, arrow, to, n]) => ({
      n: Number(n),
      arrow,
      who: (alone ? [alone] : [from, to]).map((id) => named.get(id) ?? id),
    }));
    if (lines.length !== steps.length || lines.some((l, i) => l.n !== i + 1)) {
      wrong.push(
        `${p.path} (${steps.length} steps on the page; the copy's diagram numbers ${lines.map((l) => l.n).join(", ")})`,
      );
      continue;
    }
    for (const [i, step] of steps.entries()) {
      const line = lines[i];
      const route =
        line.who.length === step.who.length &&
        step.who.every((label, k) => line.who[k].startsWith(label));
      // a response and a message out of band are dashed; one through the
      // browser or out of band has an open head; a local action is a note
      const style =
        step.who.length === 1
          ? !line.arrow
          : line.arrow?.startsWith("--") ===
              ["resp", "oob"].includes(step.kind) &&
            line.arrow?.endsWith(")") === ["front", "oob"].includes(step.kind);
      if (!route || !style)
        wrong.push(
          `${p.path} step ${i + 1} (the page: ${step.who.join(" → ")}, ${step.kind}; the copy: ${line.who.join(" → ")}, ${line.arrow ?? "a note"})`,
        );
    }
  }
  assert.ok(seen > 0, "no page with a copy draws a sequence diagram");
  assert.deepEqual(some(wrong), []);
});

// Reader modes discard CSS gaps. The status and reference need punctuation
// in the HTML itself, and Markdown must preserve it without adding another.
test("standard status and reference have a literal separator in HTML and Markdown", () => {
  let cards = 0;
  const wrong = [];
  for (const p of withCopy) {
    if (!exists(copyOf(p))) continue;
    const md = file(copyOf(p));
    for (const card of main(p).matchAll(
      /<a\b[^>]*class="card std"[^>]*>\s*<h4\b[^>]*>[^<]*<\/h4>\s*<div\b[^>]*class="std-meta"[^>]*>([\s\S]*?)<\/div>/g,
    )) {
      cards++;
      const row = plain(card[1]);
      if (!/\S\s+·\s+\S/.test(row) || /·\s*·/.test(row) || !md.includes(row))
        wrong.push(`${p.path}: ${row}`);
    }
  }
  assert.ok(cards > 0, "no page shows a standard's card");
  assert.deepEqual(some(wrong), []);
});

// After each step a flow says who holds what, and flags a credential as "new"
// or "used up". The copy has to say the same of each: a code that has been
// spent must not read as one just issued.
test("a credential flagged new or used up on a flow's page has the same flag in its Markdown copy", () => {
  const wrong = [];
  let seen = 0;
  const held = (md) =>
    md
      .split("\n")
      .filter((l) => l.startsWith("- **"))
      .join("\n")
      .replace(/\\/g, "");
  const count = (text, piece) => text.split(piece).length - 1;
  for (const p of withCopy) {
    const chips = [
      ...p.html.matchAll(
        /<span class="held-chip[^"]*"[^>]*><span class="held-flag"[^>]*>([^<]+)<\/span>([\s\S]*?)<\/span>(?=<span class="held-chip|<\/dd>)/g,
      ),
    ].map((m) => ({ flag: plain(m[1]), name: plain(m[2]) }));
    if (!chips.length) continue;
    seen += chips.length;
    const md = held(file(copyOf(p)));
    for (const flag of new Set(chips.map((c) => c.flag))) {
      const page = chips.filter((c) => c.flag === flag).length;
      const copy = count(md, ` (${flag})`);
      if (page !== copy)
        wrong.push(
          `${p.path} (“${flag}” ${page} times on the page, ${copy} in the copy)`,
        );
    }
    for (const c of chips)
      if (!md.replaceAll("~~", "").includes(`${c.name} (${c.flag})`))
        wrong.push(`${p.path} (${c.name} is not “${c.flag}” in the copy)`);
  }
  assert.ok(seen > 0, "no flow flags a credential new or used up");
  assert.deepEqual(some([...new Set(wrong)]), []);
});

// The case that shows it: in authorization code with PKCE the code is issued,
// then exchanged, and the token it buys is new at the step that spends it.
test("PKCE's authorization code is new when issued and used up once exchanged, in its copy and in llms-full.txt", () => {
  const expect = [
    ["authorization code (new)", true],
    ["~~authorization code~~ (used up)", true],
    ["access token (new)", true],
    ["~~authorization code~~ (new)", false],
  ];
  const off = [];
  for (const path of [
    "flows/authorization-code-pkce/index.md",
    "llms-full.txt",
  ]) {
    const text = file(path).replace(/\\/g, "");
    for (const [piece, wanted] of expect)
      if (text.includes(piece) !== wanted)
        off.push(`${path} ${wanted ? "lacks" : "has"} “${piece}”`);
  }
  assert.deepEqual(off, []);
});

test("llms.txt lists every page's Markdown copy, and every link in it leads to a file", () => {
  const llms = file("llms.txt");
  assert.ok(llms.startsWith("# "), "llms.txt does not open with a title");
  assert.ok(exists("llms-full.txt"), "there is no llms-full.txt");
  const listed = [
    ...llms.matchAll(/\]\(https:\/\/whosonfirst\.ai(\/[^)]*)\)/g),
  ].map((m) => m[1]);
  const expected = withCopy.map(copyOf);
  assert.deepEqual(
    some([
      ...expected
        .filter((e) => !listed.includes(e))
        .map((e) => `${e} not listed`),
      ...listed.filter((l) => !exists(l)).map((l) => `${l} listed, not built`),
    ]),
    [],
  );
});

// What a page tells a search engine: data that parses, about this page.
test("every page gives its own address as canonical and describes itself in structured data that parses", () => {
  assert.ok(indexed.length > 0, "no page may be listed by a search engine");
  const data = [];
  for (const p of indexed) {
    const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(
      head(p),
    );
    try {
      const graph = JSON.parse(m[1])["@graph"];
      const page = graph.find((n) => n["@type"] === "WebPage");
      if (page?.url !== `${ORIGIN}${p.path}`)
        data.push(`${p.path} (describes ${page?.url})`);
      if (!graph.some((n) => n["@type"] === "Person" && n.name))
        data.push(`${p.path} (does not say who makes the site)`);
    } catch {
      data.push(`${p.path} (no data, or data that does not parse)`);
    }
    if (attr(p, /rel="canonical"/, "href") !== `${ORIGIN}${p.path}`)
      data.push(`${p.path} (canonical address is not its own)`);
  }
  assert.deepEqual(some(data), []);
});

// Implementation records have their own review scope/date; generic page metadata must not
// attribute that limited review to the site author or the standards review date.
test("pages with implementation evidence make no whole-page reviewer claim", () => {
  const pages = built.filter(
    (p) =>
      p.path.startsWith("/implementations/") ||
      p.html.includes("data-implementation-reviewed"),
  );
  assert.ok(pages.some((p) => p.path === "/implementations/"));
  assert.ok(pages.some((p) => p.path === "/implementations/dpop/"));
  assert.ok(pages.some((p) => p.path === "/flows/dpop/"));
  for (const page of pages) {
    const scripts = [
      ...head(page).matchAll(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
      ),
    ];
    const graph = scripts.flatMap(
      (match) => JSON.parse(match[1])["@graph"] ?? [],
    );
    const webpage = graph.find((node) => node["@type"] === "WebPage");
    assert.ok(webpage, page.path);
    assert.equal(webpage.reviewedBy, undefined, page.path);
    assert.equal(webpage.lastReviewed, undefined, page.path);
  }
});

test("Implementations uses its published name and URLs in page metadata and Markdown navigation", () => {
  const records = built.filter((p) => p.path.startsWith("/implementations/"));
  assert.ok(records.length > 1);
  assert.ok(!built.some((p) => p.path.startsWith("/field/")));
  for (const page of records) {
    const title = plain(
      /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(main(page))?.[1] ?? "",
    );
    assert.match(
      title,
      page.path === "/implementations/"
        ? /^Implementations$/
        : / implementations and deployment reports$/,
    );
    assert.match(
      head(page),
      /Implementations|implementations and deployment reports/,
    );
    assert.ok(file(copyOf(page)).startsWith(`# ${title}\n`), page.path);
    assert.ok(!page.html.includes('href="/field/'), page.path);
  }
  const navigation = file("llms.txt");
  assert.match(navigation, /^## Implementations$/m);
  assert.ok(
    navigation.includes("https://whosonfirst.ai/implementations/dpop/index.md"),
  );
  assert.doesNotMatch(navigation, /https:\/\/whosonfirst\.ai\/field\//);
});

// Parameterized pages are not discovered by the sitemap’s filesystem glob.
test("the sitemap includes every indexable page, including implementation records", () => {
  const urls = [...file("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  assert.equal(new Set(urls).size, urls.length, "duplicate sitemap addresses");
  const missing = indexed.filter(
    (page) => !urls.includes(`${ORIGIN}${page.path}`),
  );
  assert.deepEqual(
    missing.map((page) => page.path),
    [],
  );
});

// scripts/indexnow.mjs chooses the pages a push changed by what each is made
// from, so a page left out here, or named only by files that are not there,
// would never be sent.
test("what each page in the sitemap is made from is beside it, and names a file that is there", () => {
  const urls = [...file("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  const sources = JSON.parse(file("sitemap-sources.json"));
  assert.deepEqual(Object.keys(sources), urls);
  const repo = join(root, "..", "..");
  const nowhere = Object.entries(sources)
    .filter(
      ([, names]) =>
        !names.some((name) => existsSync(join(repo, name.split("#")[0]))),
    )
    .map(([url, names]) => `${url} (${names.join(", ")})`);
  assert.deepEqual(some(nowhere), []);
});

// A date is given only where it is known, and then the same one everywhere it
// is given: a search engine trusts a sitemap's dates only while they hold up.
test("a page's date in the sitemap is the one in its structured data and in its footer, and none is in the future", () => {
  const listed = new Map(
    [
      ...file("sitemap.xml").matchAll(
        /<loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g,
      ),
    ].map(([, loc, lastmod]) => [new URL(loc).pathname, lastmod]),
  );
  const wrong = [];
  for (const p of indexed) {
    const graph = JSON.parse(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(
        head(p),
      )[1],
    )["@graph"];
    const said = graph.find((n) => n["@type"] === "WebPage").dateModified;
    const lastmod = listed.get(p.path);
    if (said !== lastmod)
      wrong.push(`${p.path} (sitemap ${lastmod}, structured data ${said})`);
    for (const n of graph.filter((n) => n["@type"] === "TechArticle"))
      if (n.dateModified !== said)
        wrong.push(`${p.path} (its article says ${n.dateModified})`);
    if (said && !(Date.parse(said) <= Date.now()))
      wrong.push(`${p.path} (${said} is not a date that has passed)`);
    const shown = /This page last changed <time datetime="([^"]*)"/.exec(
      p.html,
    )?.[1];
    if (shown && shown !== said)
      wrong.push(`${p.path} (footer ${shown}, structured data ${said})`);
    const published = graph.find((n) => n["@type"] === "WebPage").datePublished;
    if (published && !(Date.parse(published) <= Date.parse(said)))
      wrong.push(`${p.path} (published ${published}, after it last changed)`);
  }
  assert.deepEqual(some(wrong), []);
});

// A record's page shows the day its evidence was reviewed. That is one fact
// and the day the page last changed is another, so it gives both, and a
// review cannot be later than the last change to the record that carries it.
test("where pages are dated, a record's page says when it last changed as well as when its evidence was reviewed", () => {
  const changedOn = (p) =>
    /This page last changed <time datetime="([^"]*)"/.exec(p.html)?.[1];
  const records = indexed.filter((p) =>
    /^\/implementations\/[^/]+\/$/.test(p.path),
  );
  assert.ok(records.length > 1);
  if (!indexed.some(changedOn)) return; // a build without the history dates nothing
  const wrong = [];
  for (const p of records) {
    const changed = changedOn(p);
    const reviewed = /Evidence reviewed <time datetime="([^"]*)"/.exec(
      p.html,
    )?.[1];
    if (!changed) wrong.push(`${p.path} (does not say when it last changed)`);
    else if (!reviewed)
      wrong.push(`${p.path} (does not say when its evidence was reviewed)`);
    // a review is dated by its day alone, wherever it was made, so a day's grace
    else if (Date.parse(reviewed) - Date.parse(changed) > 24 * 60 * 60 * 1000)
      wrong.push(`${p.path} (reviewed ${reviewed}, after it last changed)`);
    if (
      changed &&
      !/\(<a href="[^"]*\/commits\/main\/src\/data\/implementations\/records\.ts"/.test(
        p.html,
      )
    )
      wrong.push(`${p.path} (does not link to the history of the records)`);
  }
  assert.deepEqual(some(wrong), []);
});

test("a page's Markdown copy ends with the date its footer gives", () => {
  const wrong = [];
  for (const p of withCopy) {
    const day = /This page last changed <time[^>]*>([^<]*)<\/time>/.exec(
      p.html,
    )?.[1];
    if (day && !file(copyOf(p)).includes(`This page last changed ${day}.`))
      wrong.push(p.path);
  }
  assert.deepEqual(some(wrong), []);
});

// A search result is a title and a description. Two pages that give the same
// one cannot be told apart there, and a search engine may show only one.
test("no two pages a search engine may list share a title or a description", () => {
  const shared = [];
  for (const [what, read] of [
    ["title", (p) => /<title>([^<]*)<\/title>/.exec(head(p))?.[1]],
    ["description", (p) => attr(p, /name="description"/, "content")],
  ]) {
    const seen = new Map();
    for (const p of indexed) {
      const text = read(p);
      if (!text) shared.push(`${p.path} (no ${what})`);
      else if (seen.has(text))
        shared.push(`${p.path} and ${seen.get(text)} (the same ${what})`);
      else seen.set(text, p.path);
    }
  }
  assert.deepEqual(some(shared), []);
});

// What a page offers a reader who wants it as text, and a browser that can
// load the next page ahead. Both are in every page, so both are read here.
test("every page with a Markdown copy links to it in its footer, and every page's speculation rules name only pages", () => {
  const wrong = [];
  for (const p of withCopy) {
    const footer = p.html.slice(p.html.indexOf('<footer class="site-footer"'));
    if (!footer.includes(`href="${copyOf(p)}" type="text/markdown"`))
      wrong.push(`${p.path} (no link to ${copyOf(p)} in its footer)`);
  }
  for (const p of built) {
    const rules = /<script type="speculationrules">([\s\S]*?)<\/script>/.exec(
      head(p),
    )?.[1];
    try {
      const where = JSON.parse(rules).prerender[0].where.and;
      // a page's address has no dot in it; every file's has
      assert.deepEqual(where, [
        { href_matches: "/*" },
        { not: { href_matches: "/*.*" } },
      ]);
    } catch {
      wrong.push(`${p.path} (no speculation rules, or not the ones expected)`);
    }
  }
  assert.ok(
    built.every((p) => !p.path.includes(".")),
    "a page has a dot in its address, which the speculation rules take for a file",
  );
  assert.deepEqual(some(wrong), []);
});

// IndexNow takes a list of changed pages only from whoever can put a key at
// the site's root: a file named for the key, holding the key.
test("the IndexNow key is served from the site's root and holds its own name", () => {
  const keys = readdirSync(root).filter((name) =>
    /^[0-9a-f]{8,128}\.txt$/.test(name),
  );
  assert.equal(keys.length, 1, `${keys.length} key files in the build`);
  assert.equal(file(keys[0]).trim(), keys[0].slice(0, -4));
});
