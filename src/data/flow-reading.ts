import type { Flow } from "./types";

/** Validate authored reading aids without importing the site's flow registry. */
export function validateFlowReading(
  flow: Flow,
  knownSlugs: ReadonlySet<string>,
): void {
  const reading = flow.reading;
  if (!reading) return;
  const fail = (message: string): never => {
    throw new Error(`[${flow.slug}] reading: ${message}`);
  };
  const text = (value: string, name: string) => {
    if (!value?.trim()) fail(`${name} must not be empty`);
  };
  const brief = reading.brief;
  for (const name of [
    "authority",
    "benefit",
    "cost",
    "responsibilities",
  ] as const)
    text(brief[name], `brief.${name}`);
  if (!brief.prerequisites.length)
    fail("brief.prerequisites must not be empty");
  for (const value of brief.prerequisites) text(value, "brief prerequisite");

  const anchors = new Set([
    "main",
    "site-nav",
    "walkthrough",
    "fit",
    "standards",
  ]);
  for (let n = 1; n <= flow.steps.length; n++) anchors.add(`step-${n}`);
  if (flow.related.length) anchors.add("related");
  if (flow.comparison) anchors.add("comparison");
  if (flow.example) anchors.add("example");
  if (reading.decisions?.presentation === "table") anchors.add("decisions");
  if (
    flow.slug === "workload-identity-federation" &&
    (flow.watchOut.length || flow.notes?.length)
  )
    anchors.add("cautions");
  const addAnchor = (id: string, kind: string) => {
    text(id, `${kind} id`);
    if (/\s|#/.test(id)) fail(`invalid ${kind} id "${id}"`);
    if (anchors.has(id)) fail(`duplicate ${kind} id "${id}"`);
    anchors.add(id);
  };
  for (const section of flow.sections ?? []) addAnchor(section.id, "section");
  for (const note of flow.notes ?? []) {
    if (note.id !== undefined) addAnchor(note.id, "note");
  }
  for (const alternative of brief.alternatives) {
    text(alternative.condition, "alternative condition");
    text(alternative.label, "alternative label");
    const href = alternative.href;
    if (href.startsWith("#")) {
      if (!anchors.has(href.slice(1))) fail(`unknown local anchor "${href}"`);
    } else if (href.startsWith("/flows/")) {
      const match = /^\/flows\/([^/]+)\/$/.exec(href);
      if (!match || !knownSlugs.has(match[1]))
        fail(`unknown flow link "${href}"`);
    } else {
      try {
        if (new URL(href).protocol !== "https:")
          fail(`unsupported link "${href}"`);
      } catch {
        fail(`unsupported link "${href}"`);
      }
    }
  }

  if (reading.phases) {
    if (!reading.phases.length) fail("phases must not be empty");
    let next = 1;
    for (const phase of reading.phases) {
      text(phase.title, "phase title");
      text(phase.summary, "phase summary");
      if (!Number.isInteger(phase.start) || !Number.isInteger(phase.end))
        fail("phase bounds must be integers");
      if (phase.start !== next)
        fail(
          `phase gap or overlap before step ${phase.start}; expected ${next}`,
        );
      if (phase.end < phase.start || phase.end > flow.steps.length)
        fail("phase range is outside the steps");
      next = phase.end + 1;
    }
    if (next !== flow.steps.length + 1)
      fail("phase gap at the end of the flow");
  }
  const decisions = reading.decisions;
  if (!decisions) return;
  if (!["inline", "table"].includes(decisions.presentation))
    fail("unknown decisions presentation");
  if (decisions.items.length < (decisions.presentation === "table" ? 2 : 1))
    fail("table decisions need at least two items; inline decisions need one");
  for (const item of decisions.items) {
    if (
      !Number.isInteger(item.atStep) ||
      item.atStep < 1 ||
      item.atStep > flow.steps.length
    )
      fail(`decision atStep ${item.atStep} is outside the steps`);
    for (const name of ["title", "benefit", "cost"] as const)
      text(item[name], `decision ${name}`);
    if (item.mitigation)
      for (const name of [
        "action",
        "conditions",
        "addedCost",
        "remaining",
      ] as const)
        text(item.mitigation[name], `mitigation ${name}`);
    if (!item.sources.length) fail("decision sources must not be empty");
    for (const source of item.sources) {
      text(source.label, "source label");
      text(source.href, "source href");
    }
  }
}
