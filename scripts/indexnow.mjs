/**
 * Tells the search engines that take part in IndexNow which pages have
 * changed, so they read them again without waiting to find out.
 *
 *   node scripts/indexnow.mjs --since 2026-11-14     pages changed on or after that day
 *   node scripts/indexnow.mjs --all                  every page: for the first run, or a new section
 *   node scripts/indexnow.mjs --since 2026-11-14 --dry-run     print the list and send nothing
 *
 * Run it after a deploy, not before: an engine that is told about a page goes
 * and reads it, and should find the new one.
 *
 * The list comes from the built sitemap, whose dates are read from the
 * repository's history (src/integrations/page-dates.mjs). A build made from a
 * shallow clone dates only the implementation records, so `--since` there
 * finds only those. The key is the file in public/ that holds its own name:
 * the protocol asks for a key at the site's root to show that whoever sends
 * the list also runs the site. It is not a secret.
 *
 * IndexNow is read by Bing and several other engines, and not by Google, which
 * reads the sitemap: https://www.indexnow.org/faq
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireCurrentBuild } from "./built-site.mjs";

const ENDPOINT = "https://api.indexnow.org/indexnow";
const here = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const since = args[args.indexOf("--since") + 1];

if (
  flag("--all") === flag("--since") ||
  (flag("--since") && !/^\d{4}-\d{2}-\d{2}$/.test(since ?? ""))
) {
  console.error(
    "Say which pages: --since YYYY-MM-DD for those changed on or after a day, or --all for every page. Add --dry-run to print the list and send nothing.",
  );
  process.exit(1);
}

requireCurrentBuild("The list would be of the pages as they were then.");

const publicDir = join(here, "public");
const key = readdirSync(publicDir)
  .filter((name) => /^[0-9a-f]{8,128}\.txt$/.test(name))
  .map((name) => name.slice(0, -4))
  .find(
    (name) =>
      readFileSync(join(publicDir, `${name}.txt`), "utf8").trim() === name,
  );
if (!key) {
  console.error(
    "public/ has no IndexNow key: a file named <key>.txt that holds <key>.",
  );
  process.exit(1);
}

const sitemap = readFileSync(
  join(here, "dist", "client", "sitemap.xml"),
  "utf8",
);
const pages = [
  ...sitemap.matchAll(/<loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g),
].map(([, loc, lastmod]) => ({ loc, lastmod }));
// A page's date carries the zone it was written in. Compare the instants, with
// the day given taken to start in UTC.
const from = flag("--since") ? Date.parse(`${since}T00:00:00Z`) : undefined;
const urlList = pages
  .filter(
    (p) => from === undefined || (p.lastmod && Date.parse(p.lastmod) >= from),
  )
  .map((p) => p.loc);
const undated = pages.filter((p) => !p.lastmod).length;
if (from !== undefined && undated)
  console.error(
    `${undated} of ${pages.length} pages have no date in this build's sitemap and are left out. Build from a full clone to date them.`,
  );
if (urlList.length === 0) {
  console.log("No page has changed since then. Nothing was sent.");
  process.exit(0);
}

const host = new URL(pages[0].loc).host;
for (const url of urlList) console.log(url);
if (flag("--dry-run")) {
  console.log(
    `\n${urlList.length} pages would be sent to ${ENDPOINT}. Nothing was sent.`,
  );
  process.exit(0);
}

const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList,
  }),
});
// 200 and 202 both mean the list was taken. 202 adds that the key has yet to be checked.
if (response.status === 200 || response.status === 202) {
  console.log(`\n${urlList.length} pages sent (${response.status}).`);
} else {
  console.error(
    `\nThe list was refused: ${response.status} ${response.statusText}. ${await response.text()}`,
  );
  process.exit(1);
}
