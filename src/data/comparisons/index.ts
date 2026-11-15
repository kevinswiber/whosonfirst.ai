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
import { dpopVsOauthMtls } from "./dpop-vs-oauth-mtls";
import type { Comparison } from "./types";

export type { Comparison, Point, Side } from "./types";

export const comparisons: Comparison[] = [dpopVsOauthMtls];

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
