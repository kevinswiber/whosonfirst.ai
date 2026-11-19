/**
 * The history of the standards the tracker follows: what happened to each
 * document in its body's process, when, and when this site reported it.
 *
 * It is one log of events, written in the order the site learned them. A
 * source review appends to the file for the month it runs in, so that file's
 * diff is the changelog of the site's reporting. A document's own history, its
 * versions and where it stands now are read out of the log by the functions
 * below, and are not kept anywhere else.
 *
 * An event is something that happened to a document. A clarification or an
 * edit to the site's wording is not one. An event recorded wrongly is corrected
 * in place, with `corrected` saying when and what.
 *
 * The data is in src/data/history/. The design is on issue #147.
 */
import type { StdStatus } from "../data/types.ts";

/**
 * - baseline: where a document stood when its record began. Its whole state,
 *   and nothing that happened that day.
 * - version: a revision, release or edition was published
 * - adoption: taken up by a working group, or given to a foundation
 * - call: a call for adoption or a last call opened or closed
 * - process: a named step in the body's own process, such as an IESG or RFC
 *   Editor state, a vote or an announced schedule
 * - approval: approved for publication, or as final
 * - publication: published as an RFC, a final specification, a Recommendation
 *   or a generally available feature
 * - succession: replaced, renamed, expired or withdrawn
 * - discussion: a presentation, a poll or a meeting that bears on the document
 *
 * The kinds are the same for every body. A body's own name for a state ("AD
 * Evaluation") goes in the summary, as the source words it.
 */
export type HistoryKind =
  | "baseline"
  | "version"
  | "adoption"
  | "call"
  | "process"
  | "approval"
  | "publication"
  | "succession"
  | "discussion";

export const HISTORY_KINDS: HistoryKind[] = [
  "baseline",
  "version",
  "adoption",
  "call",
  "process",
  "approval",
  "publication",
  "succession",
  "discussion",
];

export interface HistoryVersion {
  /**
   * What its publisher calls this version, in the shortest form that is
   * unique within the entry: "-09", "RFC 9700", "2026-07-28", "v1.0.1". With
   * the entry's id it names the version anywhere on the site: `wimse-arch@-09`.
   */
  label: string;
  /** Its full name, where that differs: "draft-ietf-wimse-arch-09". */
  name?: string;
  /** This version's own address, which a later version does not replace, where there is one. */
  url: string;
  /** On a baseline only: when this version was published. Elsewhere that is the event's date. */
  date?: string;
  /** A release candidate or a preview: published, and not the current version. */
  pre?: boolean;
}

export interface HistoryEvent {
  /** The tracker entry's id. Left out for an event about no tracked document. */
  entry?: string;
  /** For an event with no entry: what it is about, such as a working group. */
  subject?: string;
  kind: HistoryKind;
  /** When it happened: a day, or a month where the source gives no day. */
  date: string;
  /** The day the site reported it. */
  recorded: string;
  /** What happened, as a sentence. Not on a baseline. */
  summary?: string;
  /**
   * Where the document stands after this, as the tracker says it until a
   * later event says otherwise.
   */
  standing?: string;
  /** The tracker status the document has from this event on, where the event changes it. */
  status?: StdStatus;
  /** Where the event was read. Not on a baseline, whose source is the entry's own. */
  source?: string;
  /** True when the source is secondary, and the site words the event as reported. */
  reported?: boolean;
  /** The version this event published, or on a baseline the current one. */
  version?: HistoryVersion;
  /** What this version changed from the one before, as its source says. */
  changes?: string[];
  /** Where `changes` was read: the document's own change log, or a diff. */
  changesSource?: string;
  /** Shown on the site-wide timeline whatever its kind. */
  notable?: boolean;
  /** Set when a recorded event was wrong and has been put right. */
  corrected?: { on: string; note: string };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

const dayIsValid = (value: string) =>
  DAY.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;

/** A day, or a month. */
const dateIsValid = (value: string) =>
  dayIsValid(value) || (MONTH.test(value) && dayIsValid(`${value}-01`));

const isUrl = (value: string | undefined) => {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Puts things in the order they happened. Months are in order, and so are the
 * days inside a month. A month has no place among the days inside it, so
 * something dated by its month keeps the place the log gave it among them.
 */
const inOrder = <T>(items: T[], dateOf: (item: T) => string): T[] => {
  const months = new Map<string, T[]>();
  for (const item of items) {
    const month = dateOf(item).slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), item]);
  }
  return [...months.keys()].sort().flatMap((month) => {
    const group = months.get(month) ?? [];
    const hasDay = (item: T) => dateOf(item).length === 10;
    const days = group
      .filter(hasDay)
      .map((item, at) => ({ item, at }))
      .sort(
        (x, y) => dateOf(x.item).localeCompare(dateOf(y.item)) || x.at - y.at,
      )
      .map(({ item }) => item);
    let next = 0;
    return group.map((item) => (hasDay(item) ? days[next++] : item));
  });
};

/** The events in the order they happened. */
export const byDate = (events: HistoryEvent[]) =>
  inOrder(events, (event) => event.date);

