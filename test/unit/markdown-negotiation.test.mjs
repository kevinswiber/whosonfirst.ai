// Which form of a page a request gets, by its Accept header, and what the
// Worker in front of the pages sends for each: src/lib/markdown-negotiation.ts
// and src/worker.ts, with a store of files that is only a table here.
import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  IN_FRONT_OF,
  WORKER,
  withWorker,
} from "../../src/integrations/markdown-worker.mjs";
import {
  prefersMarkdown,
  ranges,
  respond,
  weightOf,
} from "../../src/lib/markdown-negotiation.ts";
import worker from "../../src/worker.ts";

const which = (headers) => headers.filter((accept) => !prefersMarkdown(accept));

// The examples the specifications give, with the weights they say follow.
test("the weights are the ones the RFCs' own examples give", () => {
  // RFC 9110, section 12.5.1, Table 5. Its sixth row, text/html;level=3 at
  // 0.7, is the last row of the older example below, whose header gives it.
  // https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
  const now =
    "text/*;q=0.3, text/plain;q=0.7, text/plain;format=flowed, text/plain;format=fixed;q=0.4, */*;q=0.5";
  assert.deepEqual(
    [
      "text/plain;format=flowed",
      "text/plain",
      "text/html",
      "image/jpeg",
      "text/plain;format=fixed",
    ].map((type) => weightOf(now, type)),
    [1, 0.7, 0.3, 0.5, 0.4],
  );
  // RFC 7231, section 5.3.2
  // https://www.rfc-editor.org/rfc/rfc7231#section-5.3.2
  const before =
    "text/*;q=0.3, text/html;q=0.7, text/html;level=1, text/html;level=2;q=0.4, */*;q=0.5";
  assert.deepEqual(
    [
      "text/html;level=1",
      "text/html",
      "text/plain",
      "image/jpeg",
      "text/html;level=2",
      "text/html;level=3",
    ].map((type) => weightOf(before, type)),
    [1, 0.7, 0.3, 0.5, 0.4, 0.7],
  );
  // and the two in prose: "I prefer audio/basic, but send me any audio type"
  assert.equal(weightOf("audio/*; q=0.2, audio/basic", "audio/basic"), 1);
  assert.equal(weightOf("audio/*; q=0.2, audio/basic", "audio/ogg"), 0.2);
  assert.equal(weightOf("audio/*; q=0.2, audio/basic", "text/html"), 0);
  const elaborate = "text/plain; q=0.5, text/html, text/x-dvi; q=0.8, text/x-c";
  assert.deepEqual(
    ["text/html", "text/x-c", "text/x-dvi", "text/plain"].map((type) =>
      weightOf(elaborate, type),
    ),
    [1, 1, 0.8, 0.5],
  );
});

// "Recipients SHOULD process any parameter named 'q' as weight, regardless of
// parameter ordering." The older grammar gave what followed the weight a
// meaning of its own, and RFC 9110 took that away.
test("the weight is the parameter named q, wherever it is written", () => {
  for (const header of [
    "text/markdown;charset=utf-8;q=0.4",
    "text/markdown;q=0.4;charset=utf-8",
    "text/markdown;Q=0.4;CHARSET=UTF-8",
  ]) {
    assert.equal(weightOf(header, "text/markdown;charset=utf-8"), 0.4, header);
    // and the other parameter is still the type's: a copy without it does not fit
    assert.equal(weightOf(header, "text/markdown"), 0, header);
  }
  assert.ok(!prefersMarkdown("text/html, text/markdown;q=0;charset=utf-8"));
  // a parameter the copy is not sent with, before the weight or after it
  assert.ok(!prefersMarkdown("text/markdown;q=1;ext=1"));
  assert.ok(!prefersMarkdown("text/markdown;ext=1;q=1"));
});

test("the agents known to ask for Markdown get it", () => {
  // What each sends, from Checkly's survey of February 2026:
  // https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/
  assert.deepEqual(
    which([
      "text/markdown, text/html, */*",
      "text/markdown,text/html;q=0.9,application/xhtml+xml;q=0.8,application/xml;q=0.7,image/webp;q=0.6,*/*;q=0.5",
      "text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, */*;q=0.1",
    ]),
    [],
  );
});

