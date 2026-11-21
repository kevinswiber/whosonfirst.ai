// Read the Build Output that cf deploy uploads, alongside the files it serves.
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { WORKER_BUILD } from "../../scripts/built-site.mjs";
import { exists, root } from "../support/site.mjs";

const config = JSON.parse(
  readFileSync(join(WORKER_BUILD, "worker.config.json"), "utf8"),
);

test("the deployment has the Markdown Worker and serves files through its ASSETS binding", () => {
  const bundle = join(WORKER_BUILD, "bundle", config.manifest.mainModule);
  assert.ok(existsSync(bundle));
  assert.ok(!bundle.startsWith(root));
  const { sources } = JSON.parse(readFileSync(`${bundle}.map`, "utf8"));
  const worker = fileURLToPath(new URL("../../src/worker.ts", import.meta.url));
  assert.ok(
    sources.some((source) => resolve(dirname(bundle), source) === worker),
  );
  assert.equal(config.env.ASSETS.type, "assets");
  // A search is handed to the search Worker, which has no route of its own:
  // a route matches the query string, so none can take /search?q= alone.
  assert.deepEqual(config.env.SEARCH, {
    type: "worker",
    worker: "whosonfirst-ai-search",
  });
  // The question is in that address's query string.
  assert.equal(config.observability.redactQueryString, true);
});

test("the Worker stands in front of extensionless paths and files go straight to assets", () => {
  assert.deepEqual(config.assets.runWorkerFirst, ["/*", "!/*.*"]);
});

test("a missing address gets the site's own not found page", () => {
  assert.equal(config.assets.notFoundHandling, "404-page");
  assert.ok(exists("404.html"));
});
