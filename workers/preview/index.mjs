// A version URL has one origin for the guide and its search form. Serve the
// exact handlers and assets published separately on the site's own origin.
import pages from "../../src/worker.ts";
import search from "../search/index.mjs";

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname === "/api/search/query")
      return search.fetch(request, env);
    return pages.fetch(request, env);
  },
};
