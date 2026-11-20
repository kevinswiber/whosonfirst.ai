import assert from "node:assert/strict";
import { test } from "node:test";
import { sameRelease, uploadedVersion } from "../../scripts/release-search.mjs";

test("a release requires both the live site commit and the passage digest", () => {
  const expected = { commit: "a".repeat(40), revision: "b".repeat(64) };
  assert.equal(sameRelease(expected, { ...expected }), true);
  for (const remote of [
    undefined,
    {},
    { ...expected, commit: "c".repeat(40) },
    { ...expected, revision: "c".repeat(64) },
  ]) {
    assert.equal(sameRelease(expected, remote), false);
  }
  assert.equal(
    sameRelease(
      { commit: null, revision: "b".repeat(64) },
      { commit: null, revision: "b".repeat(64) },
    ),
    false,
  );
});
test("only the CLI's single identified Worker version can receive traffic", () => {
  const id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
  const report = `Upload succeeded\nWorker Version ID: ${id}\n`;
  assert.equal(uploadedVersion(report), id);
  assert.throws(() => uploadedVersion("Upload failed"));
  assert.throws(() => uploadedVersion(report + report));
  assert.throws(() => uploadedVersion(`Some other resource: ${id}`));
});
