// The manifest, snippets and page shell come from one site build. The search
// service supplies candidate keys and their order, never links or markup.
import type { Assets } from "../lib/markdown-negotiation.ts";
import { dailyBudget, secondsUntilTomorrow } from "./budget.ts";

// A search has its own address, with the question in the query string. The
// Worker redacts query strings from logs and traces, and Workers Cache keeps a
// found answer in front of the entrypoint that answers a search.
const ADDRESS = "/search";
// Kept by Workers Cache for 48 hours, and revalidated by a browser each time,
// so a new release reaches readers as soon as it is deployed.
const FOUND = "public, max-age=0, s-maxage=172800";
const MAX_CHARS = 500;
const MAX_RESULTS = 8;
// Reranking makes a search slower, and a reranked search can take several
// seconds. The page gives up after 12, so this leaves time to answer it.
const PROVIDER_TIMEOUT_MS = 10000;
// The least vector similarity a passage needs to be found, as the instance
// sets it. AI Search stops applying it when it reranks, so the Worker does.
export const MATCH_THRESHOLD = 0.4;
const TIMED_OUT = Symbol("search timed out");

export interface PassageRecord {
  key: string;
  digest: string;
  href: string;
  type: string;
  title: string;
  section: string;
  text: string;
  aliases: string[];
}

export type SearchResult = Pick<
  PassageRecord,
  "href" | "type" | "title" | "section"
> & {
  excerpt: string;
};

export interface SearchSiteData {
  flowTitles?: Record<string, string>;
  records: PassageRecord[];
  shell: string;
  headers: Record<string, string>;
}

interface SearchChunk {
  item?: { key: string; metadata?: Record<string, unknown> };
  scoring_details?: { vector_score?: number; keyword_score?: number };
}

// A passage the words of the question found is kept. One found only by its
// meaning is kept if it is close enough to the question.
const closeEnough = ({ scoring_details: score }: SearchChunk) =>
  !score ||
  score.keyword_score !== undefined ||
  (score.vector_score ?? 0) >= MATCH_THRESHOLD;

export interface SearchBindings {
  SEARCH_INSTANCE: string;
  SEARCH_LIMITER: {
    limit(input: { key: string }): Promise<{ success: boolean }>;
  };
  AI_SEARCH: {
    get(instance: string): {
      search(
        input: ReturnType<typeof searchRequest>,
      ): Promise<{ chunks: SearchChunk[] }>;
    };
  };
  // The daily cap, counted by the Worker's SearchBudget. The cap itself is a
  // secret, and a branch preview has a count and a secret of its own.
  SEARCH_BUDGET: {
    idFromName(name: string): unknown;
    get(id: unknown): { spend(cap: number): Promise<boolean> };
  };
  SEARCH_DAILY_BUDGET?: string;
}

