// Exercise the preview entrypoint with the native build’s assets and local bindings.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import preview from "../../workers/preview/index.ts";

const output = new URL(
  "../../.cloudflare/output/v1/workers/default/",
  import.meta.url,
);
const asset = (path) => readFileSync(new URL(`assets/${path}`, output), "utf8");
const config = JSON.parse(
  readFileSync(new URL("worker.config.json", output), "utf8"),
);
const marker = JSON.parse(asset("search/release.json"));
const origin = "https://pr.example.test";

test("the native site preview carries the guide’s retrieval bindings", () => {
  const root = JSON.parse(
    readFileSync(new URL("../../config.json", output), "utf8"),
  );
  assert.equal(root.buildContext.isPreview, true);
  assert.equal(config.name, "whosonfirst-ai");
  assert.equal(config.routes, undefined);
  assert.equal(config.env.SEARCH_LIMITER.namespace, "512806497");
  // A preview answers searches, with the question in the query string.
  assert.equal(config.observability.redactQueryString, true);
  // The limit is a build variable, so that it is not written in the repository.
  assert.equal(
    config.env.SEARCH_LIMITER.simple.limit,
    Number(process.env.SEARCH_RATE_LIMIT),
  );
  assert.equal(config.env.ASSETS.type, "assets");
  // Previews count against production's daily budget, not one of their own.
  assert.deepEqual(config.env.SEARCH_BUDGET, {
    type: "durable-object",
    worker: "whosonfirst-ai-search",
    exportName: "SearchBudget",
  });
  assert.equal(config.env.SEARCH_DAILY_BUDGET.type, "secret");
  assert.equal(config.exports, undefined);
  assert.equal(config.env.AI_SEARCH.namespace, "whosonfirst");
  assert.equal(config.env.SEARCH_INSTANCE.value, "whosonfirst-guide");
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
  const payload = asset("search/preview-catalog.json");
  const record = JSON.parse(payload).records.find(
    ({ href }) => href === "/standards/rfc9449/",
  );
  const env = {
    ASSETS: {
      fetch(request) {
        assert.equal(request.url, `${origin}/search/preview-catalog.json`);
        return new Response(payload);
      },
    },
    SEARCH_INSTANCE: config.env.SEARCH_INSTANCE.value,
    SEARCH_LIMITER: { limit: () => ({ success: true }) },
    AI_SEARCH: {
      get(instance) {
        assert.equal(instance, "whosonfirst-guide");
        return {
          search: async () => ({ chunks: [{ item: { key: record.key } }] }),
        };
      },
    },
  };
  for (const json of [true, false]) {
    const request = new Request(
      `${origin}/search?q=proof+of+possession${json ? "&format=json" : ""}`,
      { headers: { "Sec-Fetch-Site": "same-origin" } },
    );
    const response = await preview.fetch(request, env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-Guide-Search-Commit"), marker.commit);
    assert.equal(
      response.headers.get("X-Guide-Search-Revision"),
      marker.revision,
    );
    if (json)
      assert.equal(
        (await response.json()).results[0].href,
        "/standards/rfc9449/",
      );
    else
      assert.match(await response.text(), /<a href="\/standards\/rfc9449\/"/);
  }
});
