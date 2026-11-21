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
    // Production routes search to a separate Worker. A preview handles
    // /api/search/query here and forwards every other request it receives to
    // src/worker.ts, which serves the page as HTML or Markdown.
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
      }),
    },
    assets: {
      notFoundHandling: "404-page",
      // Pages have extensionless paths. Files with a dot go straight to assets.
      runWorkerFirst: ["/*", "!/*.*"],
    },
    observability: {
      enabled: true,
    },
  },
}));
