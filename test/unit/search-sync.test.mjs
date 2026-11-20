import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { listItems, syncSearch } from "../../scripts/sync-search.mjs";

const passage = {
  title: "Token exchange",
  section: "Roles",
  text: "Public guide passage.",
};
const digest = createHash("sha256")
  .update(JSON.stringify(passage))
  .digest("hex");
const record = {
  ...passage,
  key: `${"b".repeat(32)}-${digest.slice(0, 32)}.md`,
  digest,
};

function page(items, total = items.length, size = 50) {
  return {
    result: items,
    result_info: { total_count: total, count: items.length, per_page: size },
  };
}

test("inventory reads every page, even when the last page is full", async () => {
  const sizes = [];
  const result = await listItems(async (path) => {
    sizes.push(path);
    return page([{ key: `key${sizes.length}` }], 2, 1);
  });
  assert.deepEqual([...result.keys()], ["key1", "key2"]);
  assert.match(sizes[1], /page=2/);
});

test("resume pending items, preserve other sources and skip uploaded content on retry", async () => {
  const other = { key: "existing-file", status: "completed", chunks_count: 1 };
  const uploaded = { key: record.key, status: "queued", chunks_count: 0 };
  let polls = 0;
  let writes = 0;
  const request = async (_path, options) => {
    if (options) {
      writes++;
      assert.equal(options.method, "POST");
      const file = options.body.get("file");
      assert.equal(file.name, record.key);
      assert.match(await file.text(), /Public guide passage/);
      return { result: uploaded };
    }
    if (writes && ++polls > 1)
      Object.assign(uploaded, { status: "completed", chunks_count: 1 });
    return page(writes ? [other, uploaded] : [other]);
  };
  for (let run = 0; run < 2; run++)
    await syncSearch([record], request, {
      log: () => {},
      pause: async () => {},
    });
  assert.equal(writes, 1);
});

test("a pending item that ends in an error fails the publish gate", async () => {
  let reads = 0;
  const request = async (_path, options) => {
    assert.equal(options, undefined);
    return page([
      {
        key: record.key,
        status: ++reads === 1 ? "running" : "error",
        chunks_count: 0,
      },
    ]);
  };
  await assert.rejects(
    () => syncSearch([record], request, { log: () => {} }),
    /Indexing failed/,
  );
});

test("a duplicated manifest key fails before contacting the provider", async () => {
  await assert.rejects(
    () => syncSearch([record, record], () => assert.fail("requested")),
    /duplicate passage/,
  );
});
