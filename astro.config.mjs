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
  }),
});
