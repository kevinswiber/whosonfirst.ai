// How much is being said and built around each flow, and which way that is going.
//
// Three public sources, none of which needs an account:
//
//   talk       Hacker News stories and comments that contain a phrase, by
//              quarter, from the search API Algolia runs for it.
//   downloads  monthly downloads of the libraries a flow's plan names, from
//              the npm, PyPI and crates.io registries.
//   paper      the revisions of the IETF drafts a flow requires, with their
//              dates, from the IETF datatracker.
//
// These measure attention. They do not measure adoption: a library is
// downloaded by build machines, and a phrase is used by people arguing against
// the thing. They are kept apart from the adoption grade for that reason, and
// used for one thing: whether interest is rising or falling against itself.
//
//   node scripts/adoption/attention.mjs
//
// It writes docs/adoption/data/attention/<day>.json.
import { join } from "node:path";
import { recordFlows } from "./flows.mjs";
import { ask, DATA, pool, today, writeJson } from "./lib.mjs";

const DAY = today();
const month = (d) => d.toISOString().slice(0, 7);
const firstOfMonth = (back) => {
  const d = new Date(`${DAY.slice(0, 7)}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - back);
  return d;
};
/** The last `n` complete months, oldest first: "2026-10". */
const months = (n) =>
  Array.from({ length: n }, (_, i) => month(firstOfMonth(n - i)));

// ---- talk ----
const QUARTERS = 12;
/** Twelve three-month windows that end at the start of this month, oldest first. */
const windows = Array.from({ length: QUARTERS }, (_, i) => {
  const from = firstOfMonth(3 * (QUARTERS - i));
  const to = firstOfMonth(3 * (QUARTERS - i - 1));
  return { from, to, label: `${month(from)}` };
});

async function mentions(phrase, from, to) {
  const u = new URL("https://hn.algolia.com/api/v1/search");
  u.searchParams.set("query", `"${phrase}"`);
  u.searchParams.set("advancedSyntax", "true");
  u.searchParams.set("typoTolerance", "false");
  u.searchParams.set("tags", "(story,comment)");
  u.searchParams.set("hitsPerPage", "0");
  u.searchParams.set(
    "numericFilters",
    `created_at_i>=${from / 1000},created_at_i<${to / 1000}`,
  );
  const res = await ask(u, { read: "json", ms: 20000 });
  return typeof res.json?.nbHits === "number" ? res.json.nbHits : null;
}

async function talk(flow) {
  if (!flow.talk?.length) return undefined;
  const jobs = flow.talk.flatMap((phrase) =>
    windows.map((w, i) => ({ phrase, i, w })),
  );
  const counts = await pool(jobs, 4, (j) =>
    mentions(j.phrase, j.w.from, j.w.to),
  );
  if (counts.some((c) => c === null))
    return { phrases: flow.talk, failed: true };
  // A post that uses two of a flow's phrases is counted twice. The phrases are
  // chosen to be names for the same thing, so that is rare, and it is the same
  // in every window.
  const byQuarter = windows.map((w, i) => ({
    from: w.label,
    n: jobs.reduce((sum, j, k) => (j.i === i ? sum + counts[k] : sum), 0),
  }));
  const sum = (list) => list.reduce((a, q) => a + q.n, 0);
  return {
    phrases: flow.talk,
    byQuarter,
    last12Months: sum(byQuarter.slice(-4)),
    the12MonthsBefore: sum(byQuarter.slice(-8, -4)),
  };
}

// ---- downloads ----
async function npm(name) {
  const list = months(18);
  const from = `${list[0]}-01`;
  const to = new Date(firstOfMonth(0) - 86400000).toISOString().slice(0, 10);
  const res = await ask(
    `https://api.npmjs.org/downloads/range/${from}:${to}/${name}`,
    { read: "json", ms: 30000, limit: 2e6 },
  );
  if (!Array.isArray(res.json?.downloads)) return undefined;
  const by = new Map(list.map((m) => [m, 0]));
  for (const d of res.json.downloads)
    if (by.has(d.day.slice(0, 7)))
      by.set(d.day.slice(0, 7), by.get(d.day.slice(0, 7)) + d.downloads);
  return [...by.entries()].map(([m, n]) => ({ month: m, n }));
}