const entities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const escapeHTML = (value: string) =>
  value.replace(/[&<>"']/g, (c) => entities[c]);

const rfcNumber = (value: string) =>
  /^rfc[\s-]*(\d+)$/i.exec(value.trim())?.[1];

const nameKey = (name: string) => {
  const number = rfcNumber(name);
  return number ? `rfc ${number}` : plainQuestion(name).toLowerCase();
};

export function catalogFor(
  records: PassageRecord[],
  flowTitles: Record<string, string> = {},
) {
  const byKey = new Map<string, PassageRecord>();
  const byName = new Map<string, PassageRecord[]>();
  for (const record of records) {
    const { key, href } = record;
    if (!/^\/(?!\/)/.test(href) || /[\\\s<>?]/.test(href) || byKey.has(key))
      throw new Error("Invalid or duplicate search record");
    byKey.set(key, record);
    const names = new Set(record.aliases.map(nameKey));
    if (!href.includes("#")) {
      names.add(nameKey(record.title));
      if (record.type === "Flow") {
        const slug = /^\/flows\/([^/]+)\/$/.exec(href)?.[1];
        if (slug) names.add(nameKey(slug.replaceAll("-", " ")));
        if (flowTitles[href]) names.add(nameKey(flowTitles[href]));
      }
      const acronym = /\(([A-Z][A-Z0-9.-]+)\)$/.exec(record.title)?.[1];
      if (acronym) names.add(nameKey(acronym));
    }
    for (const name of names) {
      const matches = byName.get(name);
      if (matches) matches.push(record);
      else byName.set(name, [record]);
    }
  }
  return { byKey, byName };
}

// The entries a question names exactly: a page's title, a flow's short name
// or search title, a published alias or an RFC number.
export function namedEntries(
  catalog: ReturnType<typeof catalogFor>,
  query: string,
) {
  return catalog.byName.get(nameKey(query)) ?? [];
}

export function rankedResults(
  catalog: ReturnType<typeof catalogFor>,
  query: string,
  chunks: SearchChunk[],
): SearchResult[] {
  const records = new Map<string, PassageRecord>();
  const add = (record: PassageRecord | undefined) => {
    if (record && !records.has(record.href)) records.set(record.href, record);
  };
  // What the question names comes first, then what AI Search found for it.
  const named = namedEntries(catalog, query);
  for (const record of named) add(record);
  for (const chunk of chunks) {
    const { item } = chunk;
    if (!item || !closeEnough(chunk)) continue;
    const record = catalog.byKey.get(item.key);
    // Item keys include the content digest, so an old index cannot silently
    // return the new passage at a previously used destination.
    if (
      record &&
      (!item.metadata?.digest || item.metadata.digest === record.digest)
    )
      add(record);
  }

  const candidates = [...records.values()];
  // A single alphanumeric identifier can have a vector neighbour even when it
  // never appears in the guide. Allow common punctuation variants such as X.509.
  if (!named.length && /^(?=.*[a-z])(?=.*\d)[a-z\d.-]+$/i.test(query)) {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const id = normalize(query);
    const found = candidates.some((r) =>
      [r.title, r.section, r.text, r.href, ...r.aliases].some((s) =>
        normalize(s).includes(id),
      ),
    );
    if (!found) return [];
  }

  // Show different destinations first. Keep a second relevant passage from
  // the same page when the search found fewer pages than the list can show.
  const first: PassageRecord[] = [],
    second: PassageRecord[] = [];
  const perPage = new Map<string, number>();
  for (const record of candidates) {
    const page = record.href.split("#")[0];
    const count = perPage.get(page) ?? 0;
    if (count === 0) first.push(record);
    if (count === 1) second.push(record);
    perPage.set(page, count + 1);
  }
  return [...first, ...second]
    .slice(0, MAX_RESULTS)
    .map(({ href, type, title, section, text }) => {
      const passage = text.replace(/\s+/g, " ").trim();
      const excerpt =
        passage.length <= 280
          ? passage
          : `${passage.slice(0, 279).replace(/\s+\S*$/, "")}…`;
      return { href, type, title, section, excerpt };
    });
}

const tags = {
  input: /<input\b(?=[^>]*\bname="q")[^>]*>/,
  status: /(<span\b[^>]*\bid="search-status-text"[^>]*>)(<\/span>)/,
  list: /(<ol\b[^>]*\bid="search-results"[^>]*)(>)(<\/ol>)/,
};
export function validateShell(shell: string) {
  for (const [name, tag] of Object.entries(tags)) {
    if (!tag.test(shell))
      throw new Error(`Missing search ${name} in rendered page`);
  }
}
function render(
  shell: string,
  query: string,
  message: string,
  results: SearchResult[],
) {
  const rows = results
    .map(
      ({ href, type, title, section, excerpt }) =>
        `<li><p class="result-kind">${escapeHTML(type)}</p><h2><a href="${escapeHTML(href)}">${escapeHTML(title)}</a></h2>${section && section !== title ? `<p class="result-section">${escapeHTML(section)}</p>` : ""}<p>${escapeHTML(excerpt)}</p></li>`,
    )
    .join("");
  return shell
    .replace(tags.input, (tag) =>
      tag.replace(/^<input/, () => `<input value="${escapeHTML(query)}"`),
    )
    .replace(tags.status, (_, start, end) => start + escapeHTML(message) + end)
    .replace(
      tags.list,
      (_, start, close, end) =>
        `${start} data-search-submitted${close}${rows}${end}`,
    );
}

// AI Search may answer from its cache, but only for a question worded almost
// exactly the same. A looser match can give one flow or RFC another's
// passages. The release purges the cache once it has indexed new passages.
//
// The passages found are put in order again by a model that reads each one
// beside the question. It needs their text, though the Worker shows its own.
// Its scores are not a measure of whether a passage belongs, so it keeps all of
// them, and the Worker applies the match threshold that reranking skips.
export function searchRequest(
  query: string,
  mode: "hybrid" | "keyword" | "vector" = "hybrid",
  cache = true,
  rerank = true,
) {
  return {
    messages: [{ role: "user" as const, content: query }],
    ai_search_options: {
      retrieval: {
        retrieval_type: mode,
        fusion_method: "rrf" as const,
        max_num_results: 24,
        match_threshold: MATCH_THRESHOLD,
        metadata_only: !rerank,
      },
      query_rewrite: { enabled: false },
      reranking: rerank
        ? {
            enabled: true,
            model: "@cf/baai/bge-reranker-base",
            match_threshold: 0,
          }
        : { enabled: false },
      cache: cache
        ? { enabled: true, cache_threshold: "super_strict_match" as const }
        : { enabled: false },
    },
  };
}

// The form of a question that is searched, ranked and put in the address, so
// the three always agree. Compatibility characters such as full-width digits
// become their plain form, and runs of spaces become one. Case is kept.
export const plainQuestion = (query: string) =>
  query.normalize("NFKC").trim().replace(/\s+/g, " ");

// The one address for a question. Workers Cache keys on the path and query
// string, so each question has exactly one spelling of them.
export const searchAddress = (question: string, json = false) =>
  `${ADDRESS}?${new URLSearchParams(json ? { q: question, format: "json" } : { q: question })}`;

export function guideSearch(
  catalog: ReturnType<typeof catalogFor>,
  shell: string,
  securityHeaders: Record<string, string>,
) {
  return async (request: Request, env: SearchBindings): Promise<Response> => {
    const url = new URL(request.url);
    const json = url.searchParams.get("format") === "json";
    let query = "";
    // How long each step took, for the browser's network panel. Durations
    // only: nothing about the question, and nothing is logged.
    const timings: string[] = [];
    async function timed<T>(name: string, step: () => Promise<T>) {
      const start = performance.now();
      try {
        return await step();
      } finally {
        timings.push(`${name};dur=${Math.round(performance.now() - start)}`);
      }
    }
    function respond(
      status: number,
      message: string,
      results: SearchResult[] = [],
      extraHeaders: Record<string, string> = {},
    ) {
      const headers: Record<string, string> = {
        ...securityHeaders,
        // Only a found answer is kept. The format is in the address, so the
        // answer does not vary by Accept: Workers Cache compares a Vary
        // header's values exactly, and every browser's differ.
        "Cache-Control": status === 200 ? FOUND : "no-store",
        "X-Robots-Tag": "noindex",
        ...(timings.length && { "Server-Timing": timings.join(", ") }),
        ...extraHeaders,
      };
      if (json)
        return Response.json(
          status === 200 ? { results } : { error: message },
          { status, headers },
        );
      headers["Content-Type"] = "text/html; charset=utf-8";
      return new Response(render(shell, query, message, results), {
        status,
        headers,
      });
    }
    const redirect = (to: string, status: number) =>
      new Response(null, {
        status,
        headers: { Location: to, "Cache-Control": "no-store" },
      });
    if (url.pathname !== ADDRESS)
      return respond(404, "This search address does not exist.");
    if (request.method !== "GET" && request.method !== "HEAD")
      return respond(405, "Use the search form below.", [], {
        Allow: "GET, HEAD",
      });
    const values = url.searchParams.getAll("q");
    if (values.length > 1) return respond(400, "Enter one term or question.");
    query = plainQuestion(values[0] ?? "");
    if (!query) return redirect("/search/", 302);
    if ([...query].length > MAX_CHARS)
      return respond(400, "Enter a term or question of up to 500 characters.");
    const canonical = searchAddress(query, json);
    if (url.pathname + url.search !== canonical)
      return redirect(canonical, 308);
    // A browser opening a link ahead of time would run a real search for a
    // page the reader may never see. It opens the page again when it is
    // followed, so the search runs then.
    if (request.headers.get("Sec-Purpose")?.includes("prefetch"))
      return respond(503, "Search runs when the page is opened.");
    // A reader may follow a link to a search from anywhere. Another site
    // may not make the browser run one in the background.
    if (
      request.headers.get("Sec-Fetch-Site") === "cross-site" &&
      request.headers.get("Sec-Fetch-Mode") !== "navigate"
    )
      return respond(403, "Open the search page to submit your question.");
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const { success } = await timed("limit", () =>
        env.SEARCH_LIMITER.limit({
          key: request.headers.get("CF-Connecting-IP") || "unknown",
        }),
      );
      if (!success)
        return respond(429, "Too many searches. Try again in a minute.", [], {
          "Retry-After": "60",
        });
      // Without a valid cap, search stays off rather than run without one.
      const cap = dailyBudget(env.SEARCH_DAILY_BUDGET);
      if (cap === undefined) throw new Error("no daily budget");
      const budget = env.SEARCH_BUDGET.get(
        env.SEARCH_BUDGET.idFromName("guide"),
      );
      if (!(await timed("budget", () => budget.spend(cap))))
        return respond(
          503,
          "Search has answered all it can for today. Browse the guide, or try again tomorrow.",
          [],
          { "Retry-After": String(secondsUntilTomorrow()) },
        );
      const search = env.AI_SEARCH.get(env.SEARCH_INSTANCE).search(
        searchRequest(query),
      );
      const reply = await timed("search", () =>
        Promise.race([
          search,
          new Promise<typeof TIMED_OUT>((resolve) => {
            timer = setTimeout(() => resolve(TIMED_OUT), PROVIDER_TIMEOUT_MS);
          }),
        ]),
      );
      if (reply === TIMED_OUT)
        return respond(504, "Guide results took too long to load. Try again.");
      const results = rankedResults(catalog, query, reply.chunks);
      return respond(
        200,
        results.length
          ? `${results.length} ${results.length === 1 ? "result" : "results"}`
          : "No results found. Try another phrase or browse the guide.",
        results,
      );
    } catch {
      return respond(
        503,
        "Search is temporarily unavailable. Try again or browse the guide.",
      );
    } finally {
      clearTimeout(timer);
    }
  };
}

/** Where the build writes what a search is answered from. */
export const CATALOG = "/search/catalog.json";

/**
 * Search for the site as it was built. The build writes the catalog after it
 * has bundled the Worker, so the Worker reads it as a file, once. The handler
 * is kept only after the file has loaded, so that requests arriving together
 * never share a read that has not finished.
 */
export function siteSearch() {
  let search: ReturnType<typeof guideSearch> | undefined;
  return async (
    request: Request,
    env: SearchBindings & { ASSETS: Assets },
  ): Promise<Response> => {
    if (!search) {
      const asset = await env.ASSETS.fetch(
        new Request(new URL(CATALOG, request.url)),
      );
      if (!asset.ok)
        return new Response("Search is unavailable.", {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        });
      const { records, flowTitles, shell, headers }: SearchSiteData =
        await asset.json();
      search = guideSearch(catalogFor(records, flowTitles), shell, headers);
    }
    return search(request, env);
  };
}
