import pages from "../../src/worker.ts";
import { catalogFor, guideSearch } from "../search/search.mjs";

// Astro writes the catalog after rendering the pages. Cache the handler only
// after the asset has loaded so simultaneous requests never share pending I/O.
let search;
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/search/query") return pages.fetch(request, env);
    if (!search) {
      const asset = await env.ASSETS.fetch(
        new URL("/search/preview-catalog.json", url),
      );
      if (!asset.ok)
        return new Response("Search is unavailable.", { status: 503 });
      const { records, shell, headers } = await asset.json();
      search = guideSearch(catalogFor(records), shell, headers);
    }
    return search(request, env);
  },
};
