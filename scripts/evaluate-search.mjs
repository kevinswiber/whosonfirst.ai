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
} from "../src/search/search.ts";

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
// Each mode is a request: keyword and hybrid search as AI Search ranks them,
// and the hybrid search the Worker makes, ranked again by a second model.
const requests = {
  keyword: (query) => searchRequest(query, "keyword", false, false),
  hybrid: (query) => searchRequest(query, "hybrid", false, false),
  reranked: (query) => searchRequest(query, "hybrid", false),
};
const requested = Object.keys(requests);
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
    for (const mode of i % 2 === 0 ? requested : requested.toReversed()) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Measure retrieval itself, not answers AI Search has cached.
        body: JSON.stringify(requests[mode](query)),
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
  // A saved report is scored with the modes it was run with, so a report
  // from before a mode was added can still be read. Every row needs the same.
  const modesOf = (row) => Object.keys(row).filter((key) => key !== "query");
  const modes = modesOf(rows[0] ?? {});
  const sameModes = (row) =>
    modesOf(row).sort().join() === modes.toSorted().join();
  for (const { query, targets } of questions) {
    const row = byQuery.get(query);
    if (
      !row ||
      !modes.length ||
      !sameModes(row) ||
      modes.some((mode) => !Array.isArray(row[mode]))
    )
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
    if (kind === "situation") {
      // A step can answer a situation even if the editorial fixture picked its
      // overview passage. This second metric still needs an excerpt review.
      const pageHits = (mode) =>
        group.filter(({ query, targets }) =>
          targets.some((href) =>
            destinationFound(byQuery.get(query)[mode], pathOf(href)),
          ),
        ).length;
      console.log(
        `situations with a target page in the first three: ${modes.map((m) => `${m} ${pageHits(m)}/${group.length}`).join(", ")}`,
      );
    }
  }
}
