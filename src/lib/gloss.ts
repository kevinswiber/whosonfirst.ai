/**
 * Glossary terms, linked where they are used.
 *
 * `inline()` and `block()` in md.ts take a Gloss. With one, the first time a
 * glossary term appears in the text they are given, it becomes a link to its
 * entry that carries the definition with it. A script in the base layout shows
 * that definition in place on hover or focus. Activating the link always goes
 * to the glossary, with or without the script.
 * Explicit links to known glossary entries carry the same preview, without
 * changing which ordinary-text occurrence is marked automatically.
 *
 * "The first time" is counted by the Gloss, so whoever renders a piece of the
 * page decides what one reading of it is: a flow page's own text shares one, and
 * each step of its diagram has its own, because steps are read one at a time.
 */
import { glossary } from "../data/glossary";
import { standards } from "../data/standards";
import { STATUS_LABEL, STATUS_TONE } from "../data/types";
import { termSlug } from "./term";

/** Too common on this site to be worth marking: every page is about them. */
const UNMARKED = new Set(["agent", "workload", "oauth", "mcp"]);
/** These also have ordinary meanings. Authors link their technical uses explicitly. */
const EXPLICIT = new Set(["claim", "state"]);

interface Entry {
  /** A glossary term, or a document in the standards tracker. */
  kind: "term" | "spec";
  term: string;
  slug: string;
  /** The definition as plain text, for an attribute. */
  def: string;
  /** Where the term is explained at length, if anywhere. */
  home?: string;
  /** Written in capitals, so "AS" does not match "as". */
  exact: boolean;
  /** For a document: its identifier and its status, as the tracker words it. */
  ref?: string;
  status?: string;
  tone?: string;
}

const plain = (md: string) =>
  md
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

const entries = new Map<string, Entry>();
const definitions = new Map<string, Omit<Entry, "exact">>();
for (const t of glossary) {
  const base = {
    kind: "term" as const,
    term: t.term,
    slug: termSlug(t.term),
    def: plain(t.def),
    home: t.see?.href,
  };
  definitions.set(base.slug, base);
  if (UNMARKED.has(t.term.toLowerCase()) || EXPLICIT.has(t.term.toLowerCase()))
    continue;
  for (const name of [t.term, ...(t.aka ?? [])]) {
    // claim names such as `aud` are only ever written as code, which is left alone
    if (/^[a-z]{2,4}$/.test(name)) continue;
    entries.set(name.toLowerCase(), {
      ...base,
      exact: /^[A-Z0-9-]{2,6}$/.test(name),
    });
  }
}

/*
 * Documents in the standards tracker. A concept is the glossary's: "DPoP" or
 * "token exchange" is marked as a term. What is marked here is an identifier
 * that says nothing to a reader by itself, such as "RFC 7519", so its preview
 * can say which document that is, what it defines and how settled it is.
 * Authored links to a tracker entry carry the same preview.
 */
const documents = new Map<string, Omit<Entry, "exact">>();
for (const s of standards) {
  const base = {
    kind: "spec" as const,
    term: s.name,
    slug: s.id,
    def: plain(s.summary),
    home: "/standards/",
    ref: s.ref,
    status: STATUS_LABEL[s.status],
    tone: STATUS_TONE[s.status],
  };
  documents.set(s.id, base);
  if (/^RFC \d{4,5}$/.test(s.ref))
    entries.set(s.ref.toLowerCase(), { ...base, exact: true });
}

const literal = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// longest first, so "authorization server" wins over "authorization code" only where it is written
const names = [...entries.keys()].sort((a, b) => b.length - a.length);
const PATTERN = new RegExp(
  `(?<![\\w-])(${names.map(literal).join("|")})(s?)(?![\\w-])`,
  "gi",
);

export interface Gloss {
  /** Terms and documents already marked in this reading, by `href`. */
  seen: Set<string>;
  /** The page being rendered: a term is not marked on the page that explains it. */
  path?: string;
}

export function gloss(path?: string): Gloss {
  return { seen: new Set(), path };
}

