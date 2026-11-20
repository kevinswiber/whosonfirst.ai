import type { Assets } from "../../src/lib/markdown-negotiation.ts";
import pages from "../../src/worker.ts";
import {
  catalogFor,
  guideSearch,
  type SearchBindings,
  type SearchSiteData,
} from "../search/search.ts";

// Astro writes the catalog after rendering the pages. Cache the handler only
// after the asset has loaded so simultaneous requests never share pending I/O.
let search: ReturnType<typeof guideSearch> | undefined;
export default {
  async fetch(request: Request, env: SearchBindings & { ASSETS: Assets }) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/search/query") return pages.fetch(request, env);
    if (!search) {
      const asset = await env.ASSETS.fetch(
        new Request(new URL("/search/preview-catalog.json", url)),
      );
      if (!asset.ok)
        return new Response("Search is unavailable.", { status: 503 });
      const { records, shell, headers }: SearchSiteData = await asset.json();
      search = guideSearch(catalogFor(records), shell, headers);
    }
    return search(request, env);
  },
};
