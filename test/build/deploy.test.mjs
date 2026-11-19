// Read the Build Output that cf deploy uploads, alongside the files it serves.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assert, test } from "ubqtest";
import { WORKER_BUILD } from "../../scripts/built-site.mjs";
import { exists, root } from "../support/site.mjs";

const config = JSON.parse(
  readFileSync(join(WORKER_BUILD, "worker.config.json"), "utf8"),
);

test("the deployment has the Markdown Worker and serves files through its ASSETS binding", () => {
  const bundle = join(WORKER_BUILD, "bundle", config.manifest.mainModule);
  assert(existsSync(bundle));
  assert(!bundle.startsWith(root));
  const { sources } = JSON.parse(readFileSync(`${bundle}.map`, "utf8"));
  const worker = fileURLToPath(new URL("../../src/worker.ts", import.meta.url));
  assert(sources.some((source) => resolve(dirname(bundle), source) === worker));
  assert.equal(config.env.ASSETS.type, "assets");
});

test("the Worker stands in front of extensionless paths and files go straight to assets", () => {
  assert.deepEqual(config.assets.runWorkerFirst, ["/*", "!/*.*"]);
});

test("a missing address gets the site's own not found page", () => {
  assert.equal(config.assets.notFoundHandling, "404-page");
  assert(exists("404.html"));
});
