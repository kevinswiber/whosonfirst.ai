import { readFileSync } from "node:fs";
import { join } from "node:path";
import { catalogFor, validateShell } from "./search.mjs";

// Use the same rendered form, passages and response headers for both Workers.
export function searchSiteData(assets, { records, revision }) {
  catalogFor(records);
  const shell = readFileSync(join(assets, "search/index.html"), "utf8");
  validateShell(shell);
  const policy = readFileSync(join(assets, "_headers"), "utf8")
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
    readFileSync(join(assets, "search/release.json"), "utf8"),
  );
  if (marker.commit) headers["X-Guide-Search-Commit"] = marker.commit;
  headers["X-Guide-Search-Revision"] = marker.revision;
  if (marker.revision !== revision)
    throw new Error("Search Worker and site have different passage manifests.");
  return { records, shell, headers };
}
