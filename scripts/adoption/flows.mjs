// The flows the adoption record covers, and what can be measured for each.
//
// Every flow is asked the same three questions (rubric.mjs). What differs is
// the instrument: one flow can be counted in metadata that servers publish,
// another only in what its implementers document. This file says, flow by
// flow, which instruments apply. A flow with none listed here is graded from
// the ledger alone.
//
// A flow marked `planned` has no page yet: it is an open issue. It is carried
// here so that the record is ready when the page is, and so that the method is
// tried on mechanisms as different as the site will cover.
import { readdirSync } from "node:fs";

/**
 * - signal: the id in metadata.mjs that is this flow's own statement in an
 *   authorization server's metadata. Counted on the issuer panel (who runs it)
 *   and in the MCP census.
 * - mcp: a measure the MCP census makes that is this flow itself.
 * - packages: libraries whose registry description names this mechanism.
 *   `whole: true` marks a library for a whole protocol, of which this flow is
 *   one part: its downloads are shown and are not graded.
 * - talk: phrases searched for, exactly as written. A phrase that also means
 *   something else is left out, and the flow then has no such measure.
 */
export const PLAN = {
  "authorization-code-pkce": {
    signal: "pkceS256",
    talk: ["PKCE"],
  },
  "device-authorization": {
    signal: "deviceGrant",
    talk: ["device authorization grant", "device code flow"],
  },
  "mcp-authorization": {
    mcp: "resourceMetadata",
    packages: [
      { registry: "npm", name: "@modelcontextprotocol/sdk", whole: true },
      { registry: "pypi", name: "mcp", whole: true },
      { registry: "crates", name: "rmcp", whole: true },
    ],
    talk: ["MCP authorization", "MCP OAuth"],
  },
  "step-up-authorization": { talk: ["step-up authentication", "RFC 9470"] },
  ciba: { signal: "ciba", talk: ["CIBA"] },
  "url-elicitation": { talk: ["MCP elicitation"] },
  aauth: { talk: ["AAuth"] },
  "token-exchange": {
    signal: "tokenExchange",
    talk: ["OAuth token exchange", "RFC 8693"],
  },
  "cross-app-access": {
    signal: "idJag",
    talk: ["Cross App Access", "ID-JAG"],
  },
  "identity-chaining": {
    signal: "identityChaining",
    talk: ["identity chaining"],
  },
  "transaction-tokens": { talk: ["transaction tokens"] },
  "client-credentials": {
    signal: "clientCredentials",
    talk: ["client credentials grant", "client credentials flow"],
  },
  "workload-identity-federation": { talk: ["workload identity federation"] },
  "spiffe-workload-identity": {
    packages: [
      { registry: "pypi", name: "spiffe" },
      { registry: "crates", name: "spiffe" },
    ],
    talk: ["SPIFFE"],
  },
  "wimse-workload-tokens": { talk: ["WIMSE"] },
  "agent-to-agent": {
    packages: [
      { registry: "npm", name: "@a2a-js/sdk", whole: true },
      { registry: "pypi", name: "a2a-sdk", whole: true },
    ],
    talk: ["A2A protocol", "Agent2Agent"],
  },
  "web-bot-auth": {
    packages: [
      { registry: "npm", name: "web-bot-auth" },
      { registry: "crates", name: "web-bot-auth" },
    ],
    talk: ["Web Bot Auth"],
  },
  "agent-payments": { talk: ["Agent Payments Protocol"] },
  dpop: {
    signal: "dpop",
    packages: [{ registry: "npm", name: "dpop" }],
    talk: ["DPoP"],
  },
  "credential-broker": { talk: ["credential broker"] },
  // ---- planned: open issues, no page yet ----
  "tool-call-authorization": {
    planned: 72,
    title: "Authorizing a tool call with AuthZEN",
    basis: ["authzen"],
    talk: ["AuthZEN"],
  },
  "access-revocation": {
    planned: 73,
    title: "Withdrawing an agent’s access",
    basis: ["shared-signals", "rfc7009", "rfc7662"],
    // The revocation endpoint (RFC 7009) is in most servers' metadata, and is
    // not this flow: the page is to follow a withdrawal to the API that must
    // refuse, by Shared Signals. Nothing a server publishes says it does that.
    talk: ["Shared Signals Framework", "CAEP"],
  },
  "oauth-mtls": {
    planned: 74,
    title: "Certificate-bound access tokens with mTLS",
    basis: ["rfc8705"],
    signal: "mtlsBoundTokens",
    talk: ["RFC 8705", "certificate-bound access tokens"],
  },
  "biscuit-delegation": {
    planned: 75,
    title: "Delegating narrower permissions with Biscuit",
    basis: [],
    packages: [
      { registry: "crates", name: "biscuit-auth" },
      { registry: "npm", name: "@biscuit-auth/biscuit-wasm" },
      { registry: "pypi", name: "biscuit-python" },
    ],
    talk: ["Biscuit tokens", "biscuitsec", "Biscuit authorization"],
  },
  gnap: {
    planned: 76,
    title: "GNAP",
    basis: ["rfc9635"],
    packages: [{ registry: "crates", name: "gnap" }],
    talk: ["GNAP"],
  },
};

/**
 * Every published flow, read file by file as scripts/sources.mjs reads them:
 * flows/index.ts imports more than Node can load.
 */
export async function publishedFlows() {
  const dir = new URL("../../src/data/flows/", import.meta.url);
  const found = [];
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".ts") || file === "index.ts") continue;
    const mod = await import(new URL(file, dir).href);
    for (const v of Object.values(mod)) if (v?.slug && v?.steps) found.push(v);
  }
  return found;
}

/**
 * The flows of the record, published first in the site's order of files, each
 * with what the site already says of it and its plan from above.
 */
export async function recordFlows() {
  const { standards } = await import("../../src/data/standards.ts");
  const byId = new Map(standards.map((s) => [s.id, s]));
  const draftsOf = (ids) =>
    ids.flatMap((id) => {
      const s = byId.get(id);
      return s?.body === "IETF" && /^draft-/.test(s.ref)
        ? s.ref.split(" · ").map((name) => ({ id, name: name.trim() }))
        : [];
    });
  const published = (await publishedFlows()).map((f) => {
    const required = f.standards.filter((id) => f.roles?.[id] === "required");
    return {
      slug: f.slug,
      title: f.short ?? f.title,
      group: f.group,
      rating: f.maturity,
      drafts: draftsOf(required),
      ...(PLAN[f.slug] ?? {}),
    };
  });
  const planned = Object.entries(PLAN)
    .filter(([, p]) => p.planned)
    .map(([slug, p]) => ({ slug, drafts: draftsOf(p.basis), ...p }));
  for (const slug of Object.keys(PLAN))
    if (!PLAN[slug].planned && !published.some((f) => f.slug === slug))
      throw new Error(
        `the plan names "${slug}", which is not a published flow`,
      );
  return [...published, ...planned];
}
