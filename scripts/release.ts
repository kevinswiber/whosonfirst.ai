// Release the guide: one Worker serves the pages and answers a search, so one
// deployment puts both into service. The release workflow runs this twice.
//
//   check   before anything is uploaded: the build is this commit, it has
//           search, and the commit is still the head of main
//   deploy  after the passages are indexed: deploy the build, wait until
//           this build is the one answering a search, then ask the site for
//           a search and see that this release answers. In a run
//           that does not index (INDEX=false), made while AI Search cannot
//           be reached, a search cannot answer: the site is asked for its
//           release marker and no more
//
// The passages are indexed first because a search shows only the passages in
// its own build: the site being replaced does not see the new ones, and the
// new site finds its own from its first search.
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { promisify, stripVTControlCharacters } from "node:util";
import { BUILT_ASSETS, WORKER_BUILD } from "./built-site.mjs";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));

/** What the build writes at /search/release.json. */
export interface Marker {
  commit: string;
  revision: string;
}

/** The part of the built Worker’s configuration that search is declared in. */
export interface BuiltWorker {
  env?: Record<string, { type?: string } | undefined>;
  exports?: Record<
    string,
    { type?: string; cache?: { enabled?: boolean } } | undefined
  >;
}

/** Whether the site is serving this build: the same commit and passages. */
export function sameRelease(marker: Marker, live: unknown): boolean {
  const { commit, revision } = (live ?? {}) as Partial<Marker>;
  return commit === marker.commit && revision === marker.revision;
}

/** A build made from a commit, with the digest of its passages. */
export function releasable(marker: unknown): marker is Marker {
  const { commit, revision } = (marker ?? {}) as Partial<Marker>;
  return (
    typeof commit === "string" &&
    typeof revision === "string" &&
    /^[0-9a-f]{40}$/.test(commit) &&
    /^[0-9a-f]{64}$/.test(revision)
  );
}

/**
 * What the built Worker is missing to answer a search, by name. The build
 * leaves search out when its limiter is not set, and the release must not
 * put a site without search in the place of one that has it.
 */
export function missingFromSearch(config: BuiltWorker | undefined): string[] {
  const kinds = {
    AI_SEARCH: "ai-search-namespace",
    SEARCH_INSTANCE: "text",
    SEARCH_LIMITER: "rate-limit",
    SEARCH_DAILY_BUDGET: "secret",
  };
  const missing = Object.entries(kinds)
    .filter(([name, type]) => config?.env?.[name]?.type !== type)
    .map(([name]) => name);
  if (config?.exports?.Search?.cache?.enabled !== true) missing.push("Search");
  if (config?.exports?.SearchBudget?.type !== "durable-object")
    missing.push("SearchBudget");
  return missing;
}

/** The site's own address, as the build's sitemap gives it. */
export function siteOrigin(sitemap: string): string {
  const first = /<loc>([^<]+)<\/loc>/.exec(sitemap)?.[1];
  if (!first) throw new Error("The built sitemap lists no page.");
  return new URL(first).origin;
}

/**
 * Whether the part of the Worker that answers a search is this build: every
 * answer it sends, a refusal too, carries the commit and passages it was
 * built from.
 */
export function servedBy(marker: Marker, response: Response): boolean {
  return (
    response.headers.get("X-Guide-Search-Commit") === marker.commit &&
    response.headers.get("X-Guide-Search-Revision") === marker.revision
  );
}

/** Whether an answer to a search came from this release, with a passage. */
export async function answeredBy(
  marker: Marker,
  origin: string,
  response: Response,
): Promise<boolean> {
  if (!response.ok || !servedBy(marker, response)) return false;
  const { results } = (await response.json()) as { results?: unknown };
  return (
    Array.isArray(results) &&
    results.some(
      (r: { href?: unknown }) =>
        typeof r.href === "string" &&
        r.href.startsWith("/") &&
        new URL(r.href, origin).origin === origin,
    )
  );
}

/**
 * What the CLI said when it failed, fit for a public log: its last lines,
 * with what names the account taken out, and the search limit, which the
 * CLI lists with the Worker’s bindings and the release keeps out of the log.
 * A deployment that fails and says nothing cannot be put right, and the log
 * is all a run leaves behind.
 */
export function failureReport(output: string): string {
  return stripVTControlCharacters(output)
    .replace(/\d+ requests\/\d+s/g, "<limit>")
    .replace(/\b[0-9a-f]{32}\b/gi, "<id>")
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "<address>")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(-40)
    .join("\n");
}

