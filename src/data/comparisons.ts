/**
 * Pairs of flows that readers ask about together: “DPoP or mTLS?”, “CIBA or
 * the device flow?”. Each pair has a page under /compare/ that sets the two
 * flows side by side.
 *
 * A pair is two slugs and nothing else, on purpose. Its page is made entirely
 * from the two flows' own data: the facts in the table, and every passage on
 * either flow's page that names the other, word for word. So a comparison
 * cannot say what the flow pages do not, and it changes when they do.
 *
 * That is also what decides which pairs can be listed. At least one of the two
 * flows has to say something about the other in its own text, or the build
 * refuses the pair: without that there is a table and nothing that answers the
 * question. To add a pair whose flows do not mention each other, write the
 * comparison on a flow's page first, as a note or in its summary, with a link
 * to the other flow.
 *
 * The list is short and chosen. Every pair of flows could be given a page, and
 * most of those pages would answer a question nobody asks.
 */
import { flow } from "./flows";
import type { Flow } from "./types";

/** The two flows of a pair, by slug, in the order they are named. */
export type Pair = [a: string, b: string];

export const pairs: Pair[] = [
  ["dpop", "oauth-mtls"],
  ["ciba", "device-authorization"],
  ["token-exchange", "identity-chaining"],
  ["identity-chaining", "cross-app-access"],
  ["mcp-authorization", "authorization-code-pkce"],
  ["device-authorization", "authorization-code-pkce"],
  ["step-up-authorization", "ciba"],
  ["client-credentials", "workload-identity-federation"],
  ["spiffe-workload-identity", "wimse-workload-tokens"],
  ["credential-broker", "workload-identity-federation"],
  ["biscuit-delegation", "token-exchange"],
  ["gnap", "authorization-code-pkce"],
];

export interface Comparison {
  /** The page's address under /compare/: the two slugs with "-vs-" between. */
  slug: string;
  a: Flow;
  b: Flow;
}

export const comparisons: Comparison[] = pairs.map(([a, b]) => ({
  slug: `${a}-vs-${b}`,
  a: flow(a),
  b: flow(b),
}));

/** The comparisons a flow is one half of. */
export const comparisonsOf = (f: Flow): Comparison[] =>
  comparisons.filter((c) => c.a === f || c.b === f);

/** The other flow of a comparison. */
export const otherOf = (c: Comparison, f: Flow): Flow =>
  c.a === f ? c.b : c.a;
