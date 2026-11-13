// The adoption rubric in scripts/adoption/rubric.mjs, and the reading of
// metadata in scripts/adoption/metadata.mjs, against cases chosen to be the
// ones that go wrong: a specification only its authors have built, a share
// with nothing counted, a field that is present and says no.
//
// These are a proposal's rules, not the site's: docs/adoption/README.md.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  challenge,
  metadataAddresses,
  operator,
  resourceAddresses,
  signalsIn,
} from "../../scripts/adoption/metadata.mjs";
import {
  attention,
  basis,
  level,
  score,
  supply,
  use,
} from "../../scripts/adoption/rubric.mjs";

const orgs = (n, stage, extra = {}) =>
  Array.from({ length: n }, (_, i) => ({
    org: `org ${stage} ${i}`,
    stage,
    ...extra,
  }));

test("supply counts organizations, and an organization once", () => {
  assert.equal(supply([]).grade, 0);
  assert.equal(supply(orgs(1, "preview")).grade, 1);
  assert.equal(supply(orgs(2, "preview")).grade, 2);
  const twice = [
    { org: "Okta", stage: "ga" },
    { org: "okta ", stage: "ga" },
    { org: "Keycloak", stage: "ga" },
  ];
  assert.equal(supply(twice).organizations, 2);
  assert.equal(supply(twice).grade, 2);
});

test("three releases are needed for grade 3, and previews are not releases", () => {
  assert.equal(supply(orgs(6, "preview")).grade, 2);
  assert.equal(supply([...orgs(2, "ga"), ...orgs(4, "experimental")]).grade, 2);
  assert.equal(supply(orgs(3, "ga")).grade, 3);
  assert.equal(supply(orgs(9, "ga")).grade, 3);
  assert.equal(supply(orgs(10, "ga")).grade, 4);
});

test("an announcement is not an implementation", () => {
  assert.equal(supply(orgs(5, "announced")).grade, 0);
  assert.equal(supply([...orgs(5, "announced"), ...orgs(1, "ga")]).grade, 1);
});

test("a specification only its authors have built stays at grade 1", () => {
  const authors = orgs(4, "ga", { authorOwn: true });
  assert.equal(supply(authors).grade, 1);
  assert.equal(supply(authors).onlyAuthors, true);
  // one organization that did not write it is enough to lift that
  assert.equal(
    supply([...authors, { org: "someone else", stage: "ga" }]).grade,
    3,
  );
  // not having checked is not the same as knowing they are the authors
  assert.equal(supply(orgs(3, "ga", { authorOwn: null })).grade, 3);
});

test("a list that counts released implementations can stand in for names", () => {
  assert.equal(supply(orgs(2, "ga"), [{ count: 19, ga: true }]).grade, 4);
  // a list of who took part in an interop event shows builds, not releases
  assert.equal(supply(orgs(2, "ga"), [{ count: 19, ga: false }]).grade, 2);
});

test("use is graded by name or by share, whichever shows more", () => {
  assert.equal(use([]).grade, 0);
  assert.equal(use(["a"]).grade, 1);
  assert.equal(use(["a", "b", "c"]).grade, 2);
  assert.equal(use(orgs(10, "x").map((o) => o.org)).grade, 3);
  assert.equal(use(orgs(30, "x").map((o) => o.org)).grade, 4);
  assert.equal(use([], [{ source: "panel", n: 1, of: 100 }]).grade, 1);
  assert.equal(use([], [{ source: "panel", n: 5, of: 100 }]).grade, 2);
  assert.equal(use([], [{ source: "panel", n: 20, of: 100 }]).grade, 3);
  assert.equal(use([], [{ source: "panel", n: 50, of: 100 }]).grade, 4);
  assert.equal(use(["a"], [{ source: "panel", n: 20, of: 100 }]).grade, 3);
});

test("a count that found nothing is not use, and nothing counted is no share", () => {
  const none = use([], [{ source: "panel", n: 0, of: 83 }]);
  assert.equal(none.grade, 0);
  assert.equal(none.share, 0);
  assert.equal(use([], [{ source: "panel", n: 0, of: 0 }]).share, undefined);
  assert.equal(use(["a"]).share, undefined);
});

test("the same name from two sources is one organization", () => {
  assert.equal(use(["Dropbox", "dropbox", " Dropbox "]).named, 1);
});

test("the level takes both answers", () => {
  assert.equal(level(0, 0), "On paper");
  assert.equal(level(1, 0), "Early");
  assert.equal(level(2, 1), "Early");
  assert.equal(level(3, 0), "Available");
  assert.equal(level(1, 2), "Available");
  assert.equal(level(3, 3), "Established");
  assert.equal(level(4, 4), "Common");
  // widely run, with nobody selling it: not established as something to choose
  assert.equal(level(2, 4), "Available");
});

