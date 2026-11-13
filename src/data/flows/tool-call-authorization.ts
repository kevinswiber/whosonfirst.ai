import type { Flow } from "../types";

export const toolCallAuthorization: Flow = {
  slug: "tool-call-authorization",
  title: "Authorizing one tool call with AuthZEN",
  short: "Tool-call authorization",
  group: "cross-cutting",
  human: "any",
  maturity: "stable",
  tagline:
    "The API checks the agent’s token, then asks a policy service whether to allow this call with these arguments.",
  summary: `Alice asks her scheduling agent to block 30 minutes on her work calendar. The agent has a valid token and can see the tool for adding a focus block, an event with no invitees. The Calendar API still has to decide whether the agent may add this particular event.

The Calendar API acts as the **policy enforcement point** (PEP). It asks the **policy decision point** (PDP) to evaluate the call, then either writes the event or refuses it. AuthZEN defines the messages between them. The application decides how to describe the call and what its policy allows.`,
  fits: [
    "Tool services and gateways that need to decide on a specific record, tenant or argument after validating a credential.",
    "Services that want to keep the policy decision separate from the code that carries it out.",
  ],
  watchOut: [
    "A visible tool, a valid token and a previous allow answer do not authorize a new call.",
    "Policy only governs calls that reach the enforcement point. Close paths to the operation that go around it.",
    "A prompt injection can still induce a call that your policy allows. AuthZEN does not tell you whether Alice intended that call.",
  ],
  credentials: {
    title: "What each caller presents",
    intro:
      "The agent’s token stops at the Calendar API. The API uses its own credential to call the policy service.",
    items: [
      {
        name: "Agent access token",
        type: "Opaque bearer token",
        issuer: "The application’s authorization server",
        recipient: "Calendar API",
        meaning:
          "The issuer’s record names the scheduling agent, Alice and the tenant where the agent may act for her. Adding an event still needs a policy decision.",
        binding: "Issued for the Calendar API, with no key binding",
      },
      {
        name: "Calendar API certificate",
        type: "TLS client certificate",
        issuer: "The operator’s certificate authority",
        recipient: "Policy service",
        meaning:
          "Identifies the Calendar API to the policy service, which trusts the API to supply caller identity and request facts.",
        binding: "The API proves it holds the certificate’s private key",
      },
    ],
  },
  lesson: "limits",
  phases: [
    { title: "Check the caller and the calendar request", from: 1 },
    { title: "Ask for a decision and enforce it", from: 3 },
    { title: "Try a longer event with the same token", from: 6 },
  ],
  parts: {
    agent:
      "Sends its access token with the requested calendar, start time and duration.",
    tool: "Checks the token and resolves the inputs the policy needs. Runs only the operation that received a usable allow answer.",
    policy:
      "Authenticates the Calendar API, applies the event policy to the facts it receives and returns a decision for the API to enforce.",
  },
  illustrated: {
    steps:
      "The agent calls an HTTP tool endpoint at the Calendar API. The API sends its first AuthZEN evaluation in step 3. Steps 6–9 show the alternative outcome when only the event’s duration changes.",
    preconditions: [
      "The agent already has a token that lets it request calendar writes for Alice. In this application, the issuer records which agent may act for which user in which tenant.",
      "The Calendar API knows its policy service endpoint. The two services authenticate each other over TLS.",
    ],
    references:
      "AuthZEN 1.0 defines the evaluation exchange. RFC 6750 supplies the bearer header on the tool call. The token record, calendar mapping and policy are application choices.",
  },
  participants: [
    { id: "agent", label: "Agent", sub: "Scheduling assistant", role: "agent" },
    {
      id: "tool",
      label: "Calendar API",
      sub: "Enforces the decision",
      role: "resource",
    },
    {
      id: "policy",
      label: "Policy service",
      sub: "Decides what is allowed",
      role: "authz",
    },
  ],
  steps: [
    {
      from: "agent",
      to: "tool",
      kind: "back",
      label: "Request a 30-minute block",
      title: "The agent asks to add a focus block",
      body: `The agent presents its access token over HTTPS. It sends a calendar ID, start time and duration in minutes. The user and tenant come from the token record.`,
      code: {
        lang: "http",
        text: `POST /api/tools/add-focus-block HTTP/1.1
Host: calendar.example
Authorization: Bearer example-agent-token
Content-Type: application/json

{
  "calendar_id": "work",
  "starts_at": "2026-11-16T17:00:00Z",
  "duration_minutes": 30
}`,
      },
      gain: [["agent", "access token for the Calendar API"]],
    },
    {
      from: "tool",
      kind: "self",
      label: "Validate token; resolve calendar",
      title: "The Calendar API assembles the facts",
      body: `The Calendar API checks the token against the trusted issuer’s records: it must be active, issued for this service and valid for the agent to act for Alice in the Northwind tenant. If that check fails, the service rejects the call before asking for a decision. It takes the agent ID, represented user and tenant from the issuer’s record. The agent ID says which client the issuer gave the token to. A bearer token alone cannot prove who presented it.

The API takes the action from its route and resolves the supplied calendar ID within Alice’s account in Northwind. It uses the calendar’s canonical ID, parses the start time as UTC and checks that the duration is a positive whole number of minutes. It keeps these inputs together for both evaluation and execution.`,
    },
    {
      from: "tool",
      to: "policy",
      kind: "back",
      label: "Evaluate this event",
      title: "The Calendar API sends an AuthZEN evaluation",
      body: `The Calendar API authenticates to the policy service with its own TLS certificate. It keeps the agent’s bearer token at the API.

AuthZEN requires a \`subject\`, \`resource\` and \`action\` and allows a \`context\` object. In this application, the subject is the agent, with Alice named in a subject property. The resource is the calendar, the action carries the start time and duration, and the context names the tenant. These field choices are the application’s mapping. AuthZEN defines no standard way to turn a delegation claim into any of them.`,
      code: {
        lang: "http",
        text: `POST /access/v1/evaluation HTTP/1.1
Host: policy.example.com
Content-Type: application/json

{
  "subject": {
    "type": "agent",
    "id": "scheduling-agent",
    "properties": {"represented_user_id": "alice"}
  },
  "resource": {"type": "calendar", "id": "northwind:alice-work"},
  "action": {
    "name": "add_focus_block",
    "properties": {
      "starts_at": "2026-11-16T17:00:00Z",
      "duration_minutes": 30
    }
  },
  "context": {"tenant_id": "northwind"}
}`,
      },
      gain: [["tool", "TLS client certificate and private key"]],
    },
    {
      from: "policy",
      to: "tool",
      kind: "resp",
      label: "200 · allow",
      title: "The policy allows the 30-minute event",
      body: `In this application, the scheduling agent may add focus blocks for Alice on a Northwind calendar she can write to, up to 60 minutes per block. That limits how much time a single tool call can mark as busy. The policy service checks the agent and Alice against its delegation rules, checks Alice’s write permission for this calendar and applies the duration limit. It returns the AuthZEN Boolean \`decision\`; here it is \`true\`.`,
      code: {
        lang: "http",
        text: `HTTP/1.1 200 OK
Content-Type: application/json

{"decision": true}`,
      },
    },
    {
      from: "tool",
      to: "agent",
      kind: "resp",
      label: "Add the event; return result",
      title: "The Calendar API adds the event it evaluated",
      body: `The API matches the answer to the pending evaluation. It uses the same calendar, action, start time and 30-minute duration to write the event.

The API uses the answer only for the pending call and within a short window set by the application. A changed calendar, start time or duration needs a new evaluation. If the answer expires or the API learns that a fact used for the decision changed, such as Alice’s write permission, it discards the answer and evaluates again before it can proceed.`,
    },
    {
      from: "agent",
      to: "tool",
      kind: "back",
      label: "Request a 90-minute block",
      title: "The same valid token accompanies a longer event",
      body: `In this alternative run, the agent sends the same token, calendar ID and start time. It sets \`duration_minutes\` to \`90\`. The Calendar API validates the token and resolves the call as before.`,
    },
    {
      from: "tool",
      to: "policy",
      kind: "back",
      label: "Evaluate the 90-minute event",
      title: "The Calendar API asks for a fresh decision",
      body: `The API sends a new evaluation with \`action.properties.duration_minutes\` set to \`90\`. The other fields match the 30-minute request.`,
    },
    {
      from: "policy",
      to: "tool",
      kind: "resp",
      label: "200 · deny",
      title: "The policy denies the longer event",
      body: `The event exceeds the policy’s 60-minute limit. The evaluation succeeds, so the policy service returns HTTP 200. The Boolean \`false\` is the denial; an HTTP error from the policy service would mean it did not supply a decision.`,
      code: {
        lang: "http",
        text: `HTTP/1.1 200 OK
Content-Type: application/json

{"decision": false}`,
      },
    },
    {
      from: "tool",
      to: "agent",
      kind: "resp",
      label: "Reject; no event",
      title: "The Calendar API stops the call",
      body: `The Calendar API refuses to add the 90-minute event even though the token is valid. It also refuses to write if it gets no usable decision: for example, the evaluation times out or the reply has no Boolean decision. That is this application’s fail-closed rule. An unavailable policy service and a policy denial both stop execution, but they are different outcomes to report.`,
    },
  ],
  standards: ["authzen", "rfc6750", "coaz-mcp"],
  roles: {
    authzen: "required", // Access Evaluation API and HTTPS binding in steps 3–4 and 7–8
    rfc6750: "required", // the illustrated bearer header in step 1
    "coaz-mcp": "optional", // a separate mapping; the HTTP tool in the steps does not use it
  },
  related: ["mcp-authorization", "step-up-authorization", "token-exchange"],
  sections: [
    {
      id: "mcp",
      title: "If the tool uses MCP",
      intro:
        "An MCP server or gateway can be the enforcement point. The numbered steps use an application’s own mapping from its HTTP tool call.",
      parts: [
        {
          title: "A draft way to map MCP calls",
          body: `The COAZ binding for MCP is an AuthZEN working group draft. Its default mapping takes the AuthZEN subject from \`sub\` in the validated JWT access token. If \`sub\` names the agent, the issuer and enforcement point can agree on a different token claim that names the user the agent acts for.

With Alice’s identity selected, the COAZ mapping puts her in \`subject.id\` and the agent’s client ID, if present, in \`context.agent\`. Step 3 uses the reverse arrangement. The agent is the subject, and Alice is in \`subject.properties.represented_user_id\`. The policy has to read the fields its enforcement point sends.

For a tool call, the default names the tool and leaves out its arguments. To include an event’s duration in the evaluation, the server can declare a mapping for that tool in its input schema.`,
          sources: [
            {
              label: "COAZ Binding for MCP",
              href: "https://openid.github.io/authzen/authzen-coaz-mcp-binding-1_0",
            },
          ],
        },
      ],
    },
  ],
  notes: [
    {
      title: "Where consent fits",
      body: `The AuthZEN Authorization API carries the decision. It does not ask Alice to approve the event. The calendar application supplies the rules. If policy requires fresh approval from Alice, a separate flow such as [step-up authorization](/flows/step-up-authorization/) can collect it.`,
    },
  ],
};
