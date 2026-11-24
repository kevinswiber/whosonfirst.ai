// Read the Build Output that cf deploy uploads, alongside the files it serves.
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { WORKER_BUILD } from "../../scripts/built-site.mjs";
import { missingFromSearch } from "../../scripts/release.ts";
import { searchLimit } from "../../src/search/limit.ts";
import { exists, root } from "../support/site.mjs";

const config = JSON.parse(
  readFileSync(join(WORKER_BUILD, "worker.config.json"), "utf8"),
);
const source = (path) =>
  fileURLToPath(new URL(`../../${path}`, import.meta.url));

test("the deployment is one Worker: the page handler, search and its daily count", () => {
  const bundle = join(WORKER_BUILD, "bundle", config.manifest.mainModule);
  assert.ok(existsSync(bundle));
  assert.ok(!bundle.startsWith(root));
  const { sources } = JSON.parse(readFileSync(`${bundle}.map`, "utf8"));
  const bundled = new Set(sources.map((s) => resolve(dirname(bundle), s)));
  for (const path of [
    "src/worker.ts",
    "src/search/entrypoints.ts",
    "src/search/search.ts",
  ])
    assert.ok(bundled.has(source(path)), path);
  assert.equal(config.env.ASSETS.type, "assets");
  assert.equal(config.routes, undefined);
  // The question is in a search's query string.
  assert.equal(config.observability.redactQueryString, true);
  // A search is handed to another entrypoint of this Worker, not to another
  // Worker: no route can take /search?q= alone, since a route matches the
  // query string too.
  assert.equal(config.env.SEARCH, undefined);
  // Workers Cache keeps a found answer in front of Search, and nothing the
  // page handler sends: a page is chosen by the request's Accept header.
  assert.deepEqual(config.cache, { enabled: true });
  assert.deepEqual(config.exports, {
    default: { type: "worker", cache: { enabled: false } },
    Search: { type: "worker", cache: { enabled: true } },
    SearchBudget: { type: "durable-object", storage: "sqlite" },
  });
});

test("search is set up where the site is built, and no account's identifiers are in the repository", () => {
  const {
    SEARCH_RATE_NAMESPACE: namespace,
    SEARCH_RATE_LIMIT: limit,
    SEARCH_NAMESPACE = "whosonfirst",
    SEARCH_INSTANCE = "whosonfirst-guide",
  } = process.env;
  const bound = Object.keys(config.env).sort();
  if (!namespace && !limit) {
    // A build with neither variable, as a contributor's is, has no search.
    assert.deepEqual(bound, ["ASSETS"]);
    assert.ok(missingFromSearch(config).length);
    return;
  }
  assert.deepEqual(bound, [
    "AI_SEARCH",
    "ASSETS",
    "SEARCH_DAILY_BUDGET",
    "SEARCH_INSTANCE",
    "SEARCH_LIMITER",
    "SEARCH_RATE_DIAGNOSTICS_KEY",
  ]);
  assert.deepEqual(config.env.SEARCH_LIMITER, {
    type: "rate-limit",
    namespace,
    simple: { limit: searchLimit(limit), period: 60 },
  });
  assert.equal(config.env.AI_SEARCH.namespace, SEARCH_NAMESPACE);
  assert.equal(config.env.SEARCH_INSTANCE.value, SEARCH_INSTANCE);
  // The cap for the day is a secret, set on the Worker and on a preview.
  assert.deepEqual(config.env.SEARCH_DAILY_BUDGET, { type: "secret" });
  assert.deepEqual(config.env.SEARCH_RATE_DIAGNOSTICS_KEY, { type: "secret" });
  assert.deepEqual(missingFromSearch(config), []);
});

test("the Worker stands in front of extensionless paths and files go straight to assets", () => {
  assert.deepEqual(config.assets.runWorkerFirst, ["/*", "!/*.*"]);
});

test("a missing address gets the site's own not found page", () => {
  assert.equal(config.assets.notFoundHandling, "404-page");
  assert.ok(exists("404.html"));
});
