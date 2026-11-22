import * as astro from "@astrojs/cloudflare/entrypoints/server" with {
  type: "cf-worker",
};
import { bindings, defineConfig, exports } from "cf/config";
import { searchLimit } from "./src/search/limit.ts";
import * as site from "./src/site.ts" with { type: "cf-worker" };

// Search is set up where the site is built and not written here: an account’s
// identifiers and its limits are its own. With neither variable, the site is
// built without search, and a search answers that it is unavailable. The site
// and a branch preview are built from the same settings, each with the values
// of the place that builds it.
function searchSettings() {
  const namespace = process.env.SEARCH_RATE_NAMESPACE;
  const written = process.env.SEARCH_RATE_LIMIT;
  if (!namespace && !written) return undefined;
  if (!namespace || !/^\d+$/.test(namespace))
    throw new Error(
      "Set SEARCH_RATE_NAMESPACE to the numeric namespace allocated to the search limiter.",
    );
  // The number, or a label, a colon and the number: src/search/limit.ts.
  const limit = searchLimit(written);
  if (limit === undefined)
    throw new Error(
      "Set SEARCH_RATE_LIMIT to the number of searches one address may make in a minute, alone or after a label and a colon.",
    );
  return {
    AI_SEARCH: bindings.aiSearchNamespace({
      namespace: process.env.SEARCH_NAMESPACE ?? "whosonfirst",
    }),
    SEARCH_INSTANCE: bindings.text(
      process.env.SEARCH_INSTANCE ?? "whosonfirst-guide",
    ),
    SEARCH_LIMITER: bindings.rateLimit({
      namespace,
      simple: { limit, period: 60 },
    }),
    // How many searches may reach AI Search in a UTC day. SearchBudget counts
    // them, and the cap is a secret of the Worker, and of a preview.
    SEARCH_DAILY_BUDGET: bindings.secret(),
  };
}

export default defineConfig(({ mode }) => {
  // `cf dev` serves the pages through Astro. What is built is src/site.ts.
  const built = mode !== "development";
  return {
    worker: {
      name: "whosonfirst-ai",
      compatibilityDate: "2026-11-20",
      compatibilityFlags: ["global_fetch_strictly_public"],
      entrypoint: built ? site : astro,
      env: {
        ASSETS: bindings.assets(),
        ...(built && searchSettings()),
      },
      // src/worker.ts serves the page as HTML or Markdown and hands /search
      // to Search. Workers Cache keeps a found answer in front of Search,
      // for each deployed version, and Search does not run when one is
      // reused. Nothing the page handler sends is kept.
      ...(built && {
        cache: { enabled: true },
        exports: {
          default: exports.worker({ cache: { enabled: false } }),
          Search: exports.worker({ cache: { enabled: true } }),
          SearchBudget: exports.durableObject({ storage: "sqlite" }),
        },
      }),
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
  };
});
