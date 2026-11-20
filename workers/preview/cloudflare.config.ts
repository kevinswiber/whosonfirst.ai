import { bindings, defineConfig } from "cf/config";

declare const process: { env: Record<string, string | undefined> };

const previewLimiter = process.env.SEARCH_PREVIEW_RATE_NAMESPACE;
if (!previewLimiter || !/^\d+$/.test(previewLimiter))
  throw new Error(
    "Set SEARCH_PREVIEW_RATE_NAMESPACE to the preview limiter’s numeric namespace.",
  );

export default defineConfig({
  worker: {
    name: "whosonfirst-ai-preview",
    entrypoint: "./index.mjs",
    compatibilityDate: "2026-11-20",
    compatibilityFlags: ["global_fetch_strictly_public"],
    workersDev: false,
    previewUrls: true,
    env: {
      ASSETS: bindings.assets(),
      AI_SEARCH: bindings.aiSearchNamespace({
        namespace: process.env.SEARCH_NAMESPACE ?? "whosonfirst",
      }),
      SEARCH_INSTANCE: bindings.text(
        process.env.SEARCH_INSTANCE ?? "whosonfirst-guide",
      ),
      SEARCH_LIMITER: bindings.rateLimit({
        namespace: previewLimiter,
        simple: { limit: 20, period: 60 },
      }),
    },
    assets: {
      notFoundHandling: "404-page",
      runWorkerFirst: ["/*", "!/*.*"],
    },
  },
});
