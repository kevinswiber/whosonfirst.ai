// A census of how public MCP servers ask for authorization.
//
// The official MCP registry lists servers that anyone can reach over HTTP. An
// MCP client that meets one sends a request with no token, reads the challenge,
// and follows it to two public documents: the server's protected resource
// metadata (RFC 9728) and its authorization server's metadata (RFC 8414). This
// script does that much and no more. It never registers a client, never starts
// an authorization, and holds no credential. Each server gets at most eight
// requests, to addresses that exist to be read by software.
//
// It draws a sample: one address per operator, in an order fixed by the seed,
// so the same sample can be drawn again. The summary gives each share with the
// margin a sample of that size carries.
//
//   node scripts/adoption/census-mcp.mjs --sample 2000
//   node scripts/adoption/census-mcp.mjs --sample all
//
// It writes docs/adoption/data/mcp-census/<day>.json, the summary, and
// <day>.rows.json beside it: one row per server asked, without its name. The
// summary can be worked out again from the rows, and the sample can be drawn
// again from the registry with the seed, so nothing rests on a list of hosts
// kept here.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ask,
  DATA,
  margin,
  pct,
  pool,
  shuffled,
  today,
  writeJson,
} from "./lib.mjs";
import {
  challenge,
  isMetadata,
  metadataAddresses,
  operator,
  resourceAddresses,
  SIGNALS,
  sharedSuffix,
  signalsIn,
} from "./metadata.mjs";

const REGISTRY = "https://registry.modelcontextprotocol.io/v0/servers";
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const SAMPLE = arg("sample", "2000");
const DAY = arg("day", today());
const SEED = arg("seed", DAY);
const WIDTH = Number(arg("width", "48"));

/** Only an address on the public web is asked: https, a name, not a number. */
const askable = (url) => {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname.includes(".") &&
      !/^[\d.]+$/.test(u.hostname) &&
      !u.hostname.includes(":") &&
      !/[{}]/.test(decodeURI(url)) &&
      !/(^|\.)(localhost|local|internal|test|example)$/.test(u.hostname)
    );
  } catch {
    return false;
  }
};

/** Every active server in the registry that names a remote address, latest version only. */
async function registry() {
  const servers = [];
  let cursor;
  let listed = 0;
  for (let page = 0; page < 2000; page++) {
    const u = new URL(REGISTRY);
    u.searchParams.set("limit", "100");
    u.searchParams.set("version", "latest");
    if (cursor) u.searchParams.set("cursor", cursor);
    const res = await ask(u, { read: "json", ms: 30000, limit: 5e6 });
    if (!res.json)
      throw new Error(
        `the registry did not answer: ${res.status ?? res.failed}`,
      );
    for (const s of res.json.servers ?? []) {
      listed++;
      const meta = s._meta?.["io.modelcontextprotocol.registry/official"];
      if (meta?.status !== "active") continue;
      const remotes = (s.server.remotes ?? [])
        .map((r) => r.url)
        .filter(askable);
      if (remotes.length) servers.push({ name: s.server.name, remotes });
    }
    cursor = res.json.metadata?.nextCursor;
    if (!cursor) break;
  }
  return { listed, servers };
}

const INITIALIZE = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "adoption-census", version: "0.1" },
  },
});

/** The first of `addresses` that answers with a JSON document `ok` accepts. */
async function firstDocument(addresses, ok) {
  for (const [i, address] of addresses.entries()) {
    if (!askable(address)) continue;
    const res = await ask(address, {
      read: "json",
      headers: { accept: "application/json" },
    });
    if (res.status === 200 && ok(res.json))
      return { json: res.json, tried: i + 1 };
  }
  return undefined;
}

