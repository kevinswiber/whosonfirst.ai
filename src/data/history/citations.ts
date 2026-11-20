import type { Citation } from "../../lib/history.ts";

/**
 * What one specification cites of another, by version.
 *
 * A published specification is written against a revision of each document it
 * relies on, and that revision is often not the latest. Each citation here was
 * read in the citing document, at `source`. `from` and `to` name versions the
 * log knows, as `<entry>@<label>`: the build refuses one it does not. A `to`
 * with no label is a document cited with no revision named.
 *
 * Whether the cited revision is still the current one is not written here. It
 * is worked out from the log, so it stays right as the log grows.
 */
export const citations: Citation[] = [
  {
    from: "mcp-authorization@2026-07-28",
    to: "oauth-2-1@-13",
    kind: "normative",
    how: "requires",
    source:
      "https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization",
    note: "One link in it, on storing refresh tokens, is to draft-ietf-oauth-v2-1-14.",
  },
  {
    from: "mcp-authorization@2026-07-28",
    to: "cimd@-00",
    kind: "normative",
    how: "recommends",
    source:
      "https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization",
  },
  {
    from: "mcp-ema@2026-07-28",
    to: "id-jag@-04",
    kind: "normative",
    how: "applies",
    source:
      "https://github.com/modelcontextprotocol/ext-auth/blob/main/specification/stable/enterprise-managed-authorization/2026-07-28/enterprise-managed-authorization.mdx",
  },
  {
    from: "aauth-hardt@-11",
    to: "signature-key",
    kind: "normative",
    how: "builds on",
    source:
      "https://www.ietf.org/archive/id/draft-hardt-oauth-aauth-protocol-11.txt",
  },
];