test("a request that names Markdown and prefers it to the page gets Markdown", () => {
  assert.deepEqual(
    which([
      "text/markdown",
      "TEXT/Markdown",
      "text/markdown;q=1",
      "text/markdown; q=1.000",
      // below 1, and still above the page
      "text/markdown;q=0.9, text/html;q=0.5",
      "text/html;q=0.5, text/markdown;q=0.9",
      "text/markdown;q=0.001",
      // the page comes under a wider range, which weighs less
      "text/markdown;q=0.5, text/*;q=0.4",
      "text/markdown;q=0.5, */*;q=0.1",
      // spaces and tabs where the grammar allows them
      "text/markdown ; q=0.7 , text/html ;q=0.7",
      "text/html;q=0.5,\ttext/markdown\t;\tq=1",
      // the charset the copy is sent in
      "text/markdown;charset=utf-8",
      'text/markdown; charset="UTF-8"; q=0.8, text/html;q=0.8',
      // empty places in the list and among the parameters
      ", text/markdown;;q=0.9 ,, text/html;q=0.8,",
    ]),
    [],
  );
});

// The RFC calls two types of the same weight “equally preferred” and leaves
// the choice to the server. The custom is the one named more specifically,
// and then the one the request lists first.
test("between equal weights, the form named more specifically wins, and then the one listed first", () => {
  assert.deepEqual(
    which([
      "text/markdown, text/html",
      "text/markdown;q=0.7, text/html;q=0.7",
      // the page comes under a wider range, wherever that range is listed
      "*/*, text/markdown",
      "text/*, text/markdown",
      "text/*;q=0.5, text/markdown;q=0.5",
      "text/html, text/markdown;charset=utf-8",
    ]),
    [],
  );
  const page = [
    "text/html, text/markdown",
    "text/html;q=0.7, text/markdown;q=0.7",
    "application/xhtml+xml, text/html, text/markdown",
    "text/html;charset=utf-8, text/markdown",
  ];
  assert.deepEqual(page.filter(prefersMarkdown), []);
});

test("a request that refuses Markdown, or prefers the page, gets the page", () => {
  const page = [
    // the one this was written for: Markdown is named, and refused
    "text/html, text/markdown;q=0",
    "text/html, text/markdown; q=0",
    "text/html, text/markdown;q=0.0",
    "text/markdown;q=0.000, text/html",
    "text/markdown\t;q=0, text/html",
    "text/markdown;q=0",
    // named, and weighed below the page
    "text/html, text/markdown;q=0.5",
    "text/markdown;q=0.8, text/html;q=0.9",
    "text/markdown;q=0.5, text/*;q=0.6",
    "text/markdown;q=0.5, */*",
    // the weight on the type itself counts, not the one on its family
    "text/*, text/markdown;q=0",
    "*/*, text/markdown;q=0",
  ];
  assert.deepEqual(page.filter(prefersMarkdown), []);
});

test("a request that does not name Markdown gets the page, whatever else it allows", () => {
  const page = [
    null,
    "",
    "*/*",
    "text/*",
    "text/html",
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    // a wider range that weighs more than the page does not name Markdown
    "text/html;q=0.4, */*;q=0.5",
    "text/html;q=0.4, text/*",
    "application/json",
    "text/x-markdown",
    "text/markdownx",
    "application/markdown",
    // a copy in another charset, or another flavor, is not one the site has
    "text/markdown;charset=iso-8859-1",
    "text/markdown;variant=CommonMark",
  ];
  assert.deepEqual(page.filter(prefersMarkdown), []);
});

