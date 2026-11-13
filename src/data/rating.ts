/**
 * The rating rule, kept free of site data so it can be checked on its own
 * (test/unit/rating.test.mjs). The rule is stated for readers on the About page
 * under "How flows are rated".
 *
 *   - A flow takes the level of its least mature required reference.
 *   - A flow with no required reference has nothing to take a level from, and is
 *     not rated. It is not assumed stable for having no draft among its references.
 *   - Optional and background references never change it.
 *   - A reference whose role is not settled is not counted, and is not assumed
 *     to be optional or stable either. If requiring it would lower the level,
 *     the rating is provisional until the reference is classified.
 */
import type { FlowRating, Maturity, RefRole, StdStatus } from "./types";

/** Least mature first. */
const ORDER: Maturity[] = ["experimental", "emerging", "stable"];

/**
 * The level a reference's status shows by itself. A project, a platform or a
 * guidance document shows none: its tracker entry states a level, from what its
 * maintainers publish, or it stays unknown. A level stated on an entry of any
 * status is used in place of what the status shows: a published specification
 * can mark one of its features as still subject to change.
 */
export function levelOf(ref: {
  status: StdStatus;
  level?: Maturity;
}): Maturity | undefined {
  if (ref.level) return ref.level;
  if (ref.status === "rfc" || ref.status === "final") return "stable";
  if (ref.status === "wg-draft") return "emerging";
  if (ref.status === "draft") return "experimental";
  return undefined;
}

export interface RatedRef {
  id: string;
  role: RefRole;
  /** Undefined when no evidence of its maturity has been recorded. */
  level: Maturity | undefined;
}

export interface Rating {
  /** "unrated" when no reference is required. */
  level: FlowRating;
  /** True while a reference whose role is not settled could lower the level, or give an unrated flow one. */
  provisional: boolean;
  /**
   * Those references: role not settled, and less mature than the level or of unknown maturity.
   * For an unrated flow, every reference whose role is not settled.
   */
  pending: string[];
}

export function rate(refs: RatedRef[]): Rating {
  const required = refs.filter((r) => r.role === "required");
  if (required.length === 0) {
    // Nothing to rate from. Any reference whose role is not settled could, if it turned out
    // to be required, give the flow a rating, so each one keeps the result provisional.
    const pending = refs
      .filter((r) => r.role === "unresolved")
      .map((r) => r.id);
    return { level: "unrated", provisional: pending.length > 0, pending };
  }
  const ranks: number[] = [];
  const unknown: string[] = [];
  for (const r of required) {
    if (r.level === undefined) unknown.push(r.id);
    else ranks.push(ORDER.indexOf(r.level));
  }
  if (unknown.length > 0) {
    throw new Error(
      `required ${unknown.map((id) => `"${id}"`).join(", ")} has no recorded maturity level; state one on its tracker entry, with its evidence`,
    );
  }
  const rank = Math.min(...ranks);
  const pending = refs
    .filter(
      (r) =>
        r.role === "unresolved" &&
        (r.level === undefined || ORDER.indexOf(r.level) < rank),
    )
    .map((r) => r.id);
  return { level: ORDER[rank], provisional: pending.length > 0, pending };
}
