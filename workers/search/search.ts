// The manifest, snippets and page shell come from one site build. The search
// service supplies candidate keys and their order, never links or markup.
import { dailyBudget, secondsUntilTomorrow } from "./budget.ts";

const ENDPOINT = "/api/search/query";
const MAX_BYTES = 8192;
const MAX_CHARS = 500;
const MAX_RESULTS = 5;
const PROVIDER_TIMEOUT_MS = 5000;
const TIMED_OUT = Symbol("search timed out");

interface PassageRecord {
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
  records: PassageRecord[];
  shell: string;
  headers: Record<string, string>;
}

interface SearchChunk {
  item?: { key: string; metadata?: Record<string, unknown> };
}

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
  // The daily cap, in the search Worker only. A branch preview has neither.
  SEARCH_BUDGET?: {
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

export function catalogFor(records: PassageRecord[]) {
  const byKey = new Map<string, PassageRecord>();
  const byRFC = new Map<string, PassageRecord>();
  for (const record of records) {
    const { key, href } = record;
    if (!/^\/(?!\/)/.test(href) || /[\\\s<>?]/.test(href) || byKey.has(key))
      throw new Error("Invalid or duplicate search record");
    byKey.set(key, record);
    if (!/^\/standards\/[^/#]+\/$/.test(href)) continue;
    for (const alias of [record.title, ...record.aliases]) {
      const number = rfcNumber(alias);
      if (number && !byRFC.has(number)) byRFC.set(number, record);
    }
  }
  return { byKey, byRFC };
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
  const number = rfcNumber(query);
  if (number) add(catalog.byRFC.get(number));
  for (const { item } of chunks) {
    if (!item) continue;
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
  if (/^(?=.*[a-z])(?=.*\d)[a-z\d.-]+$/i.test(query)) {
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

async function readQuery(request: Request) {
  if (Number(request.headers.get("Content-Length")) > MAX_BYTES) return null;
  const reader = request.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) {
        void reader.cancel();
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }
    const form = new URLSearchParams(body + decoder.decode());
    const values = form.getAll("q");
    return values.length === 1 ? values[0].trim() : "";
  } finally {
    reader.releaseLock();
  }
}

export function searchRequest(
  query: string,
  mode: "hybrid" | "keyword" | "vector" = "hybrid",
) {
  return {
    messages: [{ role: "user" as const, content: query }],
    ai_search_options: {
      retrieval: {
        retrieval_type: mode,
        fusion_method: "rrf" as const,
        max_num_results: 24,
        metadata_only: true,
      },
      query_rewrite: { enabled: false },
      reranking: { enabled: false },
    },
  };
}

export function guideSearch(
  catalog: ReturnType<typeof catalogFor>,
  shell: string,
  securityHeaders: Record<string, string>,
) {
  return async (request: Request, env: SearchBindings): Promise<Response> => {
    const url = new URL(request.url);
    const json = request.headers.get("Accept")?.includes("application/json");
    let query = "";
    function respond(
      status: number,
      message: string,
      results: SearchResult[] = [],
      extraHeaders: Record<string, string> = {},
    ) {
      const headers: Record<string, string> = {
        ...securityHeaders,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
        Vary: "Accept",
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
    if (url.pathname !== ENDPOINT)
      return respond(404, "This search address does not exist.");
    if (request.method !== "POST")
      return respond(405, "Use the search form below.", [], { Allow: "POST" });
    const origin = request.headers.get("Origin");
    if (
      (origin && origin !== url.origin) ||
      request.headers.get("Sec-Fetch-Site") === "cross-site"
    )
      return respond(403, "Open the search page to submit your question.");
    if (
      request.headers
        .get("Content-Type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() !== "application/x-www-form-urlencoded"
    )
      return respond(415, "Use the search form below.");
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const input = await readQuery(request);
      if (input === null) return respond(413, "Use a shorter question.");
      query = input;
      if (!query || [...query].length > MAX_CHARS)
        return respond(
          400,
          "Enter a term or question of up to 500 characters.",
        );
      const { success } = await env.SEARCH_LIMITER.limit({
        key: request.headers.get("CF-Connecting-IP") || "unknown",
      });
      if (!success)
        return respond(429, "Too many searches. Try again in a minute.", [], {
          "Retry-After": "60",
        });
      if (env.SEARCH_BUDGET) {
        // Without a valid cap, search stays off rather than run without one.
        const cap = dailyBudget(env.SEARCH_DAILY_BUDGET);
        if (cap === undefined) throw new Error("no daily budget");
        const budget = env.SEARCH_BUDGET.get(
          env.SEARCH_BUDGET.idFromName("guide"),
        );
        if (!(await budget.spend(cap)))
          return respond(
            503,
            "Search has answered all it can for today. Browse the guide, or try again tomorrow.",
            [],
            { "Retry-After": String(secondsUntilTomorrow()) },
          );
      }
      const search = env.AI_SEARCH.get(env.SEARCH_INSTANCE).search(
        searchRequest(query),
      );
      const reply = await Promise.race([
        search,
        new Promise<typeof TIMED_OUT>((resolve) => {
          timer = setTimeout(() => resolve(TIMED_OUT), PROVIDER_TIMEOUT_MS);
        }),
      ]);
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
