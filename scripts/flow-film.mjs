#!/usr/bin/env node
/**
 * A flow as a short film: the question it answers, its steps one at a time,
 * and what it does not protect. A pilot, for one flow, of something to post
 * where a video is watched and not read.
 *
 *   npm run build && node scripts/flow-film.mjs --flow dpop
 *   node scripts/flow-film.mjs --flow dpop --voice kokoro      said aloud, by scripts/film-voice.py
 *   node scripts/flow-film.mjs --flow dpop --voice hope --reading hope.mp3   said by a recording of the whole film, cut into its lines
 *   node scripts/flow-film.mjs --flow dpop --voice hope --room room.mp3   with the sound of a quiet room under the voice
 *   node scripts/flow-film.mjs --flow dpop --stills 2,12,30    pictures at those seconds, and no video
 *   node scripts/flow-film.mjs --flow dpop --beats             when each beat starts, and how long it lasts
 *   node scripts/flow-film.mjs --flow dpop --look flat         the page's white, with no shadows
 *   node scripts/flow-film.mjs --flow dpop --layout rows       the page's own drawing, a step to a row
 *   node scripts/flow-film.mjs --flow ciba --draft             a flow with no film yet, told in its steps' own titles
 *
 * Writes to social/, which is not committed:
 *
 *   film-<slug>.mp4            1920 × 1080, 30 frames a second; film-<slug>-voiced.mp4 with a voice
 *   film-<slug>.vtt, .srt      what is said, while it is said
 *   film-<slug>.txt            a description to paste under it, with its chapters
 *   voice/                     each line as it was said, kept so it is not said again
 *
 * A name also says what is not the usual: -rows, -flat or -depth, -draft.
 *
 * What is said is in scripts/films/<slug>.mjs, written for the ear and held
 * to what the flow's page says. What is drawn is the flow's own data: its
 * parties, what each step sends, the lines of its listings, and what a party
 * comes to hold. scripts/film-stage-fixed.js draws it with the parties
 * staying where they are, and scripts/film-stage.js as the page's rows.
 * docs/film-design.md has the measurements of both.
 *
 * A film is made a frame at a time. The stage is a page that can be put at
 * any second, and each frame is a photograph of it at its own: nothing waits
 * on a clock, so the same film comes out every time.
 *
 * A beat lasts as long as its words take to say. Without a voice that is
 * reckoned at SPEAK words a second, and the words are written under the
 * scene. With one, a beat lasts as long as its recording, what happens on the
 * stage happens at the word that names it, and the words are left off the
 * picture: said and written at once, they get in each other's way. They are
 * in the caption files either way. `--captions on` writes them on the
 * picture as well.
 *
 * Needs Chromium for Playwright and ffmpeg on the path. A voice needs a
 * Python that has Kokoro: see scripts/film-voice.py. Name it in FILM_PYTHON.
 */
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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
/**
 * Who says it: nobody, Kokoro, or a voice by any other name whose lines were
 * recorded. A recorded voice's lines are cut from one reading of the whole
 * film, given once with --reading, and kept.
 */
const VOICE = option("--voice");
const READING = option("--reading");
/** A line for the description under a film with a recorded voice, such as who or what the voice is. */
const VOICE_NOTE = option("--voice-note");
/**
 * The sound of a quiet room, laid under the voice for the whole film, so the
 * gaps between its lines are not the dead silence no recording has. A steady
 * recording with nothing happening in it, of any length: it is repeated, each
 * copy faded into the next. --room-level is how loud it is, in LUFS: far
 * under the voice, which is at -16.
 */
const ROOM = option("--room");
const ROOM_LEVEL = Number(option("--room-level") ?? -56);
/** Which of Kokoro's voices, and how fast it speaks. */
const KOKORO = { voice: option("--kokoro-voice") ?? "af_heart", speed: 1 };
/** Whether what is said is written under the scene: by default, only where nobody says it. */
const BAND = option("--captions") ? option("--captions") === "on" : !VOICE;
/**
 * How the stage is laid out. "fixed": the parties stay put with a line
 * between each two that speak, and only what is sent moves. "rows": the
 * page's drawing, a step to a row.
 */
