import * as astro from "@astrojs/cloudflare/entrypoints/server" with {
  type: "cf-worker",
};
import { bindings, defineConfig } from "cf/config";
import * as markdown from "./src/worker.ts" with { type: "cf-worker" };

export default defineConfig(({ mode }) => ({
  worker: {
    name: "whosonfirst-ai",
    compatibilityDate: "2026-11-03",
    compatibilityFlags: ["global_fetch_strictly_public"],
    entrypoint: mode === "development" ? astro : markdown,
    env: {
      ASSETS: bindings.assets(),
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
