import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { built, pageAt } from "../support/site.mjs";

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
  assert.ok(records.some((r) => r.href === "/guide/#cases"));
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
