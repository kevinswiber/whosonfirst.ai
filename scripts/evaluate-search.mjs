// Compare the search modes on published editorial examples. The computed score
// measures destinations only. Read the excerpts to judge their usefulness.
// Run: node scripts/evaluate-search.mjs [--review]
// Save just the displayed public results: --json > /tmp/search-evaluation.json
// Score that run again, offline: --replay /tmp/search-evaluation.json [--review]
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import {
  catalogFor,
  rankedResults,
  searchRequest,
} from "../workers/search/search.mjs";

const { values } = parseArgs({
  options: {
    json: { type: "boolean" },
    review: { type: "boolean" },
    replay: { type: "string" },
  },
});
const questions = JSON.parse(
  await readFile(
    new URL("../test/fixtures/guide-search-questions.json", import.meta.url),
    "utf8",
  ),
);
const modes = ["keyword", "hybrid"];
const pathOf = (href) => href.split("#")[0];

function destinationFound(results, target) {
  return results.some(({ href }) =>
    target.includes("#") ? href === target : pathOf(href) === target,
  );
}

function metric({ kind, targets }, results) {
  if (kind === "off-topic") return results.length === 0;
  if (kind === "ambiguous")
    return targets.every((target) => destinationFound(results, target));
  const candidates = kind === "lookup" ? results.slice(0, 1) : results;
  return targets.some((target) => destinationFound(candidates, target));
}

async function run() {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_AI_SEARCH_UPLOAD_TOKEN;
  if (!account || !token)
    throw new Error("Missing Cloudflare search credentials");
  const namespace = process.env.SEARCH_NAMESPACE ?? "whosonfirst";
  const instance = process.env.SEARCH_INSTANCE ?? "whosonfirst-guide";
  const endpoint = [
    "https://api.cloudflare.com/client/v4/accounts",
    encodeURIComponent(account),
    "ai-search/namespaces",
    encodeURIComponent(namespace),
    "instances",
    encodeURIComponent(instance),
    "search",
  ].join("/");
  const { revision, records } = JSON.parse(
    await readFile(
      new URL("../.astro/search/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const catalog = catalogFor(records);
  const rows = [];
  for (const [i, { query }] of questions.entries()) {
    const row = { query };
    // Alternate request order to spread the effects of warm caches.
    for (const mode of i % 2 === 0 ? modes : modes.toReversed()) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchRequest(query, mode)),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok)
        throw new Error(`${mode} query ${i + 1} returned ${response.status}`);
      const { result } = await response.json();
      row[mode] = rankedResults(catalog, query, result.chunks).slice(0, 3);
    }
    rows.push(row);
  }
  return { revision, rows };
}

const report = values.replay
  ? JSON.parse(await readFile(values.replay, "utf8"))
  : await run();
if (values.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const { revision, rows } = report;
  console.log("Passage revision:", revision);
  const byQuery = new Map(rows.map((row) => [row.query, row]));
  if (rows.length !== questions.length || byQuery.size !== rows.length)
    throw new Error("The run and the editorial question set differ");
  for (const { query, targets } of questions) {
    const row = byQuery.get(query);
    if (!row || modes.some((mode) => !Array.isArray(row[mode])))
      throw new Error("Missing question or search mode in evaluation");
    if (!values.review) continue;
    console.log(
      "\n",
      query,
      "\n Expected:",
      targets.join(" or ") || "(no results)",
    );
    for (const mode of modes) {
      console.log(" ", mode);
      for (const result of row[mode])
        console.log("  ", result.href, result.section, "\n   ", result.excerpt);
    }
  }
  const labels = {
    situation: "situations with a target in the first three",
    lookup: "lookups with a target first",
    ambiguous: "ambiguous queries with both intents in the first three",
    "off-topic": "off-topic queries returning no passages",
  };
  for (const [kind, label] of Object.entries(labels)) {
    const group = questions.filter((q) => q.kind === kind);
    const score = (mode) =>
      group.filter((q) => metric(q, byQuery.get(q.query)[mode])).length;
    console.log(
      `${label}: ${modes.map((m) => `${m} ${score(m)}/${group.length}`).join(", ")}`,
    );
  }
}
