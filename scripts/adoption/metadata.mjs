// What an authorization server says about itself, read as evidence.
//
// An authorization server publishes a metadata document (RFC 8414, or OpenID
// Connect Discovery) so that a client can find out what it supports without
// asking a person. Each signal below is one thing such a document can say, the
// document that defines the field, and the flow on the site it is evidence for.
//
// A signal that is present is the server's own statement. A signal that is
// absent proves nothing: most of these fields are optional, and a server can
// support a thing and not say so. Counts made from these are a floor.
//
// The field names were read from the IANA registry "OAuth Authorization Server
// Metadata" and, for the two that drafts define, from the drafts:
//   https://www.iana.org/assignments/oauth-parameters/oauth-parameters.xhtml
//   draft-ietf-oauth-client-id-metadata-document-03
//   draft-ietf-oauth-identity-assertion-authz-grant-06

const has = (list, value) => Array.isArray(list) && list.includes(value);
const any = (list) => Array.isArray(list) && list.length > 0;

/** @type {{ id: string, says: string, defined: string, flow?: string, test: (m: any) => boolean }[]} */
export const SIGNALS = [
  {
    id: "pkceS256",
    says: "PKCE with S256",
    defined: "RFC 8414, code_challenge_methods_supported",
    flow: "authorization-code-pkce",
    test: (m) => has(m.code_challenge_methods_supported, "S256"),
  },
  {
    id: "issParameter",
    says: "the iss parameter on the authorization response",
    defined: "RFC 9207, authorization_response_iss_parameter_supported",
    test: (m) => m.authorization_response_iss_parameter_supported === true,
  },
  {
    id: "deviceGrant",
    says: "the device authorization grant",
    defined: "RFC 8628, device_authorization_endpoint or its grant type",
    flow: "device-authorization",
    test: (m) =>
      typeof m.device_authorization_endpoint === "string" ||
      has(
        m.grant_types_supported,
        "urn:ietf:params:oauth:grant-type:device_code",
      ),
  },
  {
    id: "ciba",
    says: "client-initiated backchannel authentication",
    defined:
      "OpenID CIBA Core 1.0, backchannel_authentication_endpoint or its grant type",
    flow: "ciba",
    test: (m) =>
      typeof m.backchannel_authentication_endpoint === "string" ||
      has(m.grant_types_supported, "urn:openid:params:grant-type:ciba"),
  },
  {
    id: "clientCredentials",
    says: "the client credentials grant",
    defined: "RFC 8414, grant_types_supported",
    flow: "client-credentials",
    test: (m) => has(m.grant_types_supported, "client_credentials"),
  },
  {
    id: "privateKeyJwt",
    says: "client authentication with a signed JWT",
    defined: "RFC 8414, token_endpoint_auth_methods_supported: private_key_jwt",
    test: (m) =>
      has(m.token_endpoint_auth_methods_supported, "private_key_jwt"),
  },
  {
    id: "tokenExchange",
    says: "token exchange",
    defined: "RFC 8693, its grant type in grant_types_supported",
    flow: "token-exchange",
    test: (m) =>
      has(
        m.grant_types_supported,
        "urn:ietf:params:oauth:grant-type:token-exchange",
      ),
  },
  {
    id: "jwtBearer",
    says: "the JWT bearer grant",
    defined: "RFC 7523, its grant type in grant_types_supported",
    test: (m) =>
      has(
        m.grant_types_supported,
        "urn:ietf:params:oauth:grant-type:jwt-bearer",
      ),
  },
  {
    id: "idJag",
    says: "the identity assertion authorization grant (ID-JAG)",
    defined:
      "draft-ietf-oauth-identity-assertion-authz-grant, authorization_grant_profiles_supported",
    flow: "cross-app-access",
    test: (m) =>
      has(
        m.authorization_grant_profiles_supported,
        "urn:ietf:params:oauth:grant-profile:id-jag",
      ) || any(m.id_jag_signing_alg_values_supported),
  },
  {
    id: "identityChaining",
    says: "identity chaining across domains",
    defined:
      "draft-ietf-oauth-identity-chaining, identity_chaining_requested_token_types_supported",
    flow: "identity-chaining",
    test: (m) => any(m.identity_chaining_requested_token_types_supported),
  },
  {
    id: "dpop",
    says: "DPoP",
    defined: "RFC 9449, dpop_signing_alg_values_supported",
    flow: "dpop",
    test: (m) => any(m.dpop_signing_alg_values_supported),
  },
  {
    id: "mtlsBoundTokens",
    says: "certificate-bound access tokens",
    defined: "RFC 8705, tls_client_certificate_bound_access_tokens",
    flow: "oauth-mtls",
    test: (m) => m.tls_client_certificate_bound_access_tokens === true,
  },
  {
    id: "mtlsClientAuth",
    says: "mutual-TLS client authentication",
    defined: "RFC 8705, tls_client_auth or self_signed_tls_client_auth",
    test: (m) =>
      has(m.token_endpoint_auth_methods_supported, "tls_client_auth") ||
      has(
        m.token_endpoint_auth_methods_supported,
        "self_signed_tls_client_auth",
      ),
  },
  {
    id: "par",
    says: "pushed authorization requests",
    defined: "RFC 9126, pushed_authorization_request_endpoint",
    test: (m) => typeof m.pushed_authorization_request_endpoint === "string",
  },
  {
    id: "rar",
    says: "rich authorization requests",
    defined: "RFC 9396, authorization_details_types_supported",
    test: (m) => any(m.authorization_details_types_supported),
  },
  {
    id: "cimd",
    says: "client ID metadata documents",
    defined:
      "draft-ietf-oauth-client-id-metadata-document, client_id_metadata_document_supported",
    test: (m) => m.client_id_metadata_document_supported === true,
  },
  {
    id: "dynamicRegistration",
    says: "dynamic client registration",
    defined: "RFC 7591, registration_endpoint",
    test: (m) => typeof m.registration_endpoint === "string",
  },
  {
    id: "revocation",
    says: "token revocation",
    defined: "RFC 7009, revocation_endpoint",
    flow: "access-revocation",
    test: (m) => typeof m.revocation_endpoint === "string",
  },
  {
    id: "introspection",
    says: "token introspection",
    defined: "RFC 7662, introspection_endpoint",
    test: (m) => typeof m.introspection_endpoint === "string",
  },
];

