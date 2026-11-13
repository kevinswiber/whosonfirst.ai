import type { Flow } from "../types";

// Reference: AAuth e287b1e, protocol -11; HTTP Signature Keys -09.
// Review and step-to-source map: docs/reviews/aauth-2026-11-12.md.
// This is one PS authorization scenario, not a composite of access modes.
export const aauth: Flow = {
  slug: "aauth",
  title: "AAuth: reading a calendar with a person server",
  short: "AAuth",
  group: "human-in-the-loop",
  human: "reachable",
  maturity: "experimental",
  tagline:
    "An agent proves which person it acts for, obtains their consent, and signs its request. The API still decides what to allow.",
  summary: `Alice asks an assistant to read her calendar. An **agent provider** names the agent, a **person server (PS)** represents Alice, and the **calendar API** enforces access to her data.

AAuth is a separate protocol from OAuth. An unrelated individual draft, [draft-rosenberg-oauth-aauth](/standards/#aauth-rosenberg), also uses the name: it extends OAuth, and this page does not use it. This page follows **PS authorization**, one of its five resource access modes. The API has no separate access server: it accepts identity and consent from Alice’s person server, then applies its own policy.`,
  fits: [
    "Exploring agents that encounter APIs without being registered as clients at each one.",
    "Understanding what a user-chosen person server asserts, and what an API must still enforce.",
    "Prototyping signed requests, identity, and consent as separate checks. The draft is still changing.",
  ],
  watchOut: [
    "Require an auth token on the final call; a valid person token is not enough ([step 18](#step-18)).",
    "The API must enforce account access, scope and replay protections ([security boundaries](#boundaries)).",
    "The agent’s justification is its own claim, so the consent page must identify its source ([step 14](#step-14)).",
    "The draft and implementations can change independently; pin both ([status and sources](#reading-sources)).",
  ],
  lesson: "whose-authority",
  phases: [
    {
      title: "Establish the agent’s identity",
      from: 1,
    },
    {
      title: "Discover the API and identify Alice",
      from: 4,
    },
    {
      title: "Carry the API’s request to the person server",
      from: 8,
    },
    {
      title: "Ask Alice and collect the decision",
      from: 12,
    },
    {
      title: "Prove possession and enforce access",
      from: 17,
    },
  ],
  parts: {
    user: "Reviews the agent, calendar service and requested scope, then approves or refuses at the person server.",
    ap: "Enrolls the agent and binds its identity to its public key in an agent token.",
    ps: "Represents Alice, checks the request for access, obtains her consent and issues the tokens.",
    agent:
      "Keeps its signing key, carries tokens between parties and verifies each response before continuing.",
    api: "Describes the access it requires, verifies tokens and request signatures, and enforces its own policy.",
  },
  participants: [
    {
      id: "user",
      label: "User",
      sub: "AAuth: person",
      role: "human",
    },
    {
      id: "ps",
      label: "Person server",
      sub: "Chosen by the user",
      role: "authz",
    },
    {
      id: "ap",
      label: "Agent provider",
      sub: "Issues agent identity",
      role: "infra",
    },
    {
      id: "agent",
      label: "Agent",
      sub: "Has its own key",
      role: "agent",
    },
    {
      id: "api",
      label: "Calendar API",
      sub: "AAuth: resource",
      role: "resource",
    },
  ],
  steps: [
    {
      from: "agent",
      kind: "self",
      label: "Generate signing key",
      title: "The agent creates its own signing key",
      body: "The agent generates a key pair. The private key stays with the agent’s signing implementation; the public key can be bound into tokens. Keeping signing operations outside the language model is an implementation choice, not something a token enforces.",
      gain: [["agent", "signing key"]],
    },
    {
      from: "agent",
      to: "ap",
      kind: "back",
      label: "Enroll public key",
      title: "The agent proves itself to its provider",
      body: `The agent proves itself to the agent provider through a platform-specific enrollment mechanism. The provider decides whether to issue an identity bound to the submitted public key. The core draft does not specify a universal enrollment exchange, so this step has no HTTP listing.`,
    },
    {
      from: "ap",
      to: "agent",
      kind: "resp",
      label: "Agent token",
      title: "The provider signs the agent’s identity",
      body: `The provider issues an **agent token** with \`typ: aa-agent+jwt\`. Its signature binds the agent identifier to \`cnf.jwk\`, the agent’s public key. The provider’s signing key is separate from the agent’s key. The recommended lifetime is at most 24 hours. The required \`ps\` claim names Alice’s person server.

The listing shows the decoded JWT header and payload.`,
      code: {
        lang: "json",
        text: `{
  "header": {
    "alg": "Ed25519",
    "typ": "aa-agent+jwt",
    "kid": "ap-key-1"
  },
  "payload": {
    "iss": "https://agents.example",
    "dwk": "aauth-agent.json",
    "sub": "aauth:assistant.7f3c@agents.example",
    "ps": "https://ps.example",
    "cnf": {
      "jwk": {
        "kty": "OKP",
        "crv": "Ed25519",
        "alg": "Ed25519",
        "x": "ea1QQGf1oeC9vnp0g3rNa9DgNGmjBkODCdFgOaolCss"
      }
    },
    "jti": "at-51c2e0",
    "iat": 1794240000,
    "exp": 1794326400
  }
}`,
      },
      gain: [["agent", "agent token"]],
    },
    {
      from: "agent",
      to: "api",
      kind: "back",
      label: "Discover API metadata",
      title: "The agent reads the calendar API’s metadata",
      body: "The agent reads the resource metadata at the API’s well-known URL. Discovery tells it how to start; it does not confer trust or permission. The metadata’s issuer must match the URL before the well-known suffix. Before fetching metadata or keys, the agent and servers must check that their outbound-request policy permits the destination. A URL supplied in a token does not bypass that policy.",
      code: {
        lang: "http",
        text: `GET /.well-known/aauth-resource.json HTTP/1.1
Host: calendar.example`,
      },
    },
    {
      from: "api",
      to: "agent",
      kind: "resp",
      label: "Metadata and scope meaning",
      title: "The API describes the access it expects",
      body: `The API advertises \`access_mode: auth-token\`, so the agent starts with a person token. This declaration is advisory; requirements can change at runtime. The API publishes \`jwks_uri\` for verifying its resource tokens and describes \`calendar.read\` for the consent page.`,
      code: {
        lang: "json",
        text: `{
  "issuer": "https://calendar.example",
  "jwks_uri": "https://calendar.example/.well-known/jwks.json",
  "access_mode": "auth-token",
  "name": "Example Calendar",
  "scope_descriptions": {
    "calendar.read": "Read your calendar events"
  }
}`,
      },
    },
    {
      from: "agent",
      to: "ps",
      kind: "back",
      label: "Ask for a person token",
      title: "The agent asks for a person token for this API",
      body: `The agent reads the PS’s metadata at \`https://ps.example/.well-known/aauth-person.json\` and checks its \`issuer\`. The metadata supplies \`person_token_endpoint\` and \`auth_token_endpoint\`, here \`/person\` and \`/token\`.

The request names the calendar API as the token’s audience. \`Signature-Key\` carries the **agent token**; the agent signs with its own private key. \`Signature-Input\` lists the signed components, and \`Signature\` carries the result. Body-bearing requests to the PS must cover \`content-digest\` and \`content-type\`, in addition to method, authority, path and signature-key.`,
      code: {
        lang: "http",
        text: `POST /person HTTP/1.1
Host: ps.example
Content-Type: application/json
Content-Digest: sha-256=:3B5kr1N+7RsZx0N/Ye5sOXIa+xc6skzUiG/ieCr66oI=:
Signature-Key: sig=jwt;jwt="AGENT_TOKEN"
Signature-Input: sig=("@method" "@authority" "@path" "signature-key"
  "content-digest" "content-type");created=1794268800
Signature: sig=:SIGNATURE_BYTES:

{"resource":"https://calendar.example","capabilities":["interaction"]}`,
      },
    },
    {
      from: "ps",
      to: "agent",
      kind: "resp",
      label: "Person token for this API",
      title: "The person server identifies Alice to this API",
      body: `The PS verifies the provider’s signature on the agent token and the agent’s HTTP signature. It checks the existing agent–person binding and resource approval, so it can answer immediately.

The response contains \`person_token\` and \`expires_in\`. In the decoded JWT below, \`typ\` is \`aa-person+jwt\`, \`aud\` names this API, \`sub\` is Alice’s directed identifier there, and \`cnf.jwk\` is the agent’s public key. It carries no scope or account claim. Its lifetime is at most one hour and cannot exceed the agent token’s expiry.`,
      code: {
        lang: "json",
        text: `{
  "header": {
    "alg": "Ed25519",
    "typ": "aa-person+jwt",
    "kid": "ps-key-1"
  },
  "payload": {
    "iss": "https://ps.example",
    "dwk": "aauth-person.json",
    "aud": "https://calendar.example",
    "sub": "bc83dde689646e8541a62df13b879317",
    "cnf": {
      "jwk": {
        "kty": "OKP",
        "crv": "Ed25519",
        "alg": "Ed25519",
        "x": "ea1QQGf1oeC9vnp0g3rNa9DgNGmjBkODCdFgOaolCss"
      }
    },
    "jti": "pt-3ab910",
    "iat": 1794268800,
    "exp": 1794272400
  }
}`,
      },
      gain: [["agent", "person token (calendar API)"]],
    },
    {
      from: "agent",
      to: "api",
      kind: "back",
      label: "Signed request, person token",
      title: "The agent calls the API as Alice’s agent",
      body: `The agent signs \`GET /events\` with its private key and presents the **person token** in \`Signature-Key\`. The API receives the PS’s assertion about Alice, but no agent identifier.

\`AAuth-Capabilities: interaction\` says the agent can direct Alice to a consent page.`,
      code: {
        lang: "http",
        text: `GET /events HTTP/1.1
Host: calendar.example
AAuth-Capabilities: interaction
Signature-Key: sig=jwt;jwt="PERSON_TOKEN"
Signature-Input: sig=("@method" "@authority" "@path" "signature-key");created=1794268801
Signature: sig=:SIGNATURE_BYTES:`,
      },
    },
    {
      from: "api",
      to: "agent",
      kind: "resp",
      label: "401 with a resource token",
      title: "The API says what it needs, in a token of its own",
      body: `The API verifies the person token’s type, issuer signature, expiry, audience and key binding, and verifies the HTTP signature. This endpoint also requires consent for \`calendar.read\`, so it does not return her events yet.

It responds with \`401 Unauthorized\` and \`AAuth-Requirement: requirement=auth-token; resource-token="RESOURCE_TOKEN"\`. The API signs this resource token, decoded below, with its own issuer key. It describes the requested access.

\`aud\` names the PS because this scenario has no access server. \`ps\` and \`sub\` identify the person; \`presented_jti\` identifies the exact person token; \`agent_jkt\` is the RFC 7638 thumbprint of the agent’s key. The recommended lifetime is at most five minutes.`,
      code: {
        lang: "json",
        text: `{
  "header": {
    "alg": "Ed25519",
    "typ": "aa-resource+jwt",
    "kid": "calendar-key-1"
  },
  "payload": {
    "iss": "https://calendar.example",
    "dwk": "aauth-resource.json",
    "aud": "https://ps.example",
    "ps": "https://ps.example",
    "sub": "bc83dde689646e8541a62df13b879317",
    "presented_jti": "pt-3ab910",
    "agent_jkt": "cGXbwNDIqrkzguDVr5oBxAEAY2kEm2LccCsY3WJtRX8",
    "scope": "calendar.read",
    "jti": "rt-90c1f4",
    "iat": 1794268802,
    "exp": 1794269102
  }
}`,
      },
      gain: [["agent", "resource token"]],
    },
    {
      from: "agent",
      kind: "self",
      label: "Verify API challenge",
      title: "The agent checks what it will ask Alice to approve",
      body: "Before forwarding the challenge, the agent verifies the resource token’s JWT signature and expiry. Its issuer must be the API just called, `agent_jkt` must match the agent’s own key, and `ps`, `sub` and `presented_jti` must match the person server and person token used on that call. A mismatched challenge is rejected; it is not sent on as a request for consent.",
    },
    {
      from: "agent",
      to: "ps",
      kind: "back",
      label: "Ask for an auth token",
      title: "The agent takes the API’s request to the person server",
      body: `The agent submits the **resource token** as \`resource_token\` and the original **person token** as \`presented_token\`. Its HTTP request presents the **agent token** in \`Signature-Key\`. These carry the API’s request, the person named at the API, and the requesting agent’s identity.

\`justification\` gives the agent’s reason for access; \`capabilities\` says it can direct Alice to a page. \`Prefer: wait=45\` allows the PS to hold the connection for up to 45 seconds without promising a decision in that time.`,
      code: {
        lang: "http",
        text: `POST /token HTTP/1.1
Host: ps.example
Content-Type: application/json
Content-Digest: sha-256=:BaDaUqpHcNcrniyiSOuljtJ6jb9qVoUnY7FF5HekFPk=:
Prefer: wait=45
Signature-Key: sig=jwt;jwt="AGENT_TOKEN"
Signature-Input: sig=("@method" "@authority" "@path" "signature-key"
  "content-digest" "content-type");created=1794268803
Signature: sig=:SIGNATURE_BYTES:

{
  "resource_token": "RESOURCE_TOKEN",
  "presented_token": "PERSON_TOKEN",
  "justification": "Read the calendar to suggest free times next week",
  "capabilities": ["interaction"]
}`,
      },
    },
    {
      from: "ps",
      to: "agent",
      kind: "resp",
      label: "202: the user must approve",
      title: "The person server answers: not yet",
      body: `The PS verifies the resource token’s type, API signature and expiry. It checks that \`aud\` and \`ps\` name itself and \`agent_jkt\` matches the requesting agent’s key. It verifies \`presented_token\` too: its audience must be the API, its key must match, and its \`jti\`, issuer and subject must match the resource token’s \`presented_jti\`, \`ps\` and \`sub\`.

The PS needs Alice’s consent, so it returns \`202 Accepted\`. The agent polls the pending URL in \`Location\`; Alice visits the interaction \`url\` with its \`code\`. The pending URL must have the PS’s origin. The code links Alice’s visit to this request; it does not approve access.`,
      code: {
        lang: "http",
        text: `HTTP/1.1 202 Accepted
Location: /pending/f7a3b9c
Retry-After: 5
Cache-Control: no-store
AAuth-Requirement: requirement=interaction;
  url="https://ps.example/interact"; code="A1B2-C3D4"
Content-Type: application/json

{"status":"pending"}`,
      },
      gain: [["agent", "pending URL"]],
    },
    {
      from: "agent",
      to: "user",
      kind: "oob",
      label: "Link and code",
      title: "The agent sends Alice to her person server",
      body: `This PS advertises no \`interaction_endpoint\`, so the agent uses the direct-interaction fallback: it sends Alice the URL and code through its existing channel to her. The person server’s page must show the full request so Alice can recognize a link to someone else’s request.`,
      code: {
        lang: "text",
        text: "To approve, open https://ps.example/interact?code=A1B2-C3D4",
      },
    },
    {
      from: "user",
      to: "ps",
      kind: "front",
      label: "Sign in, read, approve",
      title: "Alice decides at her person server",
      body: `Alice signs in to her person server. The page identifies the agent asking for access and shows **Example Calendar** and its scope description, “Read your calendar events”, from the API’s metadata. It presents the agent’s justification separately, marked as the agent’s claim. The PS must not decide on that justification alone when the API describes the access.

Alice approves or refuses on the person server’s page. The agent does not control that page.`,
    },
    {
      from: "agent",
      to: "ps",
      kind: "back",
      label: "Poll the pending URL",
      title: "The agent polls",
      body: `The agent sends signed \`GET\` requests to the pending URL, using its agent token and respecting \`Retry-After\`. It does not resend the original POST body. The PS verifies the requesting agent on every poll.

While the decision is pending the PS returns \`202\`. A body with \`status: "interacting"\` means Alice has arrived: stop prompting her, but keep polling. A non-\`202\` response ends this polling exchange.

The auth token returns through polling, not through Alice’s browser.`,
      code: {
        lang: "http",
        text: `GET /pending/f7a3b9c HTTP/1.1
Host: ps.example
Signature-Key: sig=jwt;jwt="AGENT_TOKEN"
Signature-Input: sig=("@method" "@authority" "@path" "signature-key");created=1794268890
Signature: sig=:SIGNATURE_BYTES:`,
      },
    },
    {
      from: "ps",
      to: "agent",
      kind: "resp",
      label: "Auth token",
      title: "The person server issues an auth token",
      body: `After Alice approves, the next poll returns \`200 OK\` with \`auth_token\` and \`expires_in\`. The PS signs an \`aa-auth+jwt\`, shown decoded below. Its \`iss\` and \`ps\` name the PS, its \`aud\` names the API, and its \`cnf.jwk\` is still the agent’s key. \`scope\` records \`calendar.read\`.

The agent checks that issuer equals the resource token’s audience, audience equals the intended API, key equals its own, and subject equals the person token’s subject. The draft also recommends verifying the issuer’s JWT signature.

The token’s lifetime is at most one hour. It must expire no later than either the agent token or the presented person token. Here the person token expires first. The resource token’s five-minute lifetime limits when it can be redeemed. It does not set the resulting grant’s expiry.`,
      code: {
        lang: "json",
        text: `{
  "header": {
    "alg": "Ed25519",
    "typ": "aa-auth+jwt",
    "kid": "ps-key-1"
  },
  "payload": {
    "iss": "https://ps.example",
    "dwk": "aauth-person.json",
    "aud": "https://calendar.example",
    "ps": "https://ps.example",
    "sub": "bc83dde689646e8541a62df13b879317",
    "scope": "calendar.read",
    "cnf": {
      "jwk": {
        "kty": "OKP",
        "crv": "Ed25519",
        "alg": "Ed25519",
        "x": "ea1QQGf1oeC9vnp0g3rNa9DgNGmjBkODCdFgOaolCss"
      }
    },
    "jti": "au-7d20b5",
    "iat": 1794268890,
    "exp": 1794272400
  }
}`,
      },
      gain: [["agent", "auth token (calendar.read)"]],
      lose: [
        ["agent", "resource token"],
        ["agent", "pending URL"],
      ],
    },
    {
      from: "agent",
      to: "api",
      kind: "back",
      label: "Signed request, auth token",
      title: "The agent calls again, with the auth token",
      body: `The agent retries step 8 with the **auth token** in \`Signature-Key\`. It signs again with the same private key and a fresh \`created\` time. Replacing the person token without signing again would invalidate the request signature, which covers \`signature-key\`.

This request has no body or query string.`,
      code: {
        lang: "http",
        text: `GET /events HTTP/1.1
Host: calendar.example
AAuth-Capabilities: interaction
Signature-Key: sig=jwt;jwt="AUTH_TOKEN"
Signature-Input: sig=("@method" "@authority" "@path" "signature-key");
  created=1794268891
Signature: sig=:SIGNATURE_BYTES:`,
      },
    },
    {
      from: "api",
      kind: "self",
      label: "Verify and enforce",
      title: "The API checks both signatures and its own policy",
      body: `**Token:** require \`aa-auth+jwt\`, the expected metadata document name, a valid issuer signature, an unexpired token, this API as audience, and a usable \`cnf.jwk\`. A person token must fail here even if it has the same issuer, subject and key.

**Request:** check the required signed components and freshness, then verify the HTTP signature using that confirmed agent key. A token signature alone does not prove possession of the agent key.

**Policy:** resolve \`(iss, sub)\` to Alice’s existing account and check \`calendar.read\` against the requested operation. A different issuer using the same subject string is a different identity. Verified signatures do not entitle that identity to Alice’s calendar. A failed policy check denies access.`,
    },
    {
      from: "api",
      to: "agent",
      kind: "resp",
      label: "200 OK: Alice’s events",
      title: "The API returns the calendar events",
      body: `The API returns Alice’s events only after all the checks in step 18 pass. It has evidence of a person-server assertion, consented scope, and possession of the bound key.

Later reads can reuse the unexpired auth token with a new HTTP signature on each request. The PS does not approve or observe every calendar read. The API enforces the allowed scope on every call.`,
    },
  ],
  standards: ["aauth-hardt", "signature-key", "rfc9421", "rfc7638", "rfc9449"],
  basis: ["aauth-hardt"],
  roles: {
    "aauth-hardt": "required",
    "signature-key": "required",
    rfc9421: "required",
    rfc7638: "required",
    rfc9449: "background",
  },
  illustrated: {
    steps: `**One scenario: a returning user grants read access to their calendar.** The PS requires fresh consent for this scope.`,
    preconditions: [
      "Alice has connected this agent to her person server.",
      "She has allowed it to act as her at this API.",
      "The API maps her `(iss, sub)` to her existing calendar.",
      "She has not yet granted `calendar.read`.",
    ],
    examples:
      "JWT listings show decoded headers and payloads. Token strings and signature bytes are placeholders, not cryptographic test vectors. HTTP headers wrap for readability.",
    references:
      "The diagram follows protocol -11: agent, person, resource and auth tokens, HTTP request signatures, and a JWK thumbprint binding. Enrollment is shown conceptually, without choosing a bootstrap mechanism. The access-mode comparison describes the other arrangements; this diagram follows only PS authorization.",
  },
  related: ["web-bot-auth", "dpop", "ciba", "mcp-authorization", "gnap"],
  comparison: {
    title: "The five arrangements",
    intro:
      "An API chooses an access mode for each endpoint and tells the agent what it requires. These five modes differ in what the API learns and who vouches for it.",
    rowHeading: "Arrangement",
    fields: [
      {
        heading: "What the API ends up knowing",
        label: "The API knows",
      },
      {
        heading: "Who established it",
        label: "Established by",
      },
      {
        heading: "What the agent presents",
        label: "The agent presents",
      },
    ],
    rows: [
      {
        name: "Agent identity",
        values: [
          "Which agent",
          "The agent’s provider",
          "Its agent token. This mode can replace an API key",
        ],
      },
      {
        name: "Resource-managed",
        values: [
          "Which agent and which person",
          "The API’s own sign-in or consent, which can be the OAuth it already runs",
          "Its agent token. The API may also issue a session token, which works only under the agent’s signature",
        ],
      },
      {
        name: "Person identity",
        values: [
          "Which person",
          "The person server",
          "A person token. The API decides what a person it recognizes may do",
        ],
      },
      {
        name: "PS authorization, as drawn",
        values: [
          "Which person, and the scope they consented to",
          "The person server",
          "A person token, then an auth token from the person server",
        ],
      },
      {
        name: "Federated authorization",
        values: [
          "Which person, and what its own policy decided",
          "An access server that evaluates policy for the API",
          "A person token, then an auth token from the access server, which the person server obtains for it",
        ],
      },
    ],
    after:
      "In federated authorization the access server also receives the agent token and may use it in its policy decision.",
  },
  notes: [
    {
      title: "How this differs from OAuth",
      body: `**Independent agent identity.** An AAuth agent gets an identity bound to its key from its provider. It need not register as a client separately at every resource. That does not mean a resource has to permit it.

**Signed requests.** This flow presents key-bound JWTs through Signature-Key and signs HTTP messages. OAuth deployments can add sender constraint through [DPoP](/flows/dpop/) or mutual TLS; the wire protocols differ.

**Deferred consent.** Here the agent collects the token by signed polling. The browser carries an interaction code, not an OAuth authorization code.

**A user-chosen server.** In this mode the person server asserts identity and consent; the resource retains enforcement. Federated AAuth adds a separate access server for resource policy.`,
    },
    {
      title: "What is not drawn",
      body: `**Other ways in.** An API can advertise an authorization endpoint so the agent can ask for a resource token before making an API call. A first request for a person token at a resource may need its own user interaction. Agents without a person server and APIs that serve on person identity alone use other access modes.

**Other ways to reach the user.** When a PS offers an \`interaction_endpoint\`, the draft says the agent SHOULD try that relay before directing the user itself; \`interaction_unavailable\` permits fallback. A PS can also contact the user through its own established channel and return \`requirement=approval\`. The draft calls that a stronger defense against misleading links.

**Missions.** A user can approve a task description at the PS. It then evaluates and logs authorization requests under that mission against the task and earlier requests. It still does not observe every subsequent API call. An agent may report what it did, but that report is optional.

**Access servers and chains.** An API can name an access server to evaluate its policy. An API calling another API acts as an agent in turn; downstream permission is evaluated anew, not automatically narrowed from an upstream scope. AAuth tokens carry no delegation chain, whereas [token exchange](/flows/token-exchange/) can carry actor information.

**Drawing conventions.** AAuth calls this three-party PS authorization, counting agent, resource and PS. The drawing adds the person and provider, so it has five lanes. Enrollment is conceptual; metadata and JWKS fetches used in verification are described in the steps rather than drawn for every cached key.

Companion drafts cover enrollment, authorization in an API’s own vocabulary, and event delivery.`,
    },
  ],
  credentials: {
    title: "Four tokens, two kinds of signature",
    intro:
      "An issuer signs each JWT to vouch for its [claims](/glossary/#claim). The agent separately signs an HTTP request to prove possession of the key bound into the token it presents. Verifiers check the issuer’s key and the agent’s key for different reasons. The resource token uses a key thumbprint instead of carrying the public key.",
    items: [
      {
        name: "Agent token",
        type: "aa-agent+jwt",
        issuer: "Agent provider",
        recipient: "Person server, in Signature-Key",
        meaning:
          "Which agent holds this key. It does not grant calendar access.",
        binding: "cnf.jwk — the agent’s public key",
      },
      {
        name: "Person token",
        type: "aa-person+jwt",
        issuer: "Person server",
        recipient:
          "API, in Signature-Key; then back to the PS as presented_token",
        meaning:
          "Which person the agent acts for at this API. No scope or account claim.",
        binding: "cnf.jwk — the same agent key",
      },
      {
        name: "Resource token",
        type: "aa-resource+jwt",
        issuer: "Calendar API",
        recipient: "Person server, carried by the agent as resource_token",
        meaning:
          "What access the API asks to have approved, for which person and presented token. Not a grant.",
        binding: "agent_jkt — the agent key’s thumbprint",
      },
      {
        name: "Auth token",
        type: "aa-auth+jwt",
        issuer: "Person server in this scenario",
        recipient: "API, in Signature-Key",
        meaning:
          "The person and approved calendar.read scope. The API applies its own policy.",
        binding: "cnf.jwk — the same agent key",
      },
    ],
  },
  sections: [
    {
      id: "boundaries",
      title: "What the successful request does not settle",
      intro:
        "The last arrow is an authorized read in this scenario. These boundaries matter when turning the example into a system.",
      parts: [
        {
          title: "Identity continuity and account access",
          body: `The draft describes looking up \`(iss, sub)\`: a known pair matches an existing user record; an unknown pair creates a new one. The subject is opaque and proves continuity under that issuer, not a legal identity. A new record does not identify another user’s existing calendar; the API still applies its own policy.

**This guide’s recommendation:** if the API also has accounts from another sign-in system, require a separate authenticated decision before linking one to this pair. The draft does not define that account-linking procedure.`,
          sources: [
            {
              label: "Person tokens and verification",
              href: "https://github.com/dickhardt/AAuth/blob/e287b1e5d4616b61e5fcda1ac56b1be14f9d8d06/draft-hardt-oauth-aauth-protocol.md#L848",
            },
            {
              label: "Trust in PS authorization",
              href: "https://github.com/dickhardt/AAuth/blob/e287b1e5d4616b61e5fcda1ac56b1be14f9d8d06/draft-hardt-oauth-aauth-protocol.md#L2864",
            },
          ],
        },
        {
          title: "Consent and actual authority",
          body: "Alice’s approval is for calendar.read. The agent’s stated aim — suggesting free times — does not narrow that scope to one week or prohibit other reads. Those limits need enforcement by the API or a more restrictive grant. This scenario grants no permission to create or change events. The PS’s signature cannot override the API’s policy.",
          sources: [
            {
              label: "Consent presentation",
              href: "https://github.com/dickhardt/AAuth/blob/e287b1e5d4616b61e5fcda1ac56b1be14f9d8d06/draft-hardt-oauth-aauth-protocol.md#L1031",
            },
            {
              label: "Scopes",
              href: "https://github.com/dickhardt/AAuth/blob/e287b1e5d4616b61e5fcda1ac56b1be14f9d8d06/draft-hardt-oauth-aauth-protocol.md#L2641",
            },
          ],
        },
        {
          title: "Proof of possession and replay",
          body: "Copying a token alone is insufficient without the bound private key. Copying an entire signed request may still permit replay within its freshness window unless the verifier detects duplicates. The default window is 60 seconds and can be advertised differently. An API request’s query string and body are not implicitly signed. The API must require coverage for components that affect the operation. The draft separately requires signed content-digest and content-type for bodies sent to a PS or access server, and for revocation requests with bodies.",
          sources: [
            {
              label: "Signed components",
              href: "https://github.com/dickhardt/AAuth/blob/e287b1e5d4616b61e5fcda1ac56b1be14f9d8d06/draft-hardt-oauth-aauth-protocol.md#L2202",
            },
            {
              label: "Freshness and replay",
              href: "https://github.com/dickhardt/AAuth/blob/e287b1e5d4616b61e5fcda1ac56b1be14f9d8d06/draft-hardt-oauth-aauth-protocol.md#L2268",
            },
          ],
        },
        {
          title: "Renewal and revocation",
          body: `Reuse tokens only while valid, with a fresh request signature each time. AAuth uses re-authorization rather than OAuth refresh tokens. Renew the person token before expiry and obtain a fresh resource token and auth token; a new grant remains bounded by the token presented to obtain it. If the resource token expires before redemption, obtain a new one. Key rotation requires new tokens bound to the new key.

The protocol also defines revocation and cascading notices. Stopping new issuance alone does not erase an already issued JWT from an API’s view. Recipients need the revocation handling the draft defines; otherwise expiry remains relevant. This diagram does not demonstrate a revocation deployment.`,
          sources: [
            {
              label: "Re-authorization",
              href: "https://github.com/dickhardt/AAuth/blob/e287b1e5d4616b61e5fcda1ac56b1be14f9d8d06/draft-hardt-oauth-aauth-protocol.md#L1289",
            },
            {
              label: "Token revocation",
              href: "https://github.com/dickhardt/AAuth/blob/e287b1e5d4616b61e5fcda1ac56b1be14f9d8d06/draft-hardt-oauth-aauth-protocol.md#L2666",
            },
          ],
        },
      ],
    },
    {
      id: "reading-sources",
      afterNotes: true,
      title: "Status and sources",
      intro:
        "Reviewed on 12 November 2026 against protocol -11 and HTTP Signature Keys -09, both individual Internet-Drafts. The author’s draft repository is the reference; the explorer and JavaScript packages are supporting material.",
      parts: [
        {
          title: "The protocol draft",
          body: "The protocol Markdown at e287b1e matches the -11 tag and Datatracker revision. The author’s README reports adoption of an OpenID Foundation working group and a planned move of specification work there. That report does not change the IETF draft’s status. The flow remains experimental.",
          sources: [
            {
              label: "Author’s README at e287b1e",
              href: "https://github.com/dickhardt/AAuth/blob/e287b1e5d4616b61e5fcda1ac56b1be14f9d8d06/README.md",
            },
            {
              label: "Reviewed protocol source (e287b1e)",
              href: "https://github.com/dickhardt/AAuth/blob/e287b1e5d4616b61e5fcda1ac56b1be14f9d8d06/draft-hardt-oauth-aauth-protocol.md",
            },
            {
              label: "Official IETF draft record",
              href: "https://datatracker.ietf.org/doc/draft-hardt-oauth-aauth-protocol/",
            },
          ],
        },
        {
          title: "The Protocol Explorer",
          body: "The reviewed explorer covers person tokens and the five modes, but its PS authorization examples still use EdDSA, omit alg from the confirmation JWK, and include alg in Signature-Input. Protocol -11 requires fully specified algorithm identifiers such as Ed25519, requires alg in the key, and prohibits the HTTP signature alg parameter. Use its interactions to explore the sequence; check wire examples against the draft.",
          sources: [
            {
              label: "Reviewed explorer scenario (e6d7913)",
              href: "https://github.com/aauth-dev/explorer/blob/e6d79137cda1a6a650d4394a37095393e1cc62ba/lib/scenarios/ps-asserted.json",
            },
            {
              label: "Signature algorithms and keying",
              href: "https://github.com/dickhardt/AAuth/blob/e287b1e5d4616b61e5fcda1ac56b1be14f9d8d06/draft-hardt-oauth-aauth-protocol.md#L2164",
            },
          ],
        },
        {
          title: "The JavaScript packages",
          body: "The reviewed resource verifier requires callers to name acceptable token types, checks audience and key binding, and rejects EdDSA in favor of fully specified algorithms. That is useful implementation evidence for the distinctions on this page, not a claim that the whole SDK conforms to every draft requirement. Its top-level README still illustrates an older exchange without the person-token step. Follow the draft and inspect the code path you use.",
          sources: [
            {
              label: "Reviewed token verifier (9002b28)",
              href: "https://github.com/aauth-dev/packages-js/blob/9002b289db6fe9614831fe734d142c119139463b/resource/src/verify-token.ts",
            },
            {
              label: "README at the same revision",
              href: "https://github.com/aauth-dev/packages-js/blob/9002b289db6fe9614831fe734d142c119139463b/README.md",
            },
          ],
        },
      ],
    },
  ],
};
