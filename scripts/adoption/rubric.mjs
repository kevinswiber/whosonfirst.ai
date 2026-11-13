// The adoption rubric, kept free of collected data so it can be checked on its
// own (test/unit/adoption.test.mjs). docs/adoption/README.md states it for
// readers; if the two disagree, this file is what the numbers were made with.
//
// Every flow is asked the same two questions, and each answer is graded 0 to 4
// against the same thresholds. What differs from flow to flow is the
// instrument: a count in metadata that servers publish for one, what
// implementers document for another. The instrument is reported beside the
// grade (`basis`), so a grade reached by measurement does not read the same as
// one reached from four web pages.
//
//   Supply  Can you get it?         Organizations that offer an implementation.
//   Use     Is anyone running it?   Organizations that run it, by name or as a
//                                   share of a population that was counted.
//
// A third reading, attention, is kept apart. It does not enter the score.

/** What each grade of supply means. */
export const SUPPLY = [
  "No implementation recorded",
  "One organization, or only the specification’s own authors",
  "Two or more organizations, at any release stage",
  "Three or more organizations with a generally available release",
  "Ten or more organizations with a generally available release",
];

/** What each grade of use means. */
export const USE = [
  "No use recorded",
  "One named organization runs it, or it was seen at least once in a count",
  "Three or more named organizations, or 5% of a counted population",
  "Ten or more named organizations, or 20% of a counted population",
  "Thirty or more named organizations, or half of a counted population",
];

/** The thresholds of use, by grade: named organizations, and percent of a population. */
const USE_NAMED = [0, 1, 3, 10, 30];
const USE_SHARE = [0, 0, 5, 20, 50];
/** Generally available organizations needed for supply grades 3 and 4. */
const SUPPLY_GA = [3, 10];

const LEVELS = ["On paper", "Early", "Available", "Established", "Common"];
export const LEVEL_MEANS = {
  "On paper": "A specification, and no implementation or use recorded",
  Early:
    "Someone has built it or runs it, and not yet three independent releases",
  Available:
    "Three independent releases to choose from, or several organizations running it",
  Established:
    "Three independent releases, and run by ten organizations or a fifth of those counted",
  Common:
    "Three independent releases, and run by half of those counted, or thirty by name",
};

const clamp = (x) => Math.max(0, Math.min(1, x));
const names = (list) =>
  new Set(list.map((n) => String(n).trim().toLowerCase()));

/**
 * @param {{ org: string, stage: "ga"|"preview"|"experimental"|"unstated"|"announced", authorOwn?: boolean|null }[]} implementers
 *   One per organization. An announcement is not an implementation and is not counted.
 * @param {{ count: number, ga: boolean }[]} [lists]
 *   Public lists that count implementations, such as a certification listing.
 *   `ga` says whether what the list counts is released software.
 */
export function supply(implementers, lists = []) {
  const real = implementers.filter((i) => i.stage !== "announced");
  const orgs = names(real.map((i) => i.org));
  const released = names(
    real.filter((i) => i.stage === "ga").map((i) => i.org),
  );
  const listed = Math.max(0, ...lists.map((l) => l.count));
  const listedGa = Math.max(
    0,
    ...lists.filter((l) => l.ga).map((l) => l.count),
  );
  const any = Math.max(orgs.size, listed);
  const ga = Math.max(released.size, listedGa);
  // An implementation by the people who wrote the specification shows it can
  // be built. It does not show that anyone else chose to.
  const onlyAuthors =
    real.length > 0 && listed === 0 && real.every((i) => i.authorOwn === true);

  let grade = 0;
  if (any >= 1) grade = 1;
  if (any >= 2 && !onlyAuthors) grade = 2;
  if (grade === 2 && ga >= SUPPLY_GA[0]) grade = 3;
  if (grade === 3 && ga >= SUPPLY_GA[1]) grade = 4;

  let toward = 0;
  if (grade === 2) toward = ga / SUPPLY_GA[0];
  if (grade === 3) toward = (ga - SUPPLY_GA[0]) / (SUPPLY_GA[1] - SUPPLY_GA[0]);
  return {
    grade,
    position: grade + (grade < 4 ? clamp(toward) * 0.999 : 0),
    means: SUPPLY[grade],
    organizations: any,
    generallyAvailable: ga,
    onlyAuthors,
  };
}

/**
 * @param {string[]} named Organizations known by name to run it, from any source.
 * @param {{ source: string, n: number, of: number }[]} [counted]
 *   Counts of a population: how many of how many. The best share is graded.
 * @param {{ count: number }[]} [lists] Public lists that count organizations running it.
 */
