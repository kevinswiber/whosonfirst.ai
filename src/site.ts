/**
 * The Worker that cloudflare.config.ts deploys: the page handler, and the two
 * parts of search that only the Workers runtime can run.
 *
 * They are joined here, and not in src/worker.ts, so that the page handler
 * can be read and tested without the runtime.
 */

export { Search, SearchBudget } from "./search/entrypoints.ts";
export { default } from "./worker.ts";
