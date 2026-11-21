import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { built, file, pageAt } from "../support/site.mjs";

const manifest = JSON.parse(
  readFileSync(".astro/search/manifest.json", "utf8"),
);
const { records } = manifest;

test("search covers the indexed reading pages with verified destinations and unique content-bound keys", () => {
  assert.equal(
    manifest.revision,
    createHash("sha256").update(JSON.stringify(records)).digest("hex"),
  );
  const paths = new Set();
  const keys = new Set();
  for (const { href, key, text, digest, title } of records) {
    const [path, anchor] = href.split("#");
    const page = pageAt(path);
    assert.ok(page && (!anchor || page.html.includes(`id="${anchor}"`)), href);
    assert.ok(title && text && text.length <= 2200 && !keys.has(key), key);
    assert.match(key, /^[a-f0-9]{32}-[a-f0-9]{32}\.md$/);
    assert.ok(key.endsWith(`-${digest.slice(0, 32)}.md`));
    keys.add(key);
    paths.add(path);
  }
  const expected = built.filter(
    (p) =>
      p.path !== "/search/" &&
      p.html.includes('type="text/markdown"') &&
      !/<meta name="robots" content="[^"]*noindex/.test(p.html),
  );
  assert.deepEqual([...paths].sort(), expected.map((p) => p.path).sort());
});
test("a definition, RFC, flow step and product's role each lead to their source", () => {
  assert.ok(
    records
      .find((r) => r.href === "/glossary/#audience")
      ?.aliases.includes("Audience"),
  );
  assert.ok(
    records
      .find(
        (r) =>
          r.href === "/standards/rfc9449/" && r.aliases.includes("RFC 9449"),
      )
      ?.text.includes("Tokens are bound to a client key"),
  );
  assert.ok(
    records
      .find((r) => r.href === "/flows/ciba/#step-4")
      ?.text.includes("push to an authenticator app"),
  );
  const proof = records.find(
    (r) => r.href === "/implementations/dpop/#field-dpop-keycloak",
  );
  assert.match(proof.section, /Keycloak/i);
  assert.match(proof.text, /Limits\./);
  assert.match(proof.text, /Checked /);
  // a section's passages lead to its heading, which has an address of its own
  // even where the author gave it none: see src/lib/section-links.ts
  assert.ok(
    records.some(
      (r) =>
        r.href === "/guide/#four-cases-by-name" &&
        r.section === "Four cases, by name",
    ),
  );
  assert.equal(
    records.filter((r) => r.href.startsWith("/standards/#")).length,
    0,
  );
});

test("search omits directory prompts but keeps claims and walkthrough context", () => {
  assert.equal(
    records.some(({ href }) => /^\/implementations\/[^/#]+\/$/.test(href)),
    false,
  );
  assert.equal(
    records.some(({ href }) =>
      /\/(?:flows\/[^/]+\/#related|compare\/[^/]+\/#full|learn\/[^/]+\/#deeper)$/.test(
        href,
      ),
    ),
    false,
  );
  assert.equal(
    records.some(({ text }) =>
      text.includes(
        "Each step shows the message and who holds which credential afterward.",
      ),
    ),
    false,
  );
  assert.ok(records.some(({ href }) => href === "/flows/ciba/#step-4"));
  assert.ok(
    records.some(({ href }) => href === "/flows/agent-payments/#walkthrough"),
  );
  assert.ok(
    records.some(({ href }) => href === "/implementations/dpop/#field-scope"),
  );
});

test("quick matches ship one short entry per named destination", () => {
  const quick = JSON.parse(file("search/quick-matches.json"));
  const byHref = new Map(quick.map((entry) => [entry.href, entry]));
  assert.equal(quick.length, byHref.size);
  for (const entry of quick) {
    assert.deepEqual(Object.keys(entry).sort(), [
      "aliases",
      "href",
      "summary",
      "title",
      "type",
    ]);
    assert.ok(
      entry.title && entry.summary && entry.summary.length <= 161,
      entry.href,
    );
    const [path, id] = entry.href.split("#");
    assert.ok(
      pageAt(path) && (!id || pageAt(path).html.includes(`id="${id}"`)),
      entry.href,
    );
  }
  for (const path of new Set(records.map((r) => r.href.split("#")[0])))
    assert.ok(byHref.has(path), path);
  const rfc = byHref.get("/standards/rfc9449/");
  assert.ok(
    rfc.aliases.includes("RFC 9449") && rfc.aliases.includes("rfc9449"),
  );
  assert.equal(byHref.get("/glossary/#audience").title, "Audience");
  assert.ok(byHref.get("/glossary/#audience").aliases.includes("aud"));
  assert.match(
    byHref.get("/implementations/dpop/#field-dpop-keycloak").title,
    /Keycloak · Authorization server · DPoP/,
  );
  assert.ok(!byHref.has("/flows/dpop/#step-1"));
  assert.ok(!byHref.has("/implementations/dpop/#field-dates"));
});

test("every page offers the guide to browsers as a search engine that opens the search address", () => {
  const description = file("opensearch.xml");
  const short = /<ShortName>([^<]*)<\/ShortName>/.exec(description)?.[1];
  assert.ok(
    short && [...short].length <= 16,
    "a short name of 16 characters or fewer",
  );
  assert.match(
    description,
    /<Url type="text\/html" method="get" template="https:\/\/whosonfirst\.ai\/search\?q=\{searchTerms\}"\/>/,
  );
  assert.match(
    file("_headers"),
    /\/opensearch\.xml\n\s+Content-Type: application\/opensearchdescription\+xml/,
  );
  const missing = built
    .filter(
      (p) =>
        !p.html.includes(
          '<link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml"',
        ),
    )
    .map((p) => p.path);
  assert.deepEqual(missing, []);
});
