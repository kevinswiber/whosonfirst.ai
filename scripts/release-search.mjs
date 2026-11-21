// The site deploys independently. Recheck its public release marker and the
// head of main before the only operation that puts a version into service.
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { BUILT_ASSETS } from "./built-site.mjs";

const run = promisify(execFile);
const origin = "https://whosonfirst.ai";
const root = fileURLToPath(new URL("../", import.meta.url));
const worker = join(root, "workers/search");
const uuid = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}";
export function uploadedVersion(output) {
  const match = [
    ...output.matchAll(
      new RegExp(`Worker Version ID:\\s*(${uuid})(?=\\s|$)`, "gi"),
    ),
  ];
  if (match.length !== 1)
    throw new Error(
      "The CLI did not identify exactly one uploaded version. No activation attempted.",
    );
  return match[0][1];
}

export function sameRelease(local, remote) {
  return (
    /^[0-9a-f]{40}$/.test(local?.commit) &&
    /^[0-9a-f]{64}$/.test(local?.revision) &&
    remote?.commit === local.commit &&
    remote?.revision === local.revision
  );
}

async function cli(args) {
  try {
    // Reports can contain account-specific information. Only the version ID is
    // needed to select the upload, and no CLI data is printed by this helper.
    const { stdout, stderr } = await run(
      join(root, "node_modules/.bin/cf"),
      args,
      {
        cwd: worker,
        env: {
          ...process.env,
          NO_COLOR: "1",
          CI: "true",
          CF_NO_OSC_PROGRESS: "1",
        },
        timeout: 120000,
      },
    );
    return `${stdout}\n${stderr}`;
  } catch {
    throw new Error(
      `Cloudflare ${args.slice(0, 3).join(" ")} failed. Check the production environment’s credentials and Worker deployment history.`,
    );
  }
}

async function mainIsCurrent(commit) {
  const { stdout } = await run(
    "git",
    ["ls-remote", "--exit-code", "origin", "refs/heads/main"],
    { cwd: root, timeout: 15000 },
  );
  if (stdout.split(/\s/)[0] !== commit)
    throw new Error(
      "Another commit is now on main. Use the release run for its current head.",
    );
}

async function liveMatches(local) {
  try {
    const url = new URL("/search/release.json", origin);
    url.searchParams.set("check", Date.now().toString());
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    return response.ok && sameRelease(local, await response.json());
  } catch {
    return false;
  }
}

async function requireLive(local, wait) {
  const until = Date.now() + (wait ? 10 * 60_000 : 0);
  for (;;) {
    await mainIsCurrent(local.commit);
    if (await liveMatches(local)) return;
    if (Date.now() >= until)
      throw new Error(
        "The published guide does not match this build’s commit and passage revision.",
      );
    await sleep(15000);
  }
}

async function smoke(local) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      // The search address, as the search box asks it. Workers Cache keeps
      // answers for each deployed version, so the new version answers.
      const address = new URL("/search", origin);
      address.search = new URLSearchParams({
        q: "How does a device with no browser sign in?",
        format: "json",
      }).toString();
      const response = await fetch(address, {
        headers: { Accept: "application/json" },
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      });
      if (
        response.ok &&
        response.headers.get("X-Guide-Search-Commit") === local.commit &&
        response.headers.get("X-Guide-Search-Revision") === local.revision
      ) {
        const { results } = await response.json();
        if (
          Array.isArray(results) &&
          results.some(
            (r) =>
              typeof r.href === "string" &&
              r.href.startsWith("/") &&
              new URL(r.href, origin).origin === origin,
          )
        )
          return;
      }
    } catch {
      /* A newly activated version may still be propagating. */
    }
    if (attempt < 5) await sleep(10000);
  }
  throw new Error(
    "Search was activated but the same-origin route did not return results from that release. Check the route and deployment, then retry or roll back.",
  );
}

async function main(mode) {
  if (!["wait", "publish"].includes(mode))
    throw new Error("Use wait or publish.");
  const marker = JSON.parse(
    await readFile(join(BUILT_ASSETS, "search/release.json"), "utf8"),
  );
  const { stdout } = await run("git", ["rev-parse", "HEAD"], { cwd: root });
  if (
    !sameRelease(marker, marker) ||
    marker.commit !== stdout.trim() ||
    marker.commit !== process.env.GITHUB_SHA
  )
    throw new Error(
      "Checkout, event and local site build must identify the same commit.",
    );
  if (mode === "wait") {
    await requireLive(marker, true);
    console.log("The published guide matches this build.");
    return;
  }
  await requireLive(marker, false);
  const built = JSON.parse(
    await readFile(
      join(worker, ".cloudflare/output/v1/workers/default/worker.config.json"),
      "utf8",
    ),
  );
  const name = process.env.SEARCH_WORKER_NAME || "whosonfirst-ai-search";
  if (
    built.name !== name ||
    !process.env.CLOUDFLARE_ACCOUNT_ID ||
    !process.env.CLOUDFLARE_API_TOKEN
  )
    throw new Error(
      "Check the built search Worker name and production credentials.",
    );
  const output = await cli([
    "workers",
    "versions",
    "create",
    "--prebuilt",
    "--message",
    `Guide search for ${marker.commit}`,
  ]);
  const id = uploadedVersion(output);
  await requireLive(marker, false);
  await cli([
    "workers",
    "deployments",
    "create",
    "--worker",
    name,
    "--strategy",
    "percentage",
    "--versions",
    JSON.stringify([{ version_id: id, percentage: 100 }]),
  ]);
  await smoke(marker);
  console.log(
    "The same-origin search route returned passages from this release.",
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv[2]).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
