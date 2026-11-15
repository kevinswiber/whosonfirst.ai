/**
 * A comparison: two flows that are asked about together, set against each
 * other. "DPoP or mTLS?"
 *
 * A comparison is written, as a lesson is. It answers the question first, says
 * what the two share, then asks the same questions of each and sets them out
 * point by point. It is in the site's own voice: it states what the two flows'
 * pages establish, and links to them where a reader wants the whole account.
 *
 * It simplifies and does not contradict. Every statement in a comparison has to
 * be one its two flows' pages already support, or carry its own source. The
 * listings in its figure are not written again: they are the flows' own, named
 * by the step they come from, so they cannot drift apart.
 */
import type { Actor, Verdict } from "../learn/types";

/** One flow's side of the figure. */
export interface Side {
  /** What travels along each arrow of the figure's cast: one per gap between actors. */
  hops: string[];
  /**
   * What the receiver has in front of it: listings from the flow's own steps,
   * by step number, counting from 1, each under a caption.
   */
  shows: { step: number; caption: string }[];
  /** One per question, in the figure's order. `note` is md-lite. */
  findings: { verdict?: Verdict; note: string }[];
  /** What follows from the answers. md-lite. */
  so: string;
}

/** One thing the two flows do differently. */
export interface Point {
  /** What is being compared, in a few words. */
  on: string;
  /** Each flow's side, in the order the flows are named. md-lite. */
  values: [string, string];
  /** The steps of each flow that show it, for a reader who wants to see it happen. */
  steps?: [number[], number[]];
}

export interface Comparison {
  /** The two flows, by slug, in the order the question names them. */
  flows: [a: string, b: string];
  /** The question as people ask it. The page's heading. */
  question: string;
  /** The answer, in two or three sentences. The page opens with it. md-lite. */
  answer: string;
  /** One sentence for a search result and a card. */
  description: string;
  /** What the choice is between, in a line, for the list of comparisons. */
  gist: string;
  /** What the two have in common, before what sets them apart. md-lite blocks. */
  shared: string;
  /**
   * What decides it: the conditions under which each is the one to choose, in
   * the order the flows are named. Each item completes "Choose it when".
   * md-lite.
   */
  choose: [string[], string[]];
  /** The same situation, met both ways, with the same questions asked of each. */
  figure: {
    /** Leads into the figure. md-lite. */
    intro: string;
    /** What varies, e.g. "The token is bound with". */
    legend: string;
    cast: Actor[];
    /** Heading over the answers, e.g. "How it holds up". */
    asks: string;
    /**
     * Asked so that "yes" is the answer a reader would want, as in every
     * figure on the site: a green mark is never bad news.
     */
    questions: string[];
    sides: [Side, Side];
  };
  /** Point by point, for a reader who has to build one of them. */
  points: Point[];
  /** A mistaken belief the comparison is often tangled up with, and the correction. md-lite. */
  mixup?: { belief: string; body: string };
}
