// Prepare only public material from the completed site build for this separate
// Worker. Fail the build if its native form/results no longer fit the template.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  BUILT_ASSETS,
  requireCurrentBuild,
} from "../../scripts/built-site.mjs";
import { searchSiteData } from "./site-data.mjs";

requireCurrentBuild("The search Worker would point at an old site.");
const manifest = JSON.parse(
  readFileSync(
    new URL("../../.astro/search/manifest.json", import.meta.url),
    "utf8",
  ),
);
mkdirSync(new URL(".astro/", import.meta.url), { recursive: true });
const source = Object.entries(searchSiteData(BUILT_ASSETS, manifest))
  .map(([name, value]) => `export const ${name} = ${JSON.stringify(value)};\n`)
  .join("");
writeFileSync(new URL(".astro/site.mjs", import.meta.url), source);