test("a range that is not written as the grammar has it is left out", () => {
  const page = [
    "text/markdown;q=2",
    "text/markdown;q=1.5",
    "text/markdown;q=0.1234",
    "text/markdown;q=",
    "text/markdown;q=high",
    "text/markdown;q=1;q=1",
    "*/markdown",
    "text/markdown/extra",
    "markdown",
  ];
  assert.deepEqual(page.filter(prefersMarkdown), []);
  // and the ranges beside it still count, in the order they were sent
  assert.ok(prefersMarkdown("nonsense, text/markdown"));
  assert.ok(prefersMarkdown("text/html;q=2, text/markdown, text/html"));
  assert.ok(!prefersMarkdown("text/markdown;q=2, text/html"));
});

test("a comma or a semicolon inside a quoted string does not end a range", () => {
  const sent = ranges('text/html;profile="a,b;q=0", text/markdown;q=0.5');
  assert.deepEqual(
    sent.map((r) => [`${r.type}/${r.subtype}`, r.q]),
    [
      ["text/html", 1],
      ["text/markdown", 0.5],
    ],
  );
  assert.equal(sent[0].params.get("profile"), "a,b;q=0");
});

// The store of files: an address and what is there.
const COPY = "# A page\n";
const store = (extra = {}) => {
  const asked = [];
  const files = {
    "/flows/dpop/": ["<h1>A page</h1>", { "Content-Type": "text/html" }],
    "/flows/dpop/index.md": [
      COPY,
      {
        "Content-Type": "text/markdown; charset=utf-8",
        "X-Robots-Tag": "noindex",
        Vary: "Accept",
        ETag: '"copy"',
      },
    ],
    "/styleguide/": ["<h1>Styles</h1>", { "Content-Type": "text/html" }],
    ...extra,
  };
  return {
    asked,
    async fetch(request) {
      const { pathname } = new URL(request.url);
      asked.push(`${request.method} ${pathname}`);
      const file = files[pathname];
      if (!file)
        return new Response("<h1>Not found</h1>", {
          status: 404,
          headers: { "Content-Type": "text/html" },
        });
      const [body, headers] = file;
      if (request.headers.get("if-none-match") === headers.ETag)
        return new Response(null, { status: 304, headers });
      return new Response(request.method === "HEAD" ? null : body, { headers });
    },
  };
};
const ask = (path, headers = {}, method = "GET") =>
  new Request(`https://whosonfirst.ai${path}`, { method, headers });

test("a request that prefers Markdown gets the page's copy, at the page's address", async () => {
  const files = store();
  const answer = await respond(
    ask("/flows/dpop/", { Accept: "text/markdown" }),
    files,
  );
  assert.equal(answer.status, 200);
  assert.equal(await answer.text(), COPY);
  assert.equal(
    answer.headers.get("content-type"),
    "text/markdown; charset=utf-8",
  );
  // where this form lives on its own, and that the answer depends on Accept
  assert.equal(answer.headers.get("content-location"), "/flows/dpop/index.md");
  assert.equal(answer.headers.get("vary"), "Accept");
  // the page's address is not one to leave out of an index
  assert.equal(answer.headers.get("x-robots-tag"), null);
  assert.deepEqual(files.asked, ["GET /flows/dpop/index.md"]);
});

test("a request that prefers the page gets it, and the copy is not read", async () => {
  for (const accept of ["text/html, text/markdown;q=0", "*/*", undefined]) {
    const files = store();
    const answer = await respond(
      ask("/flows/dpop/", accept ? { Accept: accept } : {}),
      files,
    );
    assert.equal(answer.headers.get("content-type"), "text/html", accept);
    assert.equal(answer.headers.get("content-location"), null, accept);
    assert.deepEqual(files.asked, ["GET /flows/dpop/"], accept);
  }
});

test("a page with no copy, and an address with no page, answer as they would without the Worker", async () => {
  const files = store();
  const plain = await respond(
    ask("/styleguide/", { Accept: "text/markdown" }),
    files,
  );
  assert.equal(plain.status, 200);
  assert.equal(plain.headers.get("content-type"), "text/html");
  const missing = await respond(
    ask("/nothing-here/", { Accept: "text/markdown" }),
    files,
  );
  assert.equal(missing.status, 404);
  // a file that is at index.md and is not Markdown is not a copy
  const odd = store({
    "/odd/": ["<p>Odd</p>", { "Content-Type": "text/html" }],
    "/odd/index.md": ["<p>Not it</p>", { "Content-Type": "text/html" }],
  });
  const answer = await respond(ask("/odd/", { Accept: "text/markdown" }), odd);
  assert.equal(await answer.text(), "<p>Odd</p>");
});

