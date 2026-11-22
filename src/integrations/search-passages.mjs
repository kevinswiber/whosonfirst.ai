// Read the same published HTML as the Markdown integration. Item keys identify
// a location and its exact content, so a stale retrieval cannot resolve to a new claim.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import rehypeParse from "rehype-parse";
import { unified } from "unified";
import { searchSiteData } from "../search/site-data.ts";
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
  "evidence-date",
  "evidence-links",
  "evidence-none",
  "deeper",
  "primer",
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
    node.properties?.dataSearchIgnore !== undefined ||
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
  // The rendered document title carries the flow's searchTitle. Keep these
  // local lookup names separate from the passages uploaded to AI Search.
  const flowTitles = Object.fromEntries(
    pages
      .filter((p) => /^\/flows\/[^/]+\/$/.test(p.path))
      .map((p) => [p.path, p.name]),
  );
  return { revision: hash(JSON.stringify(records)), records, flowTitles };
}

// The browser only needs named destinations. Descriptive queries still go to
// the full search when submitted, so never ship the passage text or index keys.
function quickMatches(records) {
  const entries = new Map();
  const sentences = new Intl.Segmenter("en", { granularity: "sentence" });
  function add(record, href, title, aliases) {
    if (entries.has(href)) return;
    const lead =
      record.type === "Standard"
        ? record.text.split(" Where it stands ")[0]
        : record.text;
    let summary = "";
    for (const { segment } of sentences.segment(lead)) {
      const next = (summary + segment).trimEnd();
      if (next.length > 160) {
        if (!summary) summary = `${next.slice(0, 160).replace(/\s+\S*$/, "")}…`;
        break;
      }
      summary += segment;
      if (summary.trimEnd().length >= 70) break;
    }
    summary = summary.trimEnd();
    entries.set(href, {
      title,
      href,
      type: record.type,
      summary,
      aliases: [
        ...new Set(
          aliases.filter((a) => a && a.toLowerCase() !== title.toLowerCase()),
        ),
      ],
    });
  }
  for (const record of records) {
    const { href, title, section, type, aliases } = record;
    const [path, fragment] = href.split("#");
    // Every page has a lead, except evidence pages, where the scope is its
    // first meaningful description. Give those a page-level destination too.
    if (
      !fragment ||
      (type === "Implementation evidence" && fragment === "field-scope")
    ) {
      const slug = path.split("/").at(-2) || "";
      const name =
        type === "Standard" && section && section !== title
          ? `${title} (${section})`
          : title;
      add(record, path, name, [...aliases, slug.replaceAll("-", " ")]);
    } else if (type === "Glossary") {
      add(record, href, section, aliases);
    } else if (type === "Implementation evidence" && section.includes(" · ")) {
      // A product often plays several roles. Preserve both role and flow in
      // the link text, even when two results share the same product name.
      const flow = title.replace(
        / implementations and deployment reports$/,
        "",
      );
      add(record, href, `${section} · ${flow}`, [section.split(" · ")[0]]);
    }
  }
  const priority = ["Flow", "Standard", "Glossary", "Implementation evidence"];
  const rank = (type) => {
    const index = priority.indexOf(type);
    return index < 0 ? priority.length : index;
  };
  return [...entries.values()].sort(
    (a, b) =>
      rank(a.type) - rank(b.type) ||
      a.title.localeCompare(b.title, "en") ||
      a.href.localeCompare(b.href, "en"),
  );
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
        writeFileSync(
          new URL("search/quick-matches.json", dir),
          JSON.stringify(quickMatches(manifest.records)),
        );
        // The release checks that the site it deployed is the one answering:
        // the commit it was built from and the passages made from it.
        const git = spawnSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        });
        const commit = git.status === 0 ? git.stdout.trim() : null;
        writeFileSync(
          new URL("search/release.json", dir),
          JSON.stringify({ commit, revision: manifest.revision }),
        );
        // What the Worker answers a search from. It is written here, after
        // the pages, because the Worker is bundled before they are rendered.
        writeFileSync(
          new URL("search/catalog.json", dir),
          JSON.stringify(searchSiteData(fileURLToPath(dir), manifest)),
        );
        logger.info(`${manifest.records.length} passages for site search`);
      },
    },
  };
}