export function use(named, counted = [], lists = []) {
  const n = Math.max(names(named).size, ...lists.map((l) => l.count), 0);
  const shares = counted.filter((c) => c.of > 0).map((c) => (100 * c.n) / c.of);
  const share = shares.length ? Math.max(...shares) : undefined;
  const seen = counted.some((c) => c.n > 0);

  let grade = 0;
  for (let g = 1; g <= 4; g++) {
    const byName = n >= USE_NAMED[g];
    const byShare =
      g === 1 ? seen : share !== undefined && share >= USE_SHARE[g];
    if (byName || byShare) grade = g;
  }
  let toward = 0;
  if (grade > 0 && grade < 4) {
    const along = (value, steps) =>
      (value - steps[grade]) / (steps[grade + 1] - steps[grade]);
    toward = Math.max(
      along(n, USE_NAMED),
      share === undefined ? 0 : along(share, USE_SHARE),
    );
  }
  return {
    grade,
    position: grade + (grade < 4 ? clamp(toward) * 0.999 : 0),
    means: USE[grade],
    named: n,
    ...(share === undefined ? {} : { share: Math.round(share * 10) / 10 }),
  };
}

/** The word for where a flow stands, from the two grades. */
export function level(supplyGrade, useGrade) {
  if (supplyGrade >= 3 && useGrade >= 4) return LEVELS[4];
  if (supplyGrade >= 3 && useGrade >= 3) return LEVELS[3];
  if (supplyGrade >= 3 || useGrade >= 2) return LEVELS[2];
  if (supplyGrade >= 1 || useGrade >= 1) return LEVELS[1];
  return LEVELS[0];
}
export const levelRank = (word) => LEVELS.indexOf(word);

/**
 * A grade's position as a score out of 100: 25 for each grade, and the rest
 * for how far along the flow is toward the next. Supply and use each have one.
 * A score moves when a piece of evidence is added or lapses, and for no other
 * reason.
 *
 * The two are not added. A sum hides the gap between what is offered and what
 * is run, which is the most useful thing here, and when it was tried it put
 * flows in an order their levels contradicted: docs/adoption/decisions.md.
 */
export const score = (position) => Math.round(25 * position);

/**
 * How the answer was reached. A grade from a count with a denominator is
 * "measured". One from at least three checked sources is "documented". With
 * fewer, the grade stands and is marked "thin".
 */
export function basis({ counted = 0, checkedSources = 0 }) {
  if (counted > 0 && checkedSources >= 3) return "measured and documented";
  if (counted > 0) return "measured";
  if (checkedSources >= 3) return "documented";
  if (checkedSources > 0) return "thin";
  return "none";
}

// ---- attention: kept apart, and never part of the score ----

const TALK = [0, 1, 10, 50, 200]; // mentions in twelve months
const DOWNLOADS = [0, 1, 10_000, 1_000_000, 10_000_000]; // in the last whole month
const gradeOn = (value, steps) => {
  let g = 0;
  for (let i = 1; i < steps.length; i++) if (value >= steps[i]) g = i;
  return g;
};

/**
 * @param {{ last: number, before: number }} [talk] Mentions in the last twelve months, and the twelve before.
 * @param {{ byMonth: number[] }[]} [libraries] Monthly downloads of each library that is this mechanism, oldest first.
 */
export function attention(talk, libraries = []) {
  const readings = [];
  const ratios = [];
  if (talk) {
    readings.push({ source: "talk", grade: gradeOn(talk.last, TALK) });
    // Too few mentions to say which way they are going.
    if (talk.last + talk.before >= 10)
      ratios.push(
        talk.before === 0 ? Number.POSITIVE_INFINITY : talk.last / talk.before,
      );
  }
  const usable = libraries.filter((l) => l.byMonth.length > 0);
  if (usable.length) {
    const lastMonth = usable.reduce((sum, l) => sum + l.byMonth.at(-1), 0);
    readings.push({
      source: "downloads",
      grade: gradeOn(lastMonth, DOWNLOADS),
    });
    for (const l of usable) {
      if (l.byMonth.length < 6) continue;
      const sum = (a) => a.reduce((x, y) => x + y, 0);
      const before = sum(l.byMonth.slice(-6, -3));
      if (before > 0) ratios.push(sum(l.byMonth.slice(-3)) / before);
    }
  }
  if (!readings.length) return { grade: null, direction: null };
  const sorted = [...ratios].sort((a, b) => a - b);
  const mid = sorted.length
    ? sorted[Math.floor((sorted.length - 1) / 2)]
    : undefined;
  const direction =
    mid === undefined
      ? null
      : mid >= 1.25
        ? "rising"
        : mid <= 0.8
          ? "falling"
          : "steady";
  const top = readings.reduce((a, b) => (b.grade > a.grade ? b : a));
  return { grade: top.grade, from: top.source, direction };
}
