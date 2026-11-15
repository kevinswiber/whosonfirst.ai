import type { APIRoute } from "astro";
import { comparisons } from "../data/comparisons";
import { flows } from "../data/flows";
import { cases } from "../data/guide";
import { implementationProfiles } from "../data/implementations";
import { pageDates } from "../lib/page-dates";

/** Static pages come from the filesystem; parameterized routes come from published data. */
const pages = Object.keys(import.meta.glob("./**/*.{astro,mdx}"))
  .map((p) =>
    p
      .replace(/^\./, "")
      .replace(/\.(astro|mdx)$/, "")
      .replace(/\/index$/, "/"),
  )
  .filter((p) => !p.includes("[") && p !== "/404")
  .map((p) => (p.endsWith("/") ? p : `${p}/`));

/**
 * When each record under /implementations/ was last reviewed: the date its
 * page shows, and the one its structured data gives.
 */
const reviewed = new Map(
  implementationProfiles.map((profile) => [
    `/implementations/${profile.slug}/`,
    profile.reviewedOn,
  ]),
);

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL("https://whosonfirst.ai");
  const urls = [
    ...pages,
    ...flows.map((f) => `/flows/${f.slug}/`),
    ...comparisons.map((c) => `/compare/${c.slug}/`),
    ...cases.map((s) => `/guide/${s.slug}/`),
    ...reviewed.keys(),
  ].sort();
  // A page says when it last changed only where that is known: from the
  // repository's history, which a build may not have. The date is the one in
  // the page's own structured data, so the two cannot disagree.
  const entry = (u: string) => {
    const lastmod = reviewed.get(u) ?? pageDates(u)?.modified;
    return `  <url><loc>${new URL(u, base).href}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
  };
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(entry).join("\n")}
</urlset>
`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
