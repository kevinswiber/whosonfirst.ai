/**
 * When each source file was first committed and last changed, read from the
 * repository's history when the site is built.
 *
 * A search engine reads a page's date in two places: `lastmod` in the sitemap
 * and `dateModified` in the page's structured data. Both are worth giving only
 * if they are true, and a date typed by hand goes stale the first time someone
 * forgets it. The history already has the answer, so the build asks it.
 *
 * The answer is handed to the pages as a module, `virtual:page-dates`: a map
 * from a file's path to `{ first, last }`, each an ISO 8601 date and time.
 * `src/lib/page-dates.ts` turns a page's address into the files it is made from.
 *
 * Where the history is not all there, the map is empty and the pages carry no
 * date. A shallow clone, which is what a hosted build usually makes, has only
 * its last few commits, and every file in it appears to have been written in
 * the oldest of them: a date read from that would be wrong, and no date is
 * better than a wrong one. The build says which it found.
 *
 * The build that is deployed is one of those: Cloudflare's Workers Builds
 * clones shallowly, and its settings have nothing to change that. So there,
 * and only there, the build fetches the rest of the history first. Workers
 * Builds says where it is with `WORKERS_CI=1`:
 * https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
 * Anywhere else a shallow clone is left as it is, and a build never goes to
 * the network on a contributor's machine or in the checks.
 *
 * A commit listed in `.git-blame-ignore-revs` only reformats, so it is not a
 * change to what a page says and is passed over.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ID = "virtual:page-dates";
/** What the history is asked about: the pages and the data they are built from. */
const WATCHED = ["src/pages", "src/data"];
/** Marks a commit's line in the log, so a file name cannot be taken for one. */
const MARK = "\u0001";

/** The commits `.git-blame-ignore-revs` names, as a set of full hashes. */
export function ignoredRevisions(text) {
  return new Set(
    text
      .split("\n")
      .map((line) => line.replace(/#.*/, "").trim())
      .filter((line) => /^[0-9a-f]{40}$/.test(line)),
  );
}

/**
 * Reads `git log --format=<MARK>%H %cI --name-only`, newest commit first, into
 * a map from each file to the dates of its oldest and newest commit.
 */
export function readLog(log, ignored = new Set()) {
  const dates = {};
  let date;
  for (const line of log.split("\n")) {
    if (line.startsWith(MARK)) {
      const [hash, when] = line.slice(MARK.length).split(" ");
      date = ignored.has(hash) ? undefined : when;
    } else if (line && date) {
      // newest first: the first date seen for a file is its last change, and
      // each older one replaces what was taken for its first
      dates[line] ??= { first: date, last: date };
      dates[line].first = date;
    }
  }
  return dates;
}

/**
 * The map for the repository at `root`, and a sentence on what was found.
 * `env` is the build's environment, which says whether this is the deployed build.
 */
export function historyDates(root, env = process.env) {
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 120_000,
    });
  const shallow = () =>
    git("rev-parse", "--is-shallow-repository").trim() !== "false";
  try {
    let fetched = "";
    if (shallow() && env.WORKERS_CI === "1") {
      try {
        git("fetch", "--unshallow", "--quiet");
        fetched = ", after fetching the rest of it";
      } catch {
        // said below: the clone is still shallow
      }
    }
    if (shallow())
      return {
        dates: {},
        found:
          env.WORKERS_CI === "1"
            ? "the clone is shallow and the rest of its history could not be fetched: pages carry no date"
            : "the clone is shallow, so its history cannot date a page: pages carry no date",
      };
    const revs = join(root, ".git-blame-ignore-revs");
    const ignored = existsSync(revs)
      ? ignoredRevisions(readFileSync(revs, "utf8"))
      : new Set();
    const dates = readLog(
      git("log", `--format=${MARK}%H %cI`, "--name-only", "--", ...WATCHED),
      ignored,
    );
    return {
      dates,
      found: `${Object.keys(dates).length} files dated from the history${fetched}`,
    };
  } catch {
    return {
      dates: {},
      found: "there is no history to read here: pages carry no date",
    };
  }
}

export default function pageDates() {
  return {
    name: "page-dates",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, logger }) => {
        const { dates, found } = historyDates(fileURLToPath(config.root));
        logger.info(found);
        updateConfig({
          vite: {
            plugins: [
              {
                name: "page-dates",
                resolveId: (id) => (id === ID ? `\0${ID}` : undefined),
                load: (id) =>
                  id === `\0${ID}`
                    ? `export default ${JSON.stringify(dates)};`
                    : undefined,
              },
            ],
          },
        });
      },
    },
  };
}
