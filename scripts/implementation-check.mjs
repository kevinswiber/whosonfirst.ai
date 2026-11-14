// Checks a research worksheet before its entries go into the records, and asks
// each source whether it still has the passage an entry rests on.
// Run with `npm run implementations:check -- worksheet.json`, or with no file
// to check every quote already in the records. `--emit` prints a worksheet's
// accepted entries ready to paste into records.ts, and `--apply` writes them
// there with the day's evidence-added event, and `--log` prints the
// worksheets as a section of docs/adoption/evidence-review.md. `--hosts`
// adds each host the records link to and docs/source-review.md does not list
// to that document's list, as `--apply` does after writing. None of these
// fetches anything.
// docs/implementation-research.md says what a worksheet is and how to read
// the answers.
//
// "Found" means the page has the passage today. Whether the passage supports
// the claim is for whoever reads it.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  publishProfile,
  validateProfiles,
} from "../src/data/implementations/model.ts";
import { profiles } from "../src/data/implementations/records.ts";
import { plain } from "./quote-text.mjs";
import { flows as readFlows } from "./sources.mjs";

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith("--"));
const emit = args.includes("--emit");
const log = args.includes("--log");
const hosts = args.includes("--hosts");
const REVIEW = fileURLToPath(
  new URL("../docs/source-review.md", import.meta.url),
);
const apply = args.includes("--apply");
// The records a worksheet is applied to. Tests point this at a copy.
const RECORDS =
  process.env.IMPLEMENTATION_RECORDS ??
  fileURLToPath(
    new URL("../src/data/implementations/records.ts", import.meta.url),
  );
const freshRecords = async () =>
  (await import(`${pathToFileURL(RECORDS).href}?${Date.now()}`)).profiles;
