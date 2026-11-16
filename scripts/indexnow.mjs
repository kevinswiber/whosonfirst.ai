/**
 * Tells the search engines that take part in IndexNow which pages have
 * changed, so they read them again without waiting to find out.
 *
 *   node scripts/indexnow.mjs --since 2026-11-14     pages changed on or after that day
 *   node scripts/indexnow.mjs --since 4c1c6a6        pages changed by the commits after that one
 *   node scripts/indexnow.mjs --all                  every page: for the first run, or a new section
 *
 *   --dry-run   print the list and send nothing
 *   --wait      first wait until the deployed site has these pages as this build has them
 *
 * Run it after a deploy, not before: an engine that is told about a page goes
 * and reads it, and should find the new one. `--wait` holds it to that. It
 * reads the deployed sitemap every few seconds until each page to be sent is
 * there with a date no older than this build's, and gives up after ten
 * minutes with nothing sent. .github/workflows/indexnow.yml runs the script
 * that way after every push to main, with the commit main was at before.
 *
 * The list comes from the built sitemap. A day is compared with each page's
 * date there, which is read from the repository's history
 * (src/integrations/page-dates.mjs). A commit is not: "changed by the commits
 * after that one" is asked of what each page is made from, which the build
 * writes beside the sitemap as sitemap-sources.json (src/lib/page-sources.ts).
 * The script reads from the history the files those commits changed, and the
 * entries whose text they changed, and a page is sent when anything it is made
 * from is among them. A page's date would miss some: one changed by a commit
 * made on the 12th and merged after one made on the 14th stays dated the 14th.
 *
 * A build made from a shallow clone dates only the implementation records, so
 * a day there finds only those, and a commit is refused: the history is not
 * there to say what it changed. The key is the file
 * in public/ that holds its own name: the protocol asks for a key at the
 * site's root to show that whoever sends the list also runs the site. It is
 * not a secret.
 *
 * IndexNow is read by Bing and several other engines, and not by Google, which
 * reads the sitemap: https://www.indexnow.org/faq
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ENTRIES,
  entriesOf,
  ignoredRevisions,
} from "../src/integrations/page-dates.mjs";
import { requireCurrentBuild } from "./built-site.mjs";

const ENDPOINT = "https://api.indexnow.org/indexnow";
const USAGE =
  "Say which pages: --since YYYY-MM-DD for those changed on or after a day, --since <commit> for those changed by the commits after that one, or --all for every page. Add --dry-run to print the list and send nothing, and --wait to wait for the deploy first.";
/** How long `--wait` waits for the deploy, and how often it looks. */
const WAIT_MS = 10 * 60_000;
const EVERY_MS = 15_000;
/** Marks a commit's line in the log. */
const MARK = "\u0001";

/**
 * What the command line asks for: `{ all }`, `{ day }` or `{ commit }`, with
 * `dryRun` and `wait`. Nothing, where it does not say which pages or says it
 * twice.
 */
export function readArgs(args) {
  const known = ["--all", "--since", "--dry-run", "--wait"];
  const at = args.indexOf("--since");
  const since = at < 0 ? undefined : args[at + 1];
  const extra = args.filter(
    (arg, i) => !known.includes(arg) && !(at >= 0 && i === at + 1),
  );
  const all = args.includes("--all");
  if (extra.length || all === at >= 0) return undefined;
  const asked = {
    dryRun: args.includes("--dry-run"),
    wait: args.includes("--wait"),
  };
  if (all) return { ...asked, all: true };
  if (/^\d{4}-\d{2}-\d{2}$/.test(since ?? "")) {
    if (Number.isNaN(Date.parse(`${since}T00:00:00Z`))) return undefined;
    return { ...asked, day: since };
  }
  if (/^[0-9a-f]{7,40}$/.test(since ?? "")) return { ...asked, commit: since };
  return undefined;
}

/** The pages a sitemap lists, each with its date where it has one. */
export function readSitemap(xml) {
  return [
    ...xml.matchAll(/<loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g),
  ].map(([, loc, lastmod]) => ({ loc, lastmod }));
}

