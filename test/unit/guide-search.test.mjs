import assert from "node:assert/strict";
import { test } from "node:test";
import {
  catalogFor,
  guideSearch,
  rankedResults,
  validateShell,
} from "../../workers/search/search.mjs";

const site = "https://example.org";
const url = `${site}/api/search/query`;
const shell =
  '<main><form method="post" action="/api/search/query"><input name="q"></form><span id="search-status-text"></span><ol id="search-results"></ol><a href="/guide/">Decision guide</a></main>';
const records = [
  {
    key: "proof.md",
    href: "/standards/rfc9449/",
    title: "OAuth 2.0 DPoP",
    type: "Standard",
    section: "",
    text: "The proof's key identifies the sender.",
    aliases: ["RFC 9449"],
    digest: "a",
  },
  {
    key: "flow.md",
    href: "/flows/dpop/#proof",
    title: "DPoP & proofs",
    type: "Flow",
    section: "Proof",
    text: "The protocol checks <proof> on the wire.",
    aliases: [],
    digest: "b",
  },
];
const catalog = catalogFor(records);
const handle = guideSearch(catalog, shell, {
  "Content-Security-Policy": "default-src 'self'",
});
const submit = (q, headers = {}, body = new URLSearchParams({ q })) =>
  new Request(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers,
    },
    body,
  });
const envFor = (search, success = true) => ({
  SEARCH_INSTANCE: "guide",
  SEARCH_LIMITER: { limit: async () => ({ success }) },
  AI_SEARCH: {
    get: (name) => {
      assert.equal(name, "guide");
      return { search };
    },
  },
});
const chunk = (key, digest) => ({ item: { key, metadata: { digest } } });

test("the Worker pins the standard for an exact RFC and serves only current, unique local passages", async () => {
  const env = envFor(async (input) => {
    assert.equal(input.ai_search_options.retrieval.retrieval_type, "hybrid");
    assert.equal(input.messages[0].content, "RFC-9449");
    return {
      chunks: [
        chunk("unknown.md", "a"),
        chunk("flow.md", "stale"),
        chunk("flow.md", "b"),
        chunk("flow.md"),
        chunk("proof.md", "a"),
      ],
    };
  });
  const response = await handle(submit("RFC-9449"), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const { results } = await response.json();
  assert.deepEqual(
    results.map((r) => r.href),
    records.map((r) => r.href),
  );
  assert.equal(results[1].excerpt, records[1].text);
  assert.deepEqual(Object.keys(results[1]).sort(), [
    "excerpt",
    "href",
    "section",
    "title",
    "type",
  ]);
});
test("the native form gets escaped page markup, a useful status and a way to search again", async () => {
  validateShell(shell);
  const response = await handle(
    submit('"<$&>', { Accept: "text/html" }),
    envFor(async () => ({ chunks: [chunk("flow.md", "b")] })),
  );
  const html = await response.text();
  assert.match(html, /value="&quot;&lt;\$&amp;&gt;"/);
  assert.match(html, /1 result</);
  assert.match(html, /data-search-submitted/);
  assert.match(html, /DPoP &amp; proofs/);
  assert.match(html, /&lt;proof&gt;/);
  assert.match(html, /action="\/api\/search\/query"/);
  assert.equal(
    response.headers.get("Content-Security-Policy"),
    "default-src 'self'",
  );
  assert.throws(() => validateShell("<main></main>"));
});
test("invalid requests are rejected without invoking AI Search", async () => {
  const env = {};
  for (const [request, status] of [
    [new Request(url), 405],
    [new Request(`${site}/`), 404],
    [submit("word", { Origin: "https://elsewhere.example" }), 403],
    [submit("word", { "Content-Type": "application/json" }), 415],
    [submit(" "), 400],
    [submit("x".repeat(501)), 400],
    [submit("x", {}, "q=x&q=y"), 400],
    [submit("x", {}, `q=${"x".repeat(8200)}`), 413],
  ])
    assert.equal((await handle(request, env)).status, status);
  assert.throws(() =>
    catalogFor([{ ...records[0], href: "//other.example/" }]),
  );
});
test("the Worker distinguishes service failures, rate limits and empty results", async () => {
  const search = async () => {
    throw new Error("provider diagnostic");
  };
  const failed = await handle(submit("q"), envFor(search));
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /provider diagnostic/);
  const limited = await handle(submit("q"), envFor(search, false));
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "60");
  const empty = await handle(
    submit("q"),
    envFor(async () => ({ chunks: [] })),
  );
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), { results: [] });
});

test("a retrieval that exceeds the Worker deadline returns a gateway timeout", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const started = Promise.withResolvers();
  const waiting = handle(
    submit("ciba"),
    envFor(() => {
      started.resolve();
      return new Promise(() => {});
    }),
  );
  await started.promise;
  t.mock.timers.runAll();
  const response = await waiting;
  assert.equal(response.status, 504);
  assert.match((await response.json()).error, /took too long/);
});

test("distinct pages lead before a second passage and unknown identifiers return no semantic neighbours", () => {
  const tracer = { ...records[1], key: "step.md", href: "/flows/dpop/#step" };
  const lookup = catalogFor([...records, tracer]);
  const matches = [chunk("flow.md"), chunk("step.md"), chunk("proof.md")];
  assert.deepEqual(
    rankedResults(lookup, "prove this call", matches).map((r) => r.href),
    [records[1].href, records[0].href, tracer.href],
  );
  assert.deepEqual(rankedResults(lookup, "XZ-9581", matches), []);
  assert.equal(
    rankedResults(lookup, "RFC9449", matches)[0].href,
    records[0].href,
  );
});
