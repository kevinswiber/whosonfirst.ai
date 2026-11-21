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

async function forEachLimited(records, operation, limit = 4) {
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
  await Promise.all(
    Array.from({ length: Math.min(limit, records.length) }, run),
  );
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

// A passage this project uploads is named for its location and its content.
const PASSAGE = /^[a-f0-9]{32}-[a-f0-9]{32}\.md$/;

// Delete the passages the site no longer has, once the new site is
// answering. Nothing is kept for a rollback: the release run for an older
// commit uploads whatever its passages are missing before it deploys. Only
// items named as this project names a passage are retired, and only when every
// passage of this release is indexed.
export async function retireSearch(
  records,
  request,
  { log = console.log } = {},
) {
  checkRecords(records);
  const current = new Set(records.map(({ key }) => key));
  const items = await listItems(request);
  const missing = records.filter(({ key }) => !indexed(items.get(key)));
  if (missing.length)
    throw new Error(
      `${missing.length} passages of this release are not indexed. Nothing was retired.`,
    );
  const retired = [...items.values()].filter(
    ({ key }) => PASSAGE.test(key) && !current.has(key),
  );
  const other = [...items.values()].filter(({ key }) => !PASSAGE.test(key));
  log(
    `Retiring ${retired.length} passages the site no longer has. Keeping ${current.size}.`,
  );
  if (other.length)
    log(
      `Left ${other.length} items not named as this project names a passage.`,
    );
  // One at a time: AI Search rate limits item writes, and there is no bulk
  // delete. A run that stops says how far it got, and the next one, which
  // lists the items again, retires the rest.
  let done = 0;
  try {
    await forEachLimited(
      retired,
      async ({ id }) => {
        await request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
        done++;
        if (done % 100 === 0) log(`Retired ${done}/${retired.length}.`);
      },
      1,
    );
  } catch (error) {
    throw new Error(
      `${error.message} Retired ${done} of ${retired.length} before stopping. The next run retires the rest.`,
    );
  }
  log(`Retired ${retired.length} passages.`);
}

// A failed request is tried again. A 429 or a dropped connection is tried for
// longer than a server error, for about three minutes: AI Search rate limits
// item writes without saying how many it takes, asks for backoff or for the
// Retry-After delay, and while overloaded can drop the connection instead.
export function cloudflareRequest(
  account,
  token,
  namespace,
  instance,
  { fetch: send = fetch, pause = sleep } = {},
) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/ai-search/namespaces/${encodeURIComponent(namespace)}/instances/${encodeURIComponent(instance)}`;
  return async (suffix, options = {}) => {
    for (let attempt = 0; ; attempt++) {
      let response;
      try {
        response = await send(url + suffix, {
          ...options,
          headers: { Authorization: `Bearer ${token}` },
          redirect: "error",
          signal: AbortSignal.timeout(60_000),
        });
      } catch {
        if (attempt >= 8)
          throw new Error(
            "Cloudflare request failed. Check network access and rerun to resume.",
          );
      }
      if (response?.ok) {
        const body = await response.json();
        if (body.success === true) return body;
        throw new Error("Cloudflare rejected the AI Search request.");
      }
      const limited = response?.status === 429;
      if (
        response &&
        ((!limited && response.status < 500) || attempt >= (limited ? 8 : 5))
      ) {
        throw new Error(
          `Cloudflare AI Search request failed (HTTP ${response.status}).`,
        );
      }
      const retryAfter = Number(response?.headers.get("retry-after")) || 0;
      await response?.body?.cancel();
      await pause(Math.min(Math.max(2 ** attempt, retryAfter), 60) * 1000);
    }
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (
    args.length > 1 ||
    args.some((arg) => !["--dry-run", "--retire"].includes(arg))
  )
    throw new Error(
      "Usage: node scripts/sync-search.mjs [--dry-run | --retire]",
    );
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
  const items = (suffix, options) => request(`/items${suffix}`, options);
  if (args.includes("--retire")) {
    await retireSearch(records, items);
    return;
  }
  await syncSearch(records, items, {
    purge: () => request("/purge_cache", { method: "POST" }),
  });
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
