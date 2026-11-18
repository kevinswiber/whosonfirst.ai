/**
 * The one piece of the site that runs when a page is asked for.
 *
 * The site is files: every page is built ahead of time, with a copy in
 * Markdown beside it. This Worker stands in front of the pages only to choose
 * between the two, by the request's `Accept` header. How it chooses is in
 * src/lib/markdown-negotiation.ts. It makes nothing itself: either answer is a
 * file the build wrote, read from the host's store of them.
 *
 * cloudflare.config.ts names this entrypoint and the addresses it handles.
 *
 * If anything here fails, the request gets what is at its address, as it
 * would with no Worker at all.
 */
import type { Assets } from "./lib/markdown-negotiation.ts";
import { respond } from "./lib/markdown-negotiation.ts";

export default {
  async fetch(request: Request, env: { ASSETS: Assets }): Promise<Response> {
    try {
      return await respond(request, env.ASSETS);
    } catch (error) {
      console.error("markdown negotiation failed", error);
      return env.ASSETS.fetch(request);
    }
  },
};
