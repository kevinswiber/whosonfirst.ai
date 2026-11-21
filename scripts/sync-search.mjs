// Upload the public passages produced by the site build. Filenames include a
// content digest, so retries and overlapping releases address the same bytes.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { requireCurrentBuild } from "./built-site.mjs";

const manifestPath = new URL("../.astro/search/manifest.json", import.meta.url);
const indexed = (item) => item?.status === "completed" && item.chunks_count > 0;
const pending = (item) => ["queued", "running"].includes(item?.status);

function checkRecords(records) {
  if (!Array.isArray(records) || !records.length)
    throw new Error("Empty search manifest.");
  const keys = new Set();
  for (const record of records) {
    const { key, digest, ...passage } = record;
    if (
      !/^[a-f0-9]{32}-[a-f0-9]{32}\.md$/.test(record.key) ||
      !record.key.endsWith(`-${record.digest?.slice(0, 32)}.md`) ||
      digest !==
        createHash("sha256").update(JSON.stringify(passage)).digest("hex") ||
      keys.has(key) ||
      !record.title ||
      !record.text?.trim()
    ) {
      throw new Error("Invalid or duplicate passage in the search manifest.");
    }
    keys.add(record.key);
  }
}

export async function listItems(request) {
  const items = new Map();
  for (let page = 1; ; page += 1) {
    const response = await request(
      `?source=builtin&sort_by=modified_at&per_page=50&page=${page}`,
    );
    const { count, total_count, per_page } = response.result_info;
    if (
      !Array.isArray(response.result) ||
      !per_page ||
      !Number.isSafeInteger(total_count)
    ) {
      throw new Error("Cloudflare returned an invalid inventory.");
    }
    for (const item of response.result) items.set(item.key, item);
    if (!count || page * per_page >= total_count) return items;
  }
}

async function forEachLimited(records, operation) {
  let next = 0;
  let failure;
  async function run() {
    while (!failure && next < records.length) {
      const record = records[next++];
      try {
        await operation(record);
      } catch (error) {
        failure = error;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, records.length) }, run));
  if (failure) throw failure;
}

function upload(record) {
  const markdown = [
    `# ${record.title}`,
    record.section && `## ${record.section}`,
    record.aliases?.join(" · "),
    record.text,
  ]
    .filter(Boolean)
    .join("\n\n");
  const form = new FormData();
  form.set("file", new Blob([markdown], { type: "text/markdown" }), record.key);
  form.set("metadata", JSON.stringify({ digest: record.digest }));
  return { method: "POST", body: form };
}

// Page the inventory again after upload. Items can finish asynchronously and
// unrelated items may already exist. Only this release is required to finish.
// Then clear AI Search's cache: an answer cached from the earlier index can
// leave out passages this release added, and new passages do not clear it.
export async function syncSearch(
  records,
  request,
  { purge, pause = sleep, log = console.log } = {},
) {
  checkRecords(records);
  const before = await listItems(request);
  const changed = records.filter(
    ({ key }) => !indexed(before.get(key)) && !pending(before.get(key)),
  );
  log(`Uploading ${changed.length} of ${records.length} passages.`);
  let accepted = 0;
  await forEachLimited(changed, async (record) => {
    const { result } = await request("", upload(record));
    if (result?.key !== record.key)
      throw new Error("Cloudflare did not acknowledge the uploaded filename.");
    accepted++;
    if (accepted % 100 === 0) log(`Accepted ${accepted}/${changed.length}.`);
  });
  let highWater = 0;
  let lastProgress = Date.now();
  while (true) {
    const current = await listItems(request);
    let count = 0;
    for (const { key } of records) {
      const item = current.get(key);
      if (indexed(item)) count++;
      else if (item && !pending(item))
        throw new Error(
          `Indexing failed for ${key} (status ${item.status}). Rerun after correcting the item.`,
        );
    }
    if (count === records.length) {
      log(
        `Indexed ${count} passages. Preserved ${current.size - count} other items.`,
      );
      if (purge) {
        await purge();
        log("Cleared the answers AI Search had cached.");
      }
      return;
    }
    log(`Indexed ${count}/${records.length}. Waiting for Cloudflare.`);
    if (count > highWater) {
      highWater = count;
      lastProgress = Date.now();
    }
    if (Date.now() - lastProgress >= 20 * 60_000)
      throw new Error(
        "Indexing has made no progress for 20 minutes. Run the same command to resume.",
      );
    await pause(15_000);
  }
}

function cloudflareRequest(account, token, namespace, instance) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/ai-search/namespaces/${encodeURIComponent(namespace)}/instances/${encodeURIComponent(instance)}`;
  return async (suffix, options = {}) => {
    for (let attempt = 0; attempt < 6; attempt++) {
      let response;
      try {
        response = await fetch(url + suffix, {
          ...options,
          headers: { Authorization: `Bearer ${token}` },
          redirect: "error",
          signal: AbortSignal.timeout(60_000),
        });
      } catch {
        if (attempt === 5)
          throw new Error(
            "Cloudflare request failed. Check network access and rerun to resume.",
          );
      }
      if (response?.ok) {
        const body = await response.json();
        if (body.success === true) return body;
        throw new Error("Cloudflare rejected the AI Search request.");
      }
      if (
        response &&
        ((response.status !== 429 && response.status < 500) || attempt === 5)
      ) {
        throw new Error(
          `Cloudflare AI Search request failed (HTTP ${response.status}).`,
        );
      }
      const retryAfter = Number(response?.headers.get("retry-after")) || 0;
      await response?.body?.cancel();
      await sleep(Math.max(2 ** attempt, retryAfter) * 1000);
    }
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--dry-run"))
    throw new Error("Usage: node scripts/sync-search.mjs [--dry-run]");
  requireCurrentBuild("Search must index the current guide.");
  const { records, revision } = JSON.parse(
    await readFile(manifestPath, "utf8"),
  );
  const actual = createHash("sha256")
    .update(JSON.stringify(records))
    .digest("hex");
  if (actual !== revision)
    throw new Error(
      "Search manifest revision does not match its passages. Rebuild the site.",
    );
  if (args.includes("--dry-run")) {
    checkRecords(records);
    console.log(
      `Validated ${records.length} passages in revision ${revision}. No network requests made.`,
    );
    return;
  }
  const {
    CLOUDFLARE_ACCOUNT_ID: account,
    CLOUDFLARE_AI_SEARCH_UPLOAD_TOKEN: token,
    SEARCH_NAMESPACE: namespace = "whosonfirst",
    SEARCH_INSTANCE: instance = "whosonfirst-guide",
  } = process.env;
  if (!account || !token)
    throw new Error(
      "Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_AI_SEARCH_UPLOAD_TOKEN.",
    );
  const request = cloudflareRequest(account, token, namespace, instance);
  await syncSearch(
    records,
    (suffix, options) => request(`/items${suffix}`, options),
    {
      purge: () => request("/purge_cache", { method: "POST" }),
    },
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