/** True when a document looks like authorization server metadata at all. */
export const isMetadata = (m) =>
  !!m &&
  typeof m === "object" &&
  typeof m.issuer === "string" &&
  (typeof m.token_endpoint === "string" ||
    typeof m.authorization_endpoint === "string");

/** The ids of the signals a metadata document gives. */
export const signalsIn = (m) =>
  SIGNALS.filter((s) => {
    try {
      return s.test(m);
    } catch {
      return false;
    }
  }).map((s) => s.id);

/**
 * The parameters of a Bearer challenge that a client acts on: where the
 * protected resource metadata is (RFC 9728 section 5.1), and the scope asked for.
 */
export function challenge(header) {
  if (!header) return undefined;
  const param = (name) =>
    header.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i"))?.[1] ??
    header.match(new RegExp(`${name}\\s*=\\s*([^\\s,]+)`, "i"))?.[1];
  return {
    bearer: /(^|,|\s)bearer(\s|$)/i.test(header),
    dpop: /(^|,|\s)dpop(\s|$)/i.test(header),
    resourceMetadata: param("resource_metadata"),
    scope: param("scope") !== undefined,
  };
}

/**
 * Where an issuer's metadata can be, in the order a client tries them
 * (RFC 8414 section 3.1 with a path, then the two OpenID Connect forms).
 */
export function metadataAddresses(issuer) {
  const u = new URL(issuer);
  const path = u.pathname.replace(/\/+$/, "");
  const at = (p) => `${u.origin}${p}`;
  const list = [at(`/.well-known/oauth-authorization-server${path}`)];
  if (path) list.push(at(`/.well-known/openid-configuration${path}`));
  list.push(at(`${path}/.well-known/openid-configuration`));
  return list;
}

/** Where a protected resource's metadata can be (RFC 9728 section 3.1). */
export function resourceAddresses(resource) {
  const u = new URL(resource);
  const path = u.pathname.replace(/\/+$/, "");
  const at = (p) => `${u.origin}${p}`;
  const list = [];
  if (path) list.push(at(`/.well-known/oauth-protected-resource${path}`));
  list.push(at("/.well-known/oauth-protected-resource"));
  return list;
}

/**
 * Who runs a host, roughly: its last two labels, or three under a suffix that
 * many unrelated people publish under. It is a rough cut, made so that one
 * platform's thousand servers are counted as one operator. The Public Suffix
 * List would do it properly.
 */
const SHARED = [
  "workers.dev",
  "pages.dev",
  "vercel.app",
  "netlify.app",
  "herokuapp.com",
  "onrender.com",
  "fly.dev",
  "railway.app",
  "run.app",
  "azurewebsites.net",
  "azurecontainerapps.io",
  "amazonaws.com",
  "cloudfront.net",
  "github.io",
  "replit.app",
  "repl.co",
  "modal.run",
  "deno.dev",
  "hf.space",
  "ngrok.app",
  "ngrok-free.app",
  "web.app",
  "firebaseapp.com",
  "supabase.co",
  "auth0.com",
  "okta.com",
  "oktapreview.com",
  "stytch.com",
  "workos.com",
  "clerk.accounts.dev",
  "accounts.dev",
  "b2clogin.com",
  "ciamlogin.com",
  "kinde.com",
  "descope.com",
  "frontegg.com",
  "co.uk",
  "com.au",
  "co.jp",
  "com.br",
  "co.in",
  "co.kr",
  "co.za",
  "com.cn",
  "com.tr",
  "com.mx",
  "co.nz",
];
export function operator(host) {
  const h = host.toLowerCase();
  const labels = h.split(".");
  const shared = SHARED.find((s) => h === s || h.endsWith(`.${s}`));
  const keep = shared ? shared.split(".").length + 1 : 2;
  return labels.slice(-keep).join(".");
}

/** The shared suffix a host is under, if it is one a vendor gives its customers. */
export const sharedSuffix = (host) =>
  SHARED.find((s) => host.toLowerCase().endsWith(`.${s}`));
