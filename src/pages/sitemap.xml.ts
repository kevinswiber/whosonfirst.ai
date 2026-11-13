import type { APIRoute } from "astro";
import { fieldProfiles } from "../data/field";
import { flows } from "../data/flows";

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

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL("https://whosonfirst.ai");
  const urls = [
    ...pages,
    ...flows.map((f) => `/flows/${f.slug}/`),
    ...fieldProfiles.map((profile) => `/implementations/${profile.slug}/`),
  ].sort();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${new URL(u, base).href}</loc></url>`).join("\n")}
</urlset>
`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