async function pypi(name) {
  const res = await ask(
    `https://pypistats.org/api/packages/${name}/overall?mirrors=false`,
    { read: "json", ms: 30000, limit: 2e6 },
  );
  if (!Array.isArray(res.json?.data)) return undefined;
  // The service keeps 180 days: the first month it gives is rarely whole.
  const days = res.json.data.map((d) => d.date).sort();
  const whole = months(6).filter((m) => `${m}-01` >= days[0]);
  const by = new Map(whole.map((m) => [m, 0]));
  for (const d of res.json.data)
    if (by.has(d.date.slice(0, 7)))
      by.set(d.date.slice(0, 7), by.get(d.date.slice(0, 7)) + d.downloads);
  return [...by.entries()].map(([m, n]) => ({ month: m, n }));
}

async function crates(name) {
  const res = await ask(`https://crates.io/api/v1/crates/${name}/downloads`, {
    read: "json",
    ms: 30000,
    limit: 5e6,
  });
  if (!Array.isArray(res.json?.version_downloads)) return undefined;
  const all = [
    ...res.json.version_downloads,
    ...(res.json.meta?.extra_downloads ?? []),
  ];
  // The registry keeps 90 days.
  const days = all.map((d) => d.date).sort();
  const whole = months(3).filter((m) => `${m}-01` >= days[0]);
  const by = new Map(whole.map((m) => [m, 0]));
  for (const d of all)
    if (by.has(d.date.slice(0, 7)))
      by.set(d.date.slice(0, 7), by.get(d.date.slice(0, 7)) + d.downloads);
  return [...by.entries()].map(([m, n]) => ({ month: m, n }));
}

const REGISTRY = { npm, pypi, crates };

async function downloads(flow) {
  if (!flow.packages?.length) return undefined;
  return Promise.all(
    flow.packages.map(async (p) => {
      const byMonth = await REGISTRY[p.registry](p.name);
      return { ...p, ...(byMonth ? { byMonth } : { failed: true }) };
    }),
  );
}

// ---- paper ----
async function paper(flow) {
  if (!flow.drafts?.length) return undefined;
  const cutoff = firstOfMonth(12).toISOString();
  return Promise.all(
    flow.drafts.map(async ({ id, name }) => {
      const res = await ask(
        `https://datatracker.ietf.org/doc/${name}/doc.json`,
        {
          read: "json",
          ms: 30000,
        },
      );
      const history = res.json?.rev_history;
      if (!Array.isArray(history)) return { entry: id, name, failed: true };
      const revisions = history
        .filter((r) => r.published)
        .map((r) => ({
          name: r.name,
          rev: r.rev,
          published: r.published.slice(0, 10),
        }));
      return {
        entry: id,
        name,
        rev: res.json.rev,
        state: res.json.state,
        revisionsInLast12Months: revisions.filter(
          (r) => r.published >= cutoff.slice(0, 10),
        ).length,
        lastRevision: revisions.at(-1)?.published,
        revisions,
      };
    }),
  );
}

const flows = await recordFlows();
const out = {};
for (const flow of flows) {
  const [t, d, p] = await Promise.all([
    talk(flow),
    downloads(flow),
    paper(flow),
  ]);
  out[flow.slug] = {
    ...(t ? { talk: t } : {}),
    ...(d ? { downloads: d } : {}),
    ...(p ? { paper: p } : {}),
  };
  const say = [
    t
      ? `talk ${t.failed ? "failed" : `${t.last12Months} (was ${t.the12MonthsBefore})`}`
      : "",
    d
      ? `downloads ${d.map((x) => (x.failed ? "failed" : x.byMonth.at(-1)?.n)).join("/")}`
      : "",
    p
      ? `revisions ${p.map((x) => x.revisionsInLast12Months ?? "failed").join("/")}`
      : "",
  ].filter(Boolean);
  console.log(flow.slug.padEnd(30), say.join("  ·  "));
}

writeJson(join(DATA, "attention", `${DAY}.json`), {
  what: "Talk, downloads and draft revisions around each flow",
  day: DAY,
  windows: {
    quarters: windows.map((w) => w.label),
    lastWholeMonth: months(1)[0],
  },
  flows: out,
});
