/**
 * The comparisons under /compare/, in the order their index lists them.
 *
 * Each is a file beside this one, written as a lesson is: see ./types.ts for
 * what one has to hold. The list is short and chosen. Every pair of flows
 * could be given a page, and most of those pages would answer a question
 * nobody asks.
 */
import { flow } from "../flows";
import type { Flow } from "../types";
import { cibaVsDeviceAuthorization } from "./ciba-vs-device-authorization";
import { clientCredentialsVsWorkloadIdentityFederation } from "./client-credentials-vs-workload-identity-federation";
import { dpopVsOauthMtls } from "./dpop-vs-oauth-mtls";
import { mcpAuthorizationVsAuthorizationCodePkce } from "./mcp-authorization-vs-authorization-code-pkce";
import { tokenExchangeVsIdentityChaining } from "./token-exchange-vs-identity-chaining";
import type { Comparison } from "./types";

export type { Comparison, Point, Side } from "./types";

export const comparisons: Comparison[] = [
  dpopVsOauthMtls,
  cibaVsDeviceAuthorization,
  clientCredentialsVsWorkloadIdentityFederation,
  tokenExchangeVsIdentityChaining,
  mcpAuthorizationVsAuthorizationCodePkce,
];

/** A comparison's address under /compare/: its two flows' slugs with "-vs-" between. */
export const comparisonSlug = (c: Comparison): string => c.flows.join("-vs-");

/** The two flows of a comparison, in the order it names them. */
export const flowsOf = (c: Comparison): [Flow, Flow] => [
  flow(c.flows[0]),
  flow(c.flows[1]),
];

/** The comparisons a flow is one half of. */
export const comparisonsOf = (f: Flow): Comparison[] =>
  comparisons.filter((c) => c.flows.includes(f.slug));
