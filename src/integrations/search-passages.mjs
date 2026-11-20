// Read the same published HTML as the Markdown integration. Item keys identify
// a location and its exact content, so a stale retrieval cannot resolve to a new claim.
import { createHash } from "node:crypto";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import rehypeParse from "rehype-parse";
import { unified } from "unified";
import { builtPages } from "./built-pages.mjs";
import { omitFromReading } from "./markdown-pages.mjs";

const TYPES = {
  flows: "Flow",
  learn: "Lesson",
  compare: "Comparison",
  deployments: "Deployment guide",
  guide: "Decision guide",
  glossary: "Glossary",
  implementations: "Implementation evidence",
  standards: "Standard",
};
const directories = new Set([
  "/standards/",
  "/standards/changes/",
  "/standards/timeline/",
  "/implementations/",
  "/flows/",
  "/learn/",
  "/compare/",
  "/deployments/",
]);
const searchChrome = new Set([
  "flow-stage",
  "ways-in",
  "page-facts",
  "ov-r",
  "ov-steps",
  "sp-note",
  "evidence-summary",
  "evidence-controls",
  "evidence-empty",
  "gl-empty",
  "visually-hidden",
  "builds",
]);
const blocks = new Set([
  "p",
  "li",
  "ol",
  "ul",
  "div",
  "section",
  "article",
  "dl",
  "dt",
  "dd",
  "blockquote",
  "legend",
  "label",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "h4",
  "td",
  "th",
  "tr",
  "br",
  "wbr",
]);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const classes = (node) => node.properties?.className ?? [];
const has = (node, name) => classes(node).includes(name);
const clean = (value) => value.replace(/\s+/g, " ").trim();

function excluded(node) {
  return (
    omitFromReading(node) ||
    ["nav", "noscript", "form", "pre"].includes(node.tagName) ||
    classes(node).some((name) => searchChrome.has(name))
  );
}

function first(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.children ?? []) {
    const found = first(child, predicate);
    if (found) return found;
  }
}

// Preserve punctuation around inline code, emphasized words and links. Put
// whitespace between table cells, labels and other pieces set apart by layout.
function words(node) {
  if (!node) return "";
  if (node.type === "text") return node.value;
  if (node.type !== "element" || excluded(node)) return "";
  const inside = node.children
    .map((child, i) => {
      const previous = node.children[i - 1];
      // Spans set side by side in the layout are separate labels.
      const gap = previous?.tagName === "span" && child.tagName === "span";
      return (gap ? " " : "") + words(child);
    })
    .join("");
  return blocks.has(node.tagName) ? ` ${inside} ` : inside;
}

const content = (node) => clean(words(node));
const byClass = (node, name) => first(node, (n) => has(n, name));
const byTag = (node, tag) => first(node, (n) => n.tagName === tag);

// A matched passage should fit in one provider item with its identifying
// context. Prefer paragraph boundaries, then whole words in a long paragraph.
function* chunks(paragraphs) {
  let chunk = "";
  const limit = 2200;
  for (const text of paragraphs) {
    if (chunk && chunk.length + text.length + 1 > limit) {
      yield chunk;
      chunk = "";
    }
    for (const word of text.split(/\s+/)) {
      if (chunk && chunk.length + word.length + 1 > limit) {
        yield chunk;
        chunk = "";
      }
      if (word) chunk += (chunk ? " " : "") + word;
    }
  }
  if (chunk) yield chunk;
}

