// A page's date is the last change to anything it is made from, in
// src/lib/page-sources.ts. This checks that a change which reaches a page
// through shared data moves its date: a lesson through the list of lessons and
// the glossary, a flow through the standards it lists and its implementation
// record. And that a change to an entry the page does not show leaves it alone.
//
// Node strips the types from the file as it loads it; it imports nothing.
import { strict as assert } from "node:assert";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  datesFor,
  madeFrom,
  NOT_FOLLOWED,
} from "../../src/lib/page-sources.ts";

const site = {
  flows: [
    { slug: "dpop", standards: ["rfc9449", "rfc7519"] },
    { slug: "gnap", standards: ["rfc9635"] },
  ],
  lessons: [
    { slug: "tokens", teaches: ["Access token", "Claim"] },
    { slug: "what-the-api-sees", teaches: ["Credential"] },
  ],
  records: ["dpop"],
  glossaryStandards: ["rfc9449", "a2a"],
};
const day = (n) => `2026-11-${String(n).padStart(2, "0")}T12:00:00+00:00`;
/** The date a page gets when each named source last changed on the day given. */
const changed = (path, last) =>
  datesFor(
    madeFrom(path, site),
    Object.fromEntries(
      Object.entries(last).map(([name, n]) => [
        name,
        name.includes("#") ? { last: day(n) } : { first: day(1), last: day(n) },
      ]),
    ),
  );

test("a lesson is made from its page, its entry in the list of lessons and the terms it teaches", () => {
  assert.deepEqual(madeFrom("/learn/tokens/", site), [
    "src/pages/learn/tokens.astro",
    "src/data/learn/lessons.ts#tokens",
    "src/data/glossary.ts#Access token",
    "src/data/glossary.ts#Claim",
  ]);
});

test("a flow is made from its data, the standards it lists and its implementation record, where it has one", () => {
  assert.deepEqual(madeFrom("/flows/dpop/", site), [
    "src/data/flows/dpop.ts",
    "src/data/standards.ts#rfc9449",
    "src/data/standards.ts#rfc7519",
    "src/data/implementations/records.ts#dpop",
  ]);
  assert.deepEqual(madeFrom("/flows/gnap/", site), [
    "src/data/flows/gnap.ts",
    "src/data/standards.ts#rfc9635",
  ]);
});

test("a lesson's date moves when its title in the list of lessons does, or a term it teaches", () => {
  const page = { "src/pages/learn/tokens.astro": 11 };
  assert.equal(changed("/learn/tokens/", page).modified, day(11));
  const titled = changed("/learn/tokens/", {
    ...page,
    "src/data/learn/lessons.ts#tokens": 15,
  });
  assert.equal(titled.modified, day(15));
  assert.equal(titled.source, "src/data/learn/lessons.ts");
  assert.equal(
    changed("/learn/tokens/", { ...page, "src/data/glossary.ts#Claim": 13 })
      .modified,
    day(13),
  );
});

test("a flow's date moves when a standard it lists does, or its implementation record", () => {
  const flow = { "src/data/flows/dpop.ts": 12 };
  assert.equal(changed("/flows/dpop/", flow).modified, day(12));
  assert.equal(
    changed("/flows/dpop/", { ...flow, "src/data/standards.ts#rfc9449": 13 })
      .modified,
    day(13),
  );
  const evidence = changed("/flows/dpop/", {
    ...flow,
    "src/data/implementations/records.ts#dpop": 14,
  });
  assert.equal(evidence.modified, day(14));
  assert.equal(evidence.source, "src/data/implementations/records.ts");
});

test("a change to an entry a page does not show, or to the rest of a shared file, leaves its date alone", () => {
  const dates = changed("/flows/dpop/", {
    "src/data/flows/dpop.ts": 12,
    "src/data/standards.ts#rfc9635": 14,
    "src/data/implementations/records.ts#gnap": 14,
    "src/data/standards.ts": 14,
    "src/data/learn/lessons.ts#tokens": 15,
  });
  assert.equal(dates.modified, day(12));
});

test("a page was published when its own file was, however old the entries it shows", () => {
  const dates = datesFor(madeFrom("/flows/dpop/", site), {
    "src/data/flows/dpop.ts": { first: day(9), last: day(12) },
    "src/data/standards.ts#rfc9449": { last: day(3) },
  });
  assert.equal(dates.published, day(9));
  assert.equal(dates.modified, day(12));
  // an index is as old as its own page, not as the oldest file it lists
  assert.equal(
    datesFor(madeFrom("/flows/", site), {
      "src/pages/flows/index.astro": { first: day(10), last: day(10) },
      "src/data/flows/dpop.ts": { first: day(9), last: day(12) },
    }).published,
    day(10),
  );
  // and with no file of its own in the history, it has no dates at all
  assert.equal(
    datesFor(madeFrom("/flows/dpop/", site), {
      "src/data/standards.ts#rfc9449": { last: day(3) },
    }),
    undefined,
  );
});

test("an index that lists every entry is made from the whole file", () => {
  assert.ok(madeFrom("/standards/", site).includes("src/data/standards.ts"));
  assert.ok(madeFrom("/glossary/", site).includes("src/data/glossary.ts"));
  assert.ok(madeFrom("/learn/", site).includes("src/data/learn/lessons.ts"));
});

