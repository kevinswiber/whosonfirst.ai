// Where the built site's links lead, and what lists its pages: the lessons
// index, the README, the deployment guides' way on and the previous and next
// links at the foot of a series of pages.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  built,
  exists,
  LESSON_ORDER,
  LESSONS,
  main,
  pageAt,
  some,
} from "../support/site.mjs";

test("the lessons index lists every lesson page", () => {
  assert.deepEqual(
    [...LESSON_ORDER].sort(),
    LESSONS,
    `${LESSON_ORDER.length} listed, ${LESSONS.length} built`,
  );
});

test("every internal link leads to a page, and every anchor to something on it", () => {
  const ids = new Map(
    built.map((p) => [
      p.path,
      new Set([...p.html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])),
    ]),
  );
  const broken = [];
  for (const p of built) {
    // links that a script writes into the page at run time are templates, not addresses
    const html = p.html.replace(/<script\b[\s\S]*?<\/script>/g, "");
    for (const [, href] of html.matchAll(/<a\s[^>]*?href="([^"]+)"/g)) {
      if (/^(https?:|mailto:)/.test(href)) continue;
      const url = new URL(href.replaceAll("&amp;", "&"), `http://x${p.path}`);
      const page = url.pathname.endsWith("/")
        ? url.pathname
        : `${url.pathname}/`;
      const anchor = decodeURIComponent(url.hash.slice(1));
      if (!ids.has(page)) {
        if (!exists(url.pathname))
          broken.push(`${p.path} → ${href} (no such page)`);
      } else if (anchor && !ids.get(page).has(anchor)) {
        broken.push(`${p.path} → ${href} (no such anchor)`);
      }
    }
  }
  assert.deepEqual(some(broken, 12), []);
});

