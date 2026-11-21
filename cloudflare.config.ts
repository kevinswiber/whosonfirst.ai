import * as astro from "@astrojs/cloudflare/entrypoints/server" with {
  type: "cf-worker",
};
import { bindings, defineConfig } from "cf/config";
import * as pages from "./src/worker.ts" with { type: "cf-worker" };
import * as pagesWithSearch from "./workers/preview/index.ts" with {
  type: "cf-worker",
};

// The config runs under Node. The site has no dependency on Node’s types.
declare const process: { env: Record<string, string | undefined> };

// A preview’s limit is a build variable in Workers Builds, not written here.
function previewRateLimit() {
  const limit = process.env.SEARCH_RATE_LIMIT;
  if (!limit || !/^[1-9]\d*$/.test(limit))
    throw new Error(
      "Set SEARCH_RATE_LIMIT to the number of searches one address may make in a minute on a preview.",
    );
  return Number(limit);
}

export default defineConfig(({ mode, isPreview }) => ({
  worker: {
    name: "whosonfirst-ai",
    compatibilityDate: "2026-11-03",
    compatibilityFlags: ["global_fetch_strictly_public"],
    // In production, src/worker.ts serves the page as HTML or Markdown and
    // hands /search to the search Worker. A preview answers /search here and
    // forwards every other request it receives to src/worker.ts.
    entrypoint:
      mode === "development" ? astro : isPreview ? pagesWithSearch : pages,
    env: {
      ASSETS: bindings.assets(),
      ...(isPreview && {
        AI_SEARCH: bindings.aiSearchNamespace({ namespace: "whosonfirst" }),
        SEARCH_INSTANCE: bindings.text("whosonfirst-guide"),
        SEARCH_LIMITER: bindings.rateLimit({
          // Branch previews share a limiter separate from production search.
          namespace: "512806497",
          simple: { limit: previewRateLimit(), period: 60 },
        }),
        // Previews spend the same AI Search queries as production, so they
        // count against the same daily budget, kept by the search Worker. The
        // cap is a secret in Previews Base.
        SEARCH_BUDGET: bindings.durableObject({
          worker: process.env.SEARCH_WORKER_NAME ?? "whosonfirst-ai-search",
          exportName: "SearchBudget",
        }),
        SEARCH_DAILY_BUDGET: bindings.secret(),
      }),
      // In production, src/worker.ts hands /search to the search Worker. A
      // call through a service binding is answered from that Worker's cache
      // when it can be, without running it.
      ...(!isPreview &&
        mode !== "development" && {
          SEARCH: bindings.worker({
            worker: process.env.SEARCH_WORKER_NAME ?? "whosonfirst-ai-search",
          }),
        }),
    },
    assets: {
      notFoundHandling: "404-page",
      // Pages have extensionless paths. Files with a dot go straight to assets.
      runWorkerFirst: ["/*", "!/*.*"],
    },
    observability: {
      enabled: true,
      // A search passes through this Worker, with the question in the query
      // string. Logs and traces drop it.
      redactQueryString: true,
    },
  },
}));