/** One entry's events, in the order they happened. */
export const historyOf = (events: HistoryEvent[], entry: string) =>
  byDate(events.filter((event) => event.entry === entry));

export interface KnownVersion extends HistoryVersion {
  entry: string;
  /** When it was published. */
  date: string;
}

/**
 * The versions of an entry the log knows, oldest first. A baseline may name a
 * version an earlier event already published: that is one version, and the
 * event that published it gives its date.
 */
export const versionsOf = (
  events: HistoryEvent[],
  entry: string,
): KnownVersion[] => {
  const versions = new Map<string, KnownVersion>();
  for (const event of historyOf(events, entry)) {
    const version = event.version;
    if (!version || versions.has(version.label)) continue;
    versions.set(version.label, {
      ...version,
      entry,
      date: version.date ?? event.date,
    });
  }
  return inOrder([...versions.values()], (version) => version.date);
};

export interface Standing {
  status: StdStatus;
  /** The current version: the latest that is not a release candidate. */
  version?: KnownVersion;
  /** The sentence from the latest event that has one. */
  standing?: string;
}

/**
 * Where an entry stands now. A baseline states everything, so reading starts
 * again from the latest one; each later event changes only what it names.
 */
export const currentOf = (
  events: HistoryEvent[],
  entry: string,
): Standing | undefined => {
  let now: Standing | undefined;
  for (const event of historyOf(events, entry)) {
    if (event.kind === "baseline") {
      if (!event.status) continue;
      now = { status: event.status };
    }
    if (!now) continue;
    if (event.status) now.status = event.status;
    if (event.standing) now.standing = event.standing;
    if (event.version && !event.version.pre) {
      now.version = {
        ...event.version,
        entry,
        date: event.version.date ?? event.date,
      };
    }
  }
  return now;
};

const DRAFT_REVISION = /^-\d+$/;
const RFC_NUMBER = /^RFC \d+$/;
/** The labels `versionLine` words by itself. */
const SELF_WORDED = /^(-\d+|RFC \d+)$/;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** A date's month and year, as the tracker writes them: "November 2026". */
const monthAndYear = (date: string) =>
  `${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;

/**
 * What the tracker says of a version by itself, for the two kinds whose
 * wording is always the same: an IETF draft's revision and month, and an
 * RFC's month. Any other version is named by the entry's `standing`, in its
 * publisher's words, so an event that publishes one states a new `standing`.
 */
export const versionLine = (version: KnownVersion | undefined) => {
  if (!version) return "";
  if (DRAFT_REVISION.test(version.label))
    return `Revision ${version.label}, ${monthAndYear(version.date)}.`;
  if (RFC_NUMBER.test(version.label)) return `${monthAndYear(version.date)}.`;
  return "";
};

/**
 * An entry's status line: its version, where it stands, and the entry's own
 * lasting note, in that order.
 */
export const statusLine = (now: Standing, note?: string) =>
  [versionLine(now.version), now.standing, note].filter(Boolean).join(" ");

/**
 * A name for an event that stays the same as the log grows: its entry, its
 * date and its kind, with a number where an entry has two alike on one day.
 */
export const eventIds = (events: HistoryEvent[]) => {
  const seen = new Map<string, number>();
  return events.map((event) => {
    const base = `${event.entry ?? "field"}/${event.date}/${event.kind}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  });
};

const STATUSES: StdStatus[] = [
  "rfc",
  "final",
  "wg-draft",
  "draft",
  "project",
  "guidance",
];

/**
 * What is wrong with a log, one line each, or nothing. `entries` is the ids of
 * the tracker's entries.
 */
