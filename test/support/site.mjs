/**
 * The built site, read as files: what every test under test/build/ and
 * test/browser/ starts from.
 *
 * Importing this stops the test file if dist/client/ is missing or older than
 * its sources. What is checked is the build, not the sources, and a build made
 * before the last change can pass where the site as it is now would fail.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireCurrentBuild } from "../../scripts/built-site.mjs";

requireCurrentBuild("The checks would report on the site as it was then.");

export const root = fileURLToPath(
  new URL("../../dist/client/", import.meta.url),
);
export const ORIGIN = "https://whosonfirst.ai";

/** The pages a test looks at closely: one flow and one lesson stand for the rest. */
export const FLOW = "/flows/mcp-authorization/";
export const LESSON = "/learn/tokens/";

/** One page of each kind, looked at in each theme on a desktop and on a phone. */
export const PAGES = [
  { path: "/", name: "home" },
  { path: "/learn/", name: "lessons index" },
  { path: LESSON, name: "lesson" },
  { path: FLOW, name: "flow" },
  { path: "/standards/", name: "standards" },
  { path: "/concepts/", name: "concepts" },
  { path: "/flows/", name: "flows index" },
  { path: "/implementations/", name: "implementations directory" },
  { path: "/implementations/dpop/", name: "implementation record" },
  { path: "/guide/", name: "decision guide" },
  { path: "/guide/person-away/", name: "situation" },
  { path: "/deployments/kubernetes/", name: "deployment guide" },
];

/** Every page of the built site, as { path, html }. */
export const built = [];
(function walk(dir, at) {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (d.isDirectory()) walk(join(dir, d.name), `${at}${d.name}/`);
    else if (d.name === "index.html")
      built.push({ path: at, html: readFileSync(join(dir, d.name), "utf8") });
  }
})(root, "/");
built.sort((a, b) => a.path.localeCompare(b.path));

export const pageAt = (path) => built.find((p) => p.path === path);

/** The pages one level under a section, such as every flow: `/flows/<slug>/`. */
export const under = (dir) =>
  readdirSync(join(root, dir), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => `/${dir}/${d.name}/`)
    .sort();

export const FLOWS = under("flows");
export const LESSONS = under("learn");

/** The lessons in reading order, as the lessons index lists them. */
export const LESSON_ORDER = [
  ...(pageAt("/learn/")?.html ?? "").matchAll(
    /<a href="(\/learn\/[^"/]+\/)"[^>]*>\s*<span class="n"/g,
  ),
].map((m) => m[1]);

/** Every page that draws a sequence diagram: the flows, the lesson that walks through one, and the style guide. */
export const DIAGRAM_PAGES = built
  .filter((p) => p.html.includes("<flow-diagram"))
  .map((p) => p.path);

/** A file of the build, or "" when there is none. */
export const file = (path) => {
  const at = join(root, path);
  return existsSync(at) ? readFileSync(at, "utf8") : "";
};
export const exists = (path) => existsSync(join(root, path));

/** What sits between a page's <head> and </head>. */
export const head = (p) => p.html.slice(0, p.html.indexOf("</head>"));
/** What sits inside a page's <main>. */
export const main = (p) =>
  p.html.slice(p.html.indexOf("<main"), p.html.indexOf("</main>"));

/** The value of `name` on the first <meta> or <link> in the head that matches `test`. */
export const attr = (p, test, name) => {
  for (const [tag] of head(p).matchAll(/<(?:meta|link)\b[^>]*>/g))
    if (test.test(tag))
      return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
  return undefined;
};

/** The text of some HTML, as a reader sees it. */
export const plain = (h) =>
  h
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/** The pages a search engine is allowed to list. */
export const indexed = built.filter(
  (p) => !/<meta name="robots" content="[^"]*noindex/.test(head(p)),
);

/** The pages that name a copy of themselves in Markdown, and where it is. */
export const withCopy = built.filter((p) =>
  attr(p, /type="text\/markdown"/, "href"),
);
export const copyOf = (p) => attr(p, /type="text\/markdown"/, "href");

/**
 * The headers the host sends with every response: the `/*` block of the built
 * `_headers` file.
 */
export const SITE_HEADERS = {};
{
  let everywhere = false;
  for (const line of file("_headers").split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      everywhere = line.trim() === "/*";
      continue;
    }
    const m = /^\s+([^:]+):\s*(.+)$/.exec(line);
    if (everywhere && m) SITE_HEADERS[m[1].toLowerCase()] = m[2].trim();
  }
}

/** At most `n` items of a list, and how many more there are. */
export const some = (list, n = 8) =>
  list.length > n ? [...list.slice(0, n), `and ${list.length - n} more`] : list;