const LAYOUT = option("--layout") ?? "fixed";
if (!["rows", "fixed"].includes(LAYOUT))
  throw new Error(`--layout is rows or fixed, not ${LAYOUT}`);
/**
 * How the stage looks. "depth": a tinted page that the parties and listings
 * sit above, with a shadow under what is on its way. "flat": the page's
 * white, and nothing casts a shadow. "paper": depth on a warmer page with a
 * faint grid of dots, tried on 16 November 2026. Depth is made for the fixed layout and
 * is the usual look there; the rows have only been looked at flat.
 */
const USUAL_LOOK = LAYOUT === "fixed" ? "depth" : "flat";
const LOOK = option("--look") ?? USUAL_LOOK;
if (!["flat", "depth", "paper"].includes(LOOK))
  throw new Error(`--look is flat, depth or paper, not ${LOOK}`);

const here = fileURLToPath(new URL("../", import.meta.url));
const site = join(here, "dist", "client");
const out = join(here, "social");

/** Frames a second. */
const FPS = 30;
/** Words said in a second, at the pace of someone explaining. */
const SPEAK = 2.5;
/** The breath after a sentence, and the moment before a voice starts on one. */
const BREATH = 0.7;
const LEAD = 0.2;
/** The least a beat lasts, by what has to happen on the stage while it is told. */
const LEAST = {
  ask: 4.6,
  spend: 4,
  copy: 4.6,
  steal: 3.6,
  title: 5,
  cast: 6,
  refuse: 6.6,
  caveat: 5,
  recap: 4,
  end: 4,
  step: 2.6,
  listing: 3.4,
};

requireCurrentBuild("The film would be of the flow as it was then.");

// ---------- what is told ----------
// A flow with no film of its own can still be looked at: as a draft, told
// in the titles the page gives its steps. A draft is for seeing how a flow
// sits on the stage before its film is written, and is not for posting.
const DRAFT =
  args.includes("--draft") ||
  !existsSync(join(here, "scripts", "films", `${SLUG}.mjs`));
const script = DRAFT
  ? { flow: SLUG, beats: [] }
  : (await import(`./films/${SLUG}.mjs`)).default;
if (DRAFT && VOICE) throw new Error("A draft is not said aloud");
const data = await import(`../src/data/flows/${script.flow}.ts`);
const flow = Object.values(data).find((v) => v?.slug === script.flow);
if (!flow)
  throw new Error(
    `src/data/flows/${script.flow}.ts has no flow named ${script.flow}`,
  );
if (LAYOUT === "fixed" && flow.participants.length > 4)
  throw new Error(
    `The fixed layout has places for four parties, and ${flow.slug} has ${flow.participants.length}. Use --layout rows, or see docs/film-design.md.`,
  );
if (DRAFT) {
  console.log(
    `A draft of ${flow.slug}, told in the titles of its steps: scripts/films/${SLUG}.mjs is not written, or --draft was asked for.`,
  );
  script.beats = [
    { scene: "title", say: flow.tagline },
    ...flow.steps.map((step, i) => {
      const listed = (step.code?.text ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 2)
        .slice(0, 2)
        .map((line) => ({ line }));
      return {
        step: i + 1,
        say: step.title ?? step.label,
        ...(step.gain ? { gain: true } : {}),
        ...(listed.length ? { show: listed } : {}),
      };
    }),
    { scene: "end" },
  ];
}

mkdirSync(join(out, "voice"), { recursive: true });

// ---------- how each line is said ----------
/** A line as a voice is given it: a word it would say wrong is written as it sounds. */
const spoken = (text) =>
  Object.entries(script.speak ?? {}).reduce(
    (line, [word, sound]) => line.replaceAll(word, sound),
    text,
  );
