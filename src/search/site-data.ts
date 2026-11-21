import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  catalogFor,
  type PassageRecord,
  type SearchSiteData,
  validateShell,
} from "./search.ts";

/** The passages of a build, with the digest of all of them. */
interface Manifest {
  records: PassageRecord[];
  revision: string;
}

// What a search is answered from: the rendered form, the passages and the
// response headers of one build. The build writes it beside the pages.
export function searchSiteData(
  assets: string,
  { records, revision }: Manifest,
): SearchSiteData {
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
  const marker: { commit: string | null; revision: string } = JSON.parse(
    readFileSync(join(assets, "search/release.json"), "utf8"),
  );
  if (marker.commit) headers["X-Guide-Search-Commit"] = marker.commit;
  headers["X-Guide-Search-Revision"] = marker.revision;
  if (marker.revision !== revision)
    throw new Error(
      "The release marker and the passages are from different builds.",
    );
  return { records, shell, headers };
}
