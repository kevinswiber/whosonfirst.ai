// Checks a research worksheet before its entries go into the records, and asks
// each source whether it still has the passage an entry rests on.
// Run with `npm run implementations:check -- worksheet.json`, or with no file
// to check every quote already in the records. `--emit` prints a worksheet's
// accepted entries ready to paste into records.ts, and `--apply` writes them
// there with the day's evidence-added event; neither fetches anything.
// docs/implementation-research.md says what a worksheet is and how to read
// the answers.
//
// "Found" means the page has the passage today. Whether the passage supports
// the claim is for whoever reads it.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  publishProfile,
  validateProfiles,
} from "../src/data/implementations/model.ts";
import { profiles } from "../src/data/implementations/records.ts";
import { flows as readFlows } from "./sources.mjs";

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith("--"));
const emit = args.includes("--emit");
const apply = args.includes("--apply");
const RECORDS = fileURLToPath(
  new URL("../src/data/implementations/records.ts", import.meta.url),
);
const flows = await readFlows();
const parties = Object.fromEntries(
  flows.map((f) => [
    f.slug,
    f.participants.filter((p) => p.role !== "human").map((p) => p.id),
  ]),
);

/** Text as a reader sees it, near enough to find a copied sentence in. */
export const plain = (text) =>
  text
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCharCode(`0x${h}`))
    .replace(/\\[nrt]/g, " ")
    .replace(/\\(["'/\\])/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(`0x${h}`))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&(apos|rsquo|lsquo);/g, "'")
    .replace(/&(ldquo|rdquo);/g, '"')
    .replace(/&(ndash|mdash);/g, "-")
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/[ ​­]/g, " ")
    .replace(/[*_`[\]()#>|]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

/** Where a page's text can be read without running its scripts. */
const readable = (url) => {
  const blob = url.match(
    /^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\/([^#]+)/,
  );
  if (blob) return `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}`;
  return url.split("#")[0];
};

const pages = new Map();
const read = (url) => {
  const at = readable(url);
  if (!pages.has(at))
    pages.set(
      at,
      fetch(at, {
        headers: { accept: "text/html,text/markdown,text/plain,*/*" },
        redirect: "follow",
        signal: AbortSignal.timeout(30000),
      }).then(async (res) =>
        res.ok ? plain(await res.text()) : Promise.reject(`HTTP ${res.status}`),
      ),
    );
  return pages.get(at);
};

const result = { found: [], missing: [], failed: [] };
const check = async (id, source) => {
  try {
    const page = await read(source.url);
    (page.includes(plain(source.quote)) ? result.found : result.missing).push([
      id,
      source,
    ]);
  } catch (e) {
    const why =
      typeof e === "string"
        ? e
        : e.name === "TimeoutError"
          ? "timed out"
          : e.message;
    result.failed.push([id, source, why]);
  }
};

/** A worksheet's entries, refused as the build would refuse them. */
const worksheet = (file) => {
  const sheet = JSON.parse(readFileSync(file, "utf8"));
  const problems = [];
  const record = profiles.find((p) => p.slug === sheet.flow);
  if (!record) return { sheet, problems: [`${file}: no flow ${sheet.flow}`] };
  const entries = [
    ...(sheet.implementations ?? []),
    ...(sheet.deployments ?? []),
  ];
  const taken = new Set(
    profiles.flatMap((p) =>
      [...p.implementations, ...p.deployments, ...p.observations].map(
        (e) => e.id,
      ),
    ),
  );
  for (const entry of entries) {
    if (taken.has(entry.id))
      problems.push(`${entry.id}: already in the records`);
    for (const source of entry.sources ?? [])
      if (!source.quote || !source.section)
        problems.push(
          `${entry.id}: ${source.url} needs a quote and its section`,
        );
  }
  try {
    validateProfiles(
      [
        {
          ...record,
          reviewedOn: sheet.checkedOn,
          implementations: sheet.implementations ?? [],
          deployments: sheet.deployments ?? [],
          observations: [],
          events: [],
        },
      ],
      undefined,
      parties,
    );
  } catch (e) {
    problems.push(e.message);
  }
  return { sheet, problems, entries };
};

const literal = (value, indent = "") => {
  const next = `${indent}  `;
  if (Array.isArray(value))
    return value.length === 0
      ? "[]"
      : `[\n${value.map((v) => `${next}${literal(v, next)},`).join("\n")}\n${indent}]`;
  if (value && typeof value === "object")
    return `{\n${Object.entries(value)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(
        ([k, v]) =>
          `${next}${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${literal(v, next)},`,
      )
      .join("\n")}\n${indent}}`;
  return JSON.stringify(value);
};

/**
 * Writes a worksheet's accepted entries after the flow's existing ones, with
 * the day of the run as its review date and an evidence-added event. It rests
 * on the file being formatted as `npm run fmt` leaves it; run that afterwards.
 */
const write = (sheet, accepted) => {
  const text = readFileSync(RECORDS, "utf8");
  const start = text.indexOf(`\n    slug: "${sheet.flow}",`);
  const next = text.indexOf("\n    slug: ", start + 1);
  const end = next === -1 ? text.length : next;
  let block = text.slice(start, end);
  const into = (name, entries) => {
    if (entries.length === 0) return;
    const body = entries
      .map((e) => `      ${literal(e, "      ")},`)
      .join("\n");
    const empty = `\n    ${name}: [],`;
    if (block.includes(empty)) {
      block = block.replace(empty, () => `\n    ${name}: [\n${body}\n    ],`);
      return;
    }
    const open = block.indexOf(`\n    ${name}: [\n`);
    const close = block.indexOf("\n    ],", open);
    if (open === -1 || close === -1)
      throw new Error(`${sheet.flow}: no ${name} list to add to`);
    block = `${block.slice(0, close)}\n${body}${block.slice(close)}`;
  };
  into(
    "implementations",
    accepted.filter((e) => e.kind === "implementation"),
  );
  into(
    "deployments",
    accepted.filter((e) => e.kind === "deployment"),
  );
  into("events", [
    {
      id: `${sheet.flow}-added-${sheet.checkedOn}`,
      kind: "evidence-added",
      date: sheet.checkedOn,
      summary:
        "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
      evidenceIds: accepted.map((e) => e.id),
    },
  ]);
  block = block.replace(
    /reviewedOn: "[^"]*"/,
    () => `reviewedOn: "${sheet.checkedOn}"`,
  );
  writeFileSync(RECORDS, text.slice(0, start) + block + text.slice(end));
};

let refused = 0;
const queue = [];
if (files.length === 0) {
  for (const record of profiles.map(publishProfile))
    for (const entry of [
      ...record.implementations,
      ...record.deployments,
      ...record.observations,
    ])
      for (const source of entry.sources)
        if (source.quote) queue.push([entry.id, source]);
} else {
  for (const file of files) {
    const { sheet, problems, entries = [] } = worksheet(file);
    for (const problem of problems) console.error(`Refused: ${problem}`);
    refused += problems.length;
    const accepted = entries.filter((e) => e.review?.state === "accepted");
    if (apply) {
      if (problems.length === 0 && accepted.length > 0) {
        write(sheet, accepted);
        console.log(`${sheet.flow}: ${accepted.length} entries written.`);
      }
      continue;
    }
    if (emit) {
      for (const kind of ["implementation", "deployment"]) {
        const some = accepted.filter((e) => e.kind === kind);
        if (some.length === 0) continue;
        console.log(`// ${sheet.flow}: ${kind}s`);
        for (const entry of some) console.log(`${literal(entry, "      ")},`);
      }
      continue;
    }
    for (const entry of entries)
      for (const source of entry.sources ?? [])
        if (source.quote) queue.push([entry.id, source]);
  }
}

if (!emit && !apply) {
  let at = 0;
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (at < queue.length) await check(...queue[at++]);
    }),
  );
  console.log(
    `${queue.length} passages: ${result.found.length} found, ${result.missing.length} not found, ${result.failed.length} not reached.`,
  );
  const list = (title, rows) => {
    if (rows.length === 0) return;
    console.log(`\n${title} (${rows.length})`);
    for (const [id, source, why] of rows)
      console.log(
        `  ${id}${why ? `  — ${why}` : ""}\n      ${source.url}\n      “${source.quote}”`,
      );
  };
  list("Not found: read the page again", result.missing);
  list("Not reached: not checked", result.failed);
}
process.exit(refused > 0 ? 1 : 0);
