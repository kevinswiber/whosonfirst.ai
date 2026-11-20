// Lists what one specification cites of another, by revision, and says which
// citations name a revision the cited document has moved past. Run with
// `npm run standards:citations`. docs/source-review.md says how a review uses it.
//
// It reads the data and nothing else. Node strips the types as it loads them.
import { citations } from "../src/data/history/citations.ts";
import { history } from "../src/data/history/index.ts";
import { readCitations } from "../src/lib/history.ts";

const read = readCitations(citations, history);
const line = (c) => {
  const state = !c.toLabel
    ? "names no revision"
    : c.behind
      ? `the current one is ${c.currentName}`
      : "the current one";
  const note = c.note ? `\n      ${c.note}` : "";
  const old = c.superseded ? " (itself no longer current)" : "";
  return `  ${c.from}${old} ${c.how} ${c.to}: ${state}\n      ${c.source}${note}`;
};
const behind = read.filter((c) => c.behind);
const rest = read.filter((c) => !c.behind);
console.log(
  `${read.length} citations: ${behind.length} of a revision the cited document has moved past.\n`,
);
if (behind.length) {
  console.log("Cites an earlier revision: read both, and say what differs");
  console.log(`${behind.map(line).join("\n")}\n`);
}
if (rest.length) {
  console.log("Cites the current revision, or none");
  console.log(rest.map(line).join("\n"));
}