// The README is what a visitor to the repository reads first, and it is
// written by hand. Every address it gives is on the site, it names every
// lesson, flow and deployment guide, and where it counts them it counts right.
test("README.md lists every lesson, flow and deployment guide, counts them right, and gives no address the site lacks", () => {
  const readme = readFileSync(
    new URL("../../README.md", import.meta.url),
    "utf8",
  );
  const given = [
    ...new Set(
      [...readme.matchAll(/https:\/\/whosonfirst\.ai(\/[^\s)"'`<>]*)/g)].map(
        (m) => m[1].replace(/[.,;:]+$/, ""),
      ),
    ),
  ];
  assert.ok(given.length > 0, "the README gives no address on the site");
  const wrong = [];
  for (const address of given) {
    const [path, section] = address.split("#");
    const page = pageAt(path);
    if (path.endsWith("/") ? !page : !exists(path))
      wrong.push(`${address} is not on the site`);
    else if (section && !page?.html.includes(` id="${section}"`))
      wrong.push(`${address} names no section of its page`);
  }
  const under = (dir) =>
    built.filter((p) => new RegExp(`^/${dir}/[^/]+/$`).test(p.path));
  for (const dir of ["learn", "flows", "deployments"])
    for (const p of under(dir))
      if (!given.includes(p.path)) wrong.push(`${p.path} is not listed`);
  for (const [word, dir] of [
    ["lessons", "learn"],
    ["flows", "flows"],
  ])
    for (const m of readme.matchAll(
      new RegExp(`\\b(\\d+) (?:short )?${word}\\b`, "g"),
    ))
      if (Number(m[1]) !== under(dir).length)
        wrong.push(`it says “${m[0]}”, and there are ${under(dir).length}`);
  assert.deepEqual(some(wrong), []);
});

// A deployment guide ends with a way on: the flows it names, the other
// guides and the decision guide. The index page lists every guide.
test("every deployment guide ends with a way on, drawn from the flows it names and the other guides", () => {
  const guides = built.filter((p) => /^\/deployments\/[^/]+\/$/.test(p.path));
  const index = pageAt("/deployments/");
  assert.ok(guides.length > 0, "no deployment guide was built");
  const wrong = [];
  for (const g of guides) {
    const m = /<nav class="way-on[^"]*"[\s\S]*?<\/nav>/.exec(g.html);
    if (!m) {
      wrong.push(`${g.path} has no way on at its end`);
      continue;
    }
    const hrefs = [...m[0].matchAll(/href="([^"#]+)"/g)].map((x) => x[1]);
    if (!hrefs.includes("/guide/"))
      wrong.push(`${g.path} does not link to the decision guide`);
    if (!hrefs.some((h) => h.startsWith("/flows/")))
      wrong.push(`${g.path} names no flow`);
    if (
      !hrefs.some((h) => guides.some((o) => o.path === h && o.path !== g.path))
    )
      wrong.push(`${g.path} links to no other guide`);
    if (hrefs.includes(g.path)) wrong.push(`${g.path} links to itself`);
    if (g.html.lastIndexOf('class="article"') > g.html.indexOf(m[0]))
      wrong.push(`${g.path} puts the way on before its text`);
    const text = g.html.slice(
      g.html.indexOf('class="article"'),
      g.html.indexOf(m[0]),
    );
    for (const h of hrefs.filter((h) => h.startsWith("/flows/")))
      if (!text.includes(`href="${h}`))
        wrong.push(`${g.path} points to ${h}, which it does not name`);
    if (index && !index.html.includes(`href="${g.path}"`))
      wrong.push(`${g.path} is not on the index page`);
  }
  assert.deepEqual(some(wrong), []);
});

// A page that is one of a series ends with a link to the one before it and the
// one after it. The series is in the order its own index page lists it, so a
// page and its index cannot disagree about what comes next. A series has this
// only where its order is one a reader would follow: the lessons, the flows and
// the deployment guides. The standards, the implementations, the decision
// guide's cases and the comparisons are looked up one at a time, and have none.
test("the lessons, flows and deployment guides each end with a link to the page before and after, in the order their index lists them", () => {
  const listed = (index, pattern) => [
    ...new Set([...main(pageAt(index)).matchAll(pattern)].map((m) => m[1])),
  ];
  const series = [
    {
      name: "lesson",
      pages: LESSON_ORDER,
      // the first lesson goes back to the list, and the last goes on to what follows them
      before: "/learn/",
      after: "/learn/#next",
    },
    {
      name: "flow",
      // the "Side by side" table of the flows index is in the order of the catalog
      pages: listed(
        "/flows/",
        /<tr data-flow="[^"]*"[^>]*><td[^>]*><a href="(\/flows\/[a-z0-9-]+\/)"/g,
      ),
    },
    {
      name: "deployment guide",
      pages: listed("/deployments/", /href="(\/deployments\/[a-z0-9-]+\/)"/g),
    },
  ];
  const wrong = [];
  for (const { name, pages, before, after } of series) {
    if (pages.length < 2)
      wrong.push(`the index lists ${pages.length} ${name}s`);
    pages.forEach((path, i) => {
      const page = pageAt(path);
      const navs = [
        ...(page?.html.matchAll(/<nav class="pager[ "][\s\S]*?<\/nav>/g) ?? []),
      ];
      if (navs.length !== 1) {
        wrong.push(`${path} has ${navs.length} previous and next links`);
        return;
      }
      const to = (rel) => {
        const tag = new RegExp(`<a\\b[^>]*\\brel="${rel}"[^>]*>`).exec(
          navs[0][0],
        )?.[0];
        return tag && /\shref="([^"]*)"/.exec(tag)?.[1];
      };
      const [prev, next] = [to("prev"), to("next")];
      const [wantPrev, wantNext] = [
        pages[i - 1] ?? before,
        pages[i + 1] ?? after,
      ];
      if (prev !== wantPrev)
        wrong.push(`${path} goes back to ${prev}, not ${wantPrev}`);
      if (next !== wantNext)
        wrong.push(`${path} goes on to ${next}, not ${wantNext}`);
      // A lesson's "Go deeper" is an aside, and comes after the way on. Nothing
      // else has a section after it.
      const at = page.html.indexOf(navs[0][0]);
      if (name === "lesson") {
        if (page.html.indexOf('id="deeper"') < at)
          wrong.push(`${path} puts "Go deeper" before the next lesson`);
      } else if (
        /<h2\b/.test(page.html.slice(at, page.html.indexOf("</main>")))
      )
        wrong.push(`${path} has a section after its previous and next links`);
    });
  }
  assert.deepEqual(some(wrong), []);
});
