// What scripts/film-assets.mjs sends to the bucket, against a bucket that is
// a server in this process: the bucket's index is what the next push takes
// for what the bucket has, so it must never list a file the bucket lacks.
import { strict as assert } from "node:assert";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("../../scripts/film-assets.mjs", import.meta.url),
);
const FILES = {
  "shared/room/a-room.mp3": "a room",
  "flows/dpop/readings/a-reading.mp3": "a reading",
};

/** A bucket that keeps what it is sent and gives it back. */
async function bucket() {
  const held = new Map();
  const puts = [];
  const server = createServer((request, answer) => {
    const key = decodeURIComponent(request.url.replace(/^\/a-bucket\//, ""));
    if (request.method === "PUT") {
      const parts = [];
      request.on("data", (part) => parts.push(part));
      request.on("end", () => {
        held.set(key, Buffer.concat(parts));
        puts.push(key);
        answer.end();
      });
    } else if (held.has(key)) answer.end(held.get(key));
    else answer.writeHead(404).end();
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return {
    held,
    puts,
    address: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((done) => server.close(done)),
  };
}

/** A copy of a store whose index lists both files, with only some of them here. */
function store(present) {
  const dir = mkdtempSync(join(tmpdir(), "film-assets-test-"));
  const entry = (key) => ({
    key,
    bytes: FILES[key].length,
    sha256: createHash("sha256").update(FILES[key]).digest("hex"),
  });
  writeFileSync(
    join(dir, "index.json"),
    JSON.stringify({
      bucket: "a-bucket",
      shared: [entry("shared/room/a-room.mp3")],
      flows: {
        dpop: { readings: [entry("flows/dpop/readings/a-reading.mp3")] },
      },
    }),
  );
  writeFileSync(join(dir, "README.md"), "what this is");
  for (const key of present) put(dir, key);
  return dir;
}
function put(dir, key) {
  mkdirSync(dirname(join(dir, key)), { recursive: true });
  writeFileSync(join(dir, key), FILES[key]);
}

const run = (dir, address, ...args) =>
  new Promise((done) =>
    execFile(
      process.execPath,
      [script, ...args],
      {
        env: {
          ...process.env,
          FILM_ASSETS_DIR: dir,
          CLOUDFLARE_AWS_ACCESS_KEY: "a-key",
          CLOUDFLARE_AWS_ACCESS_SECRET: "a-secret",
          CLOUDFLARE_S3_ENDPOINT: address,
        },
      },
      (error, stdout, stderr) =>
        done({ code: error ? error.code : 0, said: stdout + stderr }),
    ),
  );

test("the index is not sent while the bucket lacks a file it lists", async () => {
  const there = await bucket();
  try {
    const dir = store(["shared/room/a-room.mp3"]);
    const first = await run(dir, there.address, "push");
    assert.equal(first.code, 1, first.said);
    assert.match(first.said, /flows\/dpop\/readings\/a-reading\.mp3/);
    assert.deepEqual(there.puts, ["shared/room/a-room.mp3"]);

    // the missing file turns up, and now it is sent, and then the index
    put(dir, "flows/dpop/readings/a-reading.mp3");
    const second = await run(dir, there.address, "push");
    assert.equal(second.code, 0, second.said);
    assert.ok(there.held.has("flows/dpop/readings/a-reading.mp3"));
    assert.deepEqual(there.puts.slice(-2), ["README.md", "index.json"]);

    // and a push after that has nothing to send but the index
    there.puts.length = 0;
    const third = await run(dir, there.address, "push");
    assert.equal(third.code, 0, third.said);
    assert.deepEqual(there.puts, ["README.md", "index.json"]);
  } finally {
    await there.close();
  }
});

test("a push of part of the store leaves the index for a push of all of it", async () => {
  const there = await bucket();
  try {
    const dir = store(Object.keys(FILES));
    const part = await run(dir, there.address, "push", "shared/");
    assert.equal(part.code, 1, part.said);
    assert.deepEqual(there.puts, ["shared/room/a-room.mp3"]);

    const all = await run(dir, there.address, "push");
    assert.equal(all.code, 0, all.said);
    assert.equal(there.held.has("index.json"), true);
    assert.equal(there.held.size, 4);
  } finally {
    await there.close();
  }
});

test("a file fetched from the bucket has to be the one the index describes", async () => {
  const there = await bucket();
  try {
    const dir = store([]);
    there.held.set("shared/room/a-room.mp3", Buffer.from("another room"));
    const pulled = await run(dir, there.address, "pull", "shared/");
    assert.notEqual(pulled.code, 0);
    assert.match(pulled.said, /came back different/);
  } finally {
    await there.close();
  }
});