/** A word as the voice was given it, back as it is written: "jot" is JWT. */
const written = (said) => {
  const plain = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
  const found = Object.entries(script.speak ?? {}).find(
    ([, sound]) => plain(sound) === plain(said),
  );
  return found ? found[0] : said;
};
/**
 * Each line's recording: how long it is, and when each word starts. A line
 * is said once and kept, under a name made from its words and its voice, so
 * a film made again says only what has changed.
 */
function recordings(lines) {
  const kept = (text) => {
    const name = createHash("sha1")
      .update(
        JSON.stringify(
          VOICE === "kokoro"
            ? [VOICE, KOKORO, spoken(text)]
            : ["recorded", VOICE, spoken(text)],
        ),
      )
      .digest("hex")
      .slice(0, 16);
    return {
      wav: join(out, "voice", `${name}.wav`),
      json: join(out, "voice", `${name}.json`),
    };
  };
  const missing = lines.filter((text) => !existsSync(kept(text).json));
  const recorded = VOICE !== "kokoro";
  if (recorded && READING && !existsSync(READING))
    throw new Error(`There is no recording at ${READING}`);
  if (recorded && missing.length && !READING)
    throw new Error(
      `The voice ${VOICE} has not said ${missing.length} of the film's ${lines.length} lines, the first of them “${missing[0]}”. Give one recording of the whole film with --reading, or use --voice kokoro.`,
    );
  if (missing.length || (recorded && READING)) {
    const job = join(out, "voice", "job.json");
    // Kokoro says the lines that are new. A recording is of the whole film,
    // so every line is cut from it again.
    writeFileSync(
      job,
      JSON.stringify(
        recorded
          ? {
              reading: READING,
              lines: lines.map((text) => ({
                text: spoken(text),
                ...kept(text),
              })),
            }
          : {
              ...KOKORO,
              lines: missing.map((text) => ({
                text: spoken(text),
                ...kept(text),
              })),
            },
      ),
    );
    const script = recorded ? "film-voice-import.py" : "film-voice.py";
    const said = spawnSync(
      process.env.FILM_PYTHON ?? "python3",
      [join(here, "scripts", script), job],
      { stdio: ["ignore", "inherit", "inherit"] },
    );
    if (said.status !== 0) {
      console.error(
        `The voice did not finish. See scripts/${script} for what it needs.`,
      );
      process.exit(1);
    }
  }
  return new Map(
    lines.map((text) => [
      text,
      { ...kept(text), ...JSON.parse(readFileSync(kept(text).json, "utf8")) },
    ]),
  );
}
if (ROOM && !VOICE)
  throw new Error("--room goes under a voice: name one with --voice");
if (ROOM && !existsSync(ROOM))
  throw new Error(`There is no recording at ${ROOM}`);
if (READING && (!VOICE || VOICE === "kokoro"))
  throw new Error(
    "--reading is a recording of a voice: name the voice with --voice",
  );
const voiced = VOICE
  ? recordings(script.beats.filter((b) => b.say).map((b) => b.say))
  : undefined;

/** Where each word of a line starts when nobody says it: by how far into the line it is. */
function reckoned(say, length) {
  const words = [];
  for (const found of say.matchAll(/\S+/g))
    words.push({
      text: found[0],
      start: LEAD + (found.index / say.length) * length,
    });
  return words;
}

