/**
 * Every page the sitemap lists, by its address: the pages under src/pages/,
 * and the pages made from published data. src/pages/sitemap.xml.ts lists them
 * with their dates, and src/pages/sitemap-sources.json.ts with what each is
 * made from, so the two cannot list different pages.
 */
import { comparisonSlug, comparisons } from "../data/comparisons";
import { flows } from "../data/flows";
import { cases } from "../data/guide";
import { implementationProfiles } from "../data/implementations";
import { standards } from "../data/standards";

/** Static pages come from the filesystem; parameterized routes come from published data. */
const files = Object.keys(import.meta.glob("../pages/**/*.{astro,mdx}"))
  .map((p) =>
    p
      .replace(/^\.\.\/pages/, "")
      .replace(/\.(astro|mdx)$/, "")
      .replace(/\/index$/, "/"),
  )
  .filter((p) => !p.includes("[") && p !== "/404" && p !== "/search/")
  .map((p) => (p.endsWith("/") ? p : `${p}/`));

export const sitePages: string[] = [
  ...files,
  ...flows.map((f) => `/flows/${f.slug}/`),
  ...comparisons.map((c) => `/compare/${comparisonSlug(c)}/`),
  ...cases.map((s) => `/guide/${s.slug}/`),
  ...implementationProfiles.map((p) => `/implementations/${p.slug}/`),
  ...standards.map((s) => `/standards/${s.id}/`),
].sort();
