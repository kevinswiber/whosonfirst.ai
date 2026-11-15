#!/usr/bin/env node
/**
 * A flow as a short film: the problem it answers, its steps one at a time,
 * and what it does not protect. A pilot, for one flow, of something to post
 * where a video is watched and not read.
 *
 *   npm run build && node scripts/flow-film.mjs --flow dpop
 *   node scripts/flow-film.mjs --flow dpop --stills 2,12,30     pictures at those seconds, and no video
 *
 * Writes to social/, which is not committed:
 *
 *   film-<slug>.mp4            1920 × 1080, 30 frames a second
 *   film-<slug>.vtt, .srt      what is said, while it is said
 *
 * What is said is in scripts/films/<slug>.mjs, written for the ear and held
 * to what the flow's page says. What is drawn is the flow's own data: its
 * parties, each step's arrow and label, the lines of its listings, and what a
 * party comes to hold. scripts/film-stage.js draws it.
 *
 * A film is made a frame at a time. The stage is a page that can be put at
 * any second, and each frame is a photograph of it at its own: nothing waits
 * on a clock, so the same film comes out every time. A beat lasts as long as
 * its words take to say, at SPEAK words a second. When there is a voice, each
 * beat will last as long as its recording, and nothing else here changes.
 *
 * Needs Chromium for Playwright and ffmpeg on the path.
 */
import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { requireCurrentBuild } from "./built-site.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args[i + 1];
};
const SLUG = option("--flow") ?? "dpop";
const STILLS = option("--stills")?.split(",").map(Number);

const here = fileURLToPath(new URL("../", import.meta.url));
const site = join(here, "dist", "client");
const out = join(here, "social");

/** Frames a second. */
const FPS = 30;
/** Words said in a second, at the pace of someone explaining. */
const SPEAK = 2.5;
/** The breath after a sentence. */
const BREATH = 0.7;
/** The least a beat lasts, by what has to happen on the stage while it is told. */
const LEAST = {
  spend: 4.4,
  copy: 4.6,
  steal: 4.6,
  title: 5,
  refuse: 6.6,
  caveat: 5.6,
  end: 4,
  step: 3,
  listing: 6,
};

requireCurrentBuild("The film would be of the flow as it was then.");

// ---------- what is told ----------
const { default: script } = await import(`./films/${SLUG}.mjs`);
const data = await import(`../src/data/flows/${script.flow}.ts`);
const flow = Object.values(data).find((v) => v?.slug === script.flow);
if (!flow)
  throw new Error(
    `src/data/flows/${script.flow}.ts has no flow named ${script.flow}`,
  );

let clock = 0;
const beats = script.beats.map((beat) => {
  const words = beat.say ? beat.say.trim().split(/\s+/).length : 0;
  const least = beat.step
    ? beat.show
      ? LEAST.listing
      : LEAST.step
    : LEAST[beat.scene];
  if (least === undefined)
    throw new Error(`The stage has no scene named ${beat.scene}`);
  if (beat.step && !flow.steps[beat.step - 1])
    throw new Error(`${script.flow} has no step ${beat.step}`);
  const dur = Math.max(least, words / SPEAK + BREATH);
  const timed = { ...beat, start: clock, dur };
  clock += dur;
  return timed;
});
const duration = clock;
if (args.includes("--beats"))
  for (const b of beats)
    console.log(
      `${b.start.toFixed(1).padStart(5)}  ${b.dur.toFixed(1).padStart(4)}  ${b.step ? `step ${b.step}` : b.scene}`,
    );

