// The link put beside each section heading when a page is built:
// src/lib/section-links.ts. What it does to a page's HTML, with no build.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { linkSections, sectionSlug } from "../../src/lib/section-links.ts";

const LINK = (id, text) =>
  `<section-link class="section-link"><a href="#${id}" aria-label="Link to this section: ${text}">${ICON}</a></section-link>`;
// an icon, in the colour of the text, with no words of its own
const ICON =
  /<svg [^>]*aria-hidden="true"[^>]*><path [^>]*fill="currentColor"[^>]*\/><\/svg>/.exec(
    linkSections('<h2 id="x">X</h2>'),
  )?.[0];
/** The page with every link taken out again, and the names the headings were given. */
const bare = (html) =>
  html
    .replace(/<section-link[\s\S]*?<\/section-link>/g, "")
    .replace(/ aria-label="[^"]*"/g, "");

test("the link holds a drawing and no words", () => {
  const link = /<a [^>]*>([\s\S]*?)<\/a>/.exec(
    linkSections('<h2 id="x">X</h2>'),
  )[1];
  assert.equal(link.replace(/<[^>]*>/g, ""), "");
});

test("a heading with an id keeps it and gets a link to it, first in it, and its name is its own words", () => {
  const html = '<h2 id="how">How it works</h2><p>Text.</p>';
  assert.equal(
    linkSections(html),
    `<h2 id="how" aria-label="How it works">${LINK("how", "How it works")}How it works</h2><p>Text.</p>`,
  );
});

test("an h2 without an id is given the one the base layout's script would give it", () => {
  const out = linkSections("<h2>What it isn&#39;t — and why</h2>");
  assert.match(out, /<h2 id="what-it-isn-t-and-why" /);
  assert.match(out, /href="#what-it-isn-t-and-why"/);
  assert.equal(sectionSlug("A, B & C"), "a-b-c");
  assert.equal(sectionSlug("—"), "section");
});

test("an id is never one the page has, in the page or in its frame", () => {
  const out = linkSections(
    '<h2>Steps</h2><h2>Steps</h2><h2>Main</h2><div id="steps-3"></div><h2>Steps</h2>',
  );
  assert.deepEqual(
    [...out.matchAll(/<h2 id="([^"]+)"/g)].map((m) => m[1]),
    ["steps", "steps-2", "main-2", "steps-4"],
  );
});

test("an id that a heading has is not changed, and one a later heading has is not taken", () => {
  const out = linkSections('<h2>Setup</h2><h2 id="setup">Other</h2>');
  assert.match(out, /<h2 id="setup-2" [^>]*>.*<\/section-link>Setup/);
  assert.match(out, /<h2 id="setup" [^>]*>.*<\/section-link>Other/);
});

test("an h3 is linked only where it already has an id", () => {
  const out = linkSections('<h3>No id</h3><h3 id="has">Has id</h3>');
  assert.ok(out.startsWith("<h3>No id</h3>"));
  assert.ok(out.includes(LINK("has", "Has id")));
});

test("a heading is left alone in a link, a list item, a menu, a dialog, a card or a script's element", () => {
  const inside = (open, close, h = '<h3 id="x">Name</h3>') => open + h + close;
  const left = [
    inside('<a href="/y">', "</a>"),
    inside("<ul><li>", "</li></ul>"),
    inside("<nav>", "</nav>"),
    inside("<dialog>", "</dialog>"),
    inside('<div class="grid card flow">', "</div>"),
    inside("<token-inspector><div>", "</div></token-inspector>"),
    inside("<div hidden>", "</div>"),
    inside('<section class="lh-panel">', "</section>"),
    '<h2 id="x">A <a href="/y">linked</a> word</h2>',
  ];
  for (const html of left) assert.equal(linkSections(html), html, html);
});

test("a heading after one of those, and after elements left open, is linked", () => {
  const out = linkSections(
    '<ul><li>one<li>two</ul><nav><a href="/">x</a></nav><p>a<br>b<img src="i.png"></p><h2>After</h2>',
  );
  assert.ok(out.includes(LINK("after", "After")));
});

test("the name is the heading's text with its tags and character references read", () => {
  const out = linkSections(
    '<h2 id="t">The <code>iat</code> claim &amp; “time”</h2>',
  );
  assert.ok(out.includes('aria-label="The iat claim &amp; “time”"'), out);
  assert.ok(out.includes(LINK("t", "The iat claim &amp; “time”")));
});

test("a heading that is named already keeps its name", () => {
  const out = linkSections('<h2 id="t" aria-labelledby="u">Words</h2>');
  assert.ok(!/aria-label=/.test(out.replace(LINK("t", "Words"), "")));
  assert.ok(out.includes(LINK("t", "Words")));
});

test("a heading in a script, a style or a comment is not one", () => {
  const html =
    '<script>document.write("<h2>x</h2>"); if (a<b) {}</script><style>h2>a{}</style><!-- <h2 id="c">y</h2> --><h2 id="real">Real</h2>';
  const out = linkSections(html);
  assert.equal(out.match(/<section-link/g).length, 1);
  assert.ok(out.includes(LINK("real", "Real")));
});

test("everything but the links and the names is as it was", () => {
  const html =
    '<div class="a"><h2 data-x="1" id="a">One</h2><p>x &lt; y</p><h2 id="b">Two <em>2</em></h2><svg><path d="M0 0"/></svg><h3 id="c">Three</h3></div>';
  const out = linkSections(html);
  assert.notEqual(out, html);
  assert.equal(bare(out), html);
});

test("a page with no section heading comes back as it was", () => {
  const html = "<p>One</p><h1>Title</h1><h4>Small</h4>";
  assert.equal(linkSections(html), html);
});
