/**
 * What a page is made from, and so which dates are its own.
 *
 * A page is made from its own file under src/pages/ and, for most, from data.
 * `MADE_FROM` names the data, in three forms:
 *
 * - a file's path;
 * - a path that ends in "/", a directory, which means every file under it;
 * - `<file>#<name>`, one entry of a file that is a list of entries. A flow
 *   shows the standards it lists and not the whole tracker, so it is dated by
 *   those entries and not by every change to the tracker;
 * - `<directory>/#<name>`, what a log kept in that directory has recorded for
 *   one entry, in whichever of its files. A standard's status is read from
 *   the log in src/data/history/, so a page that shows one is dated by it.
 *
 * What is followed is what a page states: a figure, a definition, a status, a
 * rating. Such a fact has to be named here, or a change that reaches the page
 * through it leaves the page's date where it was. What is not followed is
 * what a page borrows to point somewhere else: the name of a page it links to,
 * that page's one-line description, a count. Nor are the parts that are the
 * same on every page, such as the footer's review month. `NOT_FOLLOWED` lists
 * each of those by the file it comes from, with the reason, and the unit tests
 * hold every page's imports to one list or the other.
 *
 * Nothing here reads the repository or the site's data. src/lib/page-dates.ts
 * gives it both, and the unit tests give it small ones of their own.
 */

/** What the mapping needs to know of the site's data. */
export interface Site {
  /** Each flow, with the tracker ids it lists. */
  flows: { slug: string; standards: string[] }[];
  /** Each lesson, with the glossary terms it teaches. */
  lessons: { slug: string; teaches: string[] }[];
  /** The flows that have a published implementation record. */
  records: string[];
  /** The tracker ids of the glossary terms that name a standard. */
  glossaryStandards: string[];
}

/** Each source's first and last commit. An entry's first is the commit that added it. */
export type History = Record<string, { first?: string; last: string }>;

const STANDARDS = "src/data/standards.ts";
/** The log of what has happened to each standard, which gives an entry its status. */
const HISTORY = "src/data/history/";
const GLOSSARY = "src/data/glossary.ts";
const LESSONS = "src/data/learn/lessons.ts";
const RECORDS = "src/data/implementations/records.ts";

/**
 * The data a lesson's figure is drawn from, where it is kept apart from the
 * lesson's page. Most lessons hold their own.
 */
const LESSON_DATA: Record<string, string[]> = {
  "what-the-api-sees": ["src/data/learn/api-sees.ts"],
};

/**
 * The tracker's entries for some ids, each once: what the entry says, and what
 * the log has recorded for it, which is where its status comes from.
 */
const standardsFor = (ids: string[]): string[] =>
  [...new Set(ids)].flatMap((id) => [`${STANDARDS}#${id}`, `${HISTORY}#${id}`]);

/** A flow's page: its own data, the standards it lists, and the evidence it summarizes. */
const flowSources = (slug: string, site: Site): string[] => [
  `src/data/flows/${slug}.ts`,
  ...standardsFor(site.flows.find((f) => f.slug === slug)?.standards ?? []),
  ...(site.records.includes(slug) ? [`${RECORDS}#${slug}`] : []),
];

const MADE_FROM: [
  page: RegExp,
  sources: (slug: string, site: Site) => string[],
][] = [
  [/^\/$/, () => ["src/pages/index.astro"]],
  // The list of flows rates each one, and a rating is taken from the standards
  // the flow lists.
  [
    /^\/flows\/$/,
    (_, site) => [
      "src/pages/flows/index.astro",
      "src/data/flows/",
      ...standardsFor(site.flows.flatMap((f) => f.standards)),
    ],
  ],
  [/^\/flows\/([^/]+)\/$/, flowSources],
  // The list of comparisons gives each one's question and its answer.
  [
    /^\/compare\/$/,
    () => ["src/pages/compare/index.astro", "src/data/comparisons/"],
  ],
  // A comparison is written in a file of its own, and is as old as that file.
  // Its figure shows the two flows' own listings and its table their
  // standards' status, so it also changes when either flow does, or a standard
  // either lists.
  [
    /^\/compare\/([^/]+)\/$/,
    (pair, site) => [
      `src/data/comparisons/${pair}.ts`,
      ...pair
        .split("-vs-")
        .flatMap((slug) =>
          flowSources(slug, site).filter((s) => !s.startsWith(RECORDS)),
        ),
    ],
  ],
  [/^\/learn\/$/, () => ["src/pages/learn/index.astro", LESSONS]],
  // A lesson: its page, its entry in the list of lessons, which holds its
  // title and what it promises, and the glossary's words for what it teaches.
  [
    /^\/learn\/([^/]+)\/$/,
    (slug, site) => [
      `src/pages/learn/${slug}.astro`,
      ...(LESSON_DATA[slug] ?? []),
      `${LESSONS}#${slug}`,
      ...(site.lessons.find((l) => l.slug === slug)?.teaches ?? []).map(
        (term) => `${GLOSSARY}#${term}`,
      ),
    ],
  ],
  [/^\/guide\/$/, () => ["src/pages/guide/index.astro", "src/data/guide.ts"]],
  [/^\/guide\/([^/]+)\/$/, () => ["src/data/guide.ts"]],
  [
    /^\/standards\/$/,
    () => ["src/pages/standards/index.astro", STANDARDS, HISTORY],
  ],
  // A term that names a standard shows that standard's status.
  [
    /^\/glossary\/$/,
    (_, site) => [
      "src/pages/glossary/index.astro",
      GLOSSARY,
      ...standardsFor(site.glossaryStandards),
    ],
  ],
  [
    /^\/concepts\/$/,
    () => [
      "src/pages/concepts/index.astro",
      "src/data/verify.ts",
      "src/data/tokens.ts",
    ],
  ],
  [
    /^\/deployments\/$/,
    () => ["src/pages/deployments/index.astro", "src/data/deployments.ts"],
  ],
  [
    /^\/implementations\/$/,
    () => ["src/pages/implementations/index.astro", RECORDS],
  ],
  // A record's page is its entry in the records, and is as old as that entry.
  [/^\/implementations\/([^/]+)\/$/, (slug) => [`${RECORDS}#${slug}`]],
];

