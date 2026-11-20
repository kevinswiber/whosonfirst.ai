import { headers, records, shell } from "./.astro/site.mjs";
import { catalogFor, guideSearch } from "./search.ts";

export default { fetch: guideSearch(catalogFor(records), shell, headers) };
