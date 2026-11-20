// Exercise the deployable bundle with local bindings. A PR can test its assets
// and both handlers without a Cloudflare account or any search index writes.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import preview from "./.cloudflare/output/v1/workers/default/bundle/index.js";

const output = new URL(
  "./.cloudflare/output/v1/workers/default/",
  import.meta.url,
);
const asset = (path) => readFileSync(new URL(`assets/${path}`, output), "utf8");
const config = JSON.parse(
  readFileSync(new URL("worker.config.json", output), "utf8"),
);
const marker = JSON.parse(asset("search/release.json"));
const origin = "https://pr.example.test";

test("the preview targets only its dedicated Worker, Version URLs and limiter", () => {
  assert.equal(config.name, "whosonfirst-ai-preview");
  assert.equal(config.previewUrls, true);
  assert.equal(config.workersDev, false);
  assert.equal(config.routes, undefined);
  assert.equal(
    config.env.SEARCH_LIMITER.namespace,
    process.env.SEARCH_PREVIEW_RATE_NAMESPACE,
  );
  assert.equal(config.env.ASSETS.type, "assets");
  assert.equal(
    config.env.AI_SEARCH.namespace,
    process.env.SEARCH_NAMESPACE ?? "whosonfirst",
  );
  assert.equal(
    marker.commit,
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  );
});

test("the preview serves the site's HTML, negotiated Markdown and quick matches", async () => {
  const env = {
    ASSETS: {
      fetch(request) {
        const path = new URL(request.url).pathname.slice(1);
        return new Response(
          asset(path.endsWith("/") ? `${path}index.html` : path),
          {
            headers: {
              "Content-Type": path.endsWith(".md")
                ? "text/markdown"
                : "text/html",
            },
          },
        );
      },
    },
  };
  const url = `${origin}/flows/dpop/`;
  const page = await preview.fetch(new Request(url), env);
  assert.match(await page.text(), /id="global-search"/);
  const markdown = await preview.fetch(
    new Request(url, { headers: { Accept: "text/markdown" } }),
    env,
  );
  assert.equal(
    markdown.headers.get("Content-Location"),
    "/flows/dpop/index.md",
  );
  assert.match(await markdown.text(), /^# Sender-constrained tokens/);
  assert.ok(
    JSON.parse(asset("search/quick-matches.json")).some(
      (r) => r.href === "/standards/rfc9449/",
    ),
  );
});

test("same-origin search responses carry the release of the preview's pages", async () => {
  const env = {
    SEARCH_INSTANCE: config.env.SEARCH_INSTANCE.value,
    SEARCH_LIMITER: { limit: () => ({ success: true }) },
    AI_SEARCH: {
      get(instance) {
        assert.equal(
          instance,
          process.env.SEARCH_INSTANCE ?? "whosonfirst-guide",
        );
        return { search: async () => ({ chunks: [] }) };
      },
    },
  };
  for (const accept of ["application/json", "text/html"]) {
    const request = new Request(`${origin}/api/search/query`, {
      method: "POST",
      body: new URLSearchParams({ q: "RFC 9449" }),
      headers: { Accept: accept, Origin: origin },
    });
    const response = await preview.fetch(request, env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-Guide-Search-Commit"), marker.commit);
    assert.equal(
      response.headers.get("X-Guide-Search-Revision"),
      marker.revision,
    );
    if (accept === "application/json")
      assert.equal(
        (await response.json()).results[0].href,
        "/standards/rfc9449/",
      );
    else
      assert.match(await response.text(), /<a href="\/standards\/rfc9449\/"/);
  }
});
