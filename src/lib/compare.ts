/**
 * What one flow's page says about another flow, word for word.
 *
 * A comparison under /compare/ is made from the two flows' own data. Its table
 * comes from their fields. Its answer to "which one?" comes from here: every
 * passage in one flow's text that links to the other. Nothing is rewritten, so
 * a comparison says only what a flow page already says.
 */
import type { Flow } from "../data/types";

export interface Passage {
  /** Where on the flow's page the passage is from, as that page heads it. */
  where: string;
  /** md-lite, as written in the flow's data. */
  text: string;
}

/** The paragraphs of an md-lite block that link to a flow. */
const naming = (text: string | undefined, slug: string): string[] =>
  (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.includes(`(/flows/${slug}/`));

/** Every passage in `from` that links to `about`, in the order its page gives them. */
export function passages(from: Flow, about: Flow): Passage[] {
  const slug = about.slug;
  const out: Passage[] = [];
  const add = (where: string, text: string | undefined) => {
    for (const p of naming(text, slug)) out.push({ where, text: p });
  };
  add("In its opening", from.summary);
  // The flow page says "Know X? This is the same, except that …". Said away
  // from that page, the sentence needs its two names.
  if (from.like?.flow === slug)
    out.push({
      where: "Where it says what it resembles",
      text: `${from.short} is the same as [${about.short}](/flows/${slug}/), except that ${from.like.except}`,
    });
  for (const x of from.fits) add("Under “Use it when”", x);
  from.steps.forEach((s, i) => {
    add(`In step ${i + 1}, “${s.title}”`, s.body);
  });
  add("Before its steps", from.illustrated?.steps);
  add(`Under “${from.comparison?.title}”`, from.comparison?.intro);
  add(`Under “${from.comparison?.title}”`, from.comparison?.after);
  for (const section of [
    ...(from.example ? [from.example] : []),
    ...(from.sections ?? []),
  ]) {
    add(`Under “${section.title}”`, section.intro);
    for (const part of section.parts)
      add(`Under “${section.title}”, in “${part.title}”`, part.body);
    add(`Under “${section.title}”`, section.after);
  }
  for (const x of from.watchOut) add("Under “Watch out for”", x);
  for (const note of from.notes ?? []) add(`Under “${note.title}”`, note.body);
  return out;
}
