/**
 * Worked examples: one situation, a starting design, and the variations and
 * build paths written up for it.
 *
 * An example is an authored design. What a vendor documents, what this site
 * composed from documented parts, and what is still to be designed are kept
 * apart by the evidence labels below. Nothing in an example has been run.
 */
import type { Role } from "../types";

export interface Source {
  label: string;
  href: string;
}

export interface Party {
  id: string;
  label: string;
  /** Second line under the label. */
  sub?: string;
  role: Role;
}

/** One step of a design: a message between two parties, or a note on one when `to` is absent. */
export interface DesignStep {
  from: string;
  to?: string;
  /** The label on the diagram. Arrow labels wrap onto two lines. */
  label: string;
  /** The same step in a full sentence, for the numbered list. */
  detail?: string;
  /** A flow page that explains this step: a slug, with an optional #anchor. */
  flow?: string;
}

export interface Design {
  /**
   * Core: the starting design. Addition: something added to it, which leaves
   * it as it is. Alternative: a different core, which replaces it.
   */
  kind: "Core" | "Addition" | "Alternative";
  title: string;
  parties: Party[];
  steps: DesignStep[];
  note?: string;
}

/**
 * How well a combination is supported, which is a different question from
 * whether each part is.
 *
 * - capability: one component's own documentation says it does this job
 * - together: a vendor or project documents these components working together
 * - composed: this site put documented components together; nobody documents the combination
 * - open: not established, or still to be designed. The label says which part.
 */
export type EvidenceLevel = "capability" | "together" | "composed" | "open";

export interface EvidenceChip {
  level: EvidenceLevel;
  /** Names the part the label refers to. Required when the level is "open". */
  label?: string;
}

export interface Evidence {
  chips: EvidenceChip[];
  text: string;
}

export const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  capability: "Capability documented",
  together: "Documented together",
  composed: "Composed here",
  open: "Not established",
};

/** Whose job a responsibility is. Only "Platform" names a documented capability. */
export type Owner =
  | "Platform"
  | "Your configuration"
  | "Your code"
  | "Your policy"
  | "Your operations";

export interface Cell {
  /** The short answer: what does the job, or what it is. */
  who?: string;
  /** Running text, when there is no short answer. */
  text?: string;
  note?: string;
  /** Not established, or yours to design and verify. */
  gap?: boolean;
  /** A vendor's release stage, as its own page states it. */
  stage?: string;
  sources?: Source[];
}

/** A job someone has to do, and who does it on each build path. */
export interface Responsibility {
  job: string;
  owner: Owner;
  /** One cell for each build path, or one under "all" for every path. */
  cells: Record<string, Cell>;
}

export interface BuildPath {
  label: string;
  /** Completes "Fits when: …". */
  fits: string;
}

/** A short heading and the sentence under it. */
export type Pair = [title: string, text: string];

/** A design to build: the starting design, or one variation of it. */
export interface Case {
  id: string;
  /** Completes "Building: …". */
  name: string;
  /** The build paths written up for this case. */
  paths: string[];
  /** A case whose conditions and setup links come first: its build is a superset. */
  extends?: string;
  /** Which row sets apply, in order. */
  rows: string[];
  /**
   * The label describes the whole combination on that path, unresolved parts
   * included.
   */
  evidence: Record<string, Evidence>;
  /** Limits and requirements, for each path or under "all". */
  conditions: Record<string, string[]>;
  setup: Record<string, Source[]>;
  /** One observable check that the boundary holds. */
  check: string;
}

export interface SupportExample {
  slug: string;
  title: string;
  paths: Record<string, BuildPath>;
  designs: Record<string, Design>;
  rows: Record<string, Responsibility[]>;
  cases: Case[];
}

/** A block of the invoice example: the starting design, an addition or an alternative. */
export interface Block {
  /** The changed fact, as the reader would say it. */
  label?: string;
  design: Design;
  delta?: Pair[];
  simpler: Pair[];
  check: string;
  rows: Responsibility[];
  /** Absent when no build path is written up for the block. */
  evidence?: Record<string, Evidence>;
  conditions?: Record<string, string[]>;
  setup?: Record<string, Source[]>;
}

export interface InvoiceExample {
  slug: string;
  title: string;
  paths: Record<string, BuildPath>;
  blocks: Record<"own" | "key" | "approval" | "accountant", Block>;
}