function passages(page) {
  const main = byTag(unified().use(rehypeParse).parse(page.html), "main");
  const title = content(byTag(main, "h1")) || page.name;
  const type = TYPES[page.path.split("/")[1]] ?? "Guide";
  const records = [];
  const counts = new Map();
  const add = (section, id, paragraphs, aliases = [], label = type) => {
    const href = page.path + (id ? `#${id}` : "");
    const location = JSON.stringify([href, section]);
    for (const text of chunks(paragraphs)) {
      const ordinal = counts.get(location) ?? 0;
      const record = {
        href,
        type: label,
        title,
        section,
        text,
        aliases: ordinal === 0 ? aliases : [],
      };
      counts.set(location, ordinal + 1);
      const digest = hash(JSON.stringify(record));
      const position = hash(`${location}:${ordinal}`).slice(0, 32);
      records.push({
        ...record,
        key: `${position}-${digest.slice(0, 32)}.md`,
        digest,
      });
    }
  };

  // These lists repeat the detail pages. Keep the directory itself findable.
  if (directories.has(page.path)) {
    add(
      "",
      "",
      [content(byClass(main, "lede")) || page.description],
      [],
      "Directory",
    );
    return records;
  }
  // Standards have a dedicated canonical page and unanchored subheadings.
  // Keep the definition, current status and version context together so a
  // match for "RFC9449" opens the document the tracker actually describes.
  const standard = byClass(main, "sp-ref");
  if (standard) {
    const ref = content(standard);
    const body = byClass(main, "sp");
    const parts = body.children
      .filter((n) => n.type === "element")
      .map(content);
    add(ref, "", [content(byClass(main, "lede")), ...parts], [ref, title]);
    return records;
  }
  let section = "";
  let anchor = "";
  let paragraphs = [];
  const flush = () => {
    const aliases = [];
    if (!section && !anchor && type === "Flow") {
      aliases.push(title);
      const acronym = /\(([^()]+)\)$/.exec(title)?.[1];
      if (acronym) aliases.push(acronym);
    }
    add(section, anchor, paragraphs, aliases);
    paragraphs = [];
  };
  function walk(node, ancestor = "") {
    if (node.type !== "element" || excluded(node)) return;
    const { id } = node.properties;
    if (node.tagName === "h1") return;
    if (has(node, "gl-term")) {
      const dt = byTag(node, "dt");
      const aliases = content(byClass(dt, "aka")).split(" · ").filter(Boolean);
      const name = clean(
        dt.children
          .filter((n) => !has(n, "aka"))
          .map(words)
          .join(""),
      );
      add(
        name,
        id,
        [
          content(
            byTag(node, "dd")?.children.find((n) => n.tagName === "span"),
          ),
        ],
        [name, ...aliases],
      );
      return;
    }
    if (has(node, "evidence-entry")) {
      const name = content(byTag(node, "h3"));
      const role = content(byClass(node, "evidence-entry-role"));
      const summary = content(byClass(node, "evidence-entry-summary"));
      const limits = byClass(node, "evidence-claim")
        .children.filter((n) => has(n, "evidence-limits"))
        .map(content);
      add([name, role].filter(Boolean).join(" · "), id, [
        summary,
        ...limits,
        content(byClass(node, "evidence-sources")),
      ]);
      return;
    }
    if (has(node, "flow-step")) {
      add(content(byTag(node, "h3")), id, [
        content(byClass(node, "step-body")),
      ]);
      return;
    }
    if (node.tagName === "h2" || (node.tagName === "h3" && id)) {
      flush();
      section = content(node);
      anchor = id || ancestor;
      return;
    }
    // A rendered paragraph or table row is a unit of meaning. The section
    // supplies both its heading context and the real anchor a link may use.
    if (
      [
        "p",
        "li",
        "dt",
        "dd",
        "tr",
        "figcaption",
        "h3",
        "h4",
        "blockquote",
      ].includes(node.tagName)
    ) {
      const paragraph = content(node);
      if (paragraph) paragraphs.push(paragraph);
      return;
    }
    const parentAnchor =
      ["section", "figure", "article"].includes(node.tagName) && id
        ? id
        : ancestor;
    for (const child of node.children) walk(child, parentAnchor);
  }
  walk(main);
  flush();
  if (!records.length) add("", "", [page.description]);
  return records;
}

export function searchManifest(root) {
  const pages = builtPages(root).filter(
    (p) => p.indexed && p.markdown && p.path !== "/search/",
  );
  const records = pages.flatMap(passages);
  return { revision: hash(JSON.stringify(records)), records };
}

export default function searchPassages() {
  let destination;
  return {
    name: "search-passages",
    hooks: {
      "astro:config:done": ({ config }) => {
        destination = fileURLToPath(new URL(".astro/search/", config.root));
      },
      "astro:build:done": ({ dir, logger }) => {
        const manifest = searchManifest(fileURLToPath(dir));
        mkdirSync(destination, { recursive: true });
        // A sync process may read the previous complete index during a rebuild.
        const temp = join(destination, `manifest-${process.pid}.tmp`);
        writeFileSync(temp, JSON.stringify(manifest));
        renameSync(temp, join(destination, "manifest.json"));
        logger.info(`${manifest.records.length} passages for site search`);
      },
    },
  };
}
