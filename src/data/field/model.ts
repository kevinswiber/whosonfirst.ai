/** Evidence about implementations and deployments; never an adoption score. */
export interface FieldSource {
  title: string;
  url: string;
  publisher: string;
  /** Publication date, only when the source states it. Not a deployment date. */
  publishedOn?: string;
}

export interface EvidenceReview {
  state: "accepted" | "pending" | "excluded";
  checkedOn: string;
  rationale: string;
}

interface Evidence {
  id: string;
  /** Short, source-backed description shared by cards, the directory and the full record. */
  summary: string;
  limits: string;
  /** Material condition not already stated in the summary, also shown in compact views. */
  qualification?: string;
  sources: FieldSource[];
  review: EvidenceReview;
}

export interface ImplementationEvidence extends Evidence {
  kind: "implementation";
  organization: string;
  product: string;
  role: string;
  release: {
    stage: "supported" | "preview" | "experimental" | "unspecified";
    label: string;
    detail: string;
  };
}

export interface DeploymentEvidence extends Evidence {
  kind: "deployment";
  organization: string;
  setting: string;
  attribution: "operator-report" | "vendor-report" | "project-report";
}

export interface ObservationEvidence extends Evidence {
  kind: "observation";
  measure: "advertised-support" | "reported-count";
  unit: "panel members" | "projects" | "endpoints" | "implementations";
  numerator: number;
  denominator?: number;
  population: string;
  /** Date of the underlying observation; absent when the source does not date it. */
  observedOn?: string;
}

export interface FieldEvent {
  id: string;
  kind: "report-published" | "release" | "evidence-added";
  date: string;
  summary: string;
  evidenceIds: string[];
}

export interface FieldProfile {
  slug: string;
  reviewedOn: string;
  scope: string;
  searchNote: string;
  implementations: ImplementationEvidence[];
  deployments: DeploymentEvidence[];
  observations: ObservationEvidence[];
  events: FieldEvent[];
}

export const EVENT_LABEL = {
  "report-published": "Report published",
  release: "Release",
  "evidence-added": "Evidence added",
} as const;

export const ATTRIBUTION_LABEL = {
  "operator-report": "Operator’s account",
  "vendor-report": "Vendor’s account",
  "project-report": "Project’s account",
} as const;

const dateIsValid = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;

