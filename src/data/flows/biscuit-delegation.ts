import type { Flow } from "../types";

export const biscuitDelegation: Flow = {
  slug: "biscuit-delegation",
  title: "Delegating narrower permissions with Biscuit",
  short: "Biscuit delegation",
  group: "delegation",
  human: "any",
  maturity: "stable",
  tagline:
    "Give a worker a token with fewer permissions, without asking the issuer for a new one.",
  summary: `Alice asks her agent to summarize one calendar event. The agent can read two events in her calendar and edit one of them. It delegates the summary to a worker, but handing over its own token would give that worker more access than the task needs.

With Biscuit, the agent acts as an orchestrator and appends restrictions to the token: read this event, before this deadline. This is called **attenuation**. It happens locally, without the issuer. The worker receives the restricted token, and the API checks both its signatures and its restrictions before allowing a request.

The original token still works. The worker’s copy cannot shed its restrictions, but the orchestrator keeps its broader access. And the restricted token is still a bearer credential: anyone who copies it can use the permissions that remain.`,
  fits: [
    "An orchestrator delegates a small part of its access to a worker or tool.",
    "The receiving API supports Biscuit and can evaluate its restrictions against the actual request.",
    "The issuer need not be contacted for each delegation; the API already trusts its public key.",
  ],
  watchOut: [
    "Attenuation does not revoke the original token. Keep that token out of the worker’s process, environment and logs. A worker that can read it can bypass the narrower copy.",
    "Biscuit is a bearer token. It does not prove which worker sent a request, or that a person approved it. Add separate authentication where caller identity matters.",
    "The API supplies the facts about the request: the resource, operation, service and time. Model output is not an authority for those facts.",
    "Verification needs the expected issuer’s public key. Accepting a key supplied by the caller would let the caller mint its own permissions.",
    "Offline verification does not discover revocation. Each API needs an explicit way to obtain and enforce current revocation information, or must accept the remaining lifetime of a token.",
  ],
  lesson: "chains",
  phases: [
    { title: "The issuer grants access to the orchestrator", from: 1 },
    { title: "The orchestrator gives the worker a restricted copy", from: 3 },
    { title: "The API checks the token and the requested operation", from: 5 },
  ],
  parts: {
    issuer:
      "Decides the original permissions and signs the first block. Its authentication and approval process is a prerequisite here, not something Biscuit defines. Keeps the signing key private and distributes the public key to the API through a trusted channel.",
    parent:
      "Appends restrictions using a Biscuit library and gives only the resulting token to the worker. Keeps the broader token outside the worker’s reach. It does not need the issuer’s signing key to add restrictions.",
    worker:
      "Calls the API with the restricted token. It can copy that token or restrict it further, but cannot remove its existing restrictions. The token alone does not authenticate the worker.",
    api: "Verifies the token against the expected issuer key, supplies facts from the actual request and its own clock, and evaluates every check plus its own policy. Rejects if any check fails or the first matching policy is a deny. With no matching policy, it also rejects.",
  },
  illustrated: {
    steps:
      "Alice’s agent delegates a calendar-reading task to one worker. The API reads Biscuit’s 3.x Protocol Buffers format and evaluates its Datalog dialect through version 3.3. No third-party blocks or custom trust scopes are used.",
    preconditions: [
      "Alice has authorized the agent to access these calendar events, and the issuer has authenticated the agent and approved the original permissions. That setup is outside this diagram; Biscuit does not define login or consent.",
      "The Calendar API has the issuer’s public key and a policy for interpreting these permissions. The worker cannot read the orchestrator’s original token.",
      "The API derives one canonical resource and operation from each request. It supplies its own service name and current time.",
    ],
    examples:
      "The Datalog listings are readable text. Token blocks are stored as Protocol Buffers bytes; the API’s own facts and policy are not part of the token. Resource names, predicates and dates are application choices. The HTTP example wraps the binary token in base64url text for a header chosen by this application.",
    references:
      "The diagram follows the project’s stable Biscuit specification, pinned to the source revision linked in the tracker. The rating describes that specification, not every library that implements it.",
  },
  participants: [
    { id: "issuer", label: "Token issuer", role: "authz" },
    { id: "parent", label: "Agent", sub: "Orchestrator", role: "agent" },
    { id: "worker", label: "Worker", role: "agent" },
    { id: "api", label: "Calendar API", role: "resource" },
  ],
  steps: [
    {
      from: "issuer",
      kind: "self",
      label: "Sign the original rights",
      title: "The issuer writes the original permissions",
      body: `The first block is the **authority block**. Only the issuer can sign it with the root signing key. Here it permits reading two calendar events and editing one, and limits use to this Calendar API before 20:00 UTC. The predicate names are this application’s vocabulary, not reserved Biscuit claims.`,
      code: {
        lang: "text",
        text: `right("alice/event-1", "read");
right("alice/event-1", "write");
right("alice/event-2", "read");
check if service("calendar.example");
check if time($now), $now < 2026-11-13T20:00:00Z;`,
      },
      gain: [["issuer", "original Biscuit token"]],
    },
    {
      from: "issuer",
      to: "parent",
      kind: "resp",
      label: "Original token",
      title: "The orchestrator receives its access",
      body: `The issuer delivers the token over the protected channel established during setup. The orchestrator can now use the listed permissions. It holds a credential it can restrict; it never receives the issuer’s signing key.`,
      gain: [["parent", "original Biscuit token"]],
    },
    {
      from: "parent",
      kind: "self",
      label: "Append restrictions",
      title: "The orchestrator makes a copy for one task",
      body: `A Biscuit library appends a block that restricts the token to reads of event 1 before 18:00 UTC. The library links the new block to the existing signature chain. Someone holding only this new token cannot remove its checks without invalidating the token’s proof. No request goes to the issuer. The orchestrator still holds the original token as well.`,
      code: {
        lang: "text",
        text: `check if resource("alice/event-1");
check if operation("read");
check if time($now), $now < 2026-11-13T18:00:00Z;`,
      },
      gain: [["parent", "restricted Biscuit token"]],
    },
    {
      from: "parent",
      to: "worker",
      kind: "back",
      label: "Task + restricted token",
      title: "Only the restricted copy reaches the worker",
      body: `The task is to summarize event 1. The worker receives the restricted token over a protected channel. It gets no access to the orchestrator’s token store. Biscuit does not enforce that separation: the host running these processes must provide it.`,
      gain: [["worker", "restricted Biscuit token"]],
    },
    {
      from: "worker",
      to: "api",
      kind: "back",
      label: "Read + restricted token",
      title: "The worker presents the token to the API",
      body: `The request travels over HTTPS. This application uses \`Biscuit-Token\` as its credential header; Biscuit defines the token, not a required HTTP authentication scheme. The token proves the permission chain, not the identity of the worker presenting it.`,
      code: {
        lang: "http",
        text: `GET /calendars/alice/events/1 HTTP/1.1
Host: calendar.example
Biscuit-Token: <base64url-encoded restricted token>`,
      },
      gain: [["api", "restricted Biscuit token"]],
    },
    {
      from: "api",
      kind: "self",
      label: "Verify the token",
      title: "The API checks where the permissions came from",
      body: `Starting with the issuer’s public key, the API verifies the signature chain. It checks the final proof against the key named by the last block. These checks establish that the blocks have not been altered. That does not yet mean this request is allowed: the API must evaluate the checks and its own policy next.`,
    },
    {
      from: "api",
      kind: "self",
      label: "Check the actual request",
      title: "The API evaluates every restriction and its policy",
      body: `The API builds a fresh **authorizer**, Biscuit’s evaluation context, for this request. It derives the resource and operation from the route, and the time from its own clock. Every token check must pass, and an allow policy must match without an earlier matching deny.

The policy uses the default trust scopes: it accepts rights from the issuer’s authority block and the API itself, not rights invented in a later block. Adding \`right("alice/event-2", "write")\` downstream cannot grant that permission.`,
      code: {
        lang: "text",
        text: `service("calendar.example");
resource("alice/event-1");
operation("read");
time(2026-11-13T17:50:00Z);

allow if resource($event), operation($op), right($event, $op);`,
      },
    },
    {
      from: "api",
      to: "worker",
      kind: "resp",
      label: "Event or refusal",
      title: "The API returns only what this request permits",
      body: `Reading event 1 before the deadline passes both the token’s checks and the API’s policy. Editing it, reading event 2, or calling at or after the deadline fails a check. The API executes the same operation on the same resource it evaluated; it does not reuse the result for a different request.`,
    },
  ],
  standards: ["biscuit"],
  roles: {
    biscuit: "required", // authority and appended blocks, signatures, scopes, checks and policy evaluation
  },
  related: ["token-exchange", "credential-broker", "dpop"],
  sections: [
    {
      id: "language-and-format",
      title: "The rule language and the token format",
      intro:
        "Biscuit specifies both how permissions are expressed and how tokens are encoded.",
      parts: [
        {
          title: "Biscuit’s Datalog dialect",
          body: `Datalog is a logic language built from facts, rules and queries. Biscuit defines its own dialect, including checks, allow/deny policies and trust scopes. The API must implement those semantics to authorize a request; decoding the token and verifying its signatures is not enough.`,
          sources: [
            {
              label: "Biscuit’s logic language",
              href: "https://github.com/eclipse-biscuit/biscuit/blob/b3d3fe2d744ea8ee964ab0eba96dbc8c9bde1639/SPECIFICATIONS.md#logic-language",
            },
          ],
        },
        {
          title: "The Protocol Buffers encoding",
          body: `Biscuit uses Protocol Buffers for the outer token and the Datalog data inside each block. Biscuit’s schema defines the fields. Protocol Buffers supplies the binary encoding; Biscuit supplies the signature and authorization rules. Base64url makes those bytes suitable for text transport.`,
          sources: [
            {
              label: "Biscuit’s token format",
              href: "https://github.com/eclipse-biscuit/biscuit/blob/b3d3fe2d744ea8ee964ab0eba96dbc8c9bde1639/SPECIFICATIONS.md#format",
            },
            {
              label: "Biscuit’s Protocol Buffers schema",
              href: "https://github.com/eclipse-biscuit/biscuit/blob/b3d3fe2d744ea8ee964ab0eba96dbc8c9bde1639/schema.proto",
            },
            {
              label: "Protocol Buffers encoding",
              href: "https://protobuf.dev/programming-guides/encoding/",
            },
          ],
        },
      ],
    },
  ],
  comparison: {
    title: "What the worker’s token permits",
    intro:
      "These outcomes use the token and API policy shown above, with no additional grant or policy change.",
    rowHeading: "Request",
    fields: [
      { heading: "Result", label: "Result" },
      { heading: "Why", label: "Why" },
    ],
    rows: [
      {
        name: "Read event 1 at 17:50 UTC on November 13, 2026",
        values: [
          "Allowed",
          "The original right matches the policy, and every check passes.",
        ],
      },
      {
        name: "Edit event 1 before the deadline",
        values: ["Denied", "The appended check requires a read."],
      },
      {
        name: "Read event 2 before the deadline",
        values: ["Denied", "The appended block restricts access to event 1."],
      },
      {
        name: "Read event 1 at or after 18:00 UTC on November 13, 2026",
        values: [
          "Denied",
          "The time check requires a time before the deadline.",
        ],
      },
    ],
  },
  notes: [
    {
      title: "Expiry and revocation are checks the API enforces",
      body: `Each deadline here is a Datalog check, evaluated against the API’s current time. The worker’s earlier deadline narrows the issuer’s original one. Biscuit does not add an expiry merely because a token was issued. Set one deliberately when the task should end.

The specification also defines a revocation identifier for each block: its signature serialized as a byte array. An API can compare those identifiers with a revocation list. Rejecting the authority block’s identifier can reject that token and all its restricted descendants; rejecting a later block’s identifier targets the branch containing it. Distributing and refreshing that list is a deployment responsibility. A disconnected API cannot learn a new revocation from signature verification alone.

The [access revocation flow](/flows/access-revocation/) shows a session-based case of the same freshness problem: the API must learn and enforce changed state to stop accepting an existing token. That example uses session events; this one uses Biscuit block identifiers.`,
    },
    {
      title: "Choose where the restriction happens",
      body: `With [token exchange](/flows/token-exchange/), a server authorizes an exchange and issues a new token. With Biscuit, a holder restricts an existing credential locally, and the API evaluates it. With a [credential broker](/flows/credential-broker/), a proxy can keep the downstream credential out of the worker altogether. With [AuthZEN tool-call authorization](/flows/tool-call-authorization/), the API sends facts about the call to a policy service and enforces its decision.

These arrangements protect different boundaries. Biscuit limits what the worker’s credential permits, but a stolen copy still works within those limits. Neither the restrictions nor the signature chain records user consent unless the application explicitly supplies and verifies evidence of it.`,
    },
  ],
};
