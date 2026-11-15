/**
 * Puts src/worker.ts in front of the pages, in the configuration the site is
 * deployed with.
 *
 * Every page here is built ahead of time, and for such a site the Cloudflare
 * adapter writes a configuration that has files and no Worker: it leaves out
 * the `main` of wrangler.jsonc. That configuration is `wrangler.json` in the
 * built site, and `wrangler deploy` is sent to it by `.wrangler/deploy/config.json`.
 * So this adds the Worker to it once the site is built:
 *
 * - `main`, the Worker. Wrangler bundles it when it deploys.
 * - `assets.binding`, the name the Worker reads the site's files by.
 * - `assets.run_worker_first`, the addresses the Worker stands in front of.
 *
 * The Worker chooses between a page and its Markdown copy, so it stands in
 * front of pages and nothing else. A page's address has no dot in it and a
 * file's has one, which is the rule the speculation rules on every page
 * already keep. Everything with a dot is served as a file, without the Worker:
 * styles, scripts, fonts, pictures, the Markdown copies at their own
 * addresses, the sitemap. In a pattern, `*` stands for any run of characters
 * and `!` takes what follows away:
 * https://developers.cloudflare.com/workers/static-assets/binding/#run_worker_first
 *
 * If the adapter stops writing that file, or starts writing a Worker of its
 * own, the build stops here and says so: a site deployed without this would
 * answer every request with the page, and nothing else would say why.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/** The Worker, from the root of the repository. */
export const WORKER = "src/worker.ts";
/** The addresses it stands in front of: all of them, less any with a dot. */
export const IN_FRONT_OF = ["/*", "!/*.*"];

/** The deployed configuration with the Worker added. `main` is its path from that file. */
export function withWorker(config, main) {
  if (config.main)
    throw new Error(
      `the deployed configuration already has a Worker, ${config.main}`,
    );
  if (!config.assets)
    throw new Error(
      "the deployed configuration has no files to stand in front of",
    );
  return {
    ...config,
    main,
    assets: {
      ...config.assets,
      binding: "ASSETS",
      run_worker_first: IN_FRONT_OF,
    },
  };
}

export default function markdownWorker() {
  let root;
  return {
    name: "markdown-worker",
    hooks: {
      "astro:config:done": ({ config }) => {
        root = fileURLToPath(config.root);
      },
      "astro:build:done": ({ dir, logger }) => {
        const file = join(fileURLToPath(dir), "wrangler.json");
        if (!existsSync(file))
          throw new Error(
            `[markdown-worker] ${relative(root, file)} was not written, so the Worker that answers a request for Markdown cannot be added to it`,
          );
        const main = relative(dirname(file), join(root, WORKER));
        const config = withWorker(JSON.parse(readFileSync(file, "utf8")), main);
        writeFileSync(file, JSON.stringify(config));
        logger.info(
          `${WORKER} stands in front of the pages (${IN_FRONT_OF.join(", ")})`,
        );
      },
    },
  };
}
