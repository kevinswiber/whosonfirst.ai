// Prepare only public material from the completed site build for this separate
// Worker. Fail the build if its native form/results no longer fit the template.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUILT_ASSETS,
  requireCurrentBuild,
} from "../../scripts/built-site.mjs";
import { catalogFor, validateShell } from "./search.mjs";

requireCurrentBuild("The search Worker would point at an old site.");
const { records, revision } = JSON.parse(
  readFileSync(
    new URL("../../.astro/search/manifest.json", import.meta.url),
    "utf8",
  ),
);
catalogFor(records);
const shell = readFileSync(join(BUILT_ASSETS, "search/index.html"), "utf8");
validateShell(shell);
const policy = readFileSync(join(BUILT_ASSETS, "_headers"), "utf8")
  .split(/^\/\*\s*$/m)[1]
  ?.split(/^\S/m)[0];
if (!policy) throw new Error("Missing default site headers");
const headers = Object.fromEntries(
  policy
    .trim()
    .split("\n")
    .map((line) => {
      const colon = line.indexOf(":");
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
    })
    .filter(([name]) => name !== "Link" && name !== "Vary"),
);
if (!headers["Content-Security-Policy"]) throw new Error("Missing site CSP");
const marker = JSON.parse(
  readFileSync(join(BUILT_ASSETS, "search/release.json"), "utf8"),
);
if (marker.revision !== revision)
  throw new Error("Search Worker and site have different passage manifests.");
if (marker.commit) headers["X-Guide-Search-Commit"] = marker.commit;
headers["X-Guide-Search-Revision"] = revision;
mkdirSync(new URL(".astro/", import.meta.url), { recursive: true });
const source = Object.entries({ records, shell, headers })
  .map(([name, value]) => `export const ${name} = ${JSON.stringify(value)};\n`)
  .join("");
writeFileSync(new URL(".astro/site.mjs", import.meta.url), source);
