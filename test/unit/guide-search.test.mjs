import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dailyBudget,
  secondsUntilTomorrow,
  spend,
} from "../../workers/search/budget.ts";
import {
  catalogFor,
  guideSearch,
  plainQuestion,
  rankedResults,
  searchAddress,
  searchRequest,
  validateShell,
} from "../../workers/search/search.ts";

const site = "https://example.org";
const shell =
  '<main><form method="get" action="/search"><input name="q"></form><span id="search-status-text"></span><ol id="search-results"></ol><a href="/guide/">Decision guide</a></main>';
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
// A search as the search box asks it, or, with html, as the form sends it
// after the redirect to the address's one spelling.
const submit = (q, { html = false, headers = {} } = {}) =>
  new Request(`${site}${searchAddress(plainQuestion(q), !html)}`, {
    headers: {
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": html ? "navigate" : "cors",
      ...headers,
    },
  });
const at = (path, headers = {}) => new Request(`${site}${path}`, { headers });
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
  assert.equal(
    response.headers.get("Cache-Control"),
    "public, max-age=0, s-maxage=172800",
  );
  assert.equal(response.headers.get("Vary"), null);
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
    submit('"<$&>', { html: true }),
    envFor(async () => ({ chunks: [chunk("flow.md", "b")] })),
  );
  const html = await response.text();
  assert.match(html, /value="&quot;&lt;\$&amp;&gt;"/);
  assert.match(html, /1 result</);
  assert.match(html, /data-search-submitted/);
  assert.match(html, /DPoP &amp; proofs/);
  assert.match(html, /&lt;proof&gt;/);
  assert.match(html, /action="\/search"/);
  assert.equal(
    response.headers.get("Content-Security-Policy"),
    "default-src 'self'",
  );
  assert.throws(() => validateShell("<main></main>"));
});
test("invalid requests are rejected without invoking AI Search", async () => {
  const env = {};
  for (const [request, status] of [
    [new Request(`${site}/search?q=word`, { method: "POST" }), 405],
    [at("/"), 404],
    [at("/api/search/query?q=word"), 404],
    [at(`/search?q=${"x".repeat(501)}`), 400],
    [at("/search?q=x&q=y"), 400],
    [submit("word", { headers: { "Sec-Fetch-Site": "cross-site" } }), 403],
    [submit("word", { headers: { "Sec-Purpose": "prefetch;prerender" } }), 503],
  ]) {
    const response = await handle(request, env);
    assert.equal(response.status, status, request.url);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
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

const memory = () => {
  const values = new Map();
  return {
    get: async (key) => values.get(key),
    put: async (key, value) => {
      values.set(key, value);
    },
  };
};

test("the daily budget counts to its cap and starts again at midnight UTC", async () => {
  const storage = memory();
  const today = new Date("2026-11-21T23:59:58Z");
  assert.equal(await spend(storage, 2, today), true);
  assert.equal(await spend(storage, 2, today), true);
  assert.equal(await spend(storage, 2, today), false);
  assert.equal(await spend(storage, 2, today), false);
  assert.equal(await spend(storage, 2, new Date("2026-11-22T00:00:00Z")), true);
  assert.equal(secondsUntilTomorrow(today), 2);
  assert.equal(secondsUntilTomorrow(new Date("2026-11-22T00:00:00Z")), 86400);
});

test("only a whole number above zero is a daily budget", () => {
  assert.equal(dailyBudget("2000"), 2000);
  assert.equal(dailyBudget(" 7 "), 7);
  for (const value of [
    undefined,
    "",
    "0",
    "-1",
    "1.5",
    "lots",
    "1e3",
    "99999999999999999999",
  ])
    assert.equal(dailyBudget(value), undefined, String(value));
});

test("search stops for the day once the budget is spent, and without a budget it stays off", async () => {
  let searched = 0;
  const search = async () => {
    searched++;
    return { chunks: [chunk("flow.md", "b")] };
  };
  const budgetFor = (left) => {
    let spent = 0;
    const calls = [];
    return {
      calls,
      binding: {
        idFromName: (name) => name,
        get: (id) => ({
          async spend(cap) {
            calls.push({ id, cap });
            if (spent >= Math.min(cap, left)) return false;
            spent++;
            return true;
          },
        }),
      },
    };
  };
  const one = budgetFor(1);
  const env = {
    ...envFor(search),
    SEARCH_BUDGET: one.binding,
    SEARCH_DAILY_BUDGET: "3",
  };
  assert.equal((await handle(submit("proof"), env)).status, 200);
  const spent = await handle(submit("proof"), env);
  assert.equal(spent.status, 503);
  assert.match((await spent.json()).error, /all it can for today/);
  assert.ok(Number(spent.headers.get("Retry-After")) > 0);
  assert.equal(searched, 1);
  assert.deepEqual(one.calls, [
    { id: "guide", cap: 3 },
    { id: "guide", cap: 3 },
  ]);

  const limited = budgetFor(10);
  await handle(submit("proof"), {
    ...envFor(search, false),
    SEARCH_BUDGET: limited.binding,
    SEARCH_DAILY_BUDGET: "3",
  });
  assert.equal(limited.calls.length, 0, "a refused address spends nothing");

  for (const secret of [undefined, "0", "many"]) {
    const unset = budgetFor(10);
    const response = await handle(submit("proof"), {
      ...envFor(search),
      SEARCH_BUDGET: unset.binding,
      SEARCH_DAILY_BUDGET: secret,
    });
    assert.equal(response.status, 503, String(secret));
    assert.equal(unset.calls.length, 0);
  }
  assert.equal(searched, 1);
});

test("AI Search reuses a cached answer only for a question worded almost the same, and an evaluation uses none", () => {
  assert.deepEqual(searchRequest("CIBA").ai_search_options.cache, {
    enabled: true,
    cache_threshold: "super_strict_match",
  });
  assert.deepEqual(
    searchRequest("CIBA", "keyword", false).ai_search_options.cache,
    { enabled: false },
  );
});

test("passages are ranked again by a model that reads them, and an evaluation can ask for AI Search's own order", () => {
  const { retrieval, reranking } = searchRequest("CIBA").ai_search_options;
  assert.deepEqual(reranking, {
    enabled: true,
    model: "@cf/baai/bge-reranker-base",
    match_threshold: 0,
  });
  assert.equal(
    retrieval.metadata_only,
    false,
    "the reranker skips passages it is not given the text of",
  );
  assert.equal(retrieval.match_threshold, 0.4);
  const plain = searchRequest("CIBA", "hybrid", false, false).ai_search_options;
  assert.deepEqual(plain.reranking, { enabled: false });
  assert.equal(plain.retrieval.metadata_only, true);
});

test("a passage found only by its meaning needs to be close to the question, since reranking finds the rest", () => {
  const many = ["near", "far", "worded", "unscored"].map((name, i) => ({
    ...records[1],
    key: `${name}.md`,
    href: `/flows/${name}/`,
    digest: `d${i}`,
  }));
  const scored = (record, scoring_details) => ({
    ...chunk(record.key, record.digest),
    ...(scoring_details && { scoring_details }),
  });
  const results = rankedResults(catalogFor(many), "museum opening hours", [
    scored(many[0], { vector_score: 0.4, reranking_score: 0.001 }),
    scored(many[1], { vector_score: 0.39, reranking_score: 0.9 }),
    scored(many[2], { keyword_score: 3.1, reranking_score: 0.2 }),
    scored(many[3]),
  ]);
  assert.deepEqual(
    results.map((r) => r.href),
    ["/flows/near/", "/flows/worded/", "/flows/unscored/"],
  );
});

test("a search says how long each step took, and nothing about the question", async () => {
  const sent = [];
  const env = {
    ...envFor(async (input) => {
      sent.push(input);
      return { chunks: [chunk("flow.md", "b")] };
    }),
    SEARCH_BUDGET: {
      idFromName: (name) => name,
      get: () => ({ spend: async () => true }),
    },
    SEARCH_DAILY_BUDGET: "10",
  };
  const response = await handle(submit("a private question"), env);
  assert.equal(response.status, 200);
  const timing = response.headers.get("Server-Timing");
  assert.match(timing, /^limit;dur=\d+, budget;dur=\d+, search;dur=\d+$/);
  assert.doesNotMatch(timing, /private/);
  assert.equal(
    sent[0].ai_search_options.cache.cache_threshold,
    "super_strict_match",
  );
  const limited = await handle(
    submit("q"),
    envFor(async () => ({}), false),
  );
  assert.match(limited.headers.get("Server-Timing"), /^limit;dur=\d+$/);
  const invalid = await handle(at("/"), {});
  assert.equal(invalid.headers.get("Server-Timing"), null);
});

test("each question has one address, with the reader's capitals, and every other spelling is sent there", async () => {
  assert.equal(searchAddress("Token exchange"), "/search?q=Token+exchange");
  assert.equal(
    searchAddress("RFC 9449", true),
    "/search?q=RFC+9449&format=json",
  );
  for (const [path, to] of [
    ["/search?q=Token%20exchange", "/search?q=Token+exchange"],
    ["/search?q=++Token++exchange+", "/search?q=Token+exchange"],
    [
      "/search?q=RFC+%EF%BC%99%EF%BC%94%EF%BC%94%EF%BC%99",
      "/search?q=RFC+9449",
    ],
    ["/search?format=json&q=CIBA", "/search?q=CIBA&format=json"],
    ["/search?q=CIBA&format=html", "/search?q=CIBA"],
    ["/search?q=CIBA&utm_source=x", "/search?q=CIBA"],
  ]) {
    const response = await handle(at(path), {});
    assert.equal(response.status, 308, path);
    assert.equal(response.headers.get("Location"), to);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
  for (const path of ["/search", "/search?q=", "/search?q=+"]) {
    const response = await handle(at(path), {});
    assert.equal(response.status, 302, path);
    assert.equal(response.headers.get("Location"), "/search/");
  }
});

test("a link to a search works from any site, but another site cannot run one in the background", async () => {
  const env = envFor(async () => ({ chunks: [chunk("flow.md", "b")] }));
  const followed = await handle(
    submit("DPoP proof", {
      html: true,
      headers: { "Sec-Fetch-Site": "cross-site" },
    }),
    env,
  );
  assert.equal(followed.status, 200);
  assert.match(await followed.text(), /1 result</);
  const background = await handle(
    submit("DPoP proof", { headers: { "Sec-Fetch-Site": "cross-site" } }),
    env,
  );
  assert.equal(background.status, 403);
  const typed = await handle(
    submit("DPoP proof", { html: true, headers: { "Sec-Fetch-Site": "none" } }),
    env,
  );
  assert.equal(typed.status, 200);
});

test("a search shows up to eight results, from a larger set of passages", () => {
  const many = Array.from({ length: 12 }, (_, i) => ({
    ...records[1],
    key: `page${i}.md`,
    href: `/flows/flow-${i}/`,
    digest: `d${i}`,
  }));
  const lookup = catalogFor(many);
  const results = rankedResults(
    lookup,
    "how does a token change hands",
    many.map((r) => chunk(r.key, r.digest)),
  );
  assert.equal(results.length, 8);
  assert.deepEqual(
    results.map((r) => r.href),
    many.slice(0, 8).map((r) => r.href),
  );
  assert.equal(
    searchRequest("how does a token change hands").ai_search_options.retrieval
      .max_num_results,
    24,
    "more passages are asked for than shown: some are dropped or share a page",
  );
});
