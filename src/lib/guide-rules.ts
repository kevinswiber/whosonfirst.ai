/**
 * How the decision guide turns answers into recommendations and a name.
 *
 * The guide's script, the page for each situation and the tests all use these,
 * so a page built ahead of time says what the script would say for the same
 * answers. Nothing here reads the data: each function is given the rules it
 * applies. The imports are types only, so Node can load this file as it is.
 */
import type { Role, Rule, Situation } from "../data/guide";

/** question id → the answer chosen. A question not answered has no entry. */
export type Answers = Record<string, string>;

/** A rule that applies, with how many of its conditions the answers met. */
export type Chosen = Rule & { specificity: number };

/**
 * A rule matches when every condition whose question has been answered is
 * satisfied, and at least one of them has been answered. With `needAll`, every
 * question it names has to be answered too.
 */
export function matches(
  when: Record<string, string[]>,
  a: Answers,
  needAll = false,
): boolean {
  let hit = 0;
  for (const [q, values] of Object.entries(when)) {
    if (a[q] == null) {
      if (needAll) return false;
      continue;
    }
    if (!values.includes(a[q])) return false;
    hit++;
  }
  return hit > 0;
}

const RANK: Record<Role, number> = { start: 0, add: 1, consider: 2 };

/**
 * The flows the rules give for these answers, under each heading. A flow is
 * listed once: a "start" beats an "add" beats a "consider", and of two rules
 * under the same heading the one that matches more answers is kept, or the
 * earlier when they match as many.
 */
export function recommend(rules: Rule[], a: Answers): Record<Role, Chosen[]> {
  const best = new Map<string, Chosen>();
  for (const r of rules) {
    if (!matches(r.when, a)) continue;
    const specificity = Object.keys(r.when).filter((q) => a[q] != null).length;
    const prev = best.get(r.flow);
    if (
      !prev ||
      RANK[r.role] < RANK[prev.role] ||
      (RANK[r.role] === RANK[prev.role] && specificity > prev.specificity)
    ) {
      best.set(r.flow, { ...r, specificity });
    }
  }
  const groups: Record<Role, Chosen[]> = { start: [], add: [], consider: [] };
  for (const r of best.values()) groups[r.role].push(r);
  for (const list of Object.values(groups)) {
    list.sort(
      (x, y) =>
        y.specificity - x.specificity || (y.weight ?? 0) - (x.weight ?? 0),
    );
  }
  return groups;
}

/**
 * The situation these answers describe, once every question it is named from
 * has been answered. Before that there is none: a name is not a guess.
 */
export function situationFor<T extends Pick<Situation, "when">>(
  situations: T[],
  a: Answers,
): T | undefined {
  return situations.find((s) => matches(s.when, a, true));
}

/** The conditions of a rule that the answers have not yet settled. */
export function open(
  when: Record<string, string[]>,
  a: Answers,
): [string, string[]][] {
  return Object.entries(when).filter(([q]) => a[q] == null);
}