test("only a page's address is negotiated, and only for reading", async () => {
  const files = store();
  for (const request of [
    // not a page: no closing slash, or a file
    ask("/flows/dpop", { Accept: "text/markdown" }),
    ask("/flows/dpop/index.md", { Accept: "text/markdown" }),
    // not a reading
    ask("/flows/dpop/", { Accept: "text/markdown" }, "POST"),
  ])
    await respond(request, files);
  assert.deepEqual(files.asked, [
    "GET /flows/dpop",
    "GET /flows/dpop/index.md",
    "POST /flows/dpop/",
  ]);
});

test("a reader that already has the copy is told so, and HEAD is answered as GET would be", async () => {
  const current = await respond(
    ask("/flows/dpop/", { Accept: "text/markdown", "If-None-Match": '"copy"' }),
    store(),
  );
  assert.equal(current.status, 304);
  assert.equal(current.headers.get("content-location"), "/flows/dpop/index.md");
  const files = store();
  const head = await respond(
    ask("/flows/dpop/", { Accept: "text/markdown" }, "HEAD"),
    files,
  );
  assert.equal(
    head.headers.get("content-type"),
    "text/markdown; charset=utf-8",
  );
  assert.equal(await head.text(), "");
  assert.deepEqual(files.asked, ["HEAD /flows/dpop/index.md"]);
});

test("Vary names Accept once, beside whatever the file already varies by", async () => {
  const vary = async (sent) => {
    const files = store({
      "/a/index.md": [
        COPY,
        { "Content-Type": "text/markdown", ...(sent ? { Vary: sent } : {}) },
      ],
    });
    const answer = await respond(
      ask("/a/", { Accept: "text/markdown" }),
      files,
    );
    return answer.headers.get("vary");
  };
  assert.equal(await vary(undefined), "Accept");
  assert.equal(await vary("accept"), "accept");
  assert.equal(await vary("Accept-Encoding"), "Accept-Encoding, Accept");
  assert.equal(await vary("*"), "*");
});

test("if choosing fails, the Worker sends what is at the address", async () => {
  const files = store();
  let failed = false;
  const ASSETS = {
    async fetch(request) {
      if (new URL(request.url).pathname.endsWith("index.md") && !failed) {
        failed = true;
        throw new Error("the store did not answer");
      }
      return files.fetch(request);
    },
  };
  const error = console.error;
  console.error = () => {};
  try {
    const answer = await worker.fetch(
      ask("/flows/dpop/", { Accept: "text/markdown" }),
      { ASSETS },
    );
    assert.equal(answer.status, 200);
    assert.equal(answer.headers.get("content-type"), "text/html");
  } finally {
    console.error = error;
  }
  assert.ok(failed);
});

// A page's address has no dot in it, and a file's has one. The patterns are
// read here as the host reads them: `*` is any run of characters, and one
// that starts with `!` takes away.
test("the Worker stands in front of every page and of no file", () => {
  const matches = (pattern, path) =>
    new RegExp(
      `^${pattern
        .split("*")
        .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*")}$`,
    ).test(path);
  const inFront = (path) =>
    IN_FRONT_OF.some((p) => !p.startsWith("!") && matches(p, path)) &&
    !IN_FRONT_OF.some((p) => p.startsWith("!") && matches(p.slice(1), path));
  for (const page of [
    "/",
    "/flows/dpop/",
    "/guide/own-authority/",
    "/flows/dpop",
  ])
    assert.ok(inFront(page), page);
  for (const file of [
    "/flows/dpop/index.md",
    "/llms.txt",
    "/sitemap.xml",
    "/favicon.svg",
    "/og/flows/dpop.png",
    "/_astro/Base.01b6i8gf.css",
  ])
    assert.ok(!inFront(file), file);
});

