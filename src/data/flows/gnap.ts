import type { Flow } from "../types";

const calendarAccess = "calendar.events.read";

export const gnap: Flow = {
  slug: "gnap",
  title: "Negotiating a GNAP grant",
  short: "GNAP",
  group: "human-present",
  human: "present",
  maturity: "stable",
  tagline:
    "The agent signs a grant request, sends the user to approve it, then continues the same request to get an API token.",
  summary: `Alice asks a scheduling agent to read her calendar. The agent’s software sends a signed request to the authorization server. It describes the access it needs and offers ways for Alice to interact. The server chooses a supported interaction, and the agent can return to the same pending grant after Alice finishes.

That exchange gives the **Grant Negotiation and Authorization Protocol** (GNAP) its name. The client software and the authorization server exchange capabilities and decide what the protocol can do next. The server applies its policy and obtains Alice’s consent. The language model has no authority to change either.`,
  fits: [
    "A browser can take the user to a GNAP authorization server and back to the agent’s application.",
    "The agent needs delegated access and can sign with a private key kept outside the model’s reach.",
  ],
  watchOut: [
    "Keep the continuation token with the pending grant at the backend. It is only for the authorization server’s continuation endpoint. Use the API token only at the resource it is for.",
    "The client signature proves control of a key. The authorization server’s policy decides which clients it trusts and what they may ask for.",
    "The rating comes from published standards. Check whether the authorization server, client and API you intend to use support this profile.",
  ],
  credentials: {
    title: "Two tokens for two endpoints",
    intro:
      "The agent keeps each token at its backend until it is no longer needed. This example binds both to the same agent key.",
    items: [
      {
        name: "Continuation access token",
        type: "GNAP access token for the grant",
        issuer: "Authorization server",
        recipient: "The authorization server’s continuation endpoint",
        meaning:
          "Lets the agent continue this pending grant after Alice finishes the interaction.",
        binding:
          "The agent signs the request with its private key, covering the token",
      },
      {
        name: "Calendar API access token",
        type: "GNAP access token for the API",
        issuer: "Authorization server",
        recipient: "Calendar API",
        meaning: "Carries the approved calendar read right.",
        binding:
          "The agent signs the request with its private key, covering the token",
      },
    ],
  },
  lesson: "getting-a-token",
  phases: [
    { title: "The agent starts a grant request", from: 1 },
    { title: "Alice approves in her browser", from: 3 },
    { title: "The agent continues the grant", from: 6 },
    { title: "The API checks the token and the proof", from: 8 },
  ],
  parts: {
    user: "Signs in at the authorization server and decides whether to let the agent read her calendar.",
    agent:
      "Keeps the private key and pending grant at its backend. Checks the browser callback, then signs the continuation request and the API call.",
    as: "Checks the signatures, runs the interaction with Alice, and issues and tracks the two tokens. Answers the API’s token check.",
    api: "Asks the authorization server about the API token. Uses the bound public key from that answer to verify the agent’s signature, then enforces the granted rights.",
  },
  illustrated: {
    steps:
      "This example uses the Web-Based Redirection profile in RFC 9635, Appendix C.1. The browser starts and finishes with redirects. The agent proves it holds its key with HTTP Message Signatures (`httpsig`).",
    preconditions: [
      "The hosted agent has a browser session with Alice, holds its own private key, and knows the trusted GNAP grant endpoint.",
      "The calendar API and authorization server agree on the meaning of `calendar.events.read`. The API knows the trusted introspection endpoint and holds its own private key. The authorization server has the API’s registered public key.",
    ],
    examples:
      "All hops shown use HTTPS. The listings shorten the public keys, signature bytes and content digests. They show the fields to sign and check.",
    references:
      "The diagram uses RFC 9635 for the grant and proof rules and RFC 9767 for token introspection at the API. Other GNAP deployments can validate tokens differently.",
  },
  participants: [
    { id: "user", label: "User", sub: "Calendar owner", role: "human" },
    { id: "agent", label: "Agent", sub: "GNAP client", role: "agent" },
    {
      id: "as",
      label: "Authorization server",
      sub: "GNAP issuer",
      role: "authz",
    },
    {
      id: "api",
      label: "Calendar API",
      sub: "Resource server",
      role: "resource",
    },
  ],
  steps: [
    {
      from: "agent",
      to: "as",
      kind: "back",
      label: "Signed grant request",
      title: "The agent asks to read the calendar",
      body: `The backend sends a JSON request to the GNAP grant endpoint. It asks for one token with the calendar read right and sends its public key as a JSON Web Key (JWK). It offers a browser redirect both to start and to finish the interaction. The finish instructions include a unique callback URL and a fresh, unpredictable value called a nonce.

The backend signs the request with its private key. The signature covers the HTTP method, full URL and a SHA-256 digest of the body. The example also signs the content type. The server checks the covered fields and verifies the signature against the supplied key. It recomputes the digest from the body. The signature must carry the tag \`gnap\`, a recent \`created\` timestamp and a \`keyid\` matching the JWK’s \`kid\`. The algorithm comes from the JWK’s \`alg\` field, here \`PS256\`. Each signed request in this example carries its own fresh signature nonce. The verifier checks that nonce has not been used within its replay window.`,
      code: {
        lang: "http",
        text: `POST /gnap HTTP/1.1
Host: auth.example
Content-Type: application/json
Content-Digest: sha-256=:…:
Signature-Input: sig1=("@method" "@target-uri" "content-type" "content-digest");created=1794571200;keyid="agent-1";nonce="Grq-9vP0F2Oe5KMJ";tag="gnap"
Signature: sig1=:…:

{
  "access_token": {"access": ["${calendarAccess}"]},
  "client": {
    "key": {
      "proof": "httpsig",
      "jwk": {
        "kty": "RSA", "kid": "agent-1", "alg": "PS256",
        "e": "AQAB", "n": "…"
      }
    }
  },
  "interact": {
    "start": ["redirect"],
    "finish": {
      "method": "redirect",
      "uri": "https://agent.example/return/QXHLIiUjyytH08JcH2bHig",
      "nonce": "-RxVtUqYEyPZ-YMJJAivsA"
    }
  }
}`,
      },
    },
    {
      from: "as",
      to: "agent",
      kind: "resp",
      label: "Redirect and continue token",
      title: "The server says how to proceed",
      body: `The server accepts the signed request and leaves the grant pending. It sends the browser URL in \`interact.redirect\` and its own nonce in \`interact.finish\`. In \`continue\` it sends the exact URL to call later, a five-second minimum wait and a continuation access token bound to the agent’s key.

The agent stores both interaction nonces, the original grant endpoint, and the continuation instructions against the pending grant and Alice’s browser session. The continuation token stays at the backend.`,
      code: {
        lang: "http",
        text: `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "interact": {
    "redirect": "https://auth.example/interact/m7Jx2QFZc3d6",
    "finish": "XEQNVoHB7ISl36G2d3hE7w"
  },
  "continue": {
    "uri": "https://auth.example/continue",
    "wait": 5,
    "access_token": {"value": "example-cont-96"}
  }
}`,
      },
      gain: [["agent", "continuation access token"]],
    },
    {
      from: "agent",
      to: "user",
      kind: "front",
      label: "Open interaction URL",
      title: "Alice’s browser opens the server’s URL",
      body: `The agent directs Alice’s browser to the exact interaction URL the server returned. The browser makes a GET request. The agent adds no parameters. The authorization server uses that URL to find the pending grant.`,
    },
    {
      from: "user",
      to: "as",
      kind: "front",
      label: "Sign in and approve",
      title: "Alice approves calendar read access",
      body: `Alice signs in at the authorization server, which shows her the requested calendar access. Here she approves it. The server records the result against the pending grant. Alice can also decline. The browser’s return signals that the interaction ended, whether Alice approved or declined.`,
    },
    {
      from: "user",
      to: "agent",
      kind: "front",
      label: "Return with hash and reference",
      title: "The agent checks that the callback belongs to this grant",
      body: `The server generates an unpredictable, one-time \`interact_ref\` and an interaction hash. It returns the browser to the callback URL with both as query parameters on a GET. The agent checks that the callback belongs to Alice’s original browser session and pending grant.

The agent joins the client nonce, the server nonce, the interaction reference and the **original grant endpoint URL**, in that order, with a single newline between values and none at the end. It hashes the ASCII bytes with SHA-256 and encodes the result as base64url without padding. If the hash fails to match, it stops without sending the interaction reference to the server.`,
      code: {
        lang: "text",
        text: `Callback query (shown on two lines)
hash=yZUUHrBqi4RQKZHHwQ6r5ZSSTImkis7V-3JC3dVsNKc
interact_ref=ZWM3ePGUx3mXLl1NCNbD5Q

Hash input (no final newline)
-RxVtUqYEyPZ-YMJJAivsA
XEQNVoHB7ISl36G2d3hE7w
ZWM3ePGUx3mXLl1NCNbD5Q
https://auth.example/gnap`,
      },
    },
    {
      from: "agent",
      to: "as",
      kind: "back",
      label: "Continue with token and proof",
      title: "The agent continues the same grant",
      body: `Once the callback passes validation and the five seconds have elapsed since the continuation instructions arrived, the agent posts the interaction reference to the continuation URL exactly as given. It sends the continuation token in \`Authorization: GNAP\` and signs with the same private key. The signature also covers the authorization header so it is tied to this token.

The server uses the URL and token to find the active grant, verifies the signature against the token’s bound key, and checks that the one-time reference belongs to that grant. An early call gets \`too_fast\`. An incorrect reference gets \`invalid_interaction\`.`,
      code: {
        lang: "http",
        text: `POST /continue HTTP/1.1
Host: auth.example
Authorization: GNAP example-cont-96
Content-Type: application/json
Content-Digest: sha-256=:…:
Signature-Input: sig1=("@method" "@target-uri" "authorization" "content-type" "content-digest");created=1794571230;keyid="agent-1";nonce="cD8BR1PMhv56DZ9j";tag="gnap"
Signature: sig1=:…:

{"interact_ref": "ZWM3ePGUx3mXLl1NCNbD5Q"}`,
      },
    },
    {
      from: "as",
      to: "agent",
      kind: "resp",
      label: "Issue the calendar API token",
      title: "The server returns the approved access",
      body: `The approved response carries a separate API token. The agent uses the returned rights, which can differ from what it asked for, and observes the token’s lifetime. With no \`bearer\` flag and no separate \`key\` in the response, the token uses the key and proof method from the grant request. This response has no \`continue\` field, so the agent stops continuing the grant.

If Alice declines, the server can return \`{"error":"user_denied"}\` after the agent continues. No API token comes back. With no new \`continue\` instructions, the agent stops and tells Alice that access was declined.`,
      code: {
        lang: "http",
        text: `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "access_token": {
    "value": "example-calendar-14",
    "access": ["${calendarAccess}"],
    "expires_in": 300
  }
}`,
      },
      gain: [["agent", "calendar API access token"]],
      lose: [["agent", "continuation access token"]],
    },
    {
      from: "agent",
      to: "api",
      kind: "back",
      label: "Call API with token and proof",
      title: "The agent makes a signed calendar request",
      body: `The agent presents the API token in \`Authorization: GNAP\`. It signs the method, full URL and authorization header with the bound key. This GET has no body, so there is no content digest. A copy of the token alone cannot make a fresh proof.`,
      code: {
        lang: "http",
        text: `GET /events HTTP/1.1
Host: calendar.example
Authorization: GNAP example-calendar-14
Signature-Input: sig1=("@method" "@target-uri" "authorization");created=1794571231;keyid="agent-1";nonce="JKfj1cUVE9l2wBEv";tag="gnap"
Signature: sig1=:…:`,
      },
    },
    {
      from: "api",
      to: "as",
      kind: "back",
      label: "Introspect the API token",
      title: "The API asks the issuer about the token",
      body: `The calendar API uses RFC 9767 token introspection, a direct check with the issuer. It sends the API token in the JSON body, with the proof method, its own registered identifier and the access right needed for this request. It signs the request with the API’s own key. The authorization server verifies the signature with the public key registered for that identifier. It evaluates the token for this API, proof method and access right.`,
      code: {
        lang: "http",
        text: `POST /introspect HTTP/1.1
Host: auth.example
Content-Type: application/json
Content-Digest: sha-256=:…:
Signature-Input: sig1=("@method" "@target-uri" "content-type" "content-digest");created=1794571231;keyid="calendar-1";nonce="TP3wQerxcS0UXNPV";tag="gnap"
Signature: sig1=:…:

{
  "access_token": "example-calendar-14",
  "proof": "httpsig",
  "resource_server": "calendar-api",
  "access": ["${calendarAccess}"]
}`,
      },
    },
    {
      from: "as",
      to: "api",
      kind: "resp",
      label: "Active, rights and bound key",
      title: "The issuer returns the token’s rights and public key",
      body: `An active answer means this issuer issued the token, it is within its validity window and has not been revoked, and it is appropriate for the calendar API, the proof method and the requested access. The issuer also returns the public key bound to the token so the API can verify the agent’s signature itself. An inactive or unusable reply does not authorize the call.`,
      code: {
        lang: "http",
        text: `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "active": true,
  "iss": "https://auth.example/gnap",
  "access": ["${calendarAccess}"],
  "key": {
    "proof": "httpsig",
    "jwk": {
      "kty": "RSA", "kid": "agent-1", "alg": "PS256",
      "e": "AQAB", "n": "…"
    }
  }
}`,
      },
    },
    {
      from: "api",
      to: "agent",
      kind: "resp",
      label: "Verify proof; return events",
      title: "The API verifies the request and returns Alice’s events",
      body: `The API checks the issuer and granted rights and verifies the signature on the original request using the public key from introspection. It checks the required covered fields, the \`gnap\` tag, the key ID, timestamp and nonce. It refuses a missing, invalid or replayed proof even if the token is active.

The application’s calendar rules still decide which events this request can read. The API returns them only after both the token and the request pass their checks.`,
    },
  ],
  standards: [
    "rfc9635",
    "rfc9767",
    "rfc9421",
    "rfc9530",
    "rfc7517",
    "rfc7518",
    "rfc9493",
    "oidc-core",
  ],
  basis: ["rfc9635", "rfc9767"],
  roles: {
    rfc9635: "required", // the grant, interaction, continuation and proof profile
    rfc9767: "required", // the calendar API's signed introspection
    rfc9421: "required", // HTTP message signature fields and verification
    rfc9530: "required", // the signed Content-Digest on JSON requests
    rfc7517: "required", // JWK used for the agent's public key
    rfc7518: "required", // PS256 and RSA public-key parameters
    rfc9493: "required", // Appendix C.1 requires support for the opaque subject identifier format
    "oidc-core": "required", // Appendix C.1 requires support for the id_token assertion format
  },
  related: ["authorization-code-pkce", "ciba", "aauth"],
  notes: [
    {
      title: "How this compares with other flows",
      body: `[Authorization code with PKCE](/flows/authorization-code-pkce/) sends the browser to an OAuth authorization endpoint and redeems a code with a verifier. GNAP starts with a signed JSON POST to a GNAP grant endpoint. The browser callback brings an interaction reference. The agent continues with that reference, the continuation token and its key proof.

[Backchannel approval (CIBA)](/flows/ciba/) starts with a direct request too. CIBA lets the authorization server reach the user separately. The GNAP profile here takes the browser there and back.

[AAuth](/flows/aauth/) also uses signed requests. Its calendar example starts at the resource, and a person server supplies the user’s identity and consent. Here the agent starts at the GNAP authorization server, which runs the interaction and issues the tokens.`,
    },
    {
      title: "What the profile requires beyond this example",
      body: `RFC 9635 Appendix C.1 calls for support for redirects to start and finish, SHA-256 for the interaction hash, and the string form of \`httpsig\` with JSON Web Keys carrying their algorithm and support for \`PS256\`. The profile also requires support for RFC 9493’s opaque subject identifier format and the OpenID Connect \`id_token\` assertion format. This grant asks for access only, so it carries no subject request.`,
    },
  ],
};
