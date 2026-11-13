// Puts what was collected through the rubric, and writes the day's record.
//
// It reads the ledger and the newest file from each collector, asks the two
// questions of every flow (rubric.mjs), and writes one dated file. It fetches
// nothing. Run it after the collectors, and the record can be made again from
// the same files.
//
//   node scripts/adoption/snapshot.mjs
//
// It writes docs/adoption/data/snapshots/<day>.json, and prints the table.
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { recordFlows } from "./flows.mjs";
import { DATA, readJson, today, writeJson } from "./lib.mjs";
import {
  attention,
  basis,
  level,
  levelRank,
  score,
  supply,
  use,
} from "./rubric.mjs";

/** The newest dated file a collector has written. */
const newest = (dir) => {
  const files = readdirSync(join(DATA, dir))
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  if (!files.length)
    throw new Error(`nothing collected in ${dir}: run its collector first`);
  return readJson(join(DATA, dir, files.at(-1)));
};

const ledger = readJson(join(DATA, "ledger.json"));
const issuers = newest("issuers");
const mcp = newest("mcp-census");
const noise = newest("attention");

/** What the MCP census counts that is a flow in itself, by the name flows.mjs gives it. */
const MCP_MEASURES = {
  resourceMetadata: {
    says: "public MCP servers that refuse a request with no token and publish protected resource metadata",
    ...mcp.resourceMetadata.publishedAmongRefused,
  },
};

const flows = await recordFlows();
const record = [];
for (const flow of flows) {
  const mine = ledger.filter((e) => e.flow === flow.slug);
  const implementers = mine.filter((e) => e.kind === "implementer");
  const adopters = mine.filter((e) => e.kind === "adopter");
  const lists = mine.filter((e) => e.kind === "list");

  // Who offers it.
  const s = supply(
    implementers.map((e) => ({
      org: e.org,
      stage: e.stage,
      authorOwn: e.authorOwn,
    })),
    lists
      .filter((l) => l.listOf === "supply")
      .map((l) => ({ count: l.count, ga: l.listGa === true })),
  );

  // Who runs it: by name, and as a share of what was counted.
  const counted = [];
  const named = adopters.map((e) => e.org);
  const signal = flow.signal ? issuers.signals[flow.signal] : undefined;
  if (signal) {
    counted.push({
      source: "issuer panel",
      says: `organizations on the panel whose authorization server says it supports ${signal.says}`,
      n: signal.n,
      of: signal.of,
    });
    named.push(...signal.who);
  }
  const measure = flow.mcp ? MCP_MEASURES[flow.mcp] : undefined;
  if (measure)
    counted.push({
      source: "MCP census",
      says: measure.says,
      n: measure.n,
      of: measure.of,
      margin: measure.margin,
    });
  const u = use(
    named,
    counted,
    lists.filter((l) => l.listOf === "use").map((l) => ({ count: l.count })),
  );

  // A second reading that is shown and not graded: the same statement, among
  // the authorization servers of public MCP servers.
  const also = flow.signal
    ? [
        {
          source: "MCP census",
          says: `authorization servers of public MCP servers that say they support ${mcp.signals[flow.signal].says}`,
          n: mcp.signals[flow.signal].n,
          of: mcp.signals[flow.signal].of,
          percent: mcp.signals[flow.signal].percent,
          margin: mcp.signals[flow.signal].margin,
        },
      ]
    : [];

  const heard = noise.flows[flow.slug] ?? {};
  const a = attention(
    heard.talk && !heard.talk.failed
      ? { last: heard.talk.last12Months, before: heard.talk.the12MonthsBefore }
      : undefined,
    (heard.downloads ?? [])
      .filter((d) => !d.whole && d.byMonth)
      .map((d) => ({ byMonth: d.byMonth.map((m) => m.n) })),
  );

  const checked = mine.filter((e) => e.verified).length;
  record.push({
    slug: flow.slug,
    title: flow.title,
    ...(flow.planned
      ? { planned: flow.planned }
      : { rating: flow.rating, group: flow.group }),
    level: level(s.grade, u.grade),
    basis: basis({
      counted: counted.filter((c) => c.of > 0).length,
      checkedSources: checked,
    }),
    supply: { score: score(s.position), ...s },
    use: { score: score(u.position), ...u },
    counted: counted.map((c) => ({
      ...c,
      percent: Math.round((1000 * c.n) / c.of) / 10,
    })),
    alsoCounted: also,
    attention: a,
    evidence: {
      implementers: implementers.length,
      adopters: adopters.length,
      lists: lists.length,
      checked,
      stageInferred: implementers.filter((e) => e.stageInferred).length,
    },
    heard: {
      ...(heard.talk && !heard.talk.failed
        ? {
            talk: {
              phrases: heard.talk.phrases,
              last12Months: heard.talk.last12Months,
              the12MonthsBefore: heard.talk.the12MonthsBefore,
            },
          }
        : {}),
      ...(heard.downloads
        ? {
            downloads: heard.downloads
              .filter((d) => d.byMonth?.length)
              .map((d) => ({
                registry: d.registry,
                name: d.name,
                ...(d.whole ? { whole: true } : {}),
                lastWholeMonth: d.byMonth.at(-1).n,
              })),
          }
        : {}),
      ...(heard.paper
        ? {
            paper: heard.paper
              .filter((p) => !p.failed)
              .map((p) => ({
                name: p.name,
                rev: p.rev,
                lastRevision: p.lastRevision,
                revisionsInLast12Months: p.revisionsInLast12Months,
              })),
          }
        : {}),
    },
  });
}

const day = today();
writeJson(join(DATA, "snapshots", `${day}.json`), {
  what: "Where each flow stands, by the rubric in scripts/adoption/rubric.mjs",
  day,
  from: {
    ledger: ledger.length,
    issuers: { day: issuers.day, answered: issuers.answered },
    mcpCensus: { day: mcp.day, asked: mcp.frame.asked, reached: mcp.reached.n },
    attention: noise.day,
  },
  flows: record,
});

const pad = (v, n) => String(v ?? "").padEnd(n);
console.log(
  `${pad("flow", 30)}${pad("paper", 14)}${pad("level", 13)}${pad("supply", 8)}${pad("use", 6)}${pad("basis", 26)}attention`,
);
const order = (a, b) =>
  levelRank(b.level) - levelRank(a.level) ||
  b.use.score - a.use.score ||
  b.supply.score - a.supply.score;
for (const r of [...record].sort(order))
  console.log(
    `${pad(r.slug, 30)}${pad(r.rating ?? "planned", 14)}${pad(r.level, 13)}${pad(r.supply.score, 8)}${pad(r.use.score, 6)}${pad(r.basis, 26)}${r.attention.grade ?? "-"} ${r.attention.direction ?? ""}`,
  );
