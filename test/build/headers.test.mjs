// The headers every response carries: the `/*` block of the built `_headers`
// file. The browser tests serve every page with them, and fail on a page that
// breaks its own content security policy.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { SITE_HEADERS } from "../support/site.mjs";

test("every response carries a content security policy and the headers beside it", () => {
  const csp = SITE_HEADERS["content-security-policy"] ?? "";
  assert.deepEqual(
    [
      [/default-src 'self'/.test(csp), "a default of this origin only"],
      [/object-src 'none'/.test(csp), "no plugins"],
      [/base-uri 'self'/.test(csp), "a fixed base address"],
      [/frame-ancestors 'none'/.test(csp), "no framing"],
      [SITE_HEADERS["x-content-type-options"] === "nosniff", "nosniff"],
      [
        /max-age=\d{7,}/.test(SITE_HEADERS["strict-transport-security"] ?? ""),
        "HTTPS only, for months",
      ],
      [!!SITE_HEADERS["referrer-policy"], "a referrer policy"],
    ]
      .filter(([ok]) => !ok)
      .map(([, what]) => `missing: ${what}`),
    [],
  );
});
