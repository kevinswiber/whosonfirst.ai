/**
 * When a page was first published and when it last changed, from the history
 * of the files it is made from.
 *
 * `virtual:page-dates` is written when the site is built, by
 * src/integrations/page-dates.mjs: a map from a file's path to the dates of its
 * first and last commit. It is empty where the build cannot see the whole
 * history, and then a page has no dates and says nothing about them.
 *
 * A page is made from its own file under src/pages/ and, for most, from data.
 * `MADE_FROM` names the data. A path that ends in "/" is a directory, and means
 * every file under it.
 */
import history from "virtual:page-dates";

const MADE_FROM: [page: RegExp, files: (slug: string) => string[]][] = [
  [/^\/$/, () => ["src/pages/index.astro"]],
  [/^\/flows\/$/, () => ["src/pages/flows/index.astro", "src/data/flows/"]],
  [/^\/flows\/([^/]+)\/$/, (slug) => [`src/data/flows/${slug}.ts`]],
  [
    /^\/learn\/$/,
    () => ["src/pages/learn/index.astro", "src/data/learn/lessons.ts"],
  ],
  [/^\/guide\/$/, () => ["src/pages/guide/index.astro", "src/data/guide.ts"]],
  [/^\/guide\/([^/]+)\/$/, () => ["src/data/guide.ts"]],
  [
    /^\/standards\/$/,
    () => ["src/pages/standards/index.astro", "src/data/standards.ts"],
  ],
  [
    /^\/glossary\/$/,
    () => ["src/pages/glossary/index.astro", "src/data/glossary.ts"],
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
    () => [
      "src/pages/implementations/index.astro",
      "src/data/implementations/records.ts",
    ],
  ],
  // One file holds every flow's record, so its history cannot date one of
  // them. A record's page gives the day its evidence was reviewed instead.
  [/^\/implementations\/([^/]+)\/$/, () => []],
];

/** The files a page is made from. Any other page is made from its own file. */
export function madeFrom(path: string): string[] {
  for (const [page, files] of MADE_FROM) {
    const m = page.exec(path);
    if (m) return files(m[1]);
  }
  const at = `src/pages${path.replace(/\/$/, "")}`;
  return [`${at}.astro`, `${at}.mdx`, `${at}/index.astro`, `${at}/index.mdx`];
}

export interface PageDates {
  /** The first commit of the oldest of the page's files. ISO 8601. */
  published: string;
  /** The last commit to change any of them. ISO 8601. */
  modified: string;
  /** The file whose history says the most about the page: the first one named. */
  source: string;
}

const time = (iso: string) => new Date(iso).getTime();

/** A page's dates, or nothing where the history could not be read or does not have the page. */
export function pageDates(path: string): PageDates | undefined {
  const files = Object.keys(history);
  const named = madeFrom(path);
  const found = named.flatMap((name) =>
    name.endsWith("/") ? files.filter((f) => f.startsWith(name)) : [name],
  );
  const dated = found.filter((f) => history[f]);
  if (dated.length === 0) return undefined;
  const first = dated.map((f) => history[f].first);
  const last = dated.map((f) => history[f].last);
  return {
    published: first.reduce((a, b) => (time(b) < time(a) ? b : a)),
    modified: last.reduce((a, b) => (time(b) > time(a) ? b : a)),
    source: named.find((n) => n.endsWith("/") || history[n]) ?? dated[0],
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
