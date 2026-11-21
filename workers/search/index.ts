import { DurableObject } from "cloudflare:workers";
import { headers, records, shell } from "./.astro/site.mjs";
import { type BudgetStorage, spend } from "./budget.ts";
import { catalogFor, guideSearch } from "./search.ts";

export default { fetch: guideSearch(catalogFor(records), shell, headers) };

/** The one counter for the daily cap. search.ts calls it by the name "guide". */
export class SearchBudget extends DurableObject {
  spend(cap: number): Promise<boolean> {
    return spend(this.ctx.storage as BudgetStorage, cap);
  }
}