// ---------- the built site, and the stage beside it ----------
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};
const home = readFileSync(join(site, "index.html"), "utf8");
const sheets = [...home.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(
  ([, href]) => href,
);
const stageJs = readFileSync(join(here, "scripts", "film-stage.js"), "utf8");
const stageHtml = (film) => `<!doctype html>
<html lang="en" data-theme="light">
<meta charset="utf-8">
${sheets.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n")}
<style>
  * { --move: translate(0px, 0px); }
  html, body { margin: 0; background: var(--bg); }
  #stage { position: relative; width: 1920px; height: 1080px; overflow: hidden; color: var(--fg); font-family: var(--font-body); }
  .lines { position: absolute; left: 0; top: 0; }
  .life { stroke: var(--role); stroke-width: 4; }
  .party, .held, .verdict, .place, .keystore { position: absolute; transform: translate(-50%, -50%) var(--move); }
  .party { width: 400px; height: 104px; box-sizing: border-box; border: 4px solid var(--role); background: var(--role-soft); border-radius: 10px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
  .party strong { font: 600 32px/1.2 var(--font-body); }
  .party.other { border: 4px dashed var(--border-strong); background: var(--bg-sunken); height: 96px; }
  .held { display: flex; align-items: center; gap: 10px; height: 54px; box-sizing: border-box; padding: 0 20px; border-radius: 30px; border: 3px solid var(--fg); background: var(--bg); font: 500 24px var(--font-mono); white-space: nowrap; }
  .held-key { border-color: var(--amber); background: var(--amber-soft); color: var(--amber); }
  .glyph { width: 30px; height: 30px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; }
  .held-bound i { display: grid; place-items: center; width: 38px; height: 38px; margin-right: -10px; border-radius: 50%; background: var(--amber-soft); color: var(--amber); border: 2px solid var(--amber); }
  .verdict { font: 600 28px var(--font-mono); padding: 8px 20px; border-radius: 8px; border: 3px solid; white-space: nowrap; }
  .verdict.ok { background: var(--green-soft); color: var(--green); }
  .verdict.no { background: var(--red-soft); color: var(--red); }
  .place { font: 500 24px var(--font-mono); padding: 6px 16px; border: 2px dashed var(--border-strong); border-radius: 6px; color: var(--fg-muted); background: var(--bg); }
  .keystore { width: 280px; height: 124px; box-sizing: border-box; border: 3px dashed var(--amber); border-radius: 10px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 6px; font: 500 20px var(--font-mono); color: var(--amber); }
  /* A row that has been told is muted: each of its colors goes most of the way
     to the page's, by --dim. It is not made see-through, or the lines behind
     it would show through it. */
  .row { position: absolute; left: 0; top: 0; width: 1920px; height: 0; transform: var(--move); --dim: 0;
    --ink: color-mix(in srgb, var(--bg) calc(var(--dim) * 68%), var(--fg));
    --hue: color-mix(in srgb, var(--bg) calc(var(--dim) * 68%), var(--role, var(--fg))); }
  .arrow { position: absolute; left: 0; top: -60px; overflow: visible; }
  .arrow line { stroke: var(--ink); stroke-width: 5; }
  .arrow .dashed { stroke-dasharray: 14 10; }
  .arrow .head { fill: var(--ink); }
  .says { position: absolute; top: -66px; transform: translateX(-50%); padding: 0 14px; background: var(--bg); color: var(--ink); font: 600 32px/1.3 var(--font-body); white-space: nowrap; }
  .badge { position: absolute; top: 0; transform: translate(-50%, -50%); width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; background: color-mix(in srgb, var(--bg) calc(var(--dim) * 68%), var(--role)); color: var(--bg); font: 600 26px var(--font-mono); }
  .self { position: absolute; top: 0; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 18px; padding: 9px 34px 9px 10px; border: 3px solid color-mix(in srgb, var(--bg) calc(var(--dim) * 68%), var(--role)); border-radius: 60px; background: var(--bg); color: var(--ink); font: 500 32px/1.2 var(--font-body); white-space: nowrap; }
  .self .badge { position: static; transform: none; }
  .tick { display: inline-block; transform: var(--move); margin-left: 4px; color: var(--green); font: 700 40px/1 var(--font-body); }
  .card { position: absolute; z-index: 10; transform: translateX(-50%) var(--move); width: 900px; box-sizing: border-box; padding: 16px 0; background: var(--bg-sunken); border: 2px solid var(--border); border-radius: 10px; }
  .code { position: relative; padding: 0 30px; font: 500 30px/1.7 var(--font-mono); white-space: pre; }
  .code i { position: absolute; inset: 0; opacity: 0; background: var(--accent-soft); border-left: 6px solid var(--accent); }
  .code span { position: relative; }
  .curtain { position: absolute; z-index: 50; left: 0; top: 0; width: 1920px; height: 812px; background: var(--bg); }
  .title-card { position: absolute; z-index: 51; left: 0; width: 1920px; top: 230px; text-align: center; }
  .title-card h1 { margin: 0; font: 600 170px/1.1 var(--font-display); letter-spacing: -0.03em; }
  .title-card p { margin: 18px 0 0; font: 400 46px/1.3 var(--font-body); color: var(--fg-muted); }
  .curtain.close { z-index: 70; height: 1080px; }
  .end-card { z-index: 71; top: 330px; }
  .end-card h1 { font-size: 110px; }
  .end-card .address { font: 500 44px var(--font-mono); color: var(--accent); margin-top: 40px; }
  .end-card .basis { font-size: 30px; margin-top: 30px; }
  .said { position: absolute; z-index: 60; left: 170px; width: 1580px; top: 822px; height: 200px; border-top: 2px solid var(--border); }
  .said p { position: absolute; inset: 0; margin: 0; display: grid; place-items: center; text-align: center; text-wrap: balance; font: 500 46px/1.3 var(--font-body); }
  .where { position: absolute; z-index: 61; left: 60px; top: 1034px; font: 400 21px var(--font-mono); color: var(--fg-subtle); }
</style>
<div id="stage"></div>
<script>window.FILM = ${JSON.stringify(film).replace(/</g, "\\u003c")};</script>
<script src="/__film/stage.js"></script>
<script>document.getElementById("stage").insertAdjacentHTML("beforeend", '<div class="where">' + window.FILM.address + "</div>");</script>
`;

let film;
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path === "/__film/") {
    res.writeHead(200, { "Content-Type": TYPES[".html"] });
    return res.end(stageHtml(film));
  }
  if (path === "/__film/stage.js") {
    res.writeHead(200, { "Content-Type": TYPES[".js"] });
    return res.end(stageJs);
  }
  let file = join(site, normalize(path));
  if (!file.startsWith(site)) file = site;
  if (existsSync(file) && statSync(file).isDirectory())
    file = join(file, "index.html");
  if (!existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, {
    "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
  });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  colorScheme: "light",
});
const page = await context.newPage();
const problems = [];
page.on("pageerror", (error) => problems.push(error.message));

