/**
 * The one piece of the site that runs when a page is asked for.
 *
 * The site is files: every page is built ahead of time, with a copy in
 * Markdown beside it. This Worker stands in front of the pages only to choose
 * between the two, by the request's `Accept` header. How it chooses is in
 * src/lib/markdown-negotiation.ts. It makes nothing itself: either answer is a
 * file the build wrote, read from the host's store of them.
 *
 * cloudflare.config.ts names the addresses it handles, and src/site.ts is
 * where it is joined to the rest of the Worker.
 *
 * One address is not a page: a search, at /search, is handed unchanged to
 * `Search`, another entrypoint of this same Worker, which src/search/ is.
 * Its answers are kept in front of it by Workers Cache, which a call from
 * here is answered from. Nothing this handler sends is kept.
 *
 * A build made to go back to two Workers binds the other one as SEARCH, and
 * the search is handed to it. cloudflare.config.ts says when.
 *
 * If anything here fails, the request gets what is at its address, as it
 * would with no Worker at all.
 */
import type { Assets } from "./lib/markdown-negotiation.ts";
import { respond } from "./lib/markdown-negotiation.ts";

interface Env {
  ASSETS: Assets;
  // Bound only in a build that hands a search to another Worker.
  SEARCH?: { fetch(request: Request): Promise<Response> };
}

/** The Worker's own entrypoints, as the runtime gives them to a handler. */
interface Context {
  exports: { Search: { fetch(request: Request): Promise<Response> } };
}

export default {
  async fetch(request: Request, env: Env, ctx: Context): Promise<Response> {
    try {
      if (new URL(request.url).pathname === "/search")
        return await (env.SEARCH ?? ctx.exports.Search).fetch(request);
      return await respond(request, env.ASSETS);
    } catch (error) {
      console.error("serving the page or the search failed", error);
      return env.ASSETS.fetch(request);
    }
  },
};