async function mainIsCurrent(commit: string) {
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

/**
 * What the CLI is asked to do. Where the Worker was last changed in the
 * dashboard and the build would undo part of that, the CLI stops and names
 * the difference. `force` is the answer that the build is right: a run by
 * hand gives it, after someone has read the difference. A push never does.
 */
export function deployArguments(commit: string, force: boolean): string[] {
  return [
    "deploy",
    "--prebuilt",
    "--message",
    `Guide at ${commit}`,
    ...(force ? ["--force"] : []),
  ];
}

async function deploy(commit: string) {
  try {
    // The CLI's report can name the account. Nothing it prints is shown
    // when it succeeds.
    await run(
      join(root, "node_modules/.bin/cf"),
      deployArguments(commit, process.env.FORCE === "true"),
      {
        cwd: root,
        env: {
          ...process.env,
          NO_COLOR: "1",
          CI: "true",
          CF_NO_OSC_PROGRESS: "1",
        },
        timeout: 300000,
      },
    );
  } catch (error) {
    const { stdout = "", stderr = "" } = error as {
      stdout?: string;
      stderr?: string;
    };
    const said = failureReport(`${stdout}\n${stderr}`);
    if (said) console.error(`What the CLI said, at its end:\n${said}\n`);
    throw new Error(
      "Cloudflare did not deploy the guide. Check the release environment’s credentials and the Worker’s deployment history.",
    );
  }
}

/** Asks the site until `answers` says yes, ten seconds apart: five times, or `tries`. */
async function eventually(answers: () => Promise<boolean>, tries = 5) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      if (await answers()) return true;
    } catch {
      /* A newly deployed version may still be propagating. */
    }
    if (attempt < tries) await sleep(10000);
  }
  return false;
}

/**
 * A request the search refuses by itself: two questions. The refusal costs
 * no search, is counted against nothing and is never kept, and like every
 * answer it says which build sent it.
 */
export const WHO_ANSWERS = "/search?q=release&q=check&format=json";

/**
 * Waits until this build is the one answering a search, for up to six
 * minutes. A deployment is in service at once, but for a while after it a
 * search can still be answered by the build before: on 21 November 2026 the
 * new page handler handed the first search after a deployment to the earlier
 * build's search, and it was the new build's four minutes later. Cloudflare
 * says code updates reach its network over time, and that an active Durable
 * Object can keep its code for five minutes:
 * https://developers.cloudflare.com/durable-objects/platform/known-issues/#code-updates
 *
 * The real search waits for this. Asked sooner, it is answered by the
 * earlier build, that answer is kept, and every later try is given it again.
 */
async function newBuildAnswers(marker: Marker, origin: string) {
  const answering = await eventually(async () => {
    const response = await fetch(new URL(WHO_ANSWERS, origin), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    return servedBy(marker, response);
  }, 36);
  if (!answering)
    throw new Error(
      "The guide was deployed, but after six minutes a search is still not answered by this build. Check the Worker’s deployment history, then retry or go back.",
    );
}

/** The pages alone: the site's release marker is this build's. */
async function pagesAreLive(marker: Marker, origin: string) {
  const live = await eventually(async () => {
    const address = new URL("/search/release.json", origin);
    // The file is sent no-store. This is for anything in between.
    address.searchParams.set("check", Date.now().toString());
    const response = await fetch(address, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    return response.ok && sameRelease(marker, await response.json());
  });
  if (!live)
    throw new Error(
      "The guide was deployed, but the site does not serve this commit and its passages. Check the Worker’s deployment history, then retry or go back.",
    );
}

async function smoke(marker: Marker, origin: string) {
  const answered = await eventually(async () => {
    // The search address, as the search box asks it. This build is the one
    // answering by now, and Workers Cache keeps answers for each build, so
    // none from the build before is given back.
    const address = new URL("/search", origin);
    address.search = new URLSearchParams({
      q: "How does a device with no browser sign in?",
      format: "json",
    }).toString();
    const response = await fetch(address, {
      headers: { Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    return answeredBy(marker, origin, response);
  });
  if (!answered)
    throw new Error(
      "The guide was deployed, but a search did not return passages from this release. Check the Worker’s deployment and its SEARCH_DAILY_BUDGET secret, then retry or go back.",
    );
}

async function main(mode: string | undefined) {
  if (mode !== "check" && mode !== "deploy")
    throw new Error("Use check or deploy.");
  const marker: unknown = JSON.parse(
    readFileSync(join(BUILT_ASSETS, "search/release.json"), "utf8"),
  );
  const { stdout } = await run("git", ["rev-parse", "HEAD"], { cwd: root });
  if (
    !releasable(marker) ||
    marker.commit !== stdout.trim() ||
    marker.commit !== process.env.GITHUB_SHA
  )
    throw new Error(
      "Checkout, event and local site build must identify the same commit.",
    );
  const missing = missingFromSearch(
    JSON.parse(readFileSync(join(WORKER_BUILD, "worker.config.json"), "utf8")),
  );
  if (missing.length)
    throw new Error(
      `The site was built without search: ${missing.join(", ")}. Set SEARCH_RATE_NAMESPACE and SEARCH_RATE_LIMIT where it is built.`,
    );
  await mainIsCurrent(marker.commit);
  if (mode === "check") {
    console.log("This build is the head of main, and it has search.");
    return;
  }
  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN)
    throw new Error("Set the release environment’s Cloudflare credentials.");
  const origin = siteOrigin(
    readFileSync(join(BUILT_ASSETS, "sitemap.xml"), "utf8"),
  );
  await deploy(marker.commit);
  if (process.env.INDEX === "false") {
    await pagesAreLive(marker, origin);
    console.log(
      "The guide is deployed and serves this commit. No search was asked: this run did not index.",
    );
    return;
  }
  await newBuildAnswers(marker, origin);
  await smoke(marker, origin);
  console.log("The guide is deployed, and a search returned its passages.");
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv[2]).catch((error: Error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
