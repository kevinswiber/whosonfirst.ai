// The sources the site's data links to, for the two files that read the list:
// source-changes.mjs asks each one whether it has changed, and
// test/unit/sources.test.mjs checks that the recorded values and
// docs/source-review.md still match it.
//
// Node strips the types from the data files as it loads them.
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { publishProfile } from "../src/data/implementations/model.ts";
import { profiles } from "../src/data/implementations/records.ts";
import { standards } from "../src/data/standards.ts";

export const RECORDED = fileURLToPath(
  new URL("../docs/source-validators.json", import.meta.url),
);

/** Where a review reads a link: the record behind an RFC or a draft, or the page itself. */
export const sourceOf = (url) => {
  const rfc = url.match(/^https:\/\/www\.rfc-editor\.org\/rfc\/rfc(\d+)$/);
  if (rfc) return `https://www.rfc-editor.org/rfc/rfc${rfc[1]}.json`;
  const draft = url.match(/^https:\/\/datatracker\.ietf\.org\/doc\/([^/]+)\/$/);
  if (draft) return `https://datatracker.ietf.org/doc/${draft[1]}/doc.json`;
  return url.split("#")[0];
};

/**
 * Asks a source for its page, as a source review does. It names HTML among the
 * types it accepts, as a browser does: some servers refuse a request that
 * names none, as Uber's engineering blog does with HTTP 406. It does not name
 * Markdown: a site that serves both would answer with the Markdown, whose value
 * is not the one recorded for its HTML.
 */
export const ask = (url, headers = {}) =>
  fetch(url, {
    headers: { accept: "text/html,*/*", ...headers },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });

/** Every flow, read file by file: flows/index.ts imports more than Node can load. */
export const flows = async () => {
  const dir = new URL("../src/data/flows/", import.meta.url);
  const found = [];
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".ts") || file === "index.ts") continue;
    const mod = await import(new URL(file, dir).href);
    for (const v of Object.values(mod)) if (v?.slug && v?.steps) found.push(v);
  }
  return found;
};

/**
 * Source address -> where the site rests on it: a tracker entry's `id`, or
 * `flows/<slug>` for a link in a flow's `sources`.
 */
export const sources = async () => {
  const all = new Map();
  const add = (url, where) => {
    const s = sourceOf(url);
    all.set(s, [...new Set([...(all.get(s) ?? []), where])]);
  };
  for (const s of standards) {
    add(s.url, s.id);
    for (const r of s.related ?? []) if ("url" in r) add(r.url, s.id);
  }
  for (const f of await flows()) {
    const hrefs = JSON.stringify(f).match(/"href":"https:[^"]+/g) ?? [];
    for (const h of hrefs) add(h.slice(8), `flows/${f.slug}`);
  }
  for (const record of profiles.map(publishProfile)) {
    for (const entry of [
      ...record.implementations,
      ...record.deployments,
      ...record.observations,
    ]) {
      for (const source of entry.sources)
        add(source.url, `implementations/${record.slug}/${entry.id}`);
    }
  }
  return all;
};
