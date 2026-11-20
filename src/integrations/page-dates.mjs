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
 * Some files hold many entries, and a page shows only a few of them: a flow
 * lists some of the tracker's standards, a lesson teaches some of the
 * glossary's terms. Dating such a page by the whole file would say it changed
 * whenever any entry did. So for the files in `ENTRIES` the map also has the
 * dates of each entry, under `<file>#<name>`: the commit that added it and the
 * last one that changed its own text. They are found by reading the file as
 * it stood at each of its commits, which sees a line taken out as well as one
 * put in.
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
 * A commit listed in `.git-blame-ignore-revs` only reformats, or only moves
 * text from one file to another, so it is not a change to what a page says
 * and is passed over. An entry reads the same on either side of one, however
 * its text differs there, and an entry that came in with one has no date
 * until a later commit changes it.
 *
 * The log of the standards' history, in `LOGS`, is read the same way, with
 * two differences: it is a directory with a file for each month, and an entry
 * there is every event with that entry's name. A standard's date from the log
 * is under `<directory>/#<name>`, the latest from any month.
 *
 * The module also gives `events`: for each event of the log, by the name
 * `eventIds` in src/lib/history.ts gives it, when it reached the line of
 * commits being built, and when its correction did. That is read along first
 * parents only, so on main it is the time of the merge that brought the event
 * in: when it went on the site, not when its branch was written. The
 * changelog's feed gives each entry that time, where it falls on the day the
 * event says it was recorded. A shallow clone gives no events either.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ID = "virtual:page-dates";
/** What the history is asked about: the pages and the data they are built from. */
const WATCHED = ["src/pages", "src/data"];
/** Marks a commit's line in the log, so a file name cannot be taken for one. */
const MARK = "\u0001";
/**
 * The files that are a list of entries, each shown on pages of its own, and
 * the field that names an entry. Each is one array of objects, an entry to an
 * object, laid out as Biome lays them out.
 */
export const ENTRIES = [
  { file: "src/data/standards.ts", key: "id" },
  { file: "src/data/glossary.ts", key: "term" },
  { file: "src/data/learn/lessons.ts", key: "slug" },
  { file: "src/data/implementations/records.ts", key: "slug" },
];

/**
 * The directories that hold a log: a file for each month, named for it, each a
 * list of events. `key` names the entry an event is about, and an entry has as
 * many events as have been recorded for it.
 */
export const LOGS = [{ dir: "src/data/history", key: "entry" }];
const MONTH_FILE = /^\d{4}-\d{2}\.ts$/;

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
 * Source text without its layout, so that code that was only laid out again
 * reads as the same: no spacing between its parts, no comments, no comma
 * before a closing bracket, and one kind of quote mark.
 *
 * What is inside a string is what a page says, and is kept exactly: a space
 * put into a quoted word, or a line break taken out of a template, is a
 * change. Only an escaped quote mark is read as the mark, since which marks
 * need escaping depends on the kind that encloses them.
 */
export function withoutLayout(source) {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (c === '"' || c === "'" || c === "`") {
      let text = "";
      let j = i + 1;
      while (j < source.length && source[j] !== c) {
        if (source[j] === "\\" && j + 1 < source.length) {
          text += /["'`]/.test(source[j + 1])
            ? source[j + 1]
            : source.slice(j, j + 2);
          j += 2;
        } else text += source[j++];
      }
      // NUL stands for the quote mark: no string here has one in it
      out += `\u0000${text}\u0000`;
      i = j + 1;
    } else if (c === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i++;
    } else if (c === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end < 0 ? source.length : end + 2;
    } else if (/\s/.test(c)) {
      i++;
    } else {
      if (/[}\])]/.test(c) && out.endsWith(",")) out = out.slice(0, -1);
      out += c;
      i++;
    }
  }
  // the comma after an entry is the list's, and the last entry may have none
  return out.endsWith(",") ? out.slice(0, -1) : out;
}

/**
 * The entries of a file that is a list of them: a map from each entry's name
 * to its text, without its layout. An entry is an object of the file's
 * outermost array, from a line that is "  {" to the next that is "  }," and
 * its name is its `key`. Where objects share a name, as the events of a log
 * do, the entry is all of them, in order.
 */