/**
 * Data a page imports and is not dated by, with the reason: by the file under
 * src/pages/ that imports it, or under "*" for every page. A page's date
 * follows what the page states, not what it borrows to point elsewhere.
 */
export const NOT_FOLLOWED: Record<string, Record<string, string>> = {
  "*": {
    "src/data/types.ts": "types and the labels every page shares",
    "src/data/learn/types.ts": "types and the labels every lesson shares",
    "src/data/site.ts":
      "the review month and the site's own details, the same on every page",
  },
  "src/pages/index.astro": {
    "src/data/flows/index.ts": "the names of the flows it links to",
    "src/data/learn/lessons.ts": "the names of the lessons it links to",
    "src/data/guide.ts": "the names of the cases it links to",
    "src/data/standards.ts": "a count of the tracker's entries",
  },
  "src/pages/flows/[slug].astro": {
    "src/data/learn/lessons.ts": "the name of the lesson it links to",
    "src/data/comparisons/index.ts":
      "the questions of the comparisons it links to",
  },
  "src/pages/compare/[pair].astro": {
    "src/data/learn/lessons.ts": "the names of the lessons it links to",
  },
  "src/pages/guide/[case].astro": {
    "src/data/flows/index.ts": "the names and ratings of the flows it links to",
    "src/data/comparisons/index.ts":
      "the questions of the comparisons it links to",
  },
  "src/pages/guide/index.astro": {
    "src/data/flows/index.ts": "the names and ratings of the flows it links to",
    "src/data/implementations/index.ts":
      "whether a flow it links to has a record",
    "src/data/comparisons/index.ts":
      "the questions of the comparisons it links to",
  },
  "src/pages/implementations/index.astro": {
    "src/data/flows/index.ts": "the names and groups of the flows it links to",
  },
  "src/pages/implementations/[slug].astro": {
    "src/data/flows/index.ts": "the name of the flow it links to",
  },
  "src/pages/learn/index.astro": {
    "src/data/flows/index.ts": "a count of the flows",
  },
  "src/pages/standards/index.astro": {
    "src/data/flows/index.ts": "the names of the flows that list a standard",
  },
  "src/pages/styleguide/index.astro": {
    "src/data/flows/index.ts": "a flow borrowed to show how one is drawn",
    "src/data/learn/api-sees.ts": "a figure borrowed to show how one is drawn",
  },
};

/** What a page is made from. Any other page is made from its own file. */
export function madeFrom(path: string, site: Site): string[] {
  for (const [page, sources] of MADE_FROM) {
    const m = page.exec(path);
    if (m) return sources(m[1], site);
  }
  const at = `src/pages${path.replace(/\/$/, "")}`;
  return [`${at}.astro`, `${at}.mdx`, `${at}/index.astro`, `${at}/index.mdx`];
}

export interface PageDates {
  /** The first commit of the page's own source: the first one named. ISO 8601. */
  published: string;
  /** The last commit to change anything the page is made from. ISO 8601. */
  modified: string;
  /** The file that last change was made in: where its history is. */
  source: string;
}

const time = (iso: string) => new Date(iso).getTime();

/**
 * A page's dates from what it is made from, or nothing where the history
 * could not be read or does not have the page. It was published when its own
 * file was first committed, which is the first file named for it: a page is
 * not as old as the oldest thing it shows. An entry has no first commit, and
 * so cannot be a page's own file.
 */
export function datesFor(
  named: string[],
  history: History,
): PageDates | undefined {
  const all = Object.keys(history);
  const sources = named
    .flatMap((name) =>
      name.endsWith("/") ? all.filter((f) => f.startsWith(name)) : [name],
    )
    .filter((name) => history[name]);
  // A page is as old as its own source, which is named first. That is a file,
  // or for a page that is one entry of a list, the entry. An entry a page only
  // shows, named after its own source, says nothing of the page's age.
  const published = sources
    .filter((name) => !name.includes("#") || name === named[0])
    .flatMap((name) => history[name].first ?? [])[0];
  if (published === undefined) return undefined;
  const latest = sources.reduce((a, b) =>
    time(history[b].last) > time(history[a].last) ? b : a,
  );
  return {
    published,
    modified: history[latest].last,
    source: latest.split("#")[0],
  };
}

/** "November 14, 2026", from an ISO date: the day as the date itself was written, in whatever zone. */
export function longDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}