test("the Worker is added to a configuration that has files and no Worker, and to no other", () => {
  const made = withWorker(
    {
      name: "site",
      assets: { directory: ".", not_found_handling: "404-page" },
    },
    "../../src/worker.ts",
  );
  assert.equal(made.main, "../../src/worker.ts");
  assert.deepEqual(made.assets, {
    directory: ".",
    not_found_handling: "404-page",
    binding: "ASSETS",
    run_worker_first: IN_FRONT_OF,
  });
  assert.equal(made.name, "site");
  assert.throws(() => withWorker({ main: "other.js", assets: {} }, "w.ts"));
  assert.throws(() => withWorker({ name: "site" }, "w.ts"));
  assert.ok(
    existsSync(fileURLToPath(new URL(`../../${WORKER}`, import.meta.url))),
  );
});

// The tests above are the cases someone thought of. These hold the reading
// to what must be true of any header, over a few thousand made from the
// grammar: the same ranges, weights and parameters, drawn by a generator that
// gives the same headers on every run.
const MADE = 3000;
const made = (seed) => {
  // mulberry32: small, and the same numbers on every machine
  let a = seed;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (list) => list[Math.floor(next() * list.length)];
  const range = () => {
    const type = pick([
      "text/markdown",
      "text/markdown",
      "text/html",
      "text/html",
      "text/*",
      "*/*",
      "text/plain",
      "image/png",
      "application/xhtml+xml",
    ]);
    return {
      type,
      charset:
        /^text\/(markdown|html)$/.test(type) && next() < 0.25
          ? pick(["utf-8", "utf-8", "iso-8859-1"])
          : undefined,
      q: pick([undefined, undefined, "1", "1.0", "0.9", "0.5", "0.001", "0"]),
    };
  };
  return {
    next,
    pick,
    header: () => Array.from({ length: 1 + Math.floor(next() * 5) }, range),
  };
};
/** A header as a careful sender writes it. */
const plainly = (header) =>
  header
    .map(
      (r) =>
        r.type +
        (r.charset ? `;charset=${r.charset}` : "") +
        (r.q === undefined ? "" : `;q=${r.q}`),
    )
    .join(", ");
/** The same header as the grammar also allows it: other case, spacing, order of parameters, quotes. */
const loosely = (header, { next, pick }) =>
  header
    .map((r) => {
      const cased = (s) => (next() < 0.5 ? s.toUpperCase() : s);
      const parameters = [];
      if (r.charset)
        parameters.push(
          `${cased("charset")}=${next() < 0.5 ? `"${cased(r.charset)}"` : cased(r.charset)}`,
        );
      if (r.q !== undefined) parameters.push(`${cased("q")}=${r.q}`);
      if (next() < 0.5) parameters.reverse();
      if (next() < 0.2) parameters.splice(Math.floor(next() * 2), 0, "");
      const gap = () => pick(["", " ", "\t", "  "]);
      return [cased(r.type), ...parameters].join(`${gap()};${gap()}`);
    })
    .join(`${pick(["", " ", "\t"])},${pick(["", " ", "\t", " ,"])}`);
const COPY_TYPE = "text/markdown;charset=utf-8";
const PAGE_TYPE = "text/html;charset=utf-8";
/** Runs `check` on each made header, and names the first few it fails for. */
const forEachMade = (check) => {
  const source = made(20261115);
  const failed = [];
  for (let i = 0; i < MADE; i++) {
    const header = source.header();
    const why = check(header, source);
    if (why) failed.push(`${plainly(header)} (${why})`);
  }
  assert.deepEqual(failed.slice(0, 5), []);
};

test("how a header is spelled does not change what it says", () => {
  forEachMade((header, source) => {
    const a = plainly(header);
    const b = loosely(header, source);
    if (weightOf(a, COPY_TYPE) !== weightOf(b, COPY_TYPE))
      return `the copy weighs differently as ${JSON.stringify(b)}`;
    if (weightOf(a, PAGE_TYPE) !== weightOf(b, PAGE_TYPE))
      return `the page weighs differently as ${JSON.stringify(b)}`;
    if (prefersMarkdown(a) !== prefersMarkdown(b))
      return `the answer differs as ${JSON.stringify(b)}`;
  });
});

