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
  // The only production entrypoint is src/worker.ts.
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
  }),
});