async function probe({ operator: op, url }) {
  const row = { operator: op, host: new URL(url).hostname };
  // 1. What any client sends first, with no token.
  const first = await ask(url, {
    method: "POST",
    body: INITIALIZE,
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
  });
  if (first.failed) return { ...row, reached: false, why: first.failed };
  row.reached = true;
  row.status = first.status;
  const session = first.headers.get("mcp-session-id");
  if (session)
    // A server that let the request in has opened a session. Close it.
    await ask(url, {
      method: "DELETE",
      headers: { "mcp-session-id": session },
      ms: 5000,
    });
  const asked = challenge(first.headers.get("www-authenticate"));
  if (asked)
    row.challenge = { ...asked, resourceMetadata: !!asked.resourceMetadata };

  // 2. The protected resource metadata: where the challenge says, or where RFC 9728 puts it.
  const named = asked?.resourceMetadata;
  const places = [...(named ? [named] : []), ...resourceAddresses(url)];
  const prm = await firstDocument(
    [...new Set(places)],
    (j) =>
      j && typeof j === "object" && (j.resource || j.authorization_servers),
  );
  let issuer;
  if (prm) {
    const servers = Array.isArray(prm.json.authorization_servers)
      ? prm.json.authorization_servers.filter((s) => typeof s === "string")
      : [];
    row.resourceMetadata = {
      by: named && prm.tried === 1 ? "challenge" : "well-known",
      authorizationServers: servers.length,
      dpopBound: prm.json.dpop_bound_access_tokens_required === true,
    };
    issuer = servers.find(askable);
  }

  // 3. The authorization server's metadata. With no resource metadata, a server
  //    that challenged may still publish it at its own origin, as MCP's 2025-03-26
  //    revision had clients look for it.
  const fallback = !issuer && (first.status === 401 || first.status === 403);
  const from = issuer ?? (fallback ? new URL(url).origin : undefined);
  if (from) {
    const doc = await firstDocument(metadataAddresses(from), isMetadata);
    if (doc) {
      const host = new URL(doc.json.issuer).hostname;
      row.authorizationServer = {
        by: issuer ? "resource-metadata" : "own-origin",
        issuer: operator(host),
        suffix: sharedSuffix(host),
        sameOperator: operator(host) === op,
        signals: signalsIn(doc.json),
      };
    }
  }
  return row;
}

const { listed, servers } = await registry();
// One address per operator: the first by name, so a platform that lists a
// thousand servers is asked once.
const byOperator = new Map();
for (const s of [...servers].sort((a, b) => a.name.localeCompare(b.name))) {
  for (const url of s.remotes) {
    const op = operator(new URL(url).hostname);
    if (!byOperator.has(op)) byOperator.set(op, { operator: op, url });
  }
}
const frame = shuffled(
  [...byOperator.values()].sort((a, b) => a.operator.localeCompare(b.operator)),
  SEED,
);
const sample = SAMPLE === "all" ? frame : frame.slice(0, Number(SAMPLE));
console.error(
  `${listed} listed, ${servers.length} active with a remote address, ${byOperator.size} operators; asking ${sample.length}`,
);

let done = 0;
const rows = await pool(sample, WIDTH, async (item) => {
  const row = await probe(item);
  if (++done % 250 === 0) console.error(`  ${done} / ${sample.length}`);
  return row;
});

// ---- the summary ----
const count = (list, test) => list.filter(test).length;
const share = (n, of) => ({
  n,
  of,
  percent: pct(n, of),
  margin: margin(n, of),
});
const reached = rows.filter((r) => r.reached);
const refused = reached.filter((r) => r.status === 401);
const open = reached.filter((r) => r.status >= 200 && r.status < 300);
const withPrm = reached.filter((r) => r.resourceMetadata);
const withAs = reached.filter((r) => r.authorizationServer);
const discoverable = withAs.filter(
  (r) => r.authorizationServer.by === "resource-metadata",
);

const signals = {};
for (const s of SIGNALS)
  signals[s.id] = {
    says: s.says,
    defined: s.defined,
    ...(s.flow ? { flow: s.flow } : {}),
    ...share(
      count(withAs, (r) => r.authorizationServer.signals.includes(s.id)),
      withAs.length,
    ),
  };

