/**
 * When a page was first published and when it last changed, from the history
 * of what it is made from.
 *
 * `virtual:page-dates` is written when the site is built, by
 * src/integrations/page-dates.mjs: the dates of each file's first and last
 * commit, and of the last change to each entry of the files that are lists of
 * entries. It is empty where the build cannot see the whole history, and then
 * a page has no dates and says nothing about them.
 *
 * src/lib/page-sources.ts says what each page is made from. This file gives it
 * the history and the site's own data.
 */
import history from "virtual:page-dates";
import { flows } from "../data/flows";
import { glossary } from "../data/glossary";
import { implementationProfiles } from "../data/implementations";
import { lessons } from "../data/learn/lessons";
import type { PageDates, Site } from "./page-sources";
import { datesFor, madeFrom } from "./page-sources";

export type { PageDates } from "./page-sources";
export { longDate } from "./page-sources";

const site: Site = {
  flows,
  lessons,
  records: implementationProfiles.map((profile) => profile.slug),
  glossaryStandards: glossary.flatMap((term) => term.standard ?? []),
};

/** What a page is made from: files, directories ending in "/" and entries as `<file>#<name>`. */
export function pageSources(path: string): string[] {
  return madeFrom(path, site);
}

/** A page's dates, or nothing where the history could not be read or does not have the page. */
export function pageDates(path: string): PageDates | undefined {
  return datesFor(pageSources(path), history);
}
