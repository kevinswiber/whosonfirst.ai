// The site as it is deployed: the built files served by the Workers runtime,
// with src/worker.ts in front of the pages. test/unit/ covers how an Accept
// header is read. These ask the running site, so they also cover what only
// the host decides: which addresses reach the Worker, and which headers the
// files keep when the Worker is the one that sends them.
import { strict as assert } from "node:assert";
import { after, before, test } from "node:test";
import {
  built,
  copyOf,
  file,
  SITE_HEADERS,
  some,
  withCopy,
} from "../support/site.mjs";
import { startWorker } from "../support/worker.mjs";

const FLOW = "/flows/dpop/";
/** What a browser sends when it asks for a page. */
const BROWSER =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

let site;
before(async () => {
  site = await startWorker();
});
after(async () => {
  await site?.stop();
});

const ask = (path, headers = {}, method = "GET") =>
  fetch(`${site.origin}${path}`, { method, headers, redirect: "manual" });
const type = (answer) => answer.headers.get("content-type") ?? "";
const isMarkdown = (answer) => type(answer).startsWith("text/markdown");

test("a request that asks for Markdown gets every page's copy, as the build wrote it", async () => {
  assert.ok(withCopy.length > 50, "the pages with a copy were not found");
  const wrong = [];
  for (const p of withCopy) {
    const answer = await ask(p.path, { Accept: "text/markdown" });
    const body = await answer.text();
    if (answer.status !== 200) wrong.push(`${p.path} (${answer.status})`);
    else if (type(answer).toLowerCase() !== "text/markdown; charset=utf-8")
      wrong.push(`${p.path} (sent as ${type(answer)})`);
    else if (body !== file(copyOf(p)))
      wrong.push(`${p.path} (not the copy the build wrote)`);
    else if (answer.headers.get("content-location") !== copyOf(p))
      wrong.push(`${p.path} (does not say where its copy lives)`);
  }
  assert.deepEqual(some(wrong), []);
});

test("a browser gets every page, as the build wrote it", async () => {
  const wrong = [];
  for (const p of built) {
    const answer = await ask(p.path, { Accept: BROWSER });
    const body = await answer.text();
    if (answer.status !== 200) wrong.push(`${p.path} (${answer.status})`);
    else if (!type(answer).startsWith("text/html"))
      wrong.push(`${p.path} (sent as ${type(answer)})`);
    else if (body !== p.html) wrong.push(`${p.path} (not the page)`);
    else if (answer.headers.get("content-location"))
      wrong.push(`${p.path} (names another address for itself)`);
  }
  assert.deepEqual(some(wrong), []);
});

test("the Accept header is read by its rules, in the runtime the site is deployed to", async () => {
  const wants = {
    // what the agents that ask for Markdown send
    "text/markdown, text/html, */*": "markdown",
    "text/markdown,text/html;q=0.9,application/xhtml+xml;q=0.8,application/xml;q=0.7,image/webp;q=0.6,*/*;q=0.5":
      "markdown",
    "text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, */*;q=0.1":
      "markdown",
    // by weight
    "text/markdown;q=0.9, text/html;q=0.5": "markdown",
    "text/html, text/markdown;q=0.5": "page",
    "text/html, text/markdown;q=0": "page",
    "text/markdown;q=0": "page",
    // between equal weights: the more specific, then the one listed first
    "text/markdown, text/html": "markdown",
    "text/html, text/markdown": "page",
    "text/html, text/markdown;charset=utf-8": "markdown",
    "text/html;charset=utf-8, text/markdown": "page",
    "*/*, text/markdown": "markdown",
    // the weight wherever it is written, and a parameter the copy does not have
    "text/markdown;q=0.4;charset=utf-8": "markdown",
    "text/markdown;charset=iso-8859-1": "page",
    // Markdown not named
    "*/*": "page",
    "text/*": "page",
    "text/x-markdown": "page",
    "application/json": "page",
  };
  const wrong = [];
  for (const [accept, want] of Object.entries(wants)) {
    const answer = await ask(FLOW, { Accept: accept });
    await answer.arrayBuffer();
    const got = isMarkdown(answer) ? "markdown" : "page";
    if (got !== want) wrong.push(`${accept} (got the ${got})`);
  }
  assert.deepEqual(wrong, []);
});