test("the order of the ranges does not change the weight of any type", () => {
  forEachMade((header, { next }) => {
    const shuffled = header
      .map((r) => [next(), r])
      .sort(([a], [b]) => a - b)
      .map(([, r]) => r);
    for (const type of [COPY_TYPE, PAGE_TYPE, "text/plain", "image/png"])
      if (weightOf(plainly(header), type) !== weightOf(plainly(shuffled), type))
        return `${type} weighs differently as ${plainly(shuffled)}`;
  });
});

test("a weight of 1 written out is the weight a range has without one", () => {
  forEachMade((header) => {
    const written = header.map((r) => ({ ...r, q: r.q ?? "1" }));
    if (prefersMarkdown(plainly(header)) !== prefersMarkdown(plainly(written)))
      return "the answer differs with q=1 written out";
  });
});

test("a range for a type the site does not send changes nothing", () => {
  forEachMade((header, { next }) => {
    const other = { type: "image/png", q: next() < 0.5 ? undefined : "0.3" };
    const at = Math.floor(next() * (header.length + 1));
    const wider = [...header.slice(0, at), other, ...header.slice(at)];
    if (prefersMarkdown(plainly(header)) !== prefersMarkdown(plainly(wider)))
      return `the answer differs as ${plainly(wider)}`;
  });
});

// The weights are held to the RFC's own tables above. The answer has to
// follow from them: never Markdown where it is not named, is refused or
// weighs less than the page, and always where it is named and weighs more.
test("the answer follows from the weights", () => {
  let markdown = 0;
  let ties = 0;
  forEachMade((header) => {
    const sent = plainly(header);
    const named = header.some(
      (r) =>
        r.type === "text/markdown" &&
        (r.charset === undefined || r.charset === "utf-8"),
    );
    const copy = weightOf(sent, COPY_TYPE);
    const page = weightOf(sent, PAGE_TYPE);
    const answer = prefersMarkdown(sent);
    if (answer) markdown++;
    if (named && copy > 0 && copy === page) ties++;
    if (answer && !named) return "Markdown, and it is not named";
    if (answer && copy === 0) return "Markdown, and it is refused";
    if (answer && copy < page) return "Markdown, and the page weighs more";
    if (!answer && named && copy > page)
      return "the page, and Markdown weighs more";
  });
  // the generator reaches each kind of answer, so the test is not empty
  assert.ok(
    markdown > MADE / 20 && markdown < MADE / 2,
    `${markdown} got Markdown`,
  );
  assert.ok(ties > MADE / 50, `${ties} ties`);
});

// Between equal weights the choice is the server's, and it is made the same
// way whichever of the two forms it favors: turn the list around, and where
// both are named as specifically, the answer turns with it.
test("between equal weights named as specifically, the one listed first wins", () => {
  let turned = 0;
  forEachMade((header) => {
    const bare = header.filter((r) => r.charset === undefined);
    const copies = bare.filter((r) => r.type === "text/markdown");
    const pages = bare.filter((r) => r.type === "text/html");
    // one of each and no other way to weigh either, so order alone decides
    if (copies.length !== 1 || pages.length !== 1) return;
    if (header.length !== bare.length) return;
    const weight = (r) => Number(r.q ?? "1");
    if (weight(copies[0]) !== weight(pages[0]) || weight(copies[0]) === 0)
      return;
    turned++;
    const first = bare.indexOf(copies[0]) < bare.indexOf(pages[0]);
    if (prefersMarkdown(plainly(header)) !== first)
      return first
        ? "Markdown is first and the page won"
        : "the page is first and Markdown won";
    if (prefersMarkdown(plainly([...header].reverse())) === first)
      return "turned around, the answer did not turn";
  });
  assert.ok(turned > 20, `${turned} headers had such a tie`);
});
