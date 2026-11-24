/**
 * The two parts of the site Worker that search needs the Workers runtime for.
 * src/site.ts exports them beside the page handler, and cloudflare.config.ts
 * declares them.
 *
 * `Search` answers /search. src/worker.ts hands it the request, and Workers
 * Cache sits in front of it: a found answer is kept for each deployed version,
 * and a kept answer does not run this.
 *
 * `SearchBudget` counts the searches that reach AI Search in a UTC day.
 */
import { DurableObject, WorkerEntrypoint } from "cloudflare:workers";
import type { Assets } from "../lib/markdown-negotiation.ts";
import { type BudgetStorage, spend } from "./budget.ts";
import { type SearchBindings, siteSearch } from "./search.ts";

type Bindings = Omit<SearchBindings, "SEARCH_BUDGET"> & { ASSETS: Assets };

const search = siteSearch();

export class Search extends WorkerEntrypoint<Bindings> {
  fetch(request: Request): Promise<Response> {
    const { ASSETS, AI_SEARCH, SEARCH_INSTANCE, SEARCH_LIMITER } = this.env;
    return search(request, {
      ASSETS,
      AI_SEARCH,
      SEARCH_INSTANCE,
      SEARCH_LIMITER,
      SEARCH_DAILY_BUDGET: this.env.SEARCH_DAILY_BUDGET,
      SEARCH_RATE_DIAGNOSTICS_KEY: this.env.SEARCH_RATE_DIAGNOSTICS_KEY,
      SEARCH_BUDGET: this.ctx.exports.SearchBudget,
    });
  }
}

/** The one counter for the daily cap. search.ts calls it by the name "guide". */
export class SearchBudget extends DurableObject {
  spend(cap: number): Promise<boolean> {
    return spend(this.ctx.storage as BudgetStorage, cap);
  }
}
