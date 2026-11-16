import type { APIRoute } from "astro";
import { pageDates } from "../lib/page-dates";
import { sitePages } from "../lib/site-pages";

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL("https://whosonfirst.ai");
  // A page says when it last changed only where that is known: from the
  // repository's history, which a build may not have. The date is the one in
  // the page's own structured data, so the two cannot disagree.
  const entry = (u: string) => {
    const lastmod = pageDates(u)?.modified;
    return `  <url><loc>${new URL(u, base).href}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
  };
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitePages.map(entry).join("\n")}
</urlset>
`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
