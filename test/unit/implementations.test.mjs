import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { plain } from "../../scripts/quote-text.mjs";
import {
  deploymentOrganizations,
  publishProfile,
  validateProfiles,
} from "../../src/data/implementations/model.ts";
import { profiles } from "../../src/data/implementations/records.ts";
import { evidenceQualification } from "../../src/lib/implementations.ts";

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

test("compact qualifications retain early release wording and material limitations", () => {
  const entries = profiles.flatMap((profile) => [
    ...profile.implementations,
    ...profile.deployments,
  ]);
  const entry = (id) => entries.find((candidate) => candidate.id === id);
  assert.equal(evidenceQualification(entry("dpop-keycloak")), "");
  assert.equal(evidenceQualification(entry("mcp-keycloak")), "Experimental");
  assert.equal(
    evidenceQualification(entry("caep-google-workspace")),
    "Closed Beta",
  );
  assert.match(
    evidenceQualification(entry("gnap-rafiki")),
    /^Beta releases documented · Full RFC interoperability unverified/,
  );
  assert.match(
    evidenceQualification(entry("web-bot-auth-cloudflare")),
    /Rejects the format this guide illustrates/,
  );
  assert.equal(evidenceQualification(entry("a2a-eon")), "");
  assert.match(entry("a2a-eon").summary, /reported using A2A 0[.]3/);
  const invalid = dpop();
  invalid.implementations[0].qualification = " ";
  assert.throws(
    () => validateProfiles([invalid]),
    /qualification must not be empty/,
  );
});

test("an entry names parties its flow has, and a quote comes with its section", () => {
  const parties = { dpop: ["agent", "as", "api"] };
  assert.doesNotThrow(() => validateProfiles([dpop()], undefined, parties));
  const noParty = dpop();
  noParty.implementations[0].parties = [];
  assert.throws(() => validateProfiles([noParty]), /which parties/);
  const twice = dpop();
  twice.implementations[0].parties = ["as", "as"];
  assert.throws(() => validateProfiles([twice]), /which parties/);
  const stranger = dpop();
  stranger.implementations[0].parties = ["as", "mcp"];
  assert.throws(
    () => validateProfiles([stranger], undefined, parties),
    /dpop has no party mcp/,
  );
  const quoted = dpop();
  quoted.implementations[0].sources[0].quote = "DPoP is supported.";
  assert.throws(() => validateProfiles([quoted]), /quote is a short passage/);
  quoted.implementations[0].sources[0].section = "DPoP";
  assert.doesNotThrow(() => validateProfiles([quoted]));
  quoted.implementations[0].sources[0].quote = "x".repeat(301);
  assert.throws(() => validateProfiles([quoted]), /quote is a short passage/);
});

const run = (script, ...args) =>
  spawnSync(process.execPath, [`scripts/${script}`, ...args], {
    cwd: new URL("../..", import.meta.url),
    encoding: "utf8",
  });

test("the coverage report names every flow and every party software can fill", () => {
  const report = run("implementation-coverage.mjs");
  assert.equal(report.status, 0, report.stderr);
  for (const profile of profiles) {
    assert.ok(report.stdout.includes(`\n${profile.slug}\n`), profile.slug);
    for (const entry of profile.implementations)
      assert.ok(report.stdout.includes(entry.id), entry.id);
  }
  assert.equal(run("implementation-coverage.mjs", "no-such-flow").status, 1);
  assert.match(
    run("implementation-coverage.mjs", "--products").stdout,
    /^Keycloak \(Keycloak\)\n(?: {4}\S.*\n){2,}/m,
  );
});

test("a worksheet is refused for a used id, an unknown party or a source with no quote", () => {
  const dir = mkdtempSync(join(tmpdir(), "worksheet-"));
  const file = join(dir, "dpop.json");
  const entry = dpop().implementations[0];
  const sheet = (change) => {
    const candidate = structuredClone(entry);
    candidate.id = "dpop-candidate";
    for (const source of candidate.sources) {
      source.section = "DPoP";
      source.quote = "DPoP is supported.";
    }
    change(candidate);
    writeFileSync(
      file,
      JSON.stringify({
        flow: "dpop",
        checkedOn: "2026-11-14",
        implementations: [candidate],
      }),
    );
    return run("implementation-check.mjs", "--emit", file);
  };
  try {
    const ok = sheet(() => {});
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /id: "dpop-candidate"/);
    const used = sheet((c) => {
      c.id = entry.id;
    });
    assert.equal(used.status, 1);
    assert.match(used.stderr, /already in the records/);
    const stranger = sheet((c) => {
      c.parties = ["mcp"];
    });
    assert.equal(stranger.status, 1);
    assert.match(stranger.stderr, /dpop has no party mcp/);
    const unquoted = sheet((c) => {
      delete c.sources[0].quote;
    });
    assert.equal(unquoted.status, 1);
    assert.match(unquoted.stderr, /needs a quote and its section/);
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("a quote copied from a page is found in the HTML or Markdown the server sends", () => {
  const quote = plain("The client uses the device code flow, by default.");
  for (const page of [
    "<p>The client uses the <a href='/x'>device code</a> flow, by default.</p>",
    "The client uses the [device code](https://example.com/x) flow, by default.",
    "<p>The client uses the <!--[--><code>device code</code><!--]--> flow, by default.</p>",
    "The client uses the `device code` flow , by default.",
  ])
    assert.ok(plain(page).includes(quote), page);
  assert.ok(
    plain("A value is 1 < 2 and the client uses it > once.").includes(
      plain("1 < 2 and the client uses it > once"),
    ),
    "a < in Markdown text is text, not a tag",
  );
  assert.ok(plain("It’s “quoted”").includes(plain(`It's "quoted"`)));
});

test("a party called generic is one the flow has, and the coverage report does not count it", () => {
  const parties = { dpop: ["agent", "as", "api"] };
  const profile = dpop();
  profile.genericParties = ["api"];
  assert.doesNotThrow(() => validateProfiles([profile], undefined, parties));
  profile.genericParties = ["third"];
  assert.throws(
    () => validateProfiles([profile], undefined, parties),
    /dpop: has no party third/,
  );
  const report = run("implementation-coverage.mjs", "url-elicitation").stdout;
  assert.match(report, /Third-party service \(third\) +generic/);
});