export const validateHistory = (
  events: HistoryEvent[],
  entries: Iterable<string>,
): string[] => {
  const known = new Set(entries);
  const errors: string[] = [];
  const ids = eventIds(events);
  const baselines = new Set<string>();
  const labels = new Map<string, string>();
  let latest = "";

  events.forEach((event, at) => {
    const id = ids[at];
    const fail = (message: string) => errors.push(`${id}: ${message}`);

    if (!HISTORY_KINDS.includes(event.kind))
      fail(`unknown kind "${event.kind}"`);
    if (event.entry === undefined) {
      if (!event.subject?.trim())
        fail("has no entry, so it needs a subject: what it is about");
      if (event.kind === "baseline" || event.version || event.status)
        fail(
          "has no entry, so it cannot carry a baseline, a version or a status",
        );
    } else if (!known.has(event.entry)) {
      fail(`"${event.entry}" is not a tracker entry`);
    }

    if (!dateIsValid(event.date))
      fail(`"${event.date}" is not a day or a month`);
    if (!dayIsValid(event.recorded)) {
      fail(`recorded "${event.recorded}" is not a day`);
    } else {
      if (event.date > event.recorded.slice(0, event.date.length))
        fail(
          `happened ${event.date}, after it was recorded on ${event.recorded}`,
        );
      if (event.recorded < latest)
        fail(
          `recorded ${event.recorded}, but follows an event recorded ${latest}: the log is in the order it was written`,
        );
      else latest = event.recorded;
    }

    if (event.status && !STATUSES.includes(event.status))
      fail(`unknown status "${event.status}"`);

    if (event.kind === "baseline") {
      if (!event.status) fail("a baseline states the status");
      if (event.summary || event.source || event.changes)
        fail(
          "a baseline says where a document stood, and carries no summary, source or changes",
        );
      if (event.entry) {
        if (baselines.has(event.entry))
          fail("is a second baseline for its entry");
        baselines.add(event.entry);
      }
      if (event.version && !event.version.date)
        fail("a baseline's version says when it was published");
    } else {
      if (!event.summary?.trim()) fail("has no summary");
      if (!isUrl(event.source))
        fail("has no source, or one that is not an https address");
      if (event.version?.date)
        fail(
          "a version's date is its event's date, and is stated only on a baseline",
        );
    }

    if (event.kind === "version" && !event.version)
      fail("publishes no version");
    if (event.version) {
      const version = event.version;
      if (!version.label.trim()) fail("has a version with no label");
      if (!isUrl(version.url)) fail("has a version with no https address");
      if (version.date && !dateIsValid(version.date))
        fail(`version date "${version.date}" is not a day or a month`);
      if (
        version.date &&
        dayIsValid(event.recorded) &&
        version.date > event.recorded
      )
        fail(`version dated ${version.date}, after it was recorded`);
      const key = `${event.entry}@${version.label}`;
      const before = labels.get(key);
      // A baseline may name a version an earlier event published, and no other event may.
      if (before && event.kind !== "baseline")
        fail(`${key} was already published by ${before}`);
      if (!before) labels.set(key, id);
    }
    // The tracker words a draft's revision and an RFC's month itself. Any other
    // version it names only through `standing`, which would go on naming the
    // one before.
    if (
      event.kind !== "baseline" &&
      event.version &&
      !event.version.pre &&
      !SELF_WORDED.test(event.version.label) &&
      !event.standing?.trim()
    )
      fail(
        `publishes ${event.version.label} and has no standing: say where the document stands now, naming this version`,
      );
    if ((event.changes || event.changesSource) && !event.version)
      fail("lists changes, and names no version that made them");
    if (event.changes && !isUrl(event.changesSource))
      fail("lists changes with no source for them");

    if (event.corrected) {
      if (!dayIsValid(event.corrected.on) || !event.corrected.note.trim())
        fail(
          "a correction has the day it was made and a note of what was wrong",
        );
      else if (event.corrected.on < event.recorded)
        fail("was corrected before it was recorded");
    }
  });

  for (const entry of known) {
    if (!baselines.has(entry))
      errors.push(
        `${entry}: has no baseline. Add one when an entry joins the tracker`,
      );
  }
  return errors;
};

/* ───────────── For the pages that show the log ───────────── */

/** What each kind of event is called on a page. A baseline is not shown. */
export const KIND_LABEL: Record<Exclude<HistoryKind, "baseline">, string> = {
  version: "New version",
  adoption: "Adopted",
  call: "Call",
  process: "Process",
  approval: "Approved",
  publication: "Published",
  succession: "Replaced",
  discussion: "Discussed",
};

/** A date as a page writes it: "November 13, 2026", or "November 2026" for a month. */
export const spellDate = (date: string) =>
  date.length === 7
    ? monthAndYear(date)
    : `${MONTHS[Number(date.slice(5, 7)) - 1]} ${Number(date.slice(8, 10))}, ${date.slice(0, 4)}`;

/** An event with the name that addresses it on a page. */
export interface NamedEvent extends HistoryEvent {
  id: string;
}

/** Everything that happened: the log without its baselines, each event with its name. */
export const happenings = (events: HistoryEvent[]): NamedEvent[] => {
  const ids = eventIds(events);
  return events
    .map((event, at) => ({ ...event, id: ids[at] }))
    .filter((event) => event.kind !== "baseline");
};

export interface EventGroup {
  /** A month for the timeline, a day for the changelog. */
  key: string;
  events: NamedEvent[];
}

/** What happened, newest first, a group for each month it happened in. */
export const timeline = (events: HistoryEvent[]): EventGroup[] => {
  const groups = new Map<string, NamedEvent[]>();
  for (const event of inOrder(happenings(events), (e) => e.date).reverse()) {
    const month = event.date.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), event]);
  }
  return [...groups].map(([key, list]) => ({ key, events: list }));
};

/**
 * What the site reported, newest first, a group for each day it recorded
 * something. Within a day the latest to happen is first. An event that was
 * corrected is also under the day of its correction.
 */
export const changelog = (events: HistoryEvent[]): EventGroup[] => {
  const groups = new Map<string, NamedEvent[]>();
  const all = inOrder(happenings(events), (e) => e.date).reverse();
  for (const event of all)
    for (const day of new Set([event.recorded, event.corrected?.on]))
      if (day) groups.set(day, [...(groups.get(day) ?? []), event]);
  return [...groups]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, list]) => ({ key, events: list }));
};

/** The day the record began: the earliest baseline. */
export const recordBegan = (events: HistoryEvent[]) =>
  events
    .filter((event) => event.kind === "baseline")
    .map((event) => event.recorded)
    .sort()[0];