/** Refuse ambiguous records at build time, before a template can display them. */
export function validateProfiles(
  profiles: FieldProfile[],
  publishedSlugs?: string[],
): void {
  const slugs = new Set<string>();
  const ids = new Set<string>();
  const require = (ok: unknown, message: string) => {
    if (!ok) throw new Error(`In the field: ${message}`);
  };
  for (const profile of profiles) {
    require(!slugs.has(profile.slug), `duplicate flow ${profile.slug}`);
    slugs.add(profile.slug);
    if (publishedSlugs)
      require(publishedSlugs.includes(
        profile.slug,
      ), `${profile.slug}: no published flow`);
    require(dateIsValid(
      profile.reviewedOn,
    ), `${profile.slug}: invalid review date`);
    require(profile.scope.trim() &&
      profile.searchNote.trim(), `${profile.slug}: describe review scope`);
    const evidence = [
      ...profile.implementations,
      ...profile.deployments,
      ...profile.observations,
    ];
    for (const entry of evidence) {
      require(!ids.has(entry.id), `duplicate evidence ${entry.id}`);
      ids.add(entry.id);
      require(entry.sources.length > 0, `${entry.id}: a claim needs a source`);
      if (entry.qualification !== undefined)
        require(entry.qualification.trim(), `${entry.id}: qualification must not be empty`);
      require(entry.summary.trim() &&
        entry.limits.trim(), `${entry.id}: describe claim and limits`);
      require(["accepted", "pending", "excluded"].includes(
        entry.review.state,
      ), `${entry.id}: unknown review state`);
      require(dateIsValid(
        entry.review.checkedOn,
      ), `${entry.id}: invalid checked date`);
      require(entry.review.rationale.trim(), `${entry.id}: explain the review decision`);
      require(entry.review.checkedOn <=
        profile.reviewedOn, `${entry.id}: checked after profile review`);
      for (const source of entry.sources) {
        require(source.title.trim() &&
          source.publisher.trim(), `${entry.id}: identify the source`);
        let address: URL | undefined;
        try {
          address = new URL(source.url);
        } catch {
          /* rejected below */
        }
        require(address?.protocol === "https:" &&
          address.hostname &&
          !address.username &&
          !address.password, `${entry.id}: use a public HTTPS source`);
        if (source.publishedOn)
          require(dateIsValid(
            source.publishedOn,
          ), `${entry.id}: invalid publication date`);
      }
    }
    for (const entry of profile.implementations) {
      require(entry.kind ===
        "implementation", `${entry.id}: implementation evidence required`);
      require(entry.organization.trim() &&
        entry.product.trim() &&
        entry.role.trim(), `${entry.id}: name product and role`);
      require(["supported", "preview", "experimental", "unspecified"].includes(
        entry.release.stage,
      ), `${entry.id}: unknown release stage`);
      require(entry.release.label.trim() &&
        entry.release.detail.trim(), `${entry.id}: explain release wording`);
    }
    for (const entry of profile.deployments) {
      require(entry.kind ===
        "deployment", `${entry.id}: advertised support is not deployment evidence`);
      require(entry.organization.trim() &&
        entry.setting.trim(), `${entry.id}: name operator and setting`);
      require(Object.hasOwn(
        ATTRIBUTION_LABEL,
        entry.attribution,
      ), `${entry.id}: attribute the deployment report`);
    }
    for (const entry of profile.observations) {
      require(entry.kind ===
        "observation", `${entry.id}: observation evidence required`);
      require(["advertised-support", "reported-count"].includes(
        entry.measure,
      ), `${entry.id}: unknown measure`);
      require([
        "panel members",
        "projects",
        "endpoints",
        "implementations",
      ].includes(entry.unit), `${entry.id}: preserve count units`);
      require(Number.isSafeInteger(entry.numerator) &&
        entry.numerator >= 0, `${entry.id}: invalid count`);
      require(entry.population.trim(), `${entry.id}: describe the population`);
      if (entry.denominator !== undefined)
        require(Number.isSafeInteger(entry.denominator) &&
          entry.denominator > 0 &&
          entry.numerator <=
            entry.denominator, `${entry.id}: invalid denominator`);
      if (entry.observedOn)
        require(dateIsValid(
          entry.observedOn,
        ), `${entry.id}: invalid observation date`);
    }
    const eventIds = new Set<string>();
    for (const event of profile.events) {
      require(!eventIds.has(
        event.id,
      ), `${profile.slug}: duplicate event ${event.id}`);
      eventIds.add(event.id);
      require(Object.hasOwn(EVENT_LABEL, event.kind) &&
        dateIsValid(event.date), `${event.id}: name and date the event`);
      require(event.summary.trim() &&
        event.evidenceIds.length >
          0, `${event.id}: explain and support the event`);
      const related = event.evidenceIds.map((id) =>
        evidence.find((entry) => entry.id === id),
      );
      require(related.every(
        Boolean,
      ), `${event.id}: unknown evidence reference`);
      require(event.date <=
        profile.reviewedOn, `${event.id}: event follows the profile review`);
      if (event.kind !== "evidence-added") {
        const kind = event.kind === "release" ? "implementation" : "deployment";
        require(related.some(
          (entry) =>
            entry?.kind === kind &&
            entry.sources.some((source) => source.publishedOn === event.date),
        ), `${event.id}: ${event.kind} needs matching dated ${kind} evidence`);
      }
    }
  }
}

/** Only accepted evidence reaches readers. Pending/excluded research stays private to review. */
export function publishProfile(profile: FieldProfile): FieldProfile {
  const implementations = profile.implementations.filter(
    (entry) => entry.review.state === "accepted",
  );
  const deployments = profile.deployments.filter(
    (entry) => entry.review.state === "accepted",
  );
  const observations = profile.observations.filter(
    (entry) => entry.review.state === "accepted",
  );
  const ids = new Set(
    [...implementations, ...deployments, ...observations].map(
      (entry) => entry.id,
    ),
  );
  return {
    ...profile,
    implementations,
    deployments,
    observations,
    events: profile.events.filter((event) =>
      event.evidenceIds.every((id) => ids.has(id)),
    ),
  };
}

/** A deployment count can only be derived from accepted deployment reports. */
export function deploymentOrganizations(profile: FieldProfile): number {
  return new Set(
    profile.deployments
      .filter((entry) => entry.review.state === "accepted")
      .map((entry) => entry.organization.trim().toLowerCase()),
  ).size;
}

export function fieldDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
