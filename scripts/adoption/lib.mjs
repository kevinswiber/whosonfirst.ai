// What the adoption collectors share: one way to ask, one way to wait, one
// place to write. docs/adoption/README.md says what the collectors are for.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** Where collected data is kept. */
export const DATA = fileURLToPath(
  new URL("../../docs/adoption/data/", import.meta.url),
);

/**
 * How a collector names itself. The default says what it is and nothing about
 * who runs it. A run on a schedule should say where the census is explained:
 * set ADOPTION_USER_AGENT to a name with that address in it.
 */
export const USER_AGENT =
  process.env.ADOPTION_USER_AGENT ?? "adoption-census-prototype/0.1";

/** The day a run is recorded under, in UTC: 2026-11-13. */
export const today = () => new Date().toISOString().slice(0, 10);

/**
 * One request. Never throws: a host that does not answer is a finding, and is
 * returned as `{ failed }` with the reason. The body is read only when asked
 * for, and no more of it than `limit` bytes.
 */
export async function ask(
  url,
  { method = "GET", headers = {}, body, ms = 10000, read, limit = 400000 } = {},
) {
  try {
    const res = await fetch(url, {
      method,
      body,
      headers: { "user-agent": USER_AGENT, ...headers },
      redirect: "follow",
      signal: AbortSignal.timeout(ms),
    });
    const out = { status: res.status, headers: res.headers, url: res.url };
    if (!read) {
      await res.body?.cancel().catch(() => {});
      return out;
    }
    const text = (await res.text()).slice(0, limit);
    if (read === "json") {
      try {
        out.json = JSON.parse(text);
      } catch {
        out.json = undefined;
      }
    } else out.text = text;
    return out;
  } catch (e) {
    const cause = e?.cause?.code ?? e?.name ?? "error";
    return { failed: String(cause) };
  }
}

/** Runs `work` over `items`, `width` at a time, and keeps the order. */
export async function pool(items, width, work) {
  const out = new Array(items.length);
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await work(items[i], i);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(width, items.length) }, lane),
  );
  return out;
}

/** A shuffle that gives the same order for the same seed, so a sample can be drawn again. */
export function shuffled(items, seed) {
  let s = 0;
  for (const c of String(seed)) s = (Math.imul(s, 31) + c.charCodeAt(0)) >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/** A share as a percentage with one decimal, or null when there is nothing to divide by. */
export const pct = (n, of) =>
  of > 0 ? Math.round((1000 * n) / of) / 10 : null;

/**
 * The half-width of a 95% interval for a share found in a sample, in
 * percentage points (Wilson's interval). A census of a sample says "about".
 */
export function margin(n, of) {
  if (!of) return null;
  const z = 1.96;
  const p = n / of;
  const half =
    (z * Math.sqrt((p * (1 - p)) / of + (z * z) / (4 * of * of))) /
    (1 + (z * z) / of);
  return Math.round(1000 * half) / 10;
}
