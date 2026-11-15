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
} from "../../src/lib/markdown-negotiation.ts";
import worker from "../../src/worker.ts";

const which = (headers) => headers.filter((accept) => !prefersMarkdown(accept));

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
      // what follows the weight is not about the type
      "text/markdown;q=1;ext=1",
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
