/**
 * How the decision guide turns answers into recommendations and a name.
 *
 * The guide's script, the page for each case and the tests all use these,
 * so a page built ahead of time says what the script would say for the same
 * answers. Nothing here reads the data: each function is given the rules it
 * applies. The imports are types only, so Node can load this file as it is.
 */
import type { Case, Role, Rule } from "../data/guide";

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
 * The case these answers describe, once every question it is named from
 * has been answered. Before that there is none: a name is not a guess.
 */
export function caseFor<T extends Pick<Case, "when">>(
  cases: T[],
  a: Answers,
): T | undefined {
  return cases.find((s) => matches(s.when, a, true));
}

/** The conditions of a rule that the answers have not yet settled. */
export function open(
  when: Record<string, string[]>,
  a: Answers,
): [string, string[]][] {
  return Object.entries(when).filter(([q]) => a[q] == null);
}

/**
 * Whether these conditions could still hold: no question that has been
 * answered was answered against them. Unlike `matches`, none of them has to
 * have been answered, so a rule about a question not yet asked is compatible.
 */
export function compatible(
  when: Record<string, string[]>,
  a: Answers,
): boolean {
  return Object.entries(when).every(
    ([q, values]) => a[q] == null || values.includes(a[q]),
  );
}

/**
 * Every "start" rule that could apply once the remaining questions are
 * answered, for a page that is read with only some of them settled.
 *
 * `recommend` answers for the answers it is given, and keeps one rule for each
 * flow. Read ahead of the other answers that loses two things: a rule about a
 * question not yet answered, and a second rule for the same flow that applies
 * to different answers. This keeps both. It leaves out only a rule that
 * another rule for the same flow replaces wherever it applies: one that holds
 * for every answer the first holds for, and that `recommend` would prefer,
 * because it matches more answers, or as many and is listed earlier.
 *
 * So for any way of answering the rest, the flows `recommend` starts with are
 * the flows of the rules here whose conditions hold, and the reason it gives
 * for each is one of theirs. test/unit/guide.test.mjs checks that against
 * every combination of answers.
 */
export function possibleStarts(rules: Rule[], a: Answers): Rule[] {
  const mine = rules.filter((r) => r.role === "start" && compatible(r.when, a));
  const size = (r: Rule) => Object.keys(r.when).length;
  // b holds wherever a does: each thing b still asks, a asks too, of no more answers
  const covers = (b: Rule, r: Rule) =>
    open(b.when, a).every(([q, values]) => {
      const narrower = r.when[q];
      return (
        a[q] == null &&
        narrower != null &&
        narrower.every((v) => values.includes(v))
      );
    });
  return mine.filter(
    (r, i) =>
      !mine.some(
        (b, j) =>
          b !== r &&
          b.flow === r.flow &&
          covers(b, r) &&
          (size(b) > size(r) || (size(b) === size(r) && j < i)),
      ),
  );
}