test("a comparison is made from its own file, both flows and the standards they list, and is as old as its file", () => {
  assert.deepEqual(madeFrom("/compare/dpop-vs-gnap/", site), [
    "src/data/comparisons/dpop-vs-gnap.ts",
    "src/data/flows/dpop.ts",
    "src/data/standards.ts#rfc9449",
    "src/data/standards.ts#rfc7519",
    "src/data/flows/gnap.ts",
    "src/data/standards.ts#rfc9635",
  ]);
  const dates = changed("/compare/dpop-vs-gnap/", {
    "src/data/comparisons/dpop-vs-gnap.ts": 15,
    "src/data/flows/dpop.ts": 12,
    "src/data/flows/gnap.ts": 16,
    "src/data/standards.ts#rfc9449": 17,
  });
  assert.equal(dates.modified, day(17));
  // a record's growth does not change what a comparison says
  assert.equal(
    changed("/compare/dpop-vs-gnap/", {
      "src/data/comparisons/dpop-vs-gnap.ts": 15,
      "src/data/implementations/records.ts#dpop": 18,
    }).modified,
    day(15),
  );
  assert.equal(
    datesFor(madeFrom("/compare/dpop-vs-gnap/", site), {
      "src/data/comparisons/dpop-vs-gnap.ts": { first: day(15), last: day(15) },
      "src/data/flows/dpop.ts": { first: day(9), last: day(12) },
    }).published,
    day(15),
  );
});

test("the first lesson's date moves when the data its figure is drawn from does", () => {
  assert.ok(
    madeFrom("/learn/what-the-api-sees/", site).includes(
      "src/data/learn/api-sees.ts",
    ),
  );
  assert.equal(
    changed("/learn/what-the-api-sees/", {
      "src/pages/learn/what-the-api-sees.astro": 11,
      "src/data/learn/api-sees.ts": 16,
    }).modified,
    day(16),
  );
});

test("the list of flows and the glossary move with the standards whose status they show, and no others", () => {
  assert.equal(
    changed("/flows/", {
      "src/pages/flows/index.astro": 10,
      "src/data/standards.ts#rfc9635": 16,
    }).modified,
    day(16),
  );
  assert.equal(
    changed("/glossary/", {
      "src/pages/glossary/index.astro": 10,
      "src/data/standards.ts#a2a": 16,
    }).modified,
    day(16),
  );
  for (const path of ["/flows/", "/glossary/"])
    assert.equal(
      changed(path, {
        [`src/pages${path}index.astro`]: 10,
        "src/data/standards.ts#unlisted": 16,
      }).modified,
      day(10),
    );
});

// The mapping is written by hand, and a page that starts to draw on a data
// file it is not dated by would go on giving its old date with nothing to say
// so. So every data file a page imports has to be on one of two lists: what
// the page is made from, or what it is not dated by, with the reason.
test("every data file a page imports either dates the page or is listed, with a reason, as not followed", () => {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const pages = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const at = join(dir, name);
      if (statSync(at).isDirectory()) walk(at);
      else if (/\.(astro|mdx)$/.test(name)) pages.push(at);
    }
  })(join(root, "src/pages"));
  assert.ok(pages.length > 20, "the pages were not found");

  // One address for each page file: a page made from data stands for the rest of its kind.
  const SAMPLE = { slug: "dpop", case: "own-authority", pair: "dpop-vs-gnap" };
  const address = (file) =>
    `/${relative(join(root, "src/pages"), file)
      .replace(/\.(astro|mdx)$/, "")
      .replace(/\[(\w+)\]/g, (_, name) => SAMPLE[name])
      .replace(/(^|\/)index$/, "")}/`.replace(/^\/\/$/, "/");
  const everything = { ...site, lessons: [...site.lessons] };
  for (const file of pages) {
    const lesson = /src\/pages\/learn\/([^/]+)\.astro$/.exec(file)?.[1];
    if (
      lesson &&
      lesson !== "index" &&
      !everything.lessons.some((l) => l.slug === lesson)
    )
      everything.lessons.push({ slug: lesson, teaches: [] });
  }

  const unlisted = [];
  for (const file of pages) {
    const page = relative(root, file);
    const made = madeFrom(address(file), everything);
    const imports = [
      ...readFileSync(file, "utf8").matchAll(
        /^import\s[^;]*?from\s+["'](\.[^"']*\/data\/[^"']+)["']/gm,
      ),
    ].map(([, spec]) => {
      const at = resolve(dirname(file), spec);
      const found = [at, `${at}.ts`, join(at, "index.ts")].find(
        (f) => existsSync(f) && statSync(f).isFile(),
      );
      return relative(root, found ?? at);
    });
    for (const data of new Set(imports)) {
      // a directory's index stands for the files beside it
      const about = data.endsWith("/index.ts") ? dirname(data) : data;
      const dates = made.some(
        (source) =>
          source === data ||
          source.startsWith(`${about}#`) ||
          source.startsWith(`${about}/`) ||
          (source.endsWith("/") && data.startsWith(source)),
      );
      const reason = NOT_FOLLOWED[page]?.[data] ?? NOT_FOLLOWED["*"][data];
      if (!dates && !reason) unlisted.push(`${page} imports ${data}`);
    }
  }
  assert.deepEqual(unlisted, []);
});
