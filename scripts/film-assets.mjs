#!/usr/bin/env node
/**
 * Keeps what a film is made from, and what was made, where it will last: the
 * R2 bucket named in film-assets/index.json. A reading by a voice costs
 * credits to make, and a cut takes minutes, so neither is made twice.
 *
 *   node scripts/film-assets.mjs            what is here, against the index
 *   node scripts/film-assets.mjs record     write each file's size and hash into the index
 *   node scripts/film-assets.mjs push       send what is new or changed to the bucket
 *   node scripts/film-assets.mjs pull       fetch what the index lists and is not here
 *   node scripts/film-assets.mjs pull flows/dpop/cuts/10    only what is under that
 *
 * film-assets/ is this repository's copy of the bucket. Its index.json and
 * README.md are committed, and say what every file is and which cut is the
 * latest. The files themselves are not committed: they are in the bucket.
 *
 * It uses Wrangler, as the site's deploys do, so it needs what Wrangler
 * needs: `npx wrangler login` on a person's machine, or CLOUDFLARE_API_TOKEN
 * and CLOUDFLARE_ACCOUNT_ID where there is nobody to log in. The token needs
 * Workers R2 Storage: Edit. A token for one bucket alone does not work here:
 * those are for R2's S3 interface, which Wrangler does not use.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL("../", import.meta.url));
const store = join(here, "film-assets");
const indexFile = join(store, "index.json");
const index = JSON.parse(readFileSync(indexFile, "utf8"));
const [command = "check", under = ""] = process.argv.slice(2);

const TYPES = {
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".vtt": "text/vtt; charset=utf-8",
  ".srt": "application/x-subrip; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

/** Every file the index lists, wherever in it: each is an object with a `key`. */
function listed(node, found = []) {
  if (Array.isArray(node)) for (const item of node) listed(item, found);
  else if (node && typeof node === "object") {
    if (typeof node.key === "string") found.push(node);
    for (const value of Object.values(node)) listed(value, found);
  }
  return found;
}
const files = listed(index);
const hashOf = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

/** Every file under film-assets/, as the bucket would name it. */
function present(dir = store, found = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) present(path, found);
    else found.push(relative(store, path).split("\\").join("/"));
  }
  return found;
}

function wrangler(args, quiet = true) {
  const ran = spawnSync(
    "npx",
    ["wrangler", "r2", "object", ...args, "--remote"],
    {
      cwd: here,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (ran.status !== 0 && !quiet)
    console.error(ran.stderr.trim() || ran.stdout.trim());
  return ran.status === 0;
}
const put = (key, path) =>
  wrangler(
    [
      "put",
      `${index.bucket}/${key}`,
      "--file",
      path,
      "--content-type",
      TYPES[extname(key)] ?? "application/octet-stream",
    ],
    false,
  );
const get = (key, path, quiet = false) => {
  mkdirSync(dirname(path), { recursive: true });
  return wrangler(["get", `${index.bucket}/${key}`, "--file", path], quiet);
};

if (command === "check") {
  const names = new Set(files.map((f) => f.key));
  let wrong = 0;
  for (const file of files) {
    const path = join(store, file.key);
    if (!existsSync(path)) {
      console.log(`not here    ${file.key}`);
    } else if (!file.sha256) {
      wrong++;
      console.log(`no hash     ${file.key}`);
    } else if (hashOf(path) !== file.sha256) {
      wrong++;
      console.log(`changed     ${file.key}`);
    }
  }
  for (const key of present())
    if (!names.has(key) && !["index.json", "README.md"].includes(key)) {
      wrong++;
      console.log(`not listed  ${key}`);
    }
  const here_ = files.filter((f) => existsSync(join(store, f.key))).length;
  console.log(
    `${files.length} files in the index, ${here_} of them here. ${wrong ? `${wrong} to put right: a file that is not listed goes in the index, and a changed or unhashed one is recorded with "record".` : "Nothing is out of step."}`,
  );
  process.exit(wrong ? 1 : 0);
} else if (command === "record") {
  let written = 0;
  for (const file of files) {
    const path = join(store, file.key);
    if (!existsSync(path)) continue;
    const [bytes, sha256] = [statSync(path).size, hashOf(path)];
    if (file.bytes !== bytes || file.sha256 !== sha256) written++;
    file.bytes = bytes;
    file.sha256 = sha256;
  }
  writeFileSync(indexFile, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`${written} files recorded in film-assets/index.json.`);
} else if (command === "push") {
  // What the bucket has is what its own index says it has.
  const scratch = mkdtempSync(join(tmpdir(), "film-assets-"));
  const theirs = join(scratch, "index.json");
  const there = new Map(
    get("index.json", theirs, true)
      ? listed(JSON.parse(readFileSync(theirs, "utf8"))).map((f) => [
          f.key,
          f.sha256,
        ])
      : [],
  );
  let sent = 0;
  for (const file of files) {
    const path = join(store, file.key);
    if (!existsSync(path) || !file.key.startsWith(under)) continue;
    if (hashOf(path) !== file.sha256)
      throw new Error(
        `${file.key} is not the file the index describes. Run "record" first.`,
      );
    if (there.get(file.key) === file.sha256) continue;
    process.stdout.write(`sending ${file.key} … `);
    if (!put(file.key, path)) process.exit(1);
    console.log("sent");
    sent++;
  }
  // the index goes last, so it never lists what is not there yet
  for (const key of ["README.md", "index.json"])
    if (!put(key, join(store, key))) process.exit(1);
  console.log(`${sent} files sent to ${index.bucket}, and its index.`);
} else if (command === "pull") {
  let fetched = 0;
  for (const file of files) {
    const path = join(store, file.key);
    if (!file.key.startsWith(under)) continue;
    if (existsSync(path) && hashOf(path) === file.sha256) continue;
    process.stdout.write(`fetching ${file.key} … `);
    if (!get(file.key, path)) process.exit(1);
    if (file.sha256 && hashOf(path) !== file.sha256)
      throw new Error(
        `${file.key} came back different from what the index describes`,
      );
    console.log("here");
    fetched++;
  }
  console.log(`${fetched} files fetched from ${index.bucket}.`);
} else {
  throw new Error(
    `film-assets takes check, record, push or pull, not ${command}`,
  );
}
