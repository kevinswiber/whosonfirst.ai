/**
 * A link to each section of a page, put beside its heading when the page is
 * built.
 *
 * `linkSections()` reads a page's body as HTML and returns it with one change
 * to each section heading, an h2 or an h3: a small link to the heading's own
 * address, so that pressing it puts that address in the address bar. The link
 * is plain HTML, a small chain-link drawing. A script in SectionLinks.astro
 * adds copying to it, and nothing here needs the script.
 *
 * - A heading with an id keeps it. A heading without one, an h2 only, is
 *   given the id the base layout's script would give it once the page had
 *   loaded: its words in lowercase, joined by hyphens, with a number added
 *   where the page already has that one. So an address that was reached by
 *   way of the page's list of sections is the address built here.
 * - The link is inside the heading, but it has no words, so what the heading
 *   says (to a reader of the list of sections, to the search index, to the
 *   page's copy in Markdown) is what it said before. A screen reader is told
 *   the same: the heading is given its own words as its name, so the link's
 *   name is not read into it.
 * - A heading is left alone where a link beside it would be wrong: in a link,
 *   a list item, a menu, a dialog, a card, or a part of the page that is a
 *   script's (a custom element), and where it is already a link.
 */

const LABEL = "Link to this section: ";
/**
 * The "link" icon of Primer Octicons 19.42.0 (build/svg/link-16.svg), drawn in
 * the colour of the text around it. MIT license, Copyright (c) 2026 GitHub Inc.;
 * the notice is in the README. The path is the package's, unchanged. The drawing
 * says nothing: the link is named.
 */
const ICON =
  '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"/></svg>';

/** Elements that end without a closing tag. */
const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);
/** Inside one of these a heading is not a section of the page. */
const NOT_IN = new Set([
  "a",
  "button",
  "dialog",
  "details",
  "form",
  "li",
  "nav",
  "summary",
  "template",
]);
/** The same, by class: a card, and the panels of a figure that shows one at a time. */
const NOT_IN_CLASS = new Set(["card", "lh-panel", "flow-step"]);
/** Ids the page's frame has. A heading may not take one of these. */
const FRAME =
  /^(?:main|site-nav|header-search-\w+|nav-group-\d+|foot-group-\w+)$/;

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
};

const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, ref: string) => {
    if (ref[0] !== "#") return NAMED[ref.toLowerCase()] ?? whole;
    const code =
      ref[1].toLowerCase() === "x"
        ? Number.parseInt(ref.slice(2), 16)
        : Number.parseInt(ref.slice(1), 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff
      ? String.fromCodePoint(code)
      : whole;
  });
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The id the base layout's script gives a heading that has none, before any number is added. */
export const sectionSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section";

const TOKEN =
  /<!--[\s\S]*?-->|<(script|style|textarea|title)\b(?:"[^"]*"|'[^']*'|[^'">])*>[\s\S]*?<\/\1\s*>|<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
const ATTR = (name: string) =>
  new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i");
const attr = (attrs: string, name: string) => {
  const m = ATTR(name).exec(attrs);
  return m ? decode(m[1] ?? m[2] ?? m[3] ?? "") : undefined;
};
const hasAttr = (attrs: string, name: string) =>
  new RegExp(`\\s${name}(?:\\s*=|\\s|$)`, "i").test(` ${attrs}`);

interface Open {
  name: string;
  /** Whether a heading in here is not a section of the page. */
  barred: boolean;
}
interface Heading {
  tag: "h2" | "h3";
  /** Where the opening tag ends, and where the closing tag begins. */
  from: number;
  to: number;
  attrs: string;
  id?: string;
  /** What the heading says, as plain text. */
  text: string;
  /** Whether it holds a link already. */
  linked: boolean;
}

/**
 * The body of a page with a link to each of its sections. A body that has no
 * section heading comes back as it was.
 */
export function linkSections(html: string): string {
  const stack: Open[] = [];
  const headings: Heading[] = [];
  const used = new Set<string>();
  let current: Heading | undefined;

  for (const m of html.matchAll(TOKEN)) {
    const [whole, , close, tag = "", attrs = ""] = m;
    if (!tag) continue; // a comment, or a script or style, which holds no heading
    const name = tag.toLowerCase();
    const at = m.index ?? 0;
    const id = attr(attrs, "id");
    if (id) used.add(id);
    if (close) {
      if (current && name === current.tag) {
        current.to = at;
        current.text = decode(
          html.slice(current.from, at).replace(/<[^>]*>/g, ""),
        )
          .replace(/\s+/g, " ")
          .trim();
        headings.push(current);
        current = undefined;
      }
      const i = stack.findLastIndex((o) => o.name === name);
      if (i >= 0) stack.length = i;
      continue;
    }
    if (current) {
      if (name === "a") current.linked = true;
    } else if (name === "h2" || name === "h3") {
      if (!stack.some((o) => o.barred) && !hasAttr(attrs, "hidden")) {
        current = {
          tag: name,
          from: at + whole.length,
          to: 0,
          attrs,
          id,
          text: "",
          linked: false,
        };
      }
    }
    if (VOID.has(name) || attrs.trimEnd().endsWith("/")) continue;
    const classes = (attr(attrs, "class") ?? "").split(/\s+/);
    stack.push({
      name,
      barred:
        NOT_IN.has(name) ||
        name.includes("-") ||
        hasAttr(attrs, "hidden") ||
        classes.some((c) => NOT_IN_CLASS.has(c)),
    });
  }
  if (!headings.length) return html;

  // An id is given only to an h2, and only once the ids already on the page
  // are known, so that none is taken twice.
  for (const h of headings) {
    if (h.id || h.tag !== "h2" || h.linked || !h.text) continue;
    const base = sectionSlug(h.text);
    let id = base;
    for (let n = 2; used.has(id) || FRAME.test(id); n++) id = `${base}-${n}`;
    used.add(id);
    h.id = id;
  }

  let out = "";
  let last = 0;
  for (const h of headings) {
    if (!h.id || h.linked || !h.text || FRAME.test(h.id)) continue;
    const added = [
      attr(h.attrs, "id") === undefined ? ` id="${escapeHtml(h.id)}"` : "",
      hasAttr(h.attrs, "aria-label") || hasAttr(h.attrs, "aria-labelledby")
        ? ""
        : ` aria-label="${escapeHtml(h.text)}"`,
    ].join("");
    // The opening tag ends in ">", so what is added goes before it.
    const openEnd = h.from - 1;
    out += html.slice(last, openEnd) + added;
    out += html.slice(openEnd, h.to);
    out += `<section-link class="section-link"><a href="#${escapeHtml(h.id)}" aria-label="${escapeHtml(LABEL + h.text)}">${ICON}</a></section-link>`;
    last = h.to;
  }
  return out + html.slice(last);
}
