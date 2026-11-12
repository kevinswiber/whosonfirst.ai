#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
// Exploratory extraction audit, not a native Reader compatibility test.
// Supply an independently obtained Mozilla Readability.js; no network fetch.
import { chromium } from "playwright";
import { requireCurrentBuild } from "./built-site.mjs";

const [readabilityPath, outputDirectory] = process.argv.slice(2);
if (!readabilityPath || !outputDirectory) {
  console.error(
    "Usage: node scripts/reader-audit.mjs /path/to/Readability.js /path/to/output",
  );
  process.exit(1);
}
requireCurrentBuild("The Reader audit needs the current build.");
mkdirSync(outputDirectory, { recursive: true });
const root = fileURLToPath(new URL("../dist/client/", import.meta.url));
const server = createServer((req, res) => {
  let p = join(root, new URL(req.url, "http://x").pathname);
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
  if (!existsSync(p)) return res.writeHead(404).end();
  res.setHeader(
    "Content-Type",
    { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" }[
      extname(p)
    ] || "application/octet-stream",
  );
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  headless: true,
});
const readabilitySha256 = createHash("sha256")
  .update(readFileSync(readabilityPath))
  .digest("hex");
const results = [];
for (const path of [
  "/flows/dpop/",
  "/flows/mcp-authorization/",
  "/flows/dpop/#step-2",
  "/flows/mcp-authorization/#step-2",
  "/learn/tokens/",
  "/learn/what-the-api-sees/",
  "/deployments/kubernetes/",
  "/standards/",
  "/concepts/",
  "/glossary/",
  "/guide/",
  "/",
]) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  await page.goto(`http://127.0.0.1:${server.address().port}${path}`, {
    waitUntil: "networkidle",
  });
  await page.addScriptTag({ path: readabilityPath });
  const result = await page.evaluate(() => {
    const expected = [...document.querySelectorAll(".flow-step h3")].map((x) =>
      x.textContent.trim(),
    );
    const article = new Readability(document.cloneNode(true)).parse();
    const holder = document.createElement("div");
    holder.innerHTML = article?.content || "";
    const norm = (s) => s.replace(/\s+/g, " ").trim();
    // Compare token paragraphs, labels and code separately. An extractor can
    // change block boundaries without losing words; comparing a whole panel's
    // textContent mistakes those whitespace changes for missing explanations.
    const fragments = [
      ...document.querySelectorAll(
        ".flow-step .step-body, .flow-step pre, .flow-step .held, .sc-glance, .sx-source, .km-panel, .ti-panel > header > h3, .ti-panel > header > p, .ti-panel .claim-line > code, .ti-panel .plain > code, .claim-note > .claim-cat, .claim-note > p, main .doc-line",
      ),
    ].map((x) => ({
      kind: x.matches(".claim-note > p")
        ? "claim-note prose"
        : x.className || x.tagName.toLowerCase(),
      text: norm(x.textContent),
      token: x.closest(".ti-panel")?.id,
    }));
    const sourceLinks = [
      ...document.querySelectorAll(".sx-source a, .ti-sources a"),
    ].map((a) => a.href);
    const extractedLinks = new Set(
      [...holder.querySelectorAll("a")].map((a) => a.href),
    );
    return {
      introductionRetained: [...document.querySelectorAll("main .lede")].every(
        (p) => norm(holder.textContent).includes(norm(p.textContent)),
      ),
      extractedTitle: article?.title,
      sourceLinksChecked: sourceLinks.length,
      sourceLinksMissing: sourceLinks.filter(
        (href) => !extractedLinks.has(href),
      ),
      fragmentsMissing: fragments
        .filter((x) => {
          const scope = x.token
            ? holder.querySelector(`#${CSS.escape(x.token)}`)
            : holder;
          return !scope || !norm(scope.textContent).includes(x.text);
        })
        .map((x) => ({
          kind: x.kind,
          token: x.token,
          excerpt: x.text.slice(0, 100),
        })),
      fragmentsChecked: fragments.length,
      svg: holder.querySelectorAll("svg").length,
      controls: holder.querySelectorAll("button, nav").length,
      expected,
      headings: [...holder.querySelectorAll("h1,h2,h3,h4")].map((x) =>
        x.textContent.trim(),
      ),
      steps: holder.querySelectorAll('[id^="step-"]').length,
      text: holder.textContent,
      content: article?.content,
      hiddenSteps: document.querySelectorAll(".flow-step[hidden]").length,
    };
  });
  const name = path.replaceAll("/", "-") || "home";
  writeFileSync(join(outputDirectory, `${name}.html`), result.content || "");
  const { content, text, ...summary } = result;
  results.push({
    path,
    readabilitySha256,
    ...summary,
    length: text.length,
    missing: summary.expected.filter((h) => !text.includes(h)),
  });
  await page.close();
}
writeFileSync(
  join(outputDirectory, "audit.json"),
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
await browser.close();
server.close();
