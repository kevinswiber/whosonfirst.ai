import * as astro from "@astrojs/cloudflare/entrypoints/server" with {
  type: "cf-worker",
};
import { bindings, defineConfig } from "cf/config";
import * as markdown from "./src/worker.ts" with { type: "cf-worker" };
import * as preview from "./workers/preview/index.mjs" with {
  type: "cf-worker",
};

export default defineConfig(({ mode, isPreview }) => ({
  worker: {
    name: "whosonfirst-ai",
    compatibilityDate: "2026-11-03",
    compatibilityFlags: ["global_fetch_strictly_public"],
    entrypoint: mode === "development" ? astro : isPreview ? preview : markdown,
    env: {
      ASSETS: bindings.assets(),
      ...(isPreview && {
        AI_SEARCH: bindings.aiSearchNamespace({ namespace: "whosonfirst" }),
        SEARCH_INSTANCE: bindings.text("whosonfirst-guide"),
        SEARCH_LIMITER: bindings.rateLimit({
          // Branch previews share a limiter separate from production search.
          namespace: "512806497",
          simple: { limit: 20, period: 60 },
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
