import { bindings, defineConfig, exports } from "cf/config";

// The config runs under Node. The site has no dependency on Node’s types.
declare const process: { env: Record<string, string | undefined> };

const rateNamespace = process.env.SEARCH_RATE_NAMESPACE;
if (!rateNamespace || !/^\d+$/.test(rateNamespace))
  throw new Error(
    "Set SEARCH_RATE_NAMESPACE to the numeric namespace allocated to the search limiter.",
  );
// The limits are set where the Worker is released, not written here.
const rateLimit = process.env.SEARCH_RATE_LIMIT;
if (!rateLimit || !/^[1-9]\d*$/.test(rateLimit))
  throw new Error(
    "Set SEARCH_RATE_LIMIT to the number of searches one address may make in a minute.",
  );
const name = process.env.SEARCH_WORKER_NAME ?? "whosonfirst-ai-search";

export default defineConfig({
  worker: {
    name,
    entrypoint: "./index.ts",
    compatibilityDate: "2026-11-20",
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
        simple: { limit: Number(rateLimit), period: 60 },
      }),
      // How many searches reach AI Search in a UTC day, counted in one place.
      SEARCH_BUDGET: bindings.durableObject({
        worker: name,
        exportName: "SearchBudget",
      }),
      SEARCH_DAILY_BUDGET: bindings.secret(),
    },
    exports: {
      SearchBudget: exports.durableObject({ storage: "sqlite" }),
    },
    // The application sends query text in the POST body and never logs it.
    observability: { enabled: true },
  },
});
