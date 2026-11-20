/**
 * For a page that names a version in its own sentence: the name, read from
 * the log, so the sentence cannot fall behind it.
 *
 * A flow page that says “the current draft is draft-ietf-oauth-v2-1-17” writes
 * `${current("oauth-2-1")}` in its text, and one that says which revision a
 * specification cites writes `${cited("mcp-authorization@2026-07-28",
 * "oauth-2-1")}`. Each gives the version as its publisher writes it, and each
 * stops the build if the log or the citations have nothing to give.
 */
import { currentOf, readCitations, spellDate } from "../../lib/history.ts";
import { citations } from "./citations.ts";
import { history } from "./index.ts";

const now = (entry: string) => {
  const version = currentOf(history, entry)?.version;
  if (!version)
    throw new Error(
      `the log in src/data/history/ has no current version for "${entry}"`,
    );
  return version;
};

/** The current version of an entry, as its publisher writes it. */
export const current = (entry: string) => now(entry).name ?? now(entry).label;

/** The day, or the month, the current version of an entry was published. */
export const currentDate = (entry: string) => spellDate(now(entry).date);

/**
 * The version of `to` that `from` cites, as its publisher writes it. `from`
 * is a version, `<entry>@<label>`, and `to` an entry.
 */
export const cited = (from: string, to: string) => {
  const found = readCitations(citations, history).find(
    (c) => c.from === from && c.toEntry === to,
  );
  if (!found?.toName)
    throw new Error(
      `src/data/history/citations.ts has no citation from ${from} to a version of "${to}"`,
    );
  return found.toName;
};
