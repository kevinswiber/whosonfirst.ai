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
 *   those entries and not by every change to the tracker.
 *
 * What a page shows of an entry has to be named here, or a change that reaches
 * the page through that entry leaves its date where it was. The parts of a
 * page that are the same on every page, such as the footer's review month, are
 * not named: they are not what the page is about.
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
}

/** Each source's first and last commit. An entry has only a last. */
export type History = Record<string, { first?: string; last: string }>;

const STANDARDS = "src/data/standards.ts";
const GLOSSARY = "src/data/glossary.ts";
const LESSONS = "src/data/learn/lessons.ts";
const RECORDS = "src/data/implementations/records.ts";

/** A flow's page: its own data, the standards it lists, and the evidence it summarizes. */
const flowSources = (slug: string, site: Site): string[] => [
  `src/data/flows/${slug}.ts`,
  ...(site.flows.find((f) => f.slug === slug)?.standards ?? []).map(
    (id) => `${STANDARDS}#${id}`,
  ),
  ...(site.records.includes(slug) ? [`${RECORDS}#${slug}`] : []),
];

const MADE_FROM: [
  page: RegExp,
  sources: (slug: string, site: Site) => string[],
][] = [
  [/^\/$/, () => ["src/pages/index.astro"]],
  [/^\/flows\/$/, () => ["src/pages/flows/index.astro", "src/data/flows/"]],
  [/^\/flows\/([^/]+)\/$/, flowSources],
  [/^\/learn\/$/, () => ["src/pages/learn/index.astro", LESSONS]],
  // A lesson: its page, its entry in the list of lessons, which holds its
  // title and what it promises, and the glossary's words for what it teaches.
  [
    /^\/learn\/([^/]+)\/$/,
    (slug, site) => [
      `src/pages/learn/${slug}.astro`,
      `${LESSONS}#${slug}`,
      ...(site.lessons.find((l) => l.slug === slug)?.teaches ?? []).map(
        (term) => `${GLOSSARY}#${term}`,
      ),
    ],
  ],
  [/^\/guide\/$/, () => ["src/pages/guide/index.astro", "src/data/guide.ts"]],
  [/^\/guide\/([^/]+)\/$/, () => ["src/data/guide.ts"]],
  [/^\/standards\/$/, () => ["src/pages/standards/index.astro", STANDARDS]],
  [/^\/glossary\/$/, () => ["src/pages/glossary/index.astro", GLOSSARY]],
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
  // A record's page gives the day its evidence was reviewed, which it shows.
  [/^\/implementations\/([^/]+)\/$/, () => []],
];

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
  /** The first commit of the oldest of the page's files. ISO 8601. */
  published: string;
  /** The last commit to change anything the page is made from. ISO 8601. */
  modified: string;
  /** The file that last change was made in: where its history is. */
  source: string;
}

const time = (iso: string) => new Date(iso).getTime();

/**
 * A page's dates from what it is made from, or nothing where the history
 * could not be read or does not have the page. It was published when its
 * oldest file was first committed. An entry does not say: it has no first
 * commit of its own, and a flow is not as old as the oldest standard it lists.
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
  const first = sources.flatMap((name) => history[name].first ?? []);
  if (first.length === 0) return undefined;
  const latest = sources.reduce((a, b) =>
    time(history[b].last) > time(history[a].last) ? b : a,
  );
  return {
    published: first.reduce((a, b) => (time(b) < time(a) ? b : a)),
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