/**
 * The pages changed on or after a day. A page's date carries the zone it was
 * written in, so the instants are compared, with the day taken to start in UTC.
 */
export function changedSince(pages, day) {
  const from = Date.parse(`${day}T00:00:00Z`);
  return pages.filter((p) => p.lastmod && Date.parse(p.lastmod) >= from);
}

/**
 * The pages made from something that changed. `sources` is what each page is
 * made from, by its address, as sitemap-sources.json has it: files,
 * directories ending in "/", and entries as `<file>#<name>`. `changed` is the
 * files and the entries that changed, in the same form. A directory is made
 * of every file under it.
 */
export function changedBy(pages, sources, changed) {
  const names = new Set(changed);
  const files = changed.filter((name) => !name.includes("#"));
  const hit = (name) =>
    name.endsWith("/")
      ? files.some((file) => file.startsWith(name))
      : names.has(name);
  return pages.filter((p) => (sources[p.loc] ?? []).some(hit));
}

/**
 * The entries that differ between two texts of a file that is a list of them:
 * those added, taken away, or whose text without its layout is not the same,
 * as src/integrations/page-dates.mjs compares them to date an entry.
 */
export function changedEntries(before, now, key) {
  const then = entriesOf(before, key);
  const later = entriesOf(now, key);
  return [...new Set([...then.keys(), ...later.keys()])].filter(
    (name) => then.get(name) !== later.get(name),
  );
}

/**
 * What the commits after `commit` changed, up to the one checked out at
 * `root`: the commits that are here and were not there, which is also right
 * where history was rewritten and `commit` is no longer behind this one.
 * Returns `{ changed }`: the files those commits touched, less what the
 * commits that only reformat touched, and for each of those files that is a
 * list of entries, the entries that differ between `commit` and this one, as
 * `<file>#<name>`. Or `{ all: true }` for the name GitHub gives to "no
 * commit", all zeros, which is what came before a branch's first push; or
 * `{ refused }`, a sentence, where the answer cannot be read from this clone.
 */
export function commitsAfter(root, commit) {
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  if (/^0+$/.test(commit)) return { all: true };
  try {
    if (git("rev-parse", "--is-shallow-repository").trim() !== "false")
      return {
        refused:
          "This clone is shallow, so its history cannot say what the commits after that one changed. Fetch the rest (`git fetch --unshallow`) and build again.",
      };
  } catch {
    return { refused: "There is no history to read here." };
  }
  try {
    git("rev-parse", "--verify", "--quiet", `${commit}^{commit}`);
  } catch {
    return {
      refused: `This clone has no commit ${commit}. If history was rewritten, fetch it by name (\`git fetch origin ${commit}\`), or give a day, or --all.`,
    };
  }
  const revs = join(root, ".git-blame-ignore-revs");
  const ignored = existsSync(revs)
    ? ignoredRevisions(readFileSync(revs, "utf8"))
    : new Set();
  // A commit's line is marked, so a file name cannot be taken for one. A file
  // moved is one taken away and one added, and both are named.
  const files = new Set();
  let passedOver = false;
  const log = git(
    "log",
    `--format=${MARK}%H`,
    "--name-only",
    "--no-renames",
    `${commit}..HEAD`,
  );
  for (const line of log.split("\n")) {
    if (line.startsWith(MARK)) passedOver = ignored.has(line.slice(1));
    else if (line && !passedOver) files.add(line);
  }
  const at = (rev, file) => {
    try {
      return git("show", `${rev}:${file}`);
    } catch {
      // the file is not there at that commit
      return "";
    }
  };
  const entries = ENTRIES.filter(({ file }) => files.has(file)).flatMap(
    ({ file, key }) =>
      changedEntries(at(commit, file), at("HEAD", file), key).map(
        (name) => `${file}#${name}`,
      ),
  );
  return { changed: [...files, ...entries] };
}

/**
 * Of the pages to be sent, those the deployed site does not have yet as this
 * build has them. `live` is the deployed sitemap's pages. A page is there when
 * the deployed sitemap lists it with a date no older than this build's, so a
 * later deploy that has changed it again still counts. A page this build
 * could not date only has to be listed.
 */
