/**
 * Which form of a page a request gets: the page, or its Markdown copy.
 *
 * Every page has a copy in Markdown beside it, at `index.md`. A program that
 * reads can ask for that copy at the page's own address, by saying in its
 * `Accept` header that it wants `text/markdown`. This file reads the header as
 * RFC 9110 defines it and gives the answer. src/worker.ts runs it in front of
 * the pages.
 *
 * The header is a list of media ranges, each with a weight from 0 to 1. A
 * range with no weight has 1, and 0 means “not acceptable” (section 12.4.2).
 * Where more than one range fits a type, the most specific one is the one
 * that counts: `text/markdown` before `text/*` before the range that allows
 * anything (section 12.5.1). So `text/html, text/markdown;q=0` refuses
 * Markdown, though it has the words in it.
 * https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1
 *
 * A request gets Markdown when it names `text/markdown` itself, gives it a
 * weight above 0, and gives the page no greater one. Naming it is asked for
 * because a browser's header ends with a range that allows anything, Markdown
 * included, and a browser wants the page. Between equals Markdown wins:
 * nothing names it by accident.
 *
 * Nothing here knows about Cloudflare, so the unit tests can run it.
 */

/** One media range of an `Accept` header. */
interface Range {
  type: string;
  subtype: string;
  /** Its parameters before the weight, names in lower case. */
  params: Map<string, string>;
  /** Its weight, 0 to 1. */
  q: number;
}

/** A token, as RFC 9110 section 5.6.2 defines one. */
const TOKEN = /^[!#$%&'*+\-.^_`|~0-9a-z]+$/i;
/** A weight: 0 to 1, with at most three digits after the point. */
const WEIGHT = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/;

/** Splits at a separator, leaving alone one that is inside a quoted string. */
function split(text: string, separator: string): string[] {
  const parts: string[] = [];
  let part = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted && c === "\\" && i + 1 < text.length) part += c + text[++i];
    else if (c === '"') {
      quoted = !quoted;
      part += c;
    } else if (c === separator && !quoted) {
      parts.push(part);
      part = "";
    } else part += c;
  }
  parts.push(part);
  return parts;
}

/** A parameter's value, without the quote marks of a quoted string. */
const unquoted = (value: string): string =>
  value.startsWith('"') && value.endsWith('"') && value.length > 1
    ? value.slice(1, -1).replace(/\\(.)/g, "$1")
    : value;

/**
 * The media ranges of an `Accept` header. One that is not written as the
 * grammar has it is left out, as if it had not been sent.
 */
export function ranges(accept: string): Range[] {
  const found: Range[] = [];
  for (const element of split(accept, ",")) {
    const [range, ...parameters] = split(element, ";").map((p) => p.trim());
    const [type, subtype, more] = range.toLowerCase().split("/");
    if (
      more !== undefined ||
      !TOKEN.test(type ?? "") ||
      !TOKEN.test(subtype ?? "")
    )
      continue;
    // "*/markdown" is not a range: only a whole type or everything is
    if (type === "*" && subtype !== "*") continue;
    const params = new Map<string, string>();
    let q = 1;
    let valid = true;
    for (const parameter of parameters) {
      const at = parameter.indexOf("=");
      const name = (at < 0 ? parameter : parameter.slice(0, at))
        .trim()
        .toLowerCase();
      const value = at < 0 ? "" : unquoted(parameter.slice(at + 1).trim());
      if (name === "q") {
        if (WEIGHT.test(value)) q = Number(value);
        else valid = false;
        // what follows the weight is not about the media type
        break;
      }
      if (name) params.set(name, value.toLowerCase());
    }
    if (valid) found.push({ type, subtype, params, q });
  }
  return found;
}

/** A form the site can send: its media type and the parameters it is sent with. */
interface Form {
  type: string;
  subtype: string;
  params: Record<string, string>;
}

const MARKDOWN: Form = {
  type: "text",
  subtype: "markdown",
  params: { charset: "utf-8" },
};
const PAGE: Form = {
  type: "text",
  subtype: "html",
  params: { charset: "utf-8" },
};

/**
 * The weight a header gives a form: that of the most specific range that
 * fits it, or 0 where none does. `named` says whether that range names the
 * form's own type, and not a whole family of types.
 */
function weightOf(accept: Range[], form: Form): { q: number; named: boolean } {
  let best: { q: number; specific: number } | undefined;
  for (const range of accept) {
    const fits =
      (range.type === "*" || range.type === form.type) &&
      (range.subtype === "*" || range.subtype === form.subtype) &&
      [...range.params].every(([name, value]) => form.params[name] === value);
    if (!fits) continue;
    // text/markdown;charset=utf-8, then text/markdown, then text/*, then anything
    const specific =
      range.type === "*"
        ? 0
        : range.subtype === "*"
          ? 1
          : 2 + range.params.size;
    if (
      !best ||
      specific > best.specific ||
      (specific === best.specific && range.q > best.q)
    )
      best = { q: range.q, specific };
  }
  return { q: best?.q ?? 0, named: (best?.specific ?? 0) >= 2 };
}

/** Whether a request with this `Accept` header gets a page's Markdown copy. */
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const sent = ranges(accept);
  const markdown = weightOf(sent, MARKDOWN);
  return (
    markdown.named && markdown.q > 0 && markdown.q >= weightOf(sent, PAGE).q
  );
}

/** Where the site's files are read from: the host's own store of them. */
export interface Assets {
  fetch(request: Request): Promise<Response>;
}

/** Whether a response is a page's Markdown copy, or says the reader's is current. */
const isCopy = (response: Response): boolean =>
  response.status === 304 ||
  ((response.status === 200 || response.status === 206) &&
    (response.headers.get("content-type") ?? "")
      .toLowerCase()
      .startsWith("text/markdown"));

/**
 * The answer to a request: the page's Markdown copy where the request
 * prefers it and the page has one, and otherwise whatever is at the address.
 *
 * A copy is sent with `Content-Location`, which says where that form lives
 * on its own (RFC 9110, section 8.7), and with `Vary: Accept`, which tells a
 * cache that the answer depends on the header. The request's other headers go
 * with it to the store, so a reader that already has the copy is told so.
 *
 * A copy at its own address says `X-Robots-Tag: noindex`, so that a search
 * engine sends people to the page. Here the address is the page's, and
 * nothing should tell a crawler that reads Markdown to leave the page out, so
 * that header is taken off.
 */
export async function respond(
  request: Request,
  assets: Assets,
): Promise<Response> {
  const url = new URL(request.url);
  if (
    (request.method === "GET" || request.method === "HEAD") &&
    url.pathname.endsWith("/") &&
    prefersMarkdown(request.headers.get("accept"))
  ) {
    const copy = new URL(url);
    copy.pathname += "index.md";
    const found = await assets.fetch(new Request(copy, request));
    if (isCopy(found)) {
      const headers = new Headers(found.headers);
      headers.set("Content-Location", copy.pathname);
      headers.delete("X-Robots-Tag");
      const vary = (headers.get("vary") ?? "")
        .split(",")
        .map((name) => name.trim().toLowerCase());
      if (!vary.includes("accept") && !vary.includes("*"))
        headers.append("Vary", "Accept");
      return new Response(found.body, {
        status: found.status,
        statusText: found.statusText,
        headers,
      });
    }
  }
  return assets.fetch(request);
}
