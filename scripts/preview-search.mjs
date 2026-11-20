// Publish a PR alias on the dedicated preview Worker. The site and search API
// share an origin and must both report the build supplied by this workflow.
import { execFile } from "node:child_process";
import { appendFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { sameRelease } from "./release-search.mjs";

const worker = "whosonfirst-ai-preview";
const root = fileURLToPath(new URL("../", import.meta.url));
const project = join(root, "workers/preview");
const prebuilt = join(project, ".cloudflare/output/v1");
const run = promisify(execFile);
const uuid = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;

export function previewAlias(number, commit, marker, workerConfig) {
  if (!/^[1-9][0-9]*$/.test(number) || !Number.isSafeInteger(Number(number)))
    throw new Error("Set PREVIEW_PR_NUMBER to a positive pull request number.");
  if (!sameRelease(marker, marker) || commit !== marker.commit)
    throw new Error("PREVIEW_COMMIT and the built preview release must match.");
  if (
    workerConfig?.name !== worker ||
    workerConfig.workersDev !== false ||
    workerConfig.previewUrls !== true
  )
    throw new Error(
      `Expected the prebuilt ${worker} Worker with version previews enabled and workers.dev disabled.`,
    );
  return `pr-${number}`;
}

export function uploadedPreview(report, alias) {
  let uploads;
  try {
    uploads = report
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((event) => event.type === "version-upload");
  } catch {
    throw new Error("Cloudflare returned an invalid version upload report.");
  }
  const [event] = uploads;
  if (
    uploads.length !== 1 ||
    event.worker_name !== worker ||
    event.version !== 1 ||
    !uuid.test(event.version_id) ||
    !/^pr-[1-9][0-9]*$/.test(alias)
  )
    throw new Error(
      "Cloudflare did not report one version for the expected preview Worker.",
    );
  // An alias is one DNS label before the account's workers.dev subdomain.
  // Accept only the HTTPS origin. The same string is safe as a workflow output.
  const subdomain = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
  const origin = new RegExp(
    `^https://${alias}-${worker}\\.(${subdomain})\\.workers\\.dev/?$`,
  ).exec(event.preview_alias_url);
  if (!origin || origin[0] !== event.preview_alias_url)
    throw new Error(
      "Cloudflare did not return the expected PR alias URL. Check that version previews are enabled.",
    );
  return new URL(origin[0]).origin;
}

async function probe(origin, marker, fetchPage) {
  const get = (path, options = {}) =>
    fetchPage(new URL(path, origin), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      ...options,
    });
  const markerURL = new URL("/search/release.json", origin);
  markerURL.searchParams.set("check", String(Date.now()));
  const site = await get(markerURL);
  if (site.status !== 200) return `site marker HTTP ${site.status}`;
  if (!sameRelease(marker, await site.json()))
    return "site marker belongs to a different release";

  const releaseHeadersMatch = (response) =>
    response.headers.get("X-Guide-Search-Commit") === marker.commit &&
    response.headers.get("X-Guide-Search-Revision") === marker.revision;
  const endpoint = "/api/search/query";
  // The search API permits POST. HEAD checks routing and release headers
  // without spending a query while a previous version is still propagating.
  const head = await get(endpoint, {
    method: "HEAD",
    headers: { Accept: "application/json" },
  });
  if (
    head.status !== 405 ||
    head.headers.get("Allow") !== "POST" ||
    !releaseHeadersMatch(head)
  )
    return `API HEAD HTTP ${head.status}, method or release mismatch`;
  const response = await get(endpoint, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({
      q: "How does a device with no browser sign in?",
    }),
  });
  if (response.status !== 200 || !releaseHeadersMatch(response))
    return `API POST HTTP ${response.status}, status or release mismatch`;
  const { results } = await response.json();
  if (
    !Array.isArray(results) ||
    !results.some(
      (result) =>
        typeof result.href === "string" &&
        /^\/(?!\/)/.test(result.href) &&
        new URL(result.href, origin).origin === origin,
    )
  )
    return "API POST did not return a guide result";
  return null;
}

export async function verifyPreview(
  origin,
  marker,
  { fetchPage = fetch, pause = sleep } = {},
) {
  let reason;
  for (let attempt = 0; attempt < 8; attempt++) {
    if (attempt) await pause(10_000);
    try {
      reason = await probe(origin, marker, fetchPage);
      if (!reason) return;
    } catch {
      reason = "preview request failed or returned an invalid response";
    }
  }
  throw new Error(`Preview verification failed: ${reason}.`);
}

async function upload(alias, marker) {
  const temp = await mkdtemp(join(tmpdir(), "guide-preview-"));
  const report = join(temp, "upload.ndjson");
  try {
    try {
      // The CLI's structured report is private to this invocation. Its console
      // output can contain account details, so only the validated URL is shown.
      await run(
        join(root, "node_modules/.bin/cf"),
        [
          "workers",
          "versions",
          "create",
          "--prebuilt",
          "--worker",
          worker,
          "--preview-alias",
          alias,
          "--message",
          `Guide preview ${alias} at ${marker.commit}`,
        ],
        {
          cwd: project,
          env: {
            ...process.env,
            WRANGLER_OUTPUT_FILE_PATH: report,
            NO_COLOR: "1",
            CF_NO_OSC_PROGRESS: "1",
            CI: "true",
          },
          timeout: 240000,
          maxBuffer: 4 * 1024 * 1024,
        },
      );
    } catch (error) {
      const status = Number.isInteger(error.code)
        ? ` (exit ${error.code})`
        : "";
      throw new Error(
        `Cloudflare preview version upload failed${status}. Check preview credentials and the existing preview Worker.`,
      );
    }
    return uploadedPreview(await readFile(report, "utf8"), alias);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

async function main() {
  const {
    PREVIEW_PR_NUMBER: number,
    PREVIEW_COMMIT: commit,
    CLOUDFLARE_ACCOUNT_ID: account,
    CLOUDFLARE_API_TOKEN: token,
  } = process.env;
  if (!account || !token)
    throw new Error(
      "Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN for the preview Worker.",
    );
  const readJSON = async (path) => {
    try {
      return JSON.parse(await readFile(join(prebuilt, path), "utf8"));
    } catch {
      throw new Error(`Missing or invalid preview build output: ${path}.`);
    }
  };
  const [settings, config, marker] = await Promise.all([
    readJSON("config.json"),
    readJSON("workers/default/worker.config.json"),
    readJSON("workers/default/assets/search/release.json"),
  ]);
  if (settings.settings?.accountId && settings.settings.accountId !== account)
    throw new Error(
      "The prebuilt configuration selects a different Cloudflare account.",
    );
  const alias = previewAlias(number, commit, marker, config);
  const origin = await upload(alias, marker);
  await verifyPreview(origin, marker);
  if (process.env.GITHUB_OUTPUT)
    await appendFile(process.env.GITHUB_OUTPUT, `url=${origin}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `[Open the verified guide preview](${origin})\n`,
    );
  console.log(origin);
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
