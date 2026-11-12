/**
 * What a script that reads the built site asks before it does anything else:
 * is the build there, and was it made after the last change to its sources?
 *
 * rendered-check.mjs, readme-figure.mjs and social-assets.mjs all read
 * dist/client/, and none of them builds it. Run on a build made before the
 * last change, each would do its work on the site as it was then: the checks
 * could pass where the site as it is now would fail, and a picture would show
 * a list of flows that is one short. Nothing in what they print or draw would
 * say so, so each of them stops here first.
 *
 * This file is imported, not run. Continuous integration builds and then
 * checks, so it only ever stops a run made by hand.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL("../", import.meta.url));
/** Where everything the site is built from is kept. */
const SOURCES = ["src", "public"];

/**
 * Returns if the build is there and nothing under src/ or public/ has changed
 * since it was made. Otherwise it names a file that has, says how many more
 * there are, and ends the script with exit code 1.
 *
 * `stale` is one sentence, said after that: what this script would get wrong
 * if it went on with the old build.
 */
export function requireCurrentBuild(stale) {
  const home = join(here, "dist", "client", "index.html");
  if (!existsSync(home)) {
    console.error("dist/client/ is missing. Run `npm run build` first.");
    process.exit(1);
  }
  const built = statSync(home).mtimeMs;
  const newer = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (statSync(file).mtimeMs > built) newer.push(relative(here, file));
    }
  };
  for (const dir of SOURCES) walk(join(here, dir));
  if (!newer.length) return;
  console.error(
    `The built site is older than its sources: ${newer[0]}${newer.length > 1 ? ` and ${newer.length - 1} more` : ""} changed after the last build.\n${stale} Run \`npm run build\` first.`,
  );
  process.exit(1);
}