const flows = await readFlows();
const parties = Object.fromEntries(
  flows.map((f) => [
    f.slug,
    f.participants.filter((p) => p.role !== "human").map((p) => p.id),
  ]),
);

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
  const all = [...(sheet.implementations ?? []), ...(sheet.deployments ?? [])];
  // An excluded candidate needs only its source and the reason. Everything
  // else is held to what the build would accept.
  for (const entry of all.filter((e) => e.review?.state === "excluded"))
    if (!entry.sources?.[0]?.url || !entry.review.rationale?.trim())
      problems.push(
        `${entry.id ?? "an excluded entry"}: give its source and the reason`,
      );
  const entries = all.filter((e) => e.review?.state !== "excluded");
  const taken = new Set(
    profiles.flatMap((p) =>
      [...p.implementations, ...p.deployments, ...p.observations].map(
        (e) => e.id,
      ),
    ),
  );
  for (const entry of entries) {
    if (!log && taken.has(entry.id))
      problems.push(`${entry.id}: already in the records`);
    for (const source of entry.sources ?? [])
      if (!source.quote || !source.section)
        problems.push(
          `${entry.id}: ${source.url} needs a quote and its section`,
        );
  }
  for (const party of sheet.generic ?? [])
    if (!parties[sheet.flow]?.includes(party))
      problems.push(`${sheet.flow}: has no party ${party} to call generic`);
  try {
    validateProfiles(
      [
        {
          ...record,
          reviewedOn: sheet.checkedOn,
          implementations: entries.filter((e) => e.kind === "implementation"),
          deployments: entries.filter((e) => e.kind === "deployment"),
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
  // One evidence-added event a day: a second worksheet applied to the same
  // flow on the same day adds its entries to the event already there.
  const eventId = `${sheet.flow}-added-${sheet.checkedOn}`;
  const ids = accepted.map((e) => e.id);
  const at = block.indexOf(`id: "${eventId}",`);
  if (at === -1) {
    into("events", [
      {
        id: eventId,
        kind: "evidence-added",
        date: sheet.checkedOn,
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: ids,
      },
    ]);
  } else {
    const open = block.indexOf("evidenceIds: [", at) + "evidenceIds: [".length;
    const close = block.indexOf("]", open);
    const inner = block.slice(open, close).trim().replace(/,$/, "");
    const added = ids.map((id) => JSON.stringify(id)).join(", ");
    block = `${block.slice(0, open)}${inner}, ${added}${block.slice(close)}`;
  }
  const generic = [
    ...new Set([
      ...(record(sheet.flow)?.genericParties ?? []),
      ...(sheet.generic ?? []),
    ]),
  ];
  if (generic.length > 0) {
    const line = `\n    genericParties: ${JSON.stringify(generic).replaceAll(",", ", ")},`;
    block = /\n {4}genericParties: [^\n]*/.test(block)
      ? block.replace(/\n {4}genericParties: [^\n]*/, () => line)
      : block.replace(/\n {4}searchNote:/, () => `${line}\n    searchNote:`);
  }
  block = block.replace(
    /reviewedOn: "[^"]*"/,
    () => `reviewedOn: "${sheet.checkedOn}"`,
  );
  writeFileSync(RECORDS, text.slice(0, start) + block + text.slice(end));
  return text;
};

const record = (slug) => profiles.find((p) => p.slug === slug);
const lower = (text) => text.charAt(0).toLowerCase() + text.slice(1);
const links = (entry) =>
  (entry.sources ?? []).map((s) => `[${s.title}](${s.url})`).join(" · ");
const sentence = (text) =>
  /[.!?”)]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
/** One flow's worksheet as the evidence review writes it. */
const logSection = (sheet, entries) => {
  const flow = flows.find((f) => f.slug === sheet.flow);
  const lines = [`### ${flow?.title ?? sheet.flow}`, ""];
  for (const e of entries) {
    const who = e.kind === "deployment" ? e.organization : e.product;
    const what = e.kind === "deployment" ? e.setting : e.role;
    const state = e.review?.state;
    const label = { accepted: "Accept", pending: "Lead", excluded: "Exclude" }[
      state
    ];
    if (!label) continue;
    const body =
      state === "accepted"
        ? [e.summary, e.limits].filter(Boolean).map(sentence).join(" ")
        : sentence(e.review.rationale);
    lines.push(
      `- **${label} · ${who}${what ? `, ${lower(what)}` : ""}.** ${body} ${links(e)}`.trim(),
    );
  }
  const list = (title, items) => {
    if (!items?.length) return;
    lines.push("", `**${title}** ${items.map(sentence).join(" ")}`);
  };
  list("Looked.", sheet.looked);
  list("Not found.", sheet.notFound);
  const read = sheet.secondReading ?? [];
  const asWritten = read.filter((line) =>
    /: accepted as written\.?$/.test(line),
  );
  const changed = read.filter((line) => !asWritten.includes(line));
  if (read.length > 0)
    list("Second reading.", [
      ...(asWritten.length > 0
        ? [`${asWritten.length} of ${read.length} accepted as written`]
        : []),
      ...changed,
    ]);
  return lines.join("\n");
};

/** Adds the hosts the records link to that a source review's list lacks. */
const addHosts = async () => {
  const now = await freshRecords();
  const text = readFileSync(REVIEW, "utf8");
  const at = text.match(/## Domains a run needs[\s\S]*?```text\n([\s\S]*?)```/);
  if (!at) throw new Error("docs/source-review.md has no list of domains");
  const listed = new Set(at[1].split("\n").filter(Boolean));
  const missing = [
    ...new Set(
      now
        .map(publishProfile)
        .flatMap((p) => [
          ...p.implementations,
          ...p.deployments,
          ...p.observations,
        ])
        .flatMap((e) => e.sources.map((s) => new URL(s.url).host)),
    ),
  ]
    .filter((h) => !listed.has(h))
    .sort();
  if (missing.length === 0) return;
  const end = at.index + at[0].length - 3;
  writeFileSync(
    REVIEW,
    `${text.slice(0, end)}${missing.join("\n")}\n${text.slice(end)}`,
  );
  console.log(
    `Listed ${missing.length} hosts in docs/source-review.md: ${missing.join(", ")}`,
  );
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
        const before = write(sheet, accepted);
        try {
          validateProfiles(await freshRecords(), undefined, parties);
        } catch (e) {
          writeFileSync(RECORDS, before);
          console.error(
            `Refused: ${e.message}. ${sheet.flow} was left as it was.`,
          );
          refused++;
          continue;
        }
        console.log(`${sheet.flow}: ${accepted.length} entries written.`);
      }
      continue;
    }
    if (log) {
      const shown = (sheet.implementations ?? []).concat(
        sheet.deployments ?? [],
      );
      console.log(`${logSection(sheet, shown)}\n`);
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

if (apply || (hosts && files.length === 0)) await addHosts();

if (!emit && !apply && !log && !hosts) {
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