// what the film says of itself at its end is read from the page, as its other facts are
await page.goto(`${origin}/flows/${flow.slug}/`, { waitUntil: "networkidle" });
const basis = await page.evaluate(
  () =>
    document
      .querySelector(".page-facts .doc-line")
      ?.textContent.replace(/\s+/g, " ")
      .trim() ?? "",
);
film = {
  flow,
  beats,
  duration,
  address: `whosonfirst.ai/flows/${flow.slug}`,
  basis,
};

await page.goto(`${origin}/__film/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

mkdirSync(out, { recursive: true });
const name = `film-${flow.slug}`;

if (STILLS) {
  for (const t of STILLS) {
    await page.evaluate((s) => window.seek(s), t);
    const file = join(out, `${name}-at-${String(t).padStart(3, "0")}.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
} else {
  const made = spawn(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-framerate",
      String(FPS),
      "-i",
      "-",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "18",
      "-preset",
      "medium",
      "-movflags",
      "+faststart",
      join(out, `${name}.mp4`),
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const done = new Promise((resolve) => made.on("close", resolve));
  const frames = Math.ceil(duration * FPS);
  let last;
  let picture;
  let drawn = 0;
  for (let i = 0; i < frames; i++) {
    // a frame like the one before it is not photographed again
    const now = await page.evaluate((s) => window.seek(s), i / FPS);
    if (now !== last) {
      picture = await page.screenshot({ type: "png" });
      last = now;
      drawn++;
    }
    if (!made.stdin.write(picture))
      await new Promise((resolve) => made.stdin.once("drain", resolve));
  }
  made.stdin.end();
  const code = await done;
  if (code !== 0) {
    console.error("ffmpeg did not finish the film.");
    process.exitCode = 1;
  }

  // what is said, while it is said
  const stamp = (s, mark) => {
    const ms = Math.round(s * 1000);
    const part = (n, width = 2) => String(n).padStart(width, "0");
    return `${part(Math.floor(ms / 3600000))}:${part(Math.floor(ms / 60000) % 60)}:${part(Math.floor(ms / 1000) % 60)}${mark}${part(ms % 1000, 3)}`;
  };
  const spoken = beats.filter((b) => b.say);
  writeFileSync(
    join(out, `${name}.vtt`),
    `WEBVTT\n\n${spoken.map((b, i) => `${i + 1}\n${stamp(b.start, ".")} --> ${stamp(b.start + b.dur - 0.2, ".")}\n${b.say}\n`).join("\n")}`,
  );
  writeFileSync(
    join(out, `${name}.srt`),
    spoken
      .map(
        (b, i) =>
          `${i + 1}\n${stamp(b.start, ",")} --> ${stamp(b.start + b.dur - 0.2, ",")}\n${b.say}\n`,
      )
      .join("\n"),
  );
  const words = spoken.reduce(
    (n, b) => n + b.say.trim().split(/\s+/).length,
    0,
  );
  console.log(
    `${name}.mp4: ${duration.toFixed(1)} seconds, ${words} words said, ${drawn} of ${frames} frames drawn`,
  );
}
if (spawnSync("true").error) process.exitCode = 1;
await browser.close();
server.close();
