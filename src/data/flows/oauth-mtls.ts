import type { Flow } from "../types";

export const oauthMtls: Flow = {
  slug: "oauth-mtls",
  title: "OAuth access tokens bound to a TLS certificate",
  short: "OAuth mTLS",
  group: "cross-cutting",
  human: "any",
  maturity: "stable",
  tagline:
    "Bind an access token to the client certificate the agent presents over mutual TLS.",
  summary: `In mutual TLS (mTLS), each side of a connection proves it holds the private key for the certificate it presents. An OAuth authorization server can bind an access token to the client certificate it sees. The API then checks that the caller is using that same certificate. A token that requires this extra proof is called a sender-constrained token.

This example uses the [client credentials grant](/flows/client-credentials/). The token represents the agent’s own authority to read invoices. The authorization server uses the certificate to authenticate the client. The API checks the certificate binding to see who can use the token. These are independent choices. An authorization server can use mTLS client authentication with unbound tokens, or bind tokens while using a different method to authenticate the client.`,
  fits: [
    "The agent can present its client certificate to both the authorization server and the API, and both support certificate-bound access tokens.",
  ],
  watchOut: [
    "A token thief who can also use the private key for the bound certificate can make the TLS connection and use the token. Keep the key outside the model’s reach, and control which code can use it.",
    "An API that accepts the token without checking the certificate binding loses the protection. For the endpoint shown, require a bound token and a matching certificate before applying access policy.",
  ],
  lesson: "limits",
  credentials: {
    title: "What the agent holds",
    intro:
      "The agent keeps the certificate’s private key. Both servers see the certificate and verify proof of the key in the TLS handshake.",
    items: [
      {
        name: "Client certificate",
        type: "X.509 certificate",
        issuer: "The agent’s certificate authority",
        recipient: "Authorization server and invoice API",
        meaning:
          "The authorization server checks the certificate against the identity registered for the OAuth client.",
        binding: "The TLS handshake proves possession of the private key.",
      },
      {
        name: "Certificate-bound access token",
        type: "OAuth access token, shown as a signed JWT",
        issuer: "Authorization server",
        recipient: "Invoice API",
        meaning:
          "The agent may read invoices at this API, subject to its policy.",
        binding: "The token records a hash of the client certificate.",
      },
    ],
  },
  phases: [
    { title: "The agent presents a certificate and asks for a token", from: 1 },
    { title: "The authorization server issues a bound token", from: 3 },
    { title: "The API checks the token and the certificate", from: 5 },
  ],
  parts: {
    agent:
      "Keep the private key and present the same client certificate on both connections. Send the access token with the API request.",
    as: "Check the certificate against the client’s registration and decide what scope to grant. Bind the token to the exact certificate from the connection.",
    api: "Request a client certificate during TLS, verify the token and match its certificate hash to the one from the connection. Then decide whether the call is allowed.",
  },
  participants: [
    { id: "agent", label: "Agent", sub: "OAuth client", role: "agent" },
    { id: "as", label: "Authorization server", role: "authz" },
    {
      id: "api",
      label: "Invoice API",
      sub: "Resource server",
      role: "resource",
    },
  ],
  illustrated: {
    steps:
      "The agent uses a certificate signed by its organization’s certificate authority (CA). The authorization server uses it for client authentication and issues a signed, certificate-bound access token. The API handles the agent’s TLS connection directly.",
    preconditions: [
      "The authorization server trusts the CA. The registration for client ID `invoice-agent` names `invoice-agent.example` as the expected DNS name in the client certificate.",
      "The authorization server is configured to issue bound tokens for this client. The invoice API requires them and requests a client certificate during the TLS handshake.",
    ],
    examples:
      "HTTP listings omit transport details and some headers. The token’s decoded claims are illustrative.",
    references:
      "The diagram uses a CA-issued certificate to authenticate the client and a signed JWT as the access token.",
  },
  steps: [
    {
      from: "agent",
      kind: "self",
      label: "Hold certificate and key",
      title: "The agent starts with a certificate and key",
      body: "Before asking for any token, the agent generates a private key. Its organization’s CA issues a client certificate for the corresponding public key. The agent keeps the key and can use it to prove possession during TLS.",
      gain: [
        ["agent", "client certificate"],
        ["agent", "private key"],
      ],
    },
    {
      from: "agent",
      to: "as",
      kind: "back",
      label: "Token request over mTLS",
      title: "The agent asks for a token over mutual TLS",
      body: "The agent checks the authorization server’s certificate. It presents its own certificate during the same handshake and proves it can use the matching private key. On that connection it asks for an access token with `grant_type=client_credentials`. The `client_id` tells the server which registration to look up.",
      code: {
        lang: "http",
        text: `POST /token HTTP/1.1
Host: auth.example
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=invoice-agent&scope=invoices.read`,
      },
    },
    {
      from: "as",
      kind: "self",
      label: "Authenticate and grant scope",
      title: "The authorization server checks the client",
      body: "The server checks that the certificate chains to a trusted CA and contains the registered DNS name. A TLS handshake can fail before an OAuth request arrives. If the request reaches the token endpoint and the expected certificate is missing or mismatched, the OAuth error is `invalid_client`. Once the client is authenticated, the server applies its grant policy. Here the policy permits `invoices.read` at the invoice API.",
    },
    {
      from: "as",
      to: "agent",
      kind: "resp",
      label: "Certificate-bound token",
      title: "The authorization server binds and returns the token",
      body: "The server puts the client certificate’s thumbprint in the signed access token as `cnf.x5t#S256`. The thumbprint is a SHA-256 hash of the client certificate’s binary DER encoding, written as base64url without padding. The token’s subject is the agent’s client identity. The response carries the signed token in `access_token` and uses `token_type: Bearer`. Here are the claims inside the signed JWT, whose header has `typ: at+jwt`.",
      code: {
        lang: "json",
        text: `{
  "iss": "https://auth.example",
  "sub": "invoice-agent",
  "client_id": "invoice-agent",
  "aud": "https://invoices.example",
  "scope": "invoices.read",
  "iat": 1794528000,
  "exp": 1794528300,
  "jti": "892c879b-69ce-4561-a51c-b520ae954221",
  "cnf": {
    "x5t#S256": "zcwVJxIUpG7iR-g-Wo8HuxO0z_IrLl4vDKxoFxpK4zM"
  }
}`,
      },
      gain: [["agent", "certificate-bound access token"]],
    },
    {
      from: "agent",
      to: "api",
      kind: "back",
      label: "API request over mTLS",
      title: "The agent sends the token over a second mTLS connection",
      body: "The API asks for a client certificate during the handshake, before it can see the HTTP request or its token. The agent checks the API’s server certificate and presents the same client certificate it used at the token endpoint, again proving it holds the private key. It sends the access token in the usual `Authorization: Bearer` header on that connection.",
      code: {
        lang: "http",
        text: `GET /invoices HTTP/1.1
Host: invoices.example
Authorization: Bearer eyJ0eXAiOiJhdCtqd3QiLCJhbGciOiJSUzI1NiJ9…`,
      },
    },
    {
      from: "api",
      kind: "self",
      label: "Check token and certificate",
      title: "The API validates the token and checks its binding",
      body: `The API checks the JWT’s type, signature, issuer, audience and expiry. It takes the client certificate from the TLS connection, computes the same thumbprint and compares it with \`cnf.x5t#S256\` from the validated token. A copied token presented over mTLS with a different certificate gets HTTP 401 with \`invalid_token\`, even if the token is otherwise valid.

For the binding check, the API can rely on the TLS proof and the match to the signed token without validating the client certificate’s CA chain. The API can still apply its own certificate trust policy. The authorization server did the OAuth client authentication in step 3.`,
    },
    {
      from: "api",
      to: "agent",
      kind: "resp",
      label: "Return allowed invoices",
      title: "The API decides whether to allow the call",
      body: "The API still applies its own policy to the requested operation. Here it accepts `invoices.read` for this agent and returns the invoices the agent may see.",
    },
  ],
  notes: [
    {
      title: "When the certificate changes",
      body: "A renewed certificate has a different thumbprint, even if it keeps the same name and key. A live token bound to the old certificate will fail the comparison on a connection using the new one. Obtain a fresh access token using the new certificate before switching traffic to it. During overlap, use an old token only with the old certificate and key, while the old token is still valid and the API still accepts that certificate.",
    },
    {
      title: "When a proxy terminates TLS",
      body: "The TLS handshake proves key possession to the proxy. The proxy can validate the token and enforce the binding there, or pass the client certificate from the handshake to the API. In the second case, the API must accept certificate information only from the trusted proxy over a protected path. The proxy must strip or overwrite client-supplied certificate headers before forwarding. [RFC 9440](/standards/#rfc9440) defines a `Client-Cert` header for that handoff. A proxy in front of the token endpoint also needs a trusted way to convey the original certificate to the authorization server.",
    },
    {
      title: "When the access token is opaque",
      body: "If the access token is an identifier the API cannot read, it can ask the authorization server about the token at its introspection endpoint. The API uses its own credential for that request. For an active, bound token, the reply carries `cnf` as a top-level member, with the same `x5t#S256` inside it. The API checks that the token is active and compares the thumbprint with the certificate from the agent’s connection.",
    },
  ],
  comparison: {
    title: "OAuth mTLS, DPoP and SPIFFE",
    rowHeading: "Mechanism",
    fields: [
      { heading: "What it proves", label: "Proof" },
      { heading: "Where it is checked", label: "Checked by" },
    ],
    rows: [
      {
        name: "OAuth mTLS",
        values: [
          "The caller holds the key for the exact certificate the OAuth token is bound to.",
          "The TLS endpoint verifies key possession. The API or its trusted proxy checks the token binding.",
        ],
      },
      {
        name: "DPoP",
        values: [
          "The caller holds the key the OAuth token is bound to and signs a proof for this HTTP request.",
          "The API verifies the signed proof from an HTTP header and matches its key to the token.",
        ],
      },
      {
        name: "SPIFFE with an X.509 certificate",
        values: [
          "The caller holds the key for a certificate naming its workload identity.",
          "The TLS peer checks the certificate against its SPIFFE trust bundle and reads the SPIFFE ID.",
        ],
      },
    ],
    after:
      "For a call on a user’s behalf, the agent still needs a grant for that user, such as [authorization code with PKCE](/flows/authorization-code-pkce/). The API still decides what the call may do. SPIFFE can supply a certificate in a deployment configured to accept it. OAuth token binding still needs explicit support from the authorization server and API.",
  },
  standards: [
    "rfc8705",
    "rfc6749",
    "rfc6750",
    "rfc9068",
    "rfc7662",
    "rfc9440",
    "rfc9449",
    "spiffe",
  ],
  roles: {
    rfc8705: "required", // PKI client authentication and the certificate binding.
    rfc6749: "required", // Client credentials grant and token endpoint response.
    rfc6750: "required", // Bearer header and invalid_token response.
    rfc9068: "required", // JWT access-token example and validation.
    rfc7662: "optional", // Opaque token alternative.
    rfc9440: "optional", // Client-Cert forwarding is a deployment option.
    rfc9449: "background", // Compared with the application-layer alternative.
    spiffe: "background", // Compared with a workload identity system.
  },
  basis: ["rfc8705", "rfc6749"],
  related: [
    "client-credentials",
    "dpop",
    "spiffe-workload-identity",
    "authorization-code-pkce",
  ],
};
