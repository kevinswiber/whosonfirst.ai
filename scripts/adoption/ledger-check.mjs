// Reads every page the ledger cites again, and says whether it still says it.
//
// A ledger entry is a claim with three parts: an address, words quoted from the
// page at that address, and the day they were seen. That makes it checkable by
// a machine: fetch the page, look for the words. An entry whose words are gone
// is not wrong, but it is no longer evidence, and a person has to read the page.
//
//   node scripts/adoption/ledger-check.mjs            report only
//   node scripts/adoption/ledger-check.mjs --record   also write the day each
//                                                     entry was last confirmed
//
// It reads and writes docs/adoption/data/ledger.json.
import { join } from "node:path";
import { ask, DATA, pool, readJson, today, writeJson } from "./lib.mjs";

const FILE = join(DATA, "ledger.json");
const record = process.argv.includes("--record");

const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};
/** A page as the words on it: no tags, entities read, one space between words. */
const words = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(Number.parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ");

/**
 * How a page is asked for. A server may give different words to different
 * requests: one keeps a sentence only in the plain response, another refuses
 * a request that does not say it wants a page. So a page is asked for plainly
 * first, and as a browser would ask second. Both ask for English: a
 * documentation site that is told any language will do may answer in another.
 */
const WAYS = [
  { "accept-language": "en" },
  {
    "accept-language": "en",
    accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
  },
];

async function check(entry) {
  const quote = entry.quote.replace(/\s+/g, " ").trim();
  let why;
  let read = false;
  for (const headers of WAYS) {
    const res = await ask(entry.url, {
      read: "text",
      ms: 30000,
      limit: 8e6,
      headers,
    });
    if (res.failed || res.status !== 200) {
      why = res.failed ?? `status ${res.status}`;
      continue;
    }
    read = true;
    if (words(res.text).includes(quote)) return { entry, result: "confirmed" };
  }
  return read
    ? { entry, result: "words not found" }
    : { entry, result: "unreachable", why };
}

const ledger = readJson(FILE);
// One host at a time would be kinder still; four at once across many hosts is what a reader does.
const results = await pool(ledger, 4, check);
const by = (r) => results.filter((x) => x.result === r);

for (const r of results.filter((x) => x.result !== "confirmed"))
  console.log(
    `${r.result.padEnd(16)} ${r.entry.flow.padEnd(28)} ${r.entry.who}\n${" ".repeat(17)}${r.entry.url}${r.why ? `  (${r.why})` : ""}`,
  );
console.log(
  `\n${by("confirmed").length} confirmed, ${by("words not found").length} no longer say it, ${by("unreachable").length} could not be read, of ${ledger.length}`,
);

if (record) {
  const day = today();
  for (const r of results)
    if (r.result === "confirmed") r.entry.confirmed = day;
  writeJson(FILE, ledger);
}