let clock = 0;
const beats = script.beats.map((beat, index) => {
  const count = beat.say ? beat.say.trim().split(/\s+/).length : 0;
  const least = beat.step
    ? beat.show
      ? LEAST.listing
      : LEAST.step
    : LEAST[beat.scene];
  if (least === undefined)
    throw new Error(`The stage has no scene named ${beat.scene}`);
  if (beat.step && !flow.steps[beat.step - 1])
    throw new Error(`${script.flow} has no step ${beat.step}`);
  const clip = beat.say ? voiced?.get(beat.say) : undefined;
  const length = clip ? clip.duration : count / SPEAK;
  // A step that has been told is given a moment before the next begins: a
  // little longer than the breath between two lines of the same step. A
  // recorded line already ends in the breath its reader took, so what is
  // added to it is short: more, and the film drags between its lines.
  const next = script.beats[index + 1];
  const boundary = !beat.step || next?.step !== beat.step;
  // `hold` is a beat's own extra time: for a moment worth looking at longer.
  const dur =
    Math.max(least, LEAD + length + (clip ? (boundary ? 0.4 : 0.12) : BREATH)) +
    (beat.hold ?? 0);
  const words = clip
    ? clip.words.map((w) => ({ text: written(w.text), start: LEAD + w.start }))
    : beat.say
      ? reckoned(beat.say, length)
      : [];
  const timed = { ...beat, start: clock, dur, words, clip: clip?.wav };
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
const stageJs = readFileSync(
  join(
    here,
    "scripts",
    LAYOUT === "fixed" ? "film-stage-fixed.js" : "film-stage.js",
  ),
  "utf8",
);
const stageHtml = (film) => `<!doctype html>
<html lang="en" data-theme="light">
<meta charset="utf-8">
${sheets.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n")}
<style>
  * { --move: translate(0px, 0px); }
  html, body { margin: 0; background: var(--bg); }
  #stage { position: relative; width: 1920px; height: 1080px; overflow: hidden; color: var(--fg); font-family: var(--font-body); }
  /* Where the words are not written under it, the scene has the whole height, and sits in the middle of it. */
  #scene { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; }
  .said-aloud #scene { transform: translateY(96px); }
  .said-aloud .said { display: none; }
  .said-aloud .curtain { top: -200px; height: 1400px; }
  .lines { position: absolute; left: 0; top: 0; }
  .life { stroke: var(--role); stroke-width: 4; }
  .party, .held, .verdict, .place, .keystore { position: absolute; transform: translate(-50%, -50%) var(--move); }
  .party { width: 400px; height: 104px; box-sizing: border-box; border: 4px solid var(--role); background: var(--role-soft); border-radius: 10px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
  .party strong { font: 600 32px/1.2 var(--font-body); }
  .party.other { border: 4px dashed var(--border-strong); background: var(--bg-sunken); height: 96px; }
  .held { z-index: 2; display: flex; align-items: center; justify-content: center; gap: 10px; width: 280px; height: 54px; box-sizing: border-box; padding: 0 20px; border-radius: 30px; border: 3px solid var(--fg); background: var(--bg); font: 500 24px var(--font-mono); white-space: nowrap; }
  .held-key { border-color: var(--amber); background: var(--amber-soft); color: var(--amber); }
  .glyph { width: 30px; height: 30px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; }
  .held-bound i { display: grid; place-items: center; width: 38px; height: 38px; margin-right: -10px; border-radius: 50%; background: var(--amber-soft); color: var(--amber); border: 2px solid var(--amber); }
  .verdict { font: 600 28px var(--font-mono); padding: 8px 20px; border-radius: 8px; border: 3px solid; white-space: nowrap; }
  .verdict.ok { background: var(--green-soft); color: var(--green); }
  .verdict.no { background: var(--red-soft); color: var(--red); }
  .verdict.open { background: var(--bg); color: var(--fg); font-size: 40px; padding: 2px 22px; }
  .held.large { width: 410px; height: 84px; padding: 0 34px; font-size: 38px; border-width: 4px; border-radius: 50px; }
  .held.large .glyph { width: 46px; height: 46px; }
  .cargo { position: absolute; z-index: 3; top: 0; transform: translate(-50%, -50%) var(--move); display: flex; gap: 10px; }
  .sent { display: flex; align-items: center; gap: 8px; height: 46px; box-sizing: border-box; padding: 0 16px; border-radius: 24px; border: 3px solid var(--fg); background: var(--bg); font: 500 21px var(--font-mono); white-space: nowrap; }
  .sent i { display: grid; place-items: center; width: 32px; height: 32px; margin-right: -8px; border-radius: 50%; background: var(--amber-soft); color: var(--amber); border: 2px solid var(--amber); }
  .sent .glyph { width: 24px; height: 24px; }
  .sent-proof { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
  .sent-missing { border: 3px dashed var(--border-strong); color: var(--fg-subtle); }
  .sent-ok { border-color: var(--green); background: var(--green-soft); color: var(--green); }
  .heading { position: absolute; z-index: 40; left: 130px; top: 58px; display: grid; gap: 6px; }
  .heading small { font: 500 20px var(--font-mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--fg-subtle); }
  .heading strong { font: 600 42px/1.15 var(--font-body); }
  .gloss { position: absolute; transform: translate(-50%, -50%) var(--move); display: flex; align-items: baseline; gap: 16px; padding: 8px 22px; border: 2px dashed var(--border-strong); border-radius: 8px; background: var(--bg); white-space: nowrap; }
  .gloss b { font: 600 34px var(--font-mono); }
  .gloss span { font: 400 30px var(--font-body); color: var(--fg-muted); }
  .place { font: 500 24px var(--font-mono); padding: 6px 16px; border: 2px dashed var(--border-strong); border-radius: 6px; color: var(--fg-muted); background: var(--bg); }
  .keystore { background: var(--bg); width: 320px; height: 124px; box-sizing: border-box; border: 3px dashed var(--amber); border-radius: 10px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 6px; font: 500 20px var(--font-mono); color: var(--amber); }
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
  .title-card .expands { margin: 4px 0 26px; font: 500 34px/1.3 var(--font-mono); color: var(--fg); }
  .curtain.close { z-index: 70; height: 1080px; }
  .end-card { z-index: 71; top: 330px; }
  .end-card h1 { font-size: 110px; }
  .said-aloud .end-card { top: 234px; }
  .end-card .descriptor { font-size: 40px; margin-top: 22px; }
  .end-card .address { font: 500 44px var(--font-mono); color: var(--accent); margin-top: 56px; }
  .end-card .standards { font-size: 30px; margin: 28px auto 0; max-width: 1500px; text-wrap: balance; }
  .said { position: absolute; z-index: 60; left: 170px; width: 1580px; top: 822px; height: 200px; border-top: 2px solid var(--border); }
  .said p { position: absolute; inset: 0; margin: 0; display: grid; place-items: center; text-align: center; text-wrap: balance; font: 500 46px/1.3 var(--font-body); }
  /* What only the fixed layout has: a tall agent, a line to each other party, what a party does by itself, and the strip of steps. */
  .party.tall { justify-content: flex-start; padding-top: 26px; }
  .channel { fill: none; stroke: var(--border-strong); stroke-width: 5; transform: var(--move); }
  .aim { fill: none; stroke: var(--role); stroke-width: 6; }
  .aim-head { fill: var(--role); }
  .aim-head.other { fill: var(--border-strong); }
  .cargo { --lift: 0; }
  .tall ~ .keystore { width: 328px; height: 136px; }
  .tall ~ .card { width: 820px; }
  .tall ~ .card .code { padding: 0 26px; }
  .badge.inline { position: static; transform: none; flex: none; --dim: 0; }
  .cargo { align-items: center; }
  .cargo .badge.inline { width: 46px; height: 46px; font-size: 23px; }
  .act { position: absolute; z-index: 4; transform: translateY(-50%) var(--move); display: flex; align-items: center; gap: 18px; padding: 9px 34px 9px 10px; border: 3px solid var(--role); border-radius: 60px; background: var(--bg); font: 500 32px/1.2 var(--font-body); white-space: nowrap; }
  .strip { position: absolute; left: 130px; top: 104px; display: flex; gap: 14px; }
  .pip { position: relative; width: 44px; height: 44px; box-sizing: border-box; border-radius: 50%; display: grid; place-items: center; border: 2px solid var(--border-strong); color: var(--fg-subtle); font: 600 21px var(--font-mono); }
  .pip i { opacity: 0; position: absolute; inset: -2px; border-radius: 50%; display: grid; place-items: center; font-style: normal; color: var(--bg); }
  .pip .now { background: var(--role); }
  .pip .told { background: color-mix(in srgb, var(--bg) 45%, var(--fg)); }
  /* The look with depth. The page is tinted, so what is white sits above it;
     a party and a listing cast a shadow, and what is sent casts a longer one
     while it is on its way. Someone else, and a proof that is not there, cast none. */
  .lit { --stage: color-mix(in srgb, var(--bg-sunken) 72%, var(--border)); --shade: 24 34 56; background: var(--stage); }
  .lit::after { content: ""; position: absolute; inset: 0; z-index: 90; pointer-events: none; background: radial-gradient(ellipse 75% 70% at 50% 42%, transparent 55%, rgb(var(--shade) / 0.08) 100%); }
  .lit .curtain { background: var(--stage); }
  .lit .party { border-top-width: 16px; box-shadow: 0 1px 2px rgb(var(--shade) / 0.12), 0 8px 22px rgb(var(--shade) / 0.12); }
  .lit .party.other { border-top-width: 4px; box-shadow: none; background: color-mix(in srgb, var(--bg) 55%, transparent); }
  .lit .held, .lit .verdict, .lit .act { box-shadow: 0 1px 2px rgb(var(--shade) / 0.16), 0 3px 8px rgb(var(--shade) / 0.1); }
  .lit .sent, .lit .cargo .badge { translate: 0 calc(var(--lift) * -5px); box-shadow: 0 calc(1px + var(--lift) * 11px) calc(3px + var(--lift) * 20px) rgb(var(--shade) / calc(0.16 + var(--lift) * 0.14)); }
  .lit .sent-missing { box-shadow: none; background: var(--stage); }
  .lit .card { background: var(--bg); border-color: transparent; box-shadow: 0 2px 4px rgb(var(--shade) / 0.1), 0 16px 38px rgb(var(--shade) / 0.16); }
  /* "paper": depth on a warmer page, with a faint grid of dots that never
     moves. A curtain has the same dots, in the same places, so nothing
     jumps when one comes down: a curtain covers the frame exactly, from its
     top corner (the scene is 96px down in a said-aloud film),
     as the stage does. */
  .paper { --stage: #ecebe6; --shade: 60 48 32; --grid: radial-gradient(circle, rgb(var(--shade) / 0.16) 1.7px, transparent 2.2px); }
  .paper, .paper .curtain { background-color: var(--stage); background-image: var(--grid); background-size: 36px 36px; background-position: 18px 18px; }
  .said-aloud.paper .curtain { top: -96px; height: 1080px; }
  .lit .channel { stroke: color-mix(in srgb, var(--border-strong) 60%, var(--fg-subtle)); }
  .where { position: absolute; z-index: 61; left: 96px; top: 996px; font: 400 21px var(--font-mono); color: var(--fg-subtle); }
</style>
<div id="stage" class="${film.band ? "written" : "said-aloud"}${LOOK === "depth" ? " lit" : LOOK === "paper" ? " lit paper" : ""}"><div id="scene"></div></div>
<script>window.FILM = ${JSON.stringify(film).replace(/</g, "\\u003c")};</script>
<script>document.getElementById("stage").insertAdjacentHTML("beforeend", '<div class="where">' + window.FILM.address + "</div>");</script>
<script src="/__film/stage.js"></script>
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
const { basis, standards, descriptor } = await page.evaluate(() => {
  const line = document.querySelector(".page-facts .doc-line");
  const said = (node) => node?.textContent.replace(/\s+/g, " ").trim() ?? "";
  // The end card names the standards and leaves out their dates and the
  // guide's: a film is watched long after it is made, and a date on its last
  // frame reads as the film's own. The description, which a video site shows
  // beside the date it was posted, keeps them.
  const fact = line?.querySelector(".doc-fact");
  const names = [...(fact?.querySelectorAll("a.spec") ?? [])].map(said);
  const listed =
    names.length < 3
      ? names.join(" and ")
      : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  const site = [
    ...document.querySelectorAll('script[type="application/ld+json"]'),
  ]
    .flatMap((s) => JSON.parse(s.textContent)["@graph"] ?? [])
    .find((node) => node["@type"] === "WebSite");
  return {
    basis: said(line),
    standards: names.length
      ? `${said(fact.querySelector(".doc-key")).replace(/:$/, "")} ${listed}`
      : "",
    descriptor: site?.description.replace(/\.$/, "") ?? "",
  };
});
film = {
  flow,
  beats,
  duration,
  band: BAND,
  address: `whosonfirst.ai/flows/${flow.slug}`,
  standards,
  descriptor,
};

await page.goto(`${origin}/__film/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
// With --beats the times are all that was asked for. The stage has been
// opened, so a flow or a script it cannot draw has already been refused.
if (args.includes("--beats")) process.exit(0);

const name = `film-${flow.slug}${LAYOUT === "rows" ? "-rows" : ""}${LOOK === USUAL_LOOK ? "" : `-${LOOK}`}${DRAFT ? "-draft" : ""}${VOICE === "kokoro" ? "-voiced" : VOICE ? `-${VOICE}` : ""}${ROOM ? "-room" : ""}`;

if (STILLS) {
  for (const t of STILLS) {
    await page.evaluate((s) => window.seek(s), t);
    const file = join(out, `${name}-at-${String(t).padStart(3, "0")}.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
} else {
  // The voice, as one track: each line starts where its beat does. It is
  // brought to one loudness and to the rate a video site asks for.
  let track = join(out, "voice", `${name}.wav`);
  if (VOICE) {
    const clips = beats.filter((b) => b.clip);
    const mixed = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        ...clips.flatMap((b) => ["-i", b.clip]),
        "-filter_complex",
        `${clips.map((b, i) => `[${i}:a]adelay=${Math.round((b.start + LEAD) * 1000)}:all=1[a${i}]`).join(";")};${clips.map((_, i) => `[a${i}]`).join("")}amix=inputs=${clips.length}:normalize=0,apad=whole_dur=${duration.toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[out]`,
        "-map",
        "[out]",
        "-t",
        duration.toFixed(3),
        track,
      ],
      { stdio: ["ignore", "inherit", "inherit"] },
    );
    if (mixed.status !== 0) {
      console.error("ffmpeg did not put the voice together.");
      process.exit(1);
    }
  }
  // The room goes under the voice after the voice has been brought to its
  // loudness, and at a level of its own: brought to one loudness together,
  // the room would be turned up in every pause.
  if (ROOM) {
    const heard = spawnSync(
      "ffmpeg",
      [
        "-hide_banner",
        "-nostats",
        "-i",
        ROOM,
        "-af",
        "ebur128",
        "-f",
        "null",
        "-",
      ],
      { encoding: "utf8" },
    ).stderr;
    const loud = Number(
      /I:\s+(-?[\d.]+) LUFS/.exec(heard.split("Summary:").pop())?.[1],
    );
    const lasts = Number(
      spawnSync(
        "ffprobe",
        [
          "-v",
          "error",
          "-show_entries",
          "format=duration",
          "-of",
          "csv=p=0",
          ROOM,
        ],
        { encoding: "utf8" },
      ).stdout,
    );
    if (!Number.isFinite(loud) || !(lasts > 4))
      throw new Error(
        `${ROOM} could not be measured, or is shorter than four seconds`,
      );
    // each copy is faded into the next over a second, so no join is heard
    const JOIN = 1;
    const copies = Math.ceil((duration - JOIN) / (lasts - JOIN));
    let bed = "[1:a]";
    let joins = "";
    for (let i = 2; i <= copies; i++) {
      joins += `${bed}[${i}:a]acrossfade=d=${JOIN}[bed${i}];`;
      bed = `[bed${i}]`;
    }
    const under = join(out, "voice", `${name}-room.wav`);
    const laid = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-i",
        track,
        ...Array.from({ length: copies }, () => ["-i", ROOM]).flat(),
        "-filter_complex",
        `${joins}${bed}atrim=0:${duration.toFixed(3)},volume=${(ROOM_LEVEL - loud).toFixed(2)}dB,afade=t=in:d=0.4,afade=t=out:st=${(duration - 1).toFixed(3)}:d=1,aformat=sample_rates=48000:channel_layouts=stereo[room];[0:a]aformat=sample_rates=48000:channel_layouts=stereo[voice];[voice][room]amix=inputs=2:normalize=0[out]`,
        "-map",
        "[out]",
        "-t",
        duration.toFixed(3),
        under,
      ],
      { stdio: ["ignore", "inherit", "inherit"] },
    );
    if (laid.status !== 0) {
      console.error("ffmpeg did not lay the room under the voice.");
      process.exit(1);
    }
    track = under;
  }
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
      ...(VOICE ? ["-i", track, "-c:a", "aac", "-b:a", "192k"] : []),
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
  const lines = beats.filter((b) => b.say);
  const cue = (b, i, mark) =>
    `${i + 1}\n${stamp(b.start + LEAD, mark)} --> ${stamp(b.start + b.dur - (b.hold ?? 0) - 0.1, mark)}\n${b.say}\n`;
  writeFileSync(
    join(out, `${name}.vtt`),
    `WEBVTT\n\n${lines.map((b, i) => cue(b, i, ".")).join("\n")}`,
  );
  writeFileSync(
    join(out, `${name}.srt`),
    lines.map((b, i) => cue(b, i, ",")).join("\n"),
  );

  // What goes under it: what it is, where the page is, and its chapters. A
  // video site takes a list of chapters only if the first is at 00:00, there
  // are three or more, and each lasts ten seconds, so one that would be
  // shorter is told with the one before it.
  // https://support.google.com/youtube/answer/9884579
  const startOf = (test) => beats.find(test)?.start;
  const chapters = [];
  for (const [at, title] of [
    [0, "Can a copied token be used?"],
    [startOf((b) => b.scene === "title"), `What ${flow.short} does`],
    ...flow.phases.map((phase) => [
      startOf((b) => b.step >= phase.from),
      phase.title,
    ]),
    [startOf((b) => b.scene === "refuse"), "A copied token, tried again"],
  ]) {
    if (at === undefined) continue;
    const before = chapters[chapters.length - 1];
    if (!before || at - before[0] >= 10) chapters.push([at, title]);
  }
  // the last one runs to the end of the film, and has to last as long too
  if (duration - chapters[chapters.length - 1][0] < 10) chapters.pop();
  const clock = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  writeFileSync(
    join(out, `${name}.txt`),
    `${flow.title}\n${flow.tagline}\n\nhttps://${film.address}/\n\n${chapters.map(([at, title]) => `${clock(at)} ${title}`).join("\n")}\n\n${basis}\n${VOICE === "kokoro" ? "The voice is synthetic: Kokoro, an open text-to-speech model.\n" : VOICE_NOTE ? `${VOICE_NOTE}\n` : ""}`,
  );

  const count = lines.reduce((n, b) => n + b.say.trim().split(/\s+/).length, 0);
  console.log(
    `${name}.mp4: ${duration.toFixed(1)} seconds, ${count} words said, ${drawn} of ${frames} frames drawn`,
  );
}
await browser.close();
server.close();
