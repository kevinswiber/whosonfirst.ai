/**
 * Glossary terms and standards, linked where they are used.
 *
 * `inline()` and `block()` in md.ts take a Gloss. With one, the first time a
 * glossary term or a document in the standards tracker appears in the text they
 * are given, it becomes a link to its entry that carries what it is with it. A
 * script in the base layout shows that in place on hover or focus. Activating
 * the link always goes to the entry, with or without the script.
 * Explicit links to known glossary or tracker entries carry the same preview,
 * without changing which ordinary-text occurrence is marked automatically.
 *
 * "The first time" is counted by the Gloss, so whoever renders a piece of the
 * page decides what one reading of it is: a flow page's own text shares one, and
 * each step of its diagram has its own, because steps are read one at a time.
 */
import { glossary } from "../data/glossary";
import { standards } from "../data/standards";
import { STATUS_LABEL, STATUS_TONE } from "../data/types";
import { must } from "./must";
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
  /** Matched only as written here, so "AS" does not match "as". */
  written?: string;
  /**
   * The document: its identifier and its status, as the tracker words it. A
   * term that names a specification carries its document's too, and `spec`
   * says which tracker entry that is.
   */
  ref?: string;
  status?: string;
  tone?: string;
  spec?: string;
}
type Target = Omit<Entry, "written">;

const plain = (md: string) =>
  md
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

/*
 * Documents in the standards tracker. A concept is the glossary's: "DPoP" or
 * "token exchange" is marked as a term, and the term's preview says which
 * document defines it and how settled that is. What is marked as a document is
 * a name that is not a glossary term: an RFC number, which says nothing to a
 * reader by itself, and the proper names below. Authored links to a tracker
 * entry carry the same preview.
 */
const documents = new Map<string, Target>();
for (const s of standards)
  documents.set(s.id, {
    kind: "spec",
    term: s.name,
    slug: s.id,
    def: plain(s.summary),
    home: "/standards/",
    ref: s.ref,
    status: STATUS_LABEL[s.status],
    tone: STATUS_TONE[s.status],
  });

/**
 * Names of documents that the text uses as they are written in the tracker,
 * matched with their capitals: "HTTP Message Signatures" is marked, "message
 * signatures" is not. A name that is also used for a mechanism in general, such
 * as "token introspection", is not listed: authors link those uses.
 */
const NAMED: Record<string, string[]> = {
  rfc9421: ["HTTP Message Signatures"],
  "signature-key": ["HTTP Signature Keys"],
  rfc7638: ["JWK Thumbprint"],
  rfc9635: ["GNAP"],
  rfc8628: ["Device Authorization Grant"],
  "oidc-discovery": ["OpenID Connect Discovery"],
  rfc8417: ["Security Event Token"],
  "shared-signals": ["Shared Signals Framework"],
  caep: ["CAEP", "Continuous Access Evaluation Profile"],
  authzen: ["AuthZEN"],
  "coaz-framework": ["COAZ Framework"],
  rfc9901: ["SD-JWT"],
  "delegate-sd-jwt": ["Delegate SD-JWT"],
  ap2: ["AP2", "Agent Payments Protocol"],
  biscuit: ["Biscuit"],
  spire: ["SPIRE"],
  agentgateway: ["agentgateway"],
  "k8s-pod-certificates": ["Pod Certificates"],
  "k8s-clustertrustbundle": ["ClusterTrustBundle"],
  "kube-agentic-networking": ["Kube Agentic Networking"],
};

const entries = new Map<string, Entry>();
const add = (name: string, e: Entry) => {
  const key = name.toLowerCase();
  const had = entries.get(key);
  if (had && had.slug !== e.slug)
    throw new Error(`"${name}" names both ${had.slug} and ${e.slug}`);
  entries.set(key, e);
};

for (const [id, names] of Object.entries(NAMED)) {
  const d = must(
    documents.get(id),
    `tracker entry "${id}" (named in gloss.ts)`,
  );
  for (const name of names) add(name, { ...d, written: name });
}
for (const d of documents.values())
  if (/^RFC \d{4,5}$/.test(d.ref ?? ""))
    add(d.ref as string, { ...d, written: d.ref });

const definitions = new Map<string, Target>();
for (const t of glossary) {
  const d =
    t.standard &&
    must(
      documents.get(t.standard),
      `tracker entry "${t.standard}" (the standard of glossary term "${t.term}")`,
    );
  const base: Target = {
    kind: "term",
    term: t.term,
    slug: termSlug(t.term),
    def: plain(t.def),
    home: t.see?.href,
    ...(d && { ref: d.ref, status: d.status, tone: d.tone, spec: d.slug }),
  };
  definitions.set(base.slug, base);
  if (UNMARKED.has(t.term.toLowerCase()) || EXPLICIT.has(t.term.toLowerCase()))
    continue;
  for (const name of [t.term, ...(t.aka ?? [])]) {
    // claim names such as `aud` are only ever written as code, which is left alone
    if (/^[a-z]{2,4}$/.test(name)) continue;
    add(name, {
      ...base,
      written: /^[A-Z0-9-]{2,6}$/.test(name) ? name : undefined,
    });
  }
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

const opening = (e: Target) =>
  `<a class="${e.kind}" href="${href(e)}" ${data(e)}>`;
const href = (e: Target) =>
  e.kind === "term" ? `/glossary/#${e.slug}` : `/standards/#${e.slug}`;
const data = (e: Target) =>
  [
    `data-term="${attr(e.term)}"`,
    `data-def="${attr(e.def)}"`,
    ...(e.ref ? [`data-ref="${attr(e.ref)}"`] : []),
    ...(e.status ? [`data-status="${attr(e.status)}"`] : []),
    ...(e.tone !== undefined ? [`data-tone="${attr(e.tone)}"`] : []),
    ...(e.spec ? [`data-standard="/standards/#${attr(e.spec)}"`] : []),
  ].join(" ");

/**
 * The attributes that give a link written in a template, not in text, the
 * preview of the glossary or tracker entry it points to: its class and the
 * data the preview reads. Nothing for any other address.
 */
export function previewOf(address: string): Record<string, string> | undefined {
  const tag = markExplicitLink(`<a href="${attr(address)}">`);
  const found = [...tag.matchAll(/\s([\w-]+)="([^"]*)"/g)].filter(
    ([, name]) => name !== "href",
  );
  if (!found.length) return undefined;
  const unescape = (v: string) =>
    v
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&amp;/g, "&");
  return Object.fromEntries(found.map(([, name, v]) => [name, unescape(v)]));
}

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
 * Marks first uses of glossary terms and of documents in the tracker, in a run of text that is already HTML-escaped
 * and has had its code spans and links lifted out, so nothing here can land inside
 * a tag, a code span or another link.
 */
export function mark(text: string, g: Gloss): string {
  return text.replace(PATTERN, (whole, name: string, plural: string) => {
    const e = entries.get(name.toLowerCase());
    if (!e) return whole;
    if (e.written && name !== e.written) return whole;
    if (g.seen.has(href(e))) return whole;
    if (e.home && g.path && e.home.split("#")[0] === g.path) return whole;
    g.seen.add(href(e));
    // a term's preview already says which document defines it
    if (e.spec) g.seen.add(`/standards/#${e.spec}`);
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
