import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  cloudflareRequest,
  listItems,
  retireSearch,
  syncSearch,
} from "../../scripts/sync-search.mjs";

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

test("the cache is purged once, after this release's passages are indexed, and not when indexing fails", async () => {
  const events = [];
  const item = { key: record.key, status: "completed", chunks_count: 1 };
  await syncSearch([record], async () => page([item]), {
    purge: async () => events.push("purge"),
    log: (line) => events.push(line),
  });
  assert.deepEqual(events.slice(-2), [
    "purge",
    "Cleared the answers AI Search had cached.",
  ]);
  assert.match(events.at(-3), /^Indexed 1 passages/);

  let purged = false;
  let reads = 0;
  await assert.rejects(
    () =>
      syncSearch(
        [record],
        async (_path, options) => {
          assert.equal(options, undefined);
          return page([
            {
              key: record.key,
              status: ++reads === 1 ? "running" : "error",
              chunks_count: 0,
            },
          ]);
        },
        { purge: async () => (purged = true), log: () => {} },
      ),
    /Indexing failed/,
  );
  assert.equal(purged, false);
});

test("retiring deletes only this project's passages that the site no longer has", async () => {
  const kept = {
    id: "k",
    key: record.key,
    status: "completed",
    chunks_count: 1,
  };
  const old = {
    id: "o",
    key: `${"c".repeat(32)}-${"d".repeat(32)}.md`,
    status: "completed",
    chunks_count: 1,
  };
  const stray = {
    id: "s",
    key: "notes.md",
    status: "completed",
    chunks_count: 1,
  };
  const deleted = [];
  const lines = [];
  await retireSearch(
    [record],
    async (path, options) => {
      if (options) {
        assert.equal(options.method, "DELETE");
        deleted.push(path);
        return { success: true };
      }
      return page([kept, old, stray]);
    },
    { log: (line) => lines.push(line) },
  );
  assert.deepEqual(deleted, ["/o"]);
  assert.match(lines.join("\n"), /Retiring 1 passages .* Keeping 1\./);
  assert.match(lines.join("\n"), /Left 1 items not named/);
});

test("nothing is retired until every passage of this release is indexed", async () => {
  const old = {
    id: "o",
    key: `${"c".repeat(32)}-${"d".repeat(32)}.md`,
    status: "completed",
    chunks_count: 1,
  };
  await assert.rejects(
    () =>
      retireSearch(
        [record],
        async (_path, options) => {
          assert.equal(options, undefined, "nothing deleted");
          return page([
            { id: "k", key: record.key, status: "running", chunks_count: 0 },
            old,
          ]);
        },
        { log: () => {} },
      ),
    /not indexed\. Nothing was retired/,
  );
});

test("a rate-limited or dropped request waits as asked and backs off for about three minutes before it gives up", async () => {
  const waits = [];
  const answers = [
    new Response("", { status: 429, headers: { "Retry-After": "5" } }),
    new Response("", { status: 429 }),
    Response.json({ success: true, result: "done" }),
  ];
  const request = cloudflareRequest("a", "t", "n", "i", {
    fetch: async () => answers.shift(),
    pause: async (ms) => waits.push(ms),
  });
  assert.equal((await request("/items")).result, "done");
  assert.deepEqual(waits, [5000, 2000]);

  const limited = [];
  const always = cloudflareRequest("a", "t", "n", "i", {
    fetch: async () => new Response("", { status: 429 }),
    pause: async (ms) => limited.push(ms),
  });
  await assert.rejects(() => always("/items"), /HTTP 429/);
  assert.deepEqual(
    limited,
    [1, 2, 4, 8, 16, 32, 60, 60].map((s) => s * 1000),
  );

  const refused = cloudflareRequest("a", "t", "n", "i", {
    fetch: async () => new Response("", { status: 403 }),
    pause: async () => assert.fail("a refusal is not tried again"),
  });
  await assert.rejects(() => refused("/items"), /HTTP 403/);

  const waitsAfterDrops = [];
  const dropped = cloudflareRequest("a", "t", "n", "i", {
    fetch: async () => {
      throw new TypeError("fetch failed");
    },
    pause: async (ms) => waitsAfterDrops.push(ms / 1000),
  });
  await assert.rejects(() => dropped("/items"), /Check network access/);
  assert.deepEqual(waitsAfterDrops, [1, 2, 4, 8, 16, 32, 60, 60]);
});

test("retiring deletes one item at a time, and a run that stops says how far it got", async () => {
  const old = (n) => ({
    id: `o${n}`,
    key: `${String(n).repeat(32)}-${"d".repeat(32)}.md`,
    status: "completed",
    chunks_count: 1,
  });
  const kept = {
    id: "k",
    key: record.key,
    status: "completed",
    chunks_count: 1,
  };
  let open = 0;
  let deletes = 0;
  await assert.rejects(
    () =>
      retireSearch(
        [record],
        async (_path, options) => {
          if (!options) return page([kept, old(1), old(2), old(3)]);
          open++;
          assert.equal(open, 1, "one delete at a time");
          await new Promise((resolve) => setTimeout(resolve, 1));
          open--;
          if (++deletes === 3)
            throw new Error("Cloudflare AI Search request failed (HTTP 429).");
          return { success: true };
        },
        { log: () => {} },
      ),
    /HTTP 429\)\. Retired 2 of 3 before stopping\. The next run retires the rest\./,
  );
});