export function notYetLive(sending, live) {
  const deployed = new Map(live.map((p) => [p.loc, p.lastmod]));
  return sending.filter((p) => {
    if (!deployed.has(p.loc)) return true;
    if (!p.lastmod) return false;
    const there = deployed.get(p.loc);
    return !there || Date.parse(there) < Date.parse(p.lastmod);
  });
}

/**
 * Waits until the deployed site has every page to be sent. `read` fetches the
 * deployed sitemap's text, and may throw. Returns `{ live: true }`, or after
 * `limit` milliseconds `{ live: false, behind, problem }`: the pages still
 * missing or old at the last look, or why the sitemap could not be read.
 */
export async function untilLive(
  sending,
  read,
  {
    limit = WAIT_MS,
    every = EVERY_MS,
    now = Date.now,
    sleep = (ms) => new Promise((done) => setTimeout(done, ms)),
    say = () => {},
  } = {},
) {
  const start = now();
  for (;;) {
    let behind = sending;
    let problem;
    try {
      behind = notYetLive(sending, readSitemap(await read()));
    } catch (error) {
      problem = error.message;
    }
    if (behind.length === 0) return { live: true };
    if (now() - start + every > limit) return { live: false, behind, problem };
    say(
      problem
        ? `The deployed sitemap could not be read (${problem}). Looking again.`
        : `The deployed site does not have ${behind.length} of ${sending.length} pages yet. Looking again.`,
    );
    await sleep(every);
  }
}

/** The deployed sitemap, asked for past any cache. */
async function deployedSitemap(host) {
  const response = await fetch(`https://${host}/sitemap.xml`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${response.status}`);
  return response.text();
}

async function main(args) {
  const here = fileURLToPath(new URL("../", import.meta.url));
  const asked = readArgs(args);
  if (!asked) {
    console.error(USAGE);
    return 1;
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
    return 1;
  }

  const built = join(here, "dist", "client");
  const pages = readSitemap(readFileSync(join(built, "sitemap.xml"), "utf8"));
  let sending = pages;
  if (asked.day) sending = changedSince(pages, asked.day);
  if (asked.commit) {
    const after = commitsAfter(here, asked.commit);
    if (after.refused) {
      console.error(after.refused);
      return 1;
    }
    if (after.all)
      console.log("There was no commit before this one: every page is new.");
    else
      sending = changedBy(
        pages,
        JSON.parse(readFileSync(join(built, "sitemap-sources.json"), "utf8")),
        after.changed,
      );
  }
  const undated = pages.filter((p) => !p.lastmod).length;
  if (asked.day && undated)
    console.error(
      `${undated} of ${pages.length} pages have no date in this build's sitemap and are left out. Build from a full clone to date them.`,
    );
  if (sending.length === 0) {
    console.log("No page has changed since then. Nothing was sent.");
    return 0;
  }

  const host = new URL(pages[0].loc).host;
  const urlList = sending.map((p) => p.loc);
  for (const url of urlList) console.log(url);

  if (asked.wait) {
    console.log(`\nWaiting for https://${host} to have these pages.`);
    const waited = await untilLive(sending, () => deployedSitemap(host), {
      say: (line) => console.log(line),
    });
    if (!waited.live) {
      console.error(
        waited.problem
          ? `\nThe deployed sitemap could not be read after ${WAIT_MS / 60_000} minutes: ${waited.problem}. Nothing was sent.`
          : `\nAfter ${WAIT_MS / 60_000} minutes the deployed site still does not have ${waited.behind.length} of these pages as this build has them, ${waited.behind[0].loc} among them. Nothing was sent. Check the deploy, and that its build dated its pages.`,
      );
      return 1;
    }
    console.log("The deployed site has them.");
  }

  if (asked.dryRun) {
    console.log(
      `\n${urlList.length} pages would be sent to ${ENDPOINT}. Nothing was sent.`,
    );
    return 0;
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
    return 0;
  }
  console.error(
    `\nThe list was refused: ${response.status} ${response.statusText}. ${await response.text()}`,
  );
  return 1;
}

// Run by itself, it sends the list. A test imports it for its parts.
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  process.exitCode = await main(process.argv.slice(2));