const attr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const opening = (e: Omit<Entry, "exact">) =>
  `<a class="${e.kind}" href="${href(e)}" ${data(e)}>`;
const href = (e: Omit<Entry, "exact">) =>
  e.kind === "term" ? `/glossary/#${e.slug}` : `/standards/#${e.slug}`;
const data = (e: Omit<Entry, "exact">) =>
  [
    `data-term="${attr(e.term)}"`,
    `data-def="${attr(e.def)}"`,
    ...(e.ref ? [`data-ref="${attr(e.ref)}"`] : []),
    ...(e.status ? [`data-status="${attr(e.status)}"`] : []),
    ...(e.tone !== undefined ? [`data-tone="${attr(e.tone)}"`] : []),
  ].join(" ");

/** Give an authored glossary or tracker link the same preview as an automatically marked one.
 * The caller supplies just the opening tag; its label and destination stay intact.
 * Explicit links express the author's intent, even for ambiguous or repeated terms.
 */
export function markExplicitLink(tag: string): string {
  const to = tag.match(/\shref=(["'])\/(glossary|standards)\/#([^"']+)\1/);
  const entry =
    to && (to[2] === "glossary" ? definitions : documents).get(to[3]);
  if (!entry || /\sdata-term=/.test(tag)) return tag;
  const classes = /\sclass=(["'])(.*?)\1/;
  const styled = classes.test(tag)
    ? tag.replace(
        classes,
        (_, quote: string, value: string) =>
          ` class=${quote}${value.split(/\s+/).includes(entry.kind) ? value : `${value} ${entry.kind}`}${quote}`,
      )
    : tag.replace(/^<a\b/i, `<a class="${entry.kind}"`);
  return styled.replace(/>$/, ` ${data(entry)}>`);
}

/**
 * Marks first uses of glossary terms and of RFC numbers in a run of text that is already HTML-escaped
 * and has had its code spans and links lifted out, so nothing here can land inside
 * a tag, a code span or another link.
 */
export function mark(text: string, g: Gloss): string {
  return text.replace(PATTERN, (whole, name: string, plural: string) => {
    const e = entries.get(name.toLowerCase());
    if (!e) return whole;
    if (e.exact && name !== name.toUpperCase()) return whole;
    if (g.seen.has(href(e))) return whole;
    if (e.home && g.path && e.home.split("#")[0] === g.path) return whole;
    g.seen.add(href(e));
    return `${opening(e)}${name}${plural}</a>`;
  });
}

/** Inside these, text is left alone: it is already a link, is literal, is a heading, or belongs to a control. */
const LEAVE = new Set([
  "a",
  "code",
  "pre",
  "button",
  "summary",
  "label",
  "svg",
  "script",
  "style",
  "h1",
  "h2",
  "h3",
  "h4",
  "th",
  "figure",
]);

/**
 * Marks first uses of glossary terms in rendered HTML: the text of paragraphs and
 * list items, outside the elements above and outside any custom element, whose
 * insides belong to its own script. For pages written in MDX, whose text never
 * passes through md.ts.
 */
export function markHtml(html: string, g: Gloss): string {
  let prose = 0; // depth inside <p> or <li>
  let leave = 0; // depth inside something to leave alone
  return html.replace(
    /<(\/?)([a-zA-Z][\w-]*)([^>]*)>|([^<]+)/g,
    (whole, close: string, tag: string, rest: string, text: string) => {
      if (text !== undefined)
        return prose > 0 && leave === 0 ? mark(text, g) : text;
      const name = tag.toLowerCase();
      if (rest.endsWith("/")) return whole;
      const rendered =
        !close && name === "a" && prose > 0 && leave === 0
          ? markExplicitLink(whole)
          : whole;
      const step = close ? -1 : 1;
      if (name === "p" || name === "li") prose = Math.max(0, prose + step);
      if (LEAVE.has(name) || name.includes("-"))
        leave = Math.max(0, leave + step);
      return rendered;
    },
  );
}