test("a score is the grade and the way to the next, and never reaches it early", () => {
  assert.equal(score(0), 0);
  assert.equal(score(4), 100);
  assert.equal(score(supply(orgs(3, "ga")).position), 75);
  const s = supply(orgs(9, "ga"));
  assert.ok(s.position > 3 && s.position < 4);
  assert.ok(score(s.position) > 75 && score(s.position) < 100);
  const u = use([], [{ source: "panel", n: 49, of: 100 }]);
  assert.ok(u.position > 3 && u.position < 4);
  // one more organization moves it
  assert.ok(
    score(supply(orgs(5, "ga")).position) >
      score(supply(orgs(4, "ga")).position),
  );
});

test("the basis says how the answer was reached", () => {
  assert.equal(basis({}), "none");
  assert.equal(basis({ checkedSources: 2 }), "thin");
  assert.equal(basis({ checkedSources: 3 }), "documented");
  assert.equal(basis({ counted: 1 }), "measured");
  assert.equal(
    basis({ counted: 1, checkedSources: 5 }),
    "measured and documented",
  );
});

test("attention has a direction only when there is enough to compare", () => {
  assert.deepEqual(attention(), { grade: null, direction: null });
  assert.equal(attention({ last: 3, before: 1 }).direction, null);
  assert.equal(attention({ last: 30, before: 10 }).direction, "rising");
  assert.equal(attention({ last: 10, before: 30 }).direction, "falling");
  assert.equal(attention({ last: 20, before: 19 }).direction, "steady");
  assert.equal(attention({ last: 12, before: 0 }).direction, "rising");
  // three months of downloads cannot be compared with the three before
  assert.equal(attention(undefined, [{ byMonth: [5, 6, 7] }]).direction, null);
  const lib = attention(undefined, [
    { byMonth: [100, 100, 100, 200, 200, 200] },
  ]);
  assert.equal(lib.direction, "rising");
  assert.equal(lib.from, "downloads");
});

test("a metadata field counts only when it says yes", () => {
  const doc = {
    issuer: "https://as.example",
    token_endpoint: "https://as.example/token",
    code_challenge_methods_supported: ["plain"],
    dpop_signing_alg_values_supported: [],
    client_id_metadata_document_supported: false,
    tls_client_certificate_bound_access_tokens: "true",
    grant_types_supported: "urn:ietf:params:oauth:grant-type:token-exchange",
  };
  assert.deepEqual(signalsIn(doc), []);
  assert.deepEqual(
    signalsIn({
      ...doc,
      code_challenge_methods_supported: ["plain", "S256"],
      dpop_signing_alg_values_supported: ["ES256"],
      client_id_metadata_document_supported: true,
      grant_types_supported: [
        "authorization_code",
        "urn:ietf:params:oauth:grant-type:device_code",
      ],
      authorization_grant_profiles_supported: [
        "urn:ietf:params:oauth:grant-profile:id-jag",
      ],
    }),
    ["pkceS256", "deviceGrant", "idJag", "dpop", "cimd"],
  );
});

test("a challenge is read for where the resource metadata is", () => {
  const c = challenge(
    'Bearer realm="OAuth", resource_metadata="https://mcp.example/.well-known/oauth-protected-resource/mcp", scope="default"',
  );
  assert.equal(c.bearer, true);
  assert.equal(
    c.resourceMetadata,
    "https://mcp.example/.well-known/oauth-protected-resource/mcp",
  );
  assert.equal(c.scope, true);
  assert.equal(challenge('Basic realm="x"').bearer, false);
  assert.equal(challenge(null), undefined);
});

test("metadata is looked for where the RFCs put it", () => {
  assert.deepEqual(metadataAddresses("https://as.example"), [
    "https://as.example/.well-known/oauth-authorization-server",
    "https://as.example/.well-known/openid-configuration",
  ]);
  assert.deepEqual(metadataAddresses("https://as.example/tenant/"), [
    "https://as.example/.well-known/oauth-authorization-server/tenant",
    "https://as.example/.well-known/openid-configuration/tenant",
    "https://as.example/tenant/.well-known/openid-configuration",
  ]);
  assert.deepEqual(resourceAddresses("https://mcp.example/mcp"), [
    "https://mcp.example/.well-known/oauth-protected-resource/mcp",
    "https://mcp.example/.well-known/oauth-protected-resource",
  ]);
});

test("a platform's customers are separate operators", () => {
  assert.equal(operator("mcp.example.com"), "example.com");
  assert.equal(operator("a.workers.dev"), "a.workers.dev");
  assert.equal(operator("x.y.workers.dev"), "y.workers.dev");
  assert.equal(operator("tenant.us.auth0.com"), "us.auth0.com");
});
