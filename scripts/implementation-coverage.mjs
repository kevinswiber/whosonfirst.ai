// Says where the implementation records are thin, so that research starts
// from the gaps. Run with `npm run implementations:coverage`, with a flow's
// slug for one flow, or with `--products` for every product and where it
// appears. Reads the data and reaches nothing else.
// docs/implementation-research.md says how a run uses it.
//
// Node strips the types from the data files as it loads them.
import { publishProfile } from "../src/data/implementations/model.ts";
import { profiles } from "../src/data/implementations/records.ts";
import { flows as readFlows } from "./sources.mjs";

const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith("--"));
const flows = await readFlows();
const records = profiles.map(publishProfile);

/** One flow's parties, the entries that fill each, and what is missing. */
export const coverage = (flow, record) => {
  const entries = record?.implementations ?? [];
  const parties = flow.participants
    .filter((p) => p.role !== "human")
    .map((p) => ({
      id: p.id,
      label: p.label,
      entries: entries.filter((e) => e.parties.includes(p.id)),
      generic: (record?.genericParties ?? []).includes(p.id),
    }));
  return {
    slug: flow.slug,
    reviewed: Boolean(record),
    parties,
    deployments: record?.deployments ?? [],
    unspecified: entries.filter((e) => e.release.stage === "unspecified"),
    unquoted: [...entries, ...(record?.deployments ?? [])].filter(
      (e) => !e.sources.some((s) => s.quote),
    ),
    oldest: [...entries, ...(record?.deployments ?? [])]
      .map((e) => e.review.checkedOn)
      .sort()[0],
  };
};

const all = flows
  .map((flow) =>
    coverage(
      flow,
      records.find((r) => r.slug === flow.slug),
    ),
  )
  .sort((a, b) => a.slug.localeCompare(b.slug));

if (args.includes("--products")) {
  const products = new Map();
  for (const record of records)
    for (const e of record.implementations) {
      const key = `${e.product} (${e.organization})`;
      products.set(key, [
        ...(products.get(key) ?? []),
        `${record.slug}: ${e.role}`,
      ]);
    }
  for (const [product, where] of [...products].sort((a, b) =>
    a[0].localeCompare(b[0]),
  ))
    console.log(`${product}\n${where.map((w) => `    ${w}`).join("\n")}`);
  process.exit(0);
}

const unknown = only.filter((slug) => !all.some((c) => c.slug === slug));
if (unknown.length > 0) {
  console.error(`No flow named ${unknown.join(", ")}.`);
  process.exit(1);
}

const ids = (entries) => entries.map((e) => e.id).join(", ");
let empty = 0;
let single = 0;
let unreported = 0;
for (const c of all) {
  if (only.length > 0 && !only.includes(c.slug)) continue;
  console.log(`\n${c.slug}`);
  if (!c.reviewed) {
    console.log("  Not reviewed.");
    continue;
  }
  for (const p of c.parties) {
    const n = p.entries.length;
    if (n === 0 && !p.generic) empty++;
    if (n === 1 && !p.generic) single++;
    const mark = n > 0 ? `${n}` : p.generic ? "generic" : "none";
    console.log(
      `  ${`${p.label} (${p.id})`.padEnd(34)} ${mark.padEnd(8)} ${ids(p.entries)}`,
    );
  }
  if (c.deployments.length === 0) unreported++;
  console.log(
    `  ${"Deployment reports".padEnd(34)} ${`${c.deployments.length || "none"}`.padEnd(8)} ${ids(c.deployments)}`,
  );
  if (c.unspecified.length > 0)
    console.log(`  Stage unspecified: ${ids(c.unspecified)}`);
  if (c.unquoted.length > 0)
    console.log(`  No passage recorded: ${c.unquoted.length} entries`);
  console.log(`  Oldest check: ${c.oldest}`);
}

if (only.length === 0)
  console.log(
    `\n${all.length} flows: ${empty} parties with no entry, ${single} with one, ${unreported} flows with no deployment report. Parties marked generic need nothing particular to the flow.`,
  );
