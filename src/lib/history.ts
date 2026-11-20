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
 * wording is always the same: an IETF draft's name and month, and an RFC's
 * month. A draft is named as the IETF names it, in full, revision and all:
 * "draft-ietf-oauth-v2-1-17". Any other version is named by the entry's
 * `standing`, in its publisher's words, so an event that publishes one states
 * a new `standing`.
 */
export const versionLine = (version: KnownVersion | undefined) => {
  if (!version) return "";
  if (DRAFT_REVISION.test(version.label))
    return `${version.name ?? `Revision ${version.label}`}, ${monthAndYear(version.date)}.`;
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

/**
 * The links that go with an event wherever it is shown, in order: where it
 * was read, where what changed was read if that is somewhere else, and the
 * version it published.
 */
export const eventLinks = (
  e: HistoryEvent,
): { href: string; text: string }[] => [
  ...(e.source
    ? [
        {
          href: e.source,
          text: e.reported ? "Reported by this source" : "Source",
        },
      ]
    : []),
  ...(e.changesSource && e.changesSource !== e.source
    ? [{ href: e.changesSource, text: "What changed" }]
    : []),
  ...(e.version
    ? [{ href: e.version.url, text: e.version.name ?? e.version.label }]
    : []),
];

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

/** The kinds of event that change where a document is, and so are on any list of what moved. */
const MOVES: HistoryKind[] = [
  "adoption",
  "approval",
  "publication",
  "succession",
];

/**
 * What moved in a year, oldest first, a group for each month: the events that
 * changed where a document is, and any other marked `notable`.
 */
export const movedIn = (events: HistoryEvent[], year: string): EventGroup[] => {
  const groups = new Map<string, NamedEvent[]>();
  for (const event of inOrder(happenings(events), (e) => e.date)) {
    if (!event.date.startsWith(`${year}-`)) continue;
    if (!event.notable && !MOVES.includes(event.kind)) continue;
    const month = event.date.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), event]);
  }
  return [...groups].map(([key, list]) => ({ key, events: list }));
};

/** A date's month alone: "November". */
export const monthName = (date: string) => MONTHS[Number(date.slice(5, 7)) - 1];

/** The day the record began: the earliest baseline. */
export const recordBegan = (events: HistoryEvent[]) =>
  events
    .filter((event) => event.kind === "baseline")
    .map((event) => event.recorded)
    .sort()[0];

/* ───────────── The changelog as a feed ───────────── */

/** Where the feed is, and what it is called wherever it is linked. */
export const FEED = {
  href: "/standards/changes.xml",
  title: "Changelog of the standards tracker",
};

const xml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** What a piece of HTML says, as text: its tags taken out and its characters unescaped. */
const textOf = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");

/**
 * A time written so that it falls on `day`: as it is, where it does in its
 * own zone, or in UTC, where it does there. A time that falls on the day in
 * neither gives nothing: it is not a time on that day.
 */
export const timeOnDay = (time: string | undefined, day: string) => {
  if (!time || Number.isNaN(Date.parse(time))) return undefined;
  if (time.slice(0, 10) === day) return time;
  const utc = new Date(time).toISOString().replace(/\.\d{3}Z$/, "Z");
  return utc.slice(0, 10) === day ? utc : undefined;
};

/** An event's place on the timeline, which is where a feed entry leads. */
export const eventAnchor = (id: string) => id.replaceAll("/", "-");

/**
 * The changelog as an Atom feed (RFC 4287): an entry for each event, newest
 * recording first. An entry is the site's record of an event, so it is dated as
 * the changelog dates it: `published` is the day the site recorded the event,
 * and `updated` that day or the day it was corrected. When the event happened
 * can be long before, and is in the entry's content. Dating an entry by that
 * would put something new among what a reader read long ago (RFC 4287, 4.2.9).
 * Its id is made from the event's name, so it stays the same as the log grows.
 *
 * Each date has the time the event reached the site, and the time its
 * correction did, from `times`, where that time falls on the day: so entries
 * recorded the same day are in the order they went on the site. Where there is
 * no such time, the date is the start of its day in UTC. A correction is never
 * dated before what it corrects.
 *
 * An entry's `content` is the event as the timeline shows it, in HTML: when it
 * happened, what happened, what changed, a correction, and its links. Its
 * `summary` is what happened alone, as plain text, for a service that posts a
 * line and a link. Its categories are the kind of event and, where it has one,
 * the tracker entry it is about, so that a reader or a script can keep to some.
 *
 * `origin` is the site's address with no slash at its end, `names` gives the
 * name of the document an entry is about, `format` turns the inline
 * Markdown an event is written in into HTML, as the timeline does, and
 * `times` gives an event's times by its name, where they are known.
 */
