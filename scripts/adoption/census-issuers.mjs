// What a fixed panel of well-known authorization servers says it supports.
//
// Each issuer on the panel (panels.mjs) is asked for its metadata document,
// the one a client reads before its first request. Nothing else is asked. The
// answer is the server's own statement, so a count made from it is a floor:
// a server can support a thing and leave it out of the document.
//
//   node scripts/adoption/census-issuers.mjs
//
// It writes docs/adoption/data/issuers/<day>.json.
import { join } from "node:path";
import { ask, DATA, pct, pool, today, writeJson } from "./lib.mjs";
import {
  isMetadata,
  metadataAddresses,
  SIGNALS,
  signalsIn,
} from "./metadata.mjs";
import { ISSUERS } from "./panels.mjs";

const DAY = process.argv.includes("--day")
  ? process.argv[process.argv.indexOf("--day") + 1]
  : today();

async function read(issuer) {
  for (const address of metadataAddresses(issuer)) {
    const res = await ask(address, {
      read: "json",
      headers: { accept: "application/json" },
    });
    if (res.status === 200 && isMetadata(res.json)) return signalsIn(res.json);
  }
  return undefined;
}

const rows = await pool(ISSUERS, 16, async ({ org, issuers }) => {
  const found = (await Promise.all(issuers.map(read))).filter(Boolean);
  if (!found.length) return { org, answered: false };
  return { org, answered: true, signals: [...new Set(found.flat())].sort() };
});

const answered = rows.filter((r) => r.answered);
const signals = {};
for (const s of SIGNALS) {
  const who = answered
    .filter((r) => r.signals.includes(s.id))
    .map((r) => r.org);
  signals[s.id] = {
    says: s.says,
    defined: s.defined,
    ...(s.flow ? { flow: s.flow } : {}),
    n: who.length,
    of: answered.length,
    percent: pct(who.length, answered.length),
    who,
  };
}

const summary = {
  what: "What a fixed panel of well-known authorization servers says it supports",
  day: DAY,
  panel: ISSUERS.length,
  answered: answered.length,
  didNotAnswer: rows.filter((r) => !r.answered).map((r) => r.org),
  signals,
  rows: answered,
};
writeJson(join(DATA, "issuers", `${DAY}.json`), summary);
for (const [id, s] of Object.entries(signals))
  console.log(
    `${String(s.n).padStart(3)} of ${s.of}  ${String(s.percent).padStart(5)}%  ${id}`,
  );
if (summary.didNotAnswer.length)
  console.log("did not answer:", summary.didNotAnswer.join(", "));
