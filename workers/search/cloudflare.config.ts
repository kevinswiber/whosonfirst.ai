import { bindings, defineConfig } from "cf/config";

// The config runs under Node. The site has no dependency on Node’s types.
declare const process: { env: Record<string, string | undefined> };

const rateNamespace = process.env.SEARCH_RATE_NAMESPACE;
if (!rateNamespace || !/^\d+$/.test(rateNamespace))
  throw new Error(
    "Set SEARCH_RATE_NAMESPACE to the numeric namespace allocated to the search limiter.",
  );

export default defineConfig({
  worker: {
    name: process.env.SEARCH_WORKER_NAME ?? "whosonfirst-ai-search",
    entrypoint: "./index.mjs",
    compatibilityDate: "2026-11-03",
    workersDev: true,
    previewUrls: false,
    // The zone owner manages the same-origin route separately.
    env: {
      AI_SEARCH: bindings.aiSearchNamespace({
        namespace: process.env.SEARCH_NAMESPACE ?? "whosonfirst",
      }),
      SEARCH_INSTANCE: bindings.text(
        process.env.SEARCH_INSTANCE ?? "whosonfirst-guide",
      ),
      SEARCH_LIMITER: bindings.rateLimit({
        namespace: rateNamespace,
        simple: { limit: 20, period: 60 },
      }),
    },
    observability: { enabled: false },
  },
});