export const feedOf = (
  events: HistoryEvent[],
  origin: string,
  names: (entry: string) => string,
  format: (text: string) => string,
  times: (
    id: string,
  ) => { recorded?: string; corrected?: string } | undefined = () => undefined,
): string => {
  const at = (day: string) => `${day}T00:00:00Z`;
  // a feed is read away from the site, so an address on it is given in full
  const absolute = (html: string) =>
    html.replaceAll('href="/', `href="${origin}/`);
  const dated = (e: NamedEvent) => {
    const time = times(e.id);
    const published = timeOnDay(time?.recorded, e.recorded) ?? at(e.recorded);
    const fixed = e.corrected
      ? (timeOnDay(time?.corrected, e.corrected.on) ?? at(e.corrected.on))
      : published;
    const updated =
      Date.parse(fixed) < Date.parse(published) ? published : fixed;
    return { published, updated };
  };
  const entries = happenings(events)
    .map((event, order) => ({ event, order, ...dated(event) }))
    .sort(
      (a, b) =>
        Date.parse(b.updated) - Date.parse(a.updated) || b.order - a.order,
    );
  const host = new URL(origin).host;
  /** What a category's term is one of: the kinds of event, or the tracker's entries. */
  const scheme = (of: "kind" | "entry") => `tag:${host},2026:standards/${of}`;
  const entry = ({
    event: e,
    published,
    updated,
  }: (typeof entries)[number]) => {
    const about = e.entry ? names(e.entry) : (e.subject ?? "");
    const label = KIND_LABEL[e.kind as keyof typeof KIND_LABEL];
    const summary = e.summary ? absolute(format(e.summary)) : "";
    const links = eventLinks(e);
    const html = [
      `<p>Happened ${spellDate(e.date)}</p>`,
      ...(summary ? [`<p>${summary}</p>`] : []),
      ...(e.changes?.length
        ? [
            `<ul>${e.changes.map((change) => `<li>${absolute(format(change))}</li>`).join("")}</ul>`,
          ]
        : []),
      ...(e.corrected ? [`<p>Corrected: ${xml(e.corrected.note)}</p>`] : []),
      ...(links.length
        ? [
            `<p>${links.map((link) => `<a href="${xml(link.href)}">${xml(link.text)}</a>`).join(" · ")}</p>`,
          ]
        : []),
    ].join("\n");
    return [
      "  <entry>",
      `    <id>tag:${host},2026:standards/${xml(e.id)}</id>`,
      `    <title>${xml(`${label}: ${about}`)}</title>`,
      `    <published>${xml(published)}</published>`,
      `    <updated>${xml(updated)}</updated>`,
      `    <link rel="alternate" type="text/html" href="${xml(`${origin}/standards/timeline/#${eventAnchor(e.id)}`)}"/>`,
      ...(e.source
        ? [`    <link rel="related" href="${xml(e.source)}"/>`]
        : []),
      `    <category scheme="${xml(scheme("kind"))}" term="${xml(e.kind)}" label="${xml(label)}"/>`,
      ...(e.entry
        ? [
            `    <category scheme="${xml(scheme("entry"))}" term="${xml(e.entry)}" label="${xml(about)}"/>`,
          ]
        : []),
      ...(summary ? [`    <summary>${xml(textOf(summary))}</summary>`] : []),
      `    <content type="html">${xml(html)}</content>`,
      "  </entry>",
    ].join("\n");
  };
  const updated = entries.length ? entries[0].updated : at(recordBegan(events));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <id>${xml(`${origin}${FEED.href}`)}</id>`,
    `  <title>${xml(`${FEED.title}: Who’s on First`)}</title>`,
    "  <subtitle>What has happened to the standards for agent authentication and authorization, as this site records it.</subtitle>",
    `  <updated>${xml(updated)}</updated>`,
    "  <author><name>Who’s on First</name></author>",
    `  <link rel="self" type="application/atom+xml" href="${xml(`${origin}${FEED.href}`)}"/>`,
    `  <link rel="alternate" type="text/html" href="${xml(`${origin}/standards/changes/`)}"/>`,
    ...entries.map(entry),
    "</feed>",
    "",
  ].join("\n");
};

/* ───────────── What one specification cites of another ───────────── */

export interface Citation {
  /** The version that cites: `<entry>@<label>`. */
  from: string;
  /** The version cited: `<entry>@<label>`, or `<entry>` where no revision is named. */
  to: string;
  /** Whether the citing document depends on it, or only refers to it. */
  kind: "normative" | "informative";
  /** What the citing document does with it, as a verb: "requires", "recommends", "builds on". */
  how: string;
  /** Where in the citing document this was read. */
  source: string;
  /** Anything about the citation that a reader of either entry should know. */
  note?: string;
}

/** A version's name taken apart: `oauth-2-1@-13` is entry `oauth-2-1`, label `-13`. */
export const versionName = (name: string) => {
  const at = name.indexOf("@");
  return at < 0
    ? { entry: name, label: undefined }
    : { entry: name.slice(0, at), label: name.slice(at + 1) };
};

/** What is wrong with the citations, one line each, or nothing. */
export const validateCitations = (
  citations: Citation[],
  events: HistoryEvent[],
  entries: Iterable<string>,
): string[] => {
  const known = new Set(entries);
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const citation of citations) {
    const name = `${citation.from} → ${citation.to}`;
    const fail = (message: string) => errors.push(`${name}: ${message}`);
    if (seen.has(name)) fail("is listed twice");
    seen.add(name);
    const from = versionName(citation.from);
    const to = versionName(citation.to);
    if (!from.label) fail("the citing side names a version: <entry>@<label>");
    if (from.entry === to.entry) fail("a document does not cite itself");
    for (const side of [from, to]) {
      if (!known.has(side.entry)) {
        fail(`"${side.entry}" is not a tracker entry`);
      } else if (
        side.label &&
        !versionsOf(events, side.entry).some((v) => v.label === side.label)
      ) {
        fail(
          `the log has no version ${side.label} of "${side.entry}": record the event that published it`,
        );
      }
    }
    if (citation.kind !== "normative" && citation.kind !== "informative")
      fail(`unknown kind "${citation.kind}"`);
    if (!citation.how.trim()) fail("does not say how it is cited");
    if (!isUrl(citation.source))
      fail("has no source, or one that is not an https address");
  }
  return errors;
};

/** A citation with what the log says of the two versions today. */
export interface ReadCitation extends Citation {
  fromEntry: string;
  fromLabel: string;
  toEntry: string;
  /** The revision cited, where one is named. */
  toLabel?: string;
  /** The cited document's current version, where the log has one. */
  current?: string;
  /**
   * Each version as its publisher writes it: its full name where the log has
   * one ("draft-ietf-oauth-v2-1-13"), and its label where that is the whole of
   * it ("2026-07-28"). A page shows these, and adds no word of its own.
   */
  fromName: string;
  toName?: string;
  currentName?: string;
  /** True where a revision is named and the cited document has moved past it. */
  behind: boolean;
  /** True where the citing version is no longer its document's current one. */
  superseded: boolean;
}

/** Every citation, read against the log. */
export const readCitations = (
  citations: Citation[],
  events: HistoryEvent[],
): ReadCitation[] =>
  citations.map((citation) => {
    const from = versionName(citation.from);
    const to = versionName(citation.to);
    const now = currentOf(events, to.entry)?.version;
    const current = now?.label;
    const written = (entry: string, label: string | undefined) => {
      const version = versionsOf(events, entry).find((v) => v.label === label);
      return version?.name ?? label;
    };
    return {
      ...citation,
      fromEntry: from.entry,
      fromLabel: from.label ?? "",
      toEntry: to.entry,
      toLabel: to.label,
      current,
      fromName: written(from.entry, from.label) ?? "",
      toName: written(to.entry, to.label),
      currentName: now?.name ?? now?.label,
      behind:
        to.label !== undefined && current !== undefined && current !== to.label,
      superseded: currentOf(events, from.entry)?.version?.label !== from.label,
    };
  });
