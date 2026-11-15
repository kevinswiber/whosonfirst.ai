// The configuration the site is deployed with: `wrangler.json` in the built
// site, which `wrangler deploy` is sent to. The adapter writes it with files
// and no Worker, and src/integrations/markdown-worker.mjs adds the Worker that
// sends a page's Markdown copy to a request that asks for it.
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { IN_FRONT_OF } from "../../src/integrations/markdown-worker.mjs";
import { file, root } from "../support/site.mjs";

const config = JSON.parse(file("wrangler.json"));
const repository = fileURLToPath(new URL("../../", import.meta.url));

test("the site is deployed with the Worker that chooses between a page and its Markdown copy", () => {
  const main = resolve(root, config.main ?? "");
  assert.equal(main, join(repository, "src/worker.ts"));
  assert.ok(existsSync(main));
  // the Worker reads the site's files by this name
  assert.equal(config.assets.binding, "ASSETS");
  assert.deepEqual(config.assets.run_worker_first, IN_FRONT_OF);
  // the Worker's source is not one of the site's files
  assert.ok(!main.startsWith(root));
});

test("`wrangler deploy` is sent to that configuration", () => {
  const redirect = join(repository, ".wrangler/deploy/config.json");
  assert.ok(existsSync(redirect), "the build did not say where to deploy from");
  const { configPath } = JSON.parse(readFileSync(redirect, "utf8"));
  assert.equal(
    resolve(dirname(redirect), configPath),
    join(root, "wrangler.json"),
  );
});

// What the Worker falls back to has to be there: a page with no copy is
// answered with the page, and an address with no page with the site's own.
test("the files the Worker reads are served as the site's own: a missing address gets the “not found” page", () => {
  assert.equal(config.assets.not_found_handling, "404-page");
  assert.ok(existsSync(join(root, "404.html")));
});