export function entriesOf(text, key) {
  const entries = new Map();
  const named = new RegExp(`^\\s+${key}:\\s*(["'\`])(.*?)\\1`, "m");
  const lines = text.split("\n");
  let open;
  lines.forEach((line, i) => {
    if (/^ {2}\{\s*$/.test(line)) open = i;
    else if (/^ {2}\},?\s*$/.test(line) && open !== undefined) {
      const entry = lines.slice(open, i + 1).join("\n");
      const name = named.exec(entry)?.[2];
      if (name !== undefined)
        entries.set(name, (entries.get(name) ?? "") + withoutLayout(entry));
      open = undefined;
    }
  });
  return entries;
}

/**
 * When each entry of a file last changed. `versions` is the file at each of
 * its commits, newest first, as `{ date, text }`, with `ignored: true` on a
 * commit that changed nothing a page says. An entry's date is that of the
 * oldest commit since which its text has stayed as it is now.
 *
 * An ignored commit is read past. Whatever an entry was before it is what the
 * entry is after it, so the reading goes on from the text before. An entry
 * that was not there before came in with the ignored commit, and has no date.
 */
export function entryDates(versions, key) {
  const dates = {};
  const newest = versions.findIndex((version) => !version.ignored);
  if (newest < 0) return dates;
  const now = new Map(entriesOf(versions[newest].text, key));
  const settled = new Set();
  // Entries unchanged back to an ignored commit, to be read on from the text before it.
  const carried = new Set();
  for (const version of versions.slice(newest)) {
    const then = entriesOf(version.text, key);
    for (const name of now.keys()) {
      if (settled.has(name)) continue;
      if (carried.has(name)) {
        if (!then.has(name)) {
          // it came in with the ignored commit
          delete dates[name];
          settled.add(name);
          continue;
        }
        now.set(name, then.get(name));
        if (!version.ignored) carried.delete(name);
      }
      if (then.get(name) !== now.get(name)) settled.add(name);
      else if (version.ignored) carried.add(name);
      else dates[name] = version.date;
    }
  }
  // The oldest commits were ignored ones: what is unchanged since came in with them.
  for (const name of carried) if (!settled.has(name)) delete dates[name];
  return dates;
}

/**
 * When each entry of a file was added: the date of the oldest commit that has
 * an entry by its name. `versions` is as for `entryDates`, and an ignored
 * commit is not counted.
 */
export function entryFirsts(versions, key) {
  const dates = {};
  const real = versions.filter((version) => !version.ignored);
  if (real.length === 0) return dates;
  const now = entriesOf(real[0].text, key);
  for (const version of real) {
    const then = entriesOf(version.text, key);
    for (const name of now.keys())
      if (then.has(name)) dates[name] = version.date;
  }
  return dates;
}

/**
 * The events of one month of a log, by the name `eventIds` in
 * src/lib/history.ts gives them: `<entry>/<date>/<kind>`, with "field" for an
 * event about no entry. Each has the day of its correction, where it has one.
 * A name two events share is left out, since which is which cannot be told.
 */