test("two Accept lines are read as one list", async () => {
  const lines = new Headers();
  lines.append("Accept", "text/html;q=0.5");
  lines.append("Accept", "text/markdown");
  const answer = await ask(FLOW, lines);
  await answer.arrayBuffer();
  assert.ok(isMarkdown(answer));
});

test("either answer carries the headers every response does, and says it depends on Accept", async () => {
  assert.ok(SITE_HEADERS["content-security-policy"]);
  for (const accept of ["text/markdown", BROWSER]) {
    const answer = await ask(FLOW, { Accept: accept });
    await answer.arrayBuffer();
    for (const [name, value] of Object.entries(SITE_HEADERS))
      assert.equal(answer.headers.get(name), value, `${accept}: ${name}`);
    assert.match(answer.headers.get("vary") ?? "", /\baccept\b/i, accept);
  }
});

// At its own address a copy says noindex, so a search engine sends people to
// the page. At the page's address nothing should say to leave the page out.
test("a copy is kept out of a search index at its own address, and not at the page's", async () => {
  const own = await ask(copyOf(withCopy.find((p) => p.path === FLOW)));
  assert.equal(await own.text(), file(`${FLOW}index.md`));
  assert.equal(own.headers.get("x-robots-tag"), "noindex");
  const negotiated = await ask(FLOW, { Accept: "text/markdown" });
  await negotiated.arrayBuffer();
  assert.ok(isMarkdown(negotiated));
  assert.equal(negotiated.headers.get("x-robots-tag"), null);
});

test("a reader that already has the copy is told so, and HEAD is answered as GET would be", async () => {
  const first = await ask(FLOW, { Accept: "text/markdown" });
  await first.arrayBuffer();
  const tag = first.headers.get("etag");
  assert.ok(tag, "the copy has no entity tag");
  const again = await ask(FLOW, {
    Accept: "text/markdown",
    "If-None-Match": tag,
  });
  assert.equal(again.status, 304);
  assert.equal(await again.text(), "");
  // the page has another tag: having the copy does not mean having the page
  const page = await ask(FLOW, { Accept: BROWSER, "If-None-Match": tag });
  assert.equal(page.status, 200);
  await page.arrayBuffer();
  const head = await ask(FLOW, { Accept: "text/markdown" }, "HEAD");
  assert.equal(head.status, 200);
  assert.ok(isMarkdown(head));
  assert.equal(head.headers.get("content-location"), `${FLOW}index.md`);
  assert.equal(await head.text(), "");
});

test("a page with no copy answers with the page, and an address with no page with “not found”", async () => {
  const without = built.filter((p) => !withCopy.includes(p));
  assert.ok(without.length > 0, "every page has a copy, so nothing is tested");
  for (const p of without) {
    const answer = await ask(p.path, { Accept: "text/markdown" });
    assert.equal(answer.status, 200, p.path);
    assert.equal(await answer.text(), p.html, p.path);
  }
  const missing = await ask("/no-such-page/", { Accept: "text/markdown" });
  assert.equal(missing.status, 404);
  assert.ok(type(missing).startsWith("text/html"));
  assert.equal(await missing.text(), file("404.html"));
});

test("an address without its closing slash is sent on to the page, whatever it asks for", async () => {
  const answer = await ask(FLOW.slice(0, -1), { Accept: "text/markdown" });
  await answer.arrayBuffer();
  assert.ok(answer.status >= 300 && answer.status < 400, `${answer.status}`);
  assert.equal(
    new URL(answer.headers.get("location"), site.origin).pathname,
    FLOW,
  );
});

test("a file answers as itself, whatever the request asks for", async () => {
  for (const [path, sent] of [
    ["/llms.txt", "text/plain"],
    ["/sitemap.xml", "application/xml"],
    ["/favicon.svg", "image/svg+xml"],
    [`${FLOW}index.md`, "text/markdown"],
  ]) {
    for (const accept of ["text/markdown", "text/html, text/markdown;q=0"]) {
      const answer = await ask(path, { Accept: accept });
      await answer.arrayBuffer();
      assert.equal(answer.status, 200, path);
      assert.ok(type(answer).startsWith(sent), `${path}: ${type(answer)}`);
      assert.equal(answer.headers.get("content-location"), null, path);
    }
  }
});

test("only a reading is negotiated", async () => {
  const answer = await ask(FLOW, { Accept: "text/markdown" }, "POST");
  await answer.arrayBuffer();
  assert.ok(!isMarkdown(answer));
  assert.ok(answer.status >= 400, `${answer.status}`);
});
