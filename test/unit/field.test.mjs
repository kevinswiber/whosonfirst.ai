import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  deploymentOrganizations,
  publishProfile,
  validateProfiles,
} from "../../src/data/field/model.ts";
import { profiles } from "../../src/data/field/records.ts";

const dpop = () => structuredClone(profiles.find((p) => p.slug === "dpop"));

test("the reviewed evidence has sources, scope, valid dates and event links", () => {
  assert.doesNotThrow(() => validateProfiles(profiles));
  const profile = dpop();
  profile.slug = "misspelled-flow";
  assert.throws(
    () =>
      validateProfiles(
        [profile],
        profiles.map((p) => p.slug),
      ),
    /no published flow/,
  );
  profile.slug = "dpop";
  profile.implementations[0].sources = [];
  assert.throws(() => validateProfiles([profile]), /claim needs a source/);
});

test("only accepted deployments count operators, regardless of observed support or project totals", () => {
  const profile = dpop();
  const report = structuredClone(profile.deployments[0]);
  report.id = "second-account";
  report.organization = ` ${report.organization.toUpperCase()} `;
  const pending = structuredClone(report);
  pending.id = "pending";
  pending.organization = "Another operator";
  pending.review.state = "pending";
  profile.deployments.push(report, pending);
  const observation = {
    id: "panel-support",
    kind: "observation",
    measure: "advertised-support",
    unit: "panel members",
    numerator: 7,
    denominator: 82,
    population: "A convenience panel",
    summary: "Advertised support only",
    limits: "Does not establish use",
    sources: structuredClone(report.sources),
    review: structuredClone(report.review),
  };
  profile.observations.push(observation, {
    ...observation,
    id: "project-count",
    measure: "reported-count",
    unit: "projects",
    numerator: 13000,
    denominator: undefined,
  });
  profile.events.push({
    id: "pending-event",
    kind: "evidence-added",
    date: profile.reviewedOn,
    summary: "Candidate evidence",
    evidenceIds: [report.id, pending.id],
  });
  validateProfiles([profile]);
  const published = publishProfile(profile);
  assert.equal(deploymentOrganizations(published), 1);
  assert.equal(published.observations[1].unit, "projects");
  assert.equal(published.observations[1].numerator, 13000);
  assert.ok(!published.deployments.some((p) => p.id === "pending"));
  assert.ok(!published.events.some((p) => p.id === "pending-event"));
  profile.deployments.push({ ...observation, id: "misclassified-observation" });
  assert.throws(() => validateProfiles([profile]), /not deployment evidence/);
});

test("release and report events need the right dated evidence", () => {
  const profile = dpop();
  const release = profile.events.find((e) => e.kind === "release");
  const date = release.date;
  release.date = "2024-01-01";
  assert.throws(
    () => validateProfiles([profile]),
    /matching dated implementation/,
  );
  release.date = date;
  release.kind = "report-published";
  assert.throws(() => validateProfiles([profile]), /matching dated deployment/);
  release.kind = "release";
  release.evidenceIds = [profile.deployments[0].id];
  assert.throws(
    () => validateProfiles([profile]),
    /matching dated implementation/,
  );
  release.evidenceIds = ["missing"];
  assert.throws(
    () => validateProfiles([profile]),
    /unknown evidence reference/,
  );
});

test("re-review preserves earlier evidence-added dates and rejects future events", () => {
  const profile = dpop();
  const original = profile.events.find((e) => e.kind === "evidence-added").date;
  profile.reviewedOn = "2026-12-01";
  profile.implementations[0].review.checkedOn = profile.reviewedOn;
  validateProfiles([profile]);
  assert.equal(
    publishProfile(profile).events.find((e) => e.kind === "evidence-added")
      .date,
    original,
  );
  profile.events[0].date = "2027-01-01";
  assert.throws(
    () => validateProfiles([profile]),
    /event follows the profile review/,
  );
});

test("bad source addresses and inherited label names are rejected", () => {
  const badSource = dpop();
  badSource.implementations[0].sources[0].url = "https://";
  assert.throws(() => validateProfiles([badSource]), /public HTTPS source/);
  const badLabel = dpop();
  badLabel.deployments[0].attribution = "toString";
  assert.throws(
    () => validateProfiles([badLabel]),
    /attribute the deployment report/,
  );
  const badEvent = dpop();
  badEvent.events[0].kind = "constructor";
  assert.throws(() => validateProfiles([badEvent]), /name and date the event/);
});
