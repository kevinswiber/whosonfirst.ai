import assert from "node:assert/strict";
import { test } from "node:test";
import {
  previewAlias,
  uploadedPreview,
  verifyPreview,
} from "../../scripts/preview-search.mjs";

const marker = { commit: "c".repeat(40), revision: "a".repeat(64) };
const config = {
  name: "whosonfirst-ai-preview",
  workersDev: false,
  previewUrls: true,
};
const origin = "https://pr-17-whosonfirst-ai-preview.example.workers.dev";
const report = {
  type: "version-upload",
  version: 1,
  version_id: "12345678-1234-1234-abcd-123456789abc",
  worker_name: config.name,
  preview_alias_url: origin,
};
const headers = {
  "X-Guide-Search-Commit": marker.commit,
  "X-Guide-Search-Revision": marker.revision,
};

test("only the expected PR, Worker and release can be uploaded", () => {
  assert.equal(previewAlias("17", marker.commit, marker, config), "pr-17");
  for (const value of ["0", "0017", "17\nurl=options", "-2", "1.6", undefined])
    assert.throws(
      () => previewAlias(value, marker.commit, marker, config),
      /PR_NUMBER/,
    );
  assert.throws(
    () => previewAlias("17", "d".repeat(40), marker, config),
    /COMMIT/,
  );
  assert.throws(
    () =>
      previewAlias("17", marker.commit, { ...marker, revision: "" }, config),
    /COMMIT/,
  );
  for (const change of [
    { name: "whosonfirst-ai" },
    { workersDev: true },
    { previewUrls: false },
  ])
    assert.throws(
      () => previewAlias("17", marker.commit, marker, { ...config, ...change }),
      /prebuilt/,
    );
});

test("the machine-readable upload receipt yields one safe origin for workflow output", () => {
  const event = (data = {}) => JSON.stringify({ ...report, ...data });
  assert.equal(
    uploadedPreview(
      [
        JSON.stringify({ type: "diagnostic" }),
        event({ preview_alias_url: `${origin}/` }),
      ].join("\n"),
      "pr-17",
    ),
    origin,
  );
  for (const bad of [
    `Version Preview Alias URL: ${origin}`,
    `${event()}\n${event()}`,
    event({ worker_name: "whosonfirst-ai" }),
    event({ version_id: null }),
    event({ preview_alias_url: `${origin}\nurl=elsewhere` }),
    event({ preview_alias_url: `${origin}/other` }),
    event({ preview_alias_url: origin.replace("pr-17-", "pr-3-") }),
    event({ preview_alias_url: `${origin}.elsewhere.example` }),
    event({ preview_alias_url: origin.replace("https://", "https://user@") }),
    event({ preview_alias_url: origin.replace("https://", "http://") }),
  ]) {
    assert.throws(() => uploadedPreview(bad, "pr-17"), /report|alias/);
  }
});

test("public marker and API HEAD must agree before verifying a real same-origin POST", async () => {
  const seen = [];
  const replies = [
    Response.json({ ...marker, commit: "d".repeat(40) }),
    Response.json(marker),
    new Response(null, {
      status: 405,
      headers: { ...headers, "X-Guide-Search-Revision": "old", Allow: "POST" },
    }),
    Response.json(marker),
    new Response(null, { status: 405, headers: { ...headers, Allow: "POST" } }),
    Response.json(
      { results: [{ href: "/flows/device-authorization/" }] },
      { headers },
    ),
  ];
  await verifyPreview(origin, marker, {
    pause: async () => {},
    fetchPage: async (url, init) => {
      assert.equal(url.origin, origin);
      assert.equal(init.redirect, "error");
      assert.equal(init.headers?.Authorization, undefined);
      seen.push([init.method ?? "GET", url.pathname]);
      if (init.method === "POST")
        assert.equal(typeof init.body.get("q"), "string");
      return replies.shift();
    },
  });
  assert.deepEqual(seen, [
    ["GET", "/search/release.json"],
    ["GET", "/search/release.json"],
    ["HEAD", "/api/search/query"],
    ["GET", "/search/release.json"],
    ["HEAD", "/api/search/query"],
    ["POST", "/api/search/query"],
  ]);
});

test("an empty index, foreign link, mismatched API revision, or unavailable preview fails verification", async () => {
  for (const [body, overrides, problem] of [
    [{ results: [] }, {}, /did not return a guide result/],
    [
      { results: [{ href: "//elsewhere.example/" }] },
      {},
      /did not return a guide result/,
    ],
    [
      { results: [{ href: "/guide/" }] },
      { "X-Guide-Search-Commit": "old" },
      /release mismatch/,
    ],
  ]) {
    await assert.rejects(
      verifyPreview(origin, marker, {
        pause: async () => {},
        fetchPage: async (_url, init) => {
          if (!init.method) return Response.json(marker);
          if (init.method === "HEAD")
            return new Response(null, {
              status: 405,
              headers: { ...headers, Allow: "POST" },
            });
          return Response.json(body, { headers: { ...headers, ...overrides } });
        },
      }),
      problem,
    );
  }
  await assert.rejects(
    verifyPreview(origin, marker, {
      pause: async () => {},
      fetchPage: async () =>
        new Response("private provider error", { status: 403 }),
    }),
    { message: "Preview verification failed: site marker HTTP 403." },
  );
});
