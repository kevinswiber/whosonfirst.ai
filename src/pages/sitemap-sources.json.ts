import type { APIRoute } from "astro";
import { pageSources } from "../lib/page-dates";
import { sitePages } from "../lib/site-pages";

/**
 * What each page in the sitemap is made from, by its address in the sitemap:
 * the names `madeFrom` in src/lib/page-sources.ts gives it, which are files,
 * directories ending in "/" and entries as `<file>#<name>`. scripts/indexnow.mjs
 * reads it to choose the pages a range of commits changed. It needs no
 * history, so a shallow build writes it in full.
 */
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL("https://whosonfirst.ai");
  const sources = Object.fromEntries(
    sitePages.map((u) => [new URL(u, base).href, pageSources(u)]),
  );
  return new Response(`${JSON.stringify(sources, null, 2)}\n`, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
