import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";
import markdownPages from "./src/integrations/markdown-pages.mjs";
import pageDates from "./src/integrations/page-dates.mjs";
import searchPassages from "./src/integrations/search-passages.mjs";
import socialCards from "./src/integrations/social-cards.mjs";
import { codeThemes } from "./src/lib/code-themes.mjs";

export default defineConfig({
  site: "https://whosonfirst.ai",
  // Keep the Worker bundle even though every Astro route is prerendered.
  // What is deployed is src/site.ts: the page handler and search.
  output: "server",
  integrations: [
    mdx(),
    {
      name: "prerender-all",
      hooks: {
        "astro:route:setup": ({ route }) => {
          route.prerender = true;
        },
      },
    },
    pageDates(),
    socialCards(),
    markdownPages(),
    searchPassages(),
  ],

  markdown: {
    shikiConfig: {
      themes: codeThemes,
      defaultColor: false,
    },
  },

  session: false,

  adapter: cloudflare({
    imageService: "passthrough",
    prerenderEnvironment: "node",
    // `astro preview` runs the built Worker on this machine, with no account.
    // A search then finds its AI Search binding empty, and says so.
    remoteBindings: false,
    // The checks start one runtime for each file in test/worker/, at the same
    // moment, and two cannot share what one alone takes. Both would keep the
    // Worker’s state in .cloudflare/state, where each locks the other out of
    // the daily count’s storage. Both would open a debugger on port 9229, the
    // first that looks free to each. Either way one of them answers every
    // request with an error. So a runtime started by the checks keeps its
    // state in memory and opens no debugger.
    ...(process.env.WORKER_UNDER_TEST === "1" && {
      persistState: false,
      inspectorPort: false,
    }),
  }),
});
