// The other forms of a page: the card shown where its link is shared, its copy
// in Markdown, and what it tells a search engine about itself. Each is made
// from the page when the site is built (src/integrations/), and each is named
// in the page's own head, so the head is where this starts.
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
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

// Field records have their own review scope/date; generic page metadata must not
// attribute that limited review to the site author or the standards review date.
test("pages with field evidence make no whole-page reviewer claim", () => {
  const pages = built.filter(
    (p) =>
      p.path.startsWith("/implementations/") ||
      p.html.includes("data-field-reviewed"),
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