export function eventsOf(text) {
  const events = new Map();
  const shared = new Set();
  const field = (event, name) =>
    new RegExp(`^ {4}${name}:\\s*(["'\`])(.*?)\\1`, "m").exec(event)?.[2];
  const lines = text.split("\n");
  let open;
  lines.forEach((line, i) => {
    if (/^ {2}\{\s*$/.test(line)) open = i;
    else if (/^ {2}\},?\s*$/.test(line) && open !== undefined) {
      const event = lines.slice(open, i + 1).join("\n");
      open = undefined;
      const date = field(event, "date");
      const kind = field(event, "kind");
      if (!date || !kind) return;
      const name = `${field(event, "entry") ?? "field"}/${date}/${kind}`;
      if (events.has(name)) shared.add(name);
      const corrected = /^ {4}corrected:\s*\{\s*on:\s*(["'`])(.*?)\1/m.exec(
        event,
      )?.[2];
      events.set(name, corrected ? { corrected } : {});
    }
  });
  for (const name of shared) events.delete(name);
  return events;
}

/**
 * When each event of a month of a log reached the line of commits the build
 * is on. `versions` is the month's file at each commit of that line that
 * changed it, newest first, as `{ date, text }`. An event's `recorded` is the
 * oldest commit since which it has been in the file, and `corrected`, for an
 * event that has a correction, the oldest since which it has had that one.
 */
export function eventTimes(versions) {
  const times = {};
  const read = versions.map((version) => eventsOf(version.text));
  if (read.length === 0) return times;
  for (const [name, now] of read[0]) {
    const time = {};
    let correcting = now.corrected !== undefined;
    for (const [at, events] of read.entries()) {
      const then = events.get(name);
      if (!then) break;
      time.recorded = versions[at].date;
      if (correcting && then.corrected === now.corrected)
        time.corrected = versions[at].date;
      else correcting = false;
    }
    times[name] = time;
  }
  return times;
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
        events: {},
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
    const files = Object.keys(dates).length;
    // A list of entries, as it stood at each commit that changed it.
    const versionsOf = (file) =>
      git("log", "--format=%H %cI", "--", file)
        .split("\n")
        .filter(Boolean)
        .map((line) => line.split(" "))
        .map(([hash, date]) => {
          const ignore = ignored.has(hash) ? { ignored: true } : {};
          try {
            return { date, text: git("show", `${hash}:${file}`), ...ignore };
          } catch {
            // the commit that took the file away or moved it: nothing was in it
            return { date, text: "", ...ignore };
          }
        });
    for (const { file, key } of ENTRIES) {
      const versions = versionsOf(file);
      const firsts = entryFirsts(versions, key);
      for (const [name, date] of Object.entries(entryDates(versions, key)))
        dates[`${file}#${name}`] = { first: firsts[name], last: date };
    }
    // A log: each month's file, and for each entry the latest date in any of them.
    for (const { dir, key } of LOGS) {
      const months = existsSync(join(root, dir))
        ? readdirSync(join(root, dir)).filter((name) => MONTH_FILE.test(name))
        : [];
      for (const month of months.sort()) {
        const versions = versionsOf(`${dir}/${month}`);
        const firsts = entryFirsts(versions, key);
        for (const [name, last] of Object.entries(entryDates(versions, key))) {
          const at = `${dir}/#${name}`;
          const first = dates[at]?.first ?? firsts[name];
          if (!dates[at] || last > dates[at].last) dates[at] = { first, last };
        }
      }
    }
    // When each event reached the line of commits being built: on main, the
    // merge that brought it in. An event's name is unique in the log, so one
    // that two months share is timed in neither.
    const events = {};
    const seen = new Set();
    for (const { dir } of LOGS) {
      const months = existsSync(join(root, dir))
        ? readdirSync(join(root, dir)).filter((name) => MONTH_FILE.test(name))
        : [];
      for (const month of months.sort()) {
        const file = `${dir}/${month}`;
        const versions = git(
          "log",
          "--first-parent",
          "--format=%H %cI",
          "HEAD",
          "--",
          file,
        )
          .split("\n")
          .filter(Boolean)
          .map((line) => line.split(" "))
          .map(([hash, date]) => {
            try {
              return { date, text: git("show", `${hash}:${file}`) };
            } catch {
              return { date, text: "" };
            }
          });
        for (const [name, time] of Object.entries(eventTimes(versions))) {
          if (seen.has(name)) delete events[name];
          else events[name] = time;
          seen.add(name);
        }
      }
    }
    return {
      dates,
      events,
      found: `${files} files and ${Object.keys(dates).length - files} entries dated from the history${fetched}; ${Object.keys(events).length} events of the log timed by when they reached this line of commits`,
    };
  } catch {
    return {
      dates: {},
      events: {},
      found: "there is no history to read here: pages carry no date",
    };
  }
}

export default function pageDates() {
  return {
    name: "page-dates",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, logger }) => {
        const { dates, events, found } = historyDates(
          fileURLToPath(config.root),
        );
        logger.info(found);
        updateConfig({
          vite: {
            plugins: [
              {
                name: "page-dates",
                resolveId: (id) => (id === ID ? `\0${ID}` : undefined),
                load: (id) =>
                  id === `\0${ID}`
                    ? `export default ${JSON.stringify(dates)};\nexport const events = ${JSON.stringify(events)};`
                    : undefined,
              },
            ],
          },
        });
      },
    },
  };
}
