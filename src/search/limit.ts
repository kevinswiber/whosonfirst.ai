/**
 * How many searches one address may make in a minute, as the build is told
 * it in SEARCH_RATE_LIMIT: the number, or a label, a colon and the number.
 *
 * The label is for where the value is a secret of a public log. GitHub masks
 * a secret’s value wherever a log has it, and a short number is in a log for
 * other reasons: in a date, in the digest of the passages. Each of those is
 * masked too, and comparing one with what the site publishes gives the number
 * away (seen 21 November 2026, with a limit of two digits). Behind a long
 * label of the operator’s own, the whole value is masked only where it is
 * written whole, and that is nowhere else.
 *
 * Returns undefined for anything that is not a whole number above zero,
 * alone or after such a label.
 */
export function searchLimit(value: string | undefined): number | undefined {
  const digits = /^(?:[^:\s]+:)?([1-9]\d*)$/.exec(value ?? "")?.[1];
  const limit = Number(digits);
  return digits && Number.isSafeInteger(limit) ? limit : undefined;
}