const tally = (list, key) => {
  const t = new Map();
  for (const item of list) {
    const k = key(item);
    if (k) t.set(k, (t.get(k) ?? 0) + 1);
  }
  return [...t.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
};

const summary = {
  what: "How public MCP servers ask for authorization, from the documents they publish",
  day: DAY,
  seed: SEED,
  registry: REGISTRY,
  frame: {
    listed,
    activeWithRemote: servers.length,
    operators: byOperator.size,
    asked: sample.length,
  },
  reached: share(reached.length, rows.length),
  notReached: Object.fromEntries(
    tally(
      rows.filter((r) => !r.reached),
      (r) => r.why,
    ),
  ),
  // Of the servers that answered at all:
  firstAnswer: {
    refusedWith401: share(refused.length, reached.length),
    letIn: share(open.length, reached.length),
    other: share(reached.length - refused.length - open.length, reached.length),
    statuses: Object.fromEntries(tally(reached, (r) => String(r.status))),
  },
  // Of the servers that answered 401:
  challenge: {
    namesResourceMetadata: share(
      count(refused, (r) => r.challenge?.resourceMetadata),
      refused.length,
    ),
    bearer: share(
      count(refused, (r) => r.challenge?.bearer),
      refused.length,
    ),
    noChallengeHeader: share(
      count(refused, (r) => !r.challenge),
      refused.length,
    ),
  },
  resourceMetadata: {
    published: share(withPrm.length, reached.length),
    publishedAmongRefused: share(
      count(refused, (r) => r.resourceMetadata),
      refused.length,
    ),
    foundByChallenge: count(
      withPrm,
      (r) => r.resourceMetadata.by === "challenge",
    ),
    foundAtWellKnownOnly: count(
      withPrm,
      (r) => r.resourceMetadata.by === "well-known",
    ),
    saysDpopRequired: count(withPrm, (r) => r.resourceMetadata.dpopBound),
  },
  authorizationServer: {
    found: share(withAs.length, reached.length),
    foundThroughResourceMetadata: discoverable.length,
    foundAtOwnOriginOnly: withAs.length - discoverable.length,
    runByAnotherOperator: share(
      count(withAs, (r) => !r.authorizationServer.sameOperator),
      withAs.length,
    ),
    // Whose service the authorization server is on, where its host name says so.
    onSharedSuffix: Object.fromEntries(
      tally(withAs, (r) => r.authorizationServer.suffix),
    ),
  },
  // Of the servers whose authorization server metadata was read:
  signals,
  registration: {
    // The two ways an MCP client that nobody registered by hand can identify itself.
    cimdOnly: count(
      withAs,
      (r) => has(r, "cimd") && !has(r, "dynamicRegistration"),
    ),
    dynamicOnly: count(
      withAs,
      (r) => !has(r, "cimd") && has(r, "dynamicRegistration"),
    ),
    both: count(withAs, (r) => has(r, "cimd") && has(r, "dynamicRegistration")),
    neither: count(
      withAs,
      (r) => !has(r, "cimd") && !has(r, "dynamicRegistration"),
    ),
    of: withAs.length,
  },
};
function has(row, id) {
  return row.authorizationServer.signals.includes(id);
}

const out = join(DATA, "mcp-census");
writeJson(join(out, `${DAY}.json`), summary);
// One row to a line, and no names: which server said what is not the finding.
const unnamed = rows.map(
  ({ operator: _o, host: _h, authorizationServer: as, ...row }) => {
    if (!as) return row;
    const { issuer: _i, ...rest } = as;
    return { ...row, authorizationServer: rest };
  },
);
writeFileSync(
  join(out, `${DAY}.rows.json`),
  `[\n${unnamed.map((r) => JSON.stringify(r)).join(",\n")}\n]\n`,
);
console.log(JSON.stringify(summary, null, 2));
