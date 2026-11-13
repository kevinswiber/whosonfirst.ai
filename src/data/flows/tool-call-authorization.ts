import type { Flow } from "../types";

export const toolCallAuthorization: Flow = {
  slug: "tool-call-authorization",
  title: "Authorizing one tool call with AuthZEN",
  short: "Tool-call authorization",
  group: "cross-cutting",
  human: "any",
  maturity: "stable",
  tagline:
    "A tool service checks the caller’s credentials, then asks a policy service whether it may run this call with these arguments.",
  summary: `A support agent asks to refund $25 on order O-1842 for Alice. Its access token is valid, and the refund tool is visible. May it refund that order for her at that amount?

The tool service is the **policy enforcement point** (PEP): it can run the refund or stop it. It asks a **policy decision point** (PDP), the service that evaluates the rules, for an answer. AuthZEN defines the messages between them. The application decides how to describe the call and what its policy allows.`,
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
      "The agent’s token stops at the tool service. The tool service has its own credential for calling the policy service.",
    items: [
      {
        name: "Agent access token",
        type: "Opaque bearer token",
        issuer: "The application’s authorization server",
        recipient: "Tool service",
        meaning:
          "The issuer’s token record identifies the support agent, Alice and the tenant it may act in. It permits entry to the tool service; the refund still needs a decision.",
        binding: "Issued for the tool service; no key binding",
      },
      {
        name: "Tool service certificate",
        type: "TLS client certificate",
        issuer: "The operator’s certificate authority",
        recipient: "Policy service",
        meaning:
          "Identifies the tool service on the evaluation connection. The policy service accepts caller identity and request facts from that service.",
        binding:
          "The tool service proves it holds the certificate’s private key",
      },
    ],
  },
  lesson: "limits",
  phases: [
    { title: "Check the caller and the requested refund", from: 1 },
    { title: "Ask for a decision and enforce it", from: 3 },
    { title: "Try a larger refund with the same token", from: 6 },
  ],
  parts: {
    agent: "Sends the requested order and amount, along with its access token.",
    tool: "Checks the token and resolves the inputs the policy needs. Runs only the operation that received a usable allow answer.",
    policy:
      "Authenticates the tool service, applies the refund policy to the facts it receives and returns a decision. It cannot make the refund itself.",
  },
  illustrated: {
    steps:
      "The agent calls an HTTP tool endpoint. The AuthZEN exchange starts between the tool service and the policy service at step 3. Steps 6–9 show the alternative outcome with a different amount.",
    preconditions: [
      "The agent already has a token for the tool service. In this application, the issuer records which agent may act for which user in which tenant.",
      "The tool service knows its policy service endpoint. The two services authenticate each other over TLS.",
    ],
    references:
      "AuthZEN 1.0 defines the evaluation exchange; RFC 6750 supplies the bearer header on the tool call. The example’s token record, refund mapping and policy are application choices.",
  },
  participants: [
    { id: "agent", label: "Agent", sub: "Support assistant", role: "agent" },
    {
      id: "tool",
      label: "Tool service",
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
      label: "Request a $25 refund",
      title: "The agent requests a refund for one order",
      body: `The agent presents its access token over HTTPS. It proposes an order ID and an amount in cents. It does not get to choose the user or tenant in the request body.`,
      code: {
        lang: "http",
        text: `POST /tools/refund-order HTTP/1.1
Host: tools.example.com
Authorization: Bearer example-agent-token
Content-Type: application/json

{"order_id": "O-1842", "amount_minor": 2500}`,
      },
      gain: [["agent", "access token for the tool service"]],
    },
    {
      from: "tool",
      kind: "self",
      label: "Validate token; resolve order",
      title: "The tool service assembles the facts",
      body: `The tool service checks the token against the trusted issuer’s records: it must be active, issued for this service and valid for the agent to act for Alice in the Northwind tenant. If that check fails, the service rejects the call before asking for a decision. It takes the agent ID, represented user and tenant from the issuer’s record. The agent ID says which client the issuer gave the token to; a bearer token alone cannot prove who presented it.

The service takes the action from the route it will execute. It looks up the supplied order ID within Northwind, uses the order’s canonical ID and currency, and validates the requested amount as a positive integer in the currency’s minor units. It keeps those resolved inputs together for both evaluation and execution, and keeps the order’s current version for the write.`,
    },
    {
      from: "tool",
      to: "policy",
      kind: "back",
      label: "Evaluate this refund",
      title: "The tool service sends an AuthZEN evaluation",
      body: `The tool service authenticates to the policy service with its own TLS certificate. The agent’s bearer token is not forwarded.

AuthZEN requires a \`subject\`, \`resource\` and \`action\` and allows a \`context\` object. In this application, the subject is the agent, with Alice named in a subject property. The resource is the order, the action carries the amount and currency, and the context names the tenant. These field choices are the application’s mapping. AuthZEN defines no standard way to turn a delegation claim into any of them.`,
      code: {
        lang: "http",
        text: `POST /access/v1/evaluation HTTP/1.1
Host: policy.example.com
Content-Type: application/json

{
  "subject": {
    "type": "agent",
    "id": "support-agent",
    "properties": {"represented_user_id": "alice"}
  },
  "resource": {"type": "order", "id": "northwind:O-1842"},
  "action": {
    "name": "refund_order",
    "properties": {"amount_minor": 2500, "currency": "USD"}
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
      title: "The policy allows this $25 refund",
      body: `This application’s rules allow the support agent to refund on Alice’s behalf for orders she is allowed to handle in Northwind, up to $50 per refund. The policy service checks those permissions and the amount. AuthZEN returns a Boolean \`decision\`; here it is \`true\`.`,
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
      label: "Execute refund; return result",
      title: "The tool service executes the exact refund it evaluated",
      body: `The service matches the answer to the pending evaluation. It refunds $25 in USD using the same order, action and validated arguments. As part of the write it checks that the order version still matches the one it read. If the order changed, the write stops.

The service uses the answer only for the pending call and within a short window set by the application. A different amount or order needs its own evaluation. If the answer expires or the service learns that a fact used for the decision changed, it discards the answer and evaluates again before it can proceed.`,
    },
    {
      from: "agent",
      to: "tool",
      kind: "back",
      label: "Request an $80 refund",
      title: "The same valid token accompanies a larger refund",
      body: `In this alternative run, the agent sends the same token and order ID, but sets \`amount_minor\` to \`8000\`. The tool service validates the token and resolves the call as before.`,
    },
    {
      from: "tool",
      to: "policy",
      kind: "back",
      label: "Evaluate the $80 refund",
      title: "The tool service asks for a fresh decision",
      body: `The evaluation is the same except for \`action.properties.amount_minor\`, now \`8000\`. The service does not reuse an allow answer for $25.`,
    },
    {
      from: "policy",
      to: "tool",
      kind: "resp",
      label: "200 · deny",
      title: "The policy denies the larger refund",
      body: `The amount exceeds the policy’s $50 limit. The evaluation itself succeeded, so the policy service still returns HTTP 200. The Boolean \`false\` is the denial; an HTTP error from the policy service would mean it did not supply a decision.`,
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
      label: "Reject; no refund",
      title: "The tool service stops the call",
      body: `The tool service refuses the $80 refund even though the token is valid. It also refuses to execute if it gets no usable decision: for example, the evaluation times out or the reply has no Boolean decision. That is this application’s fail-closed rule. An unavailable policy service and a policy denial both stop execution, but they are different outcomes to report.`,
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
          body: `The COAZ binding for MCP is an AuthZEN working group draft. It reads claims from a validated JWT access token. Its default mapping uses the user’s token subject (\`sub\`) as the AuthZEN subject and puts the agent’s client ID, if present, in \`context.agent\`.

For a tool call, the default names the tool and leaves out its arguments. To include an amount in the evaluation, the server can declare a mapping for that tool in its input schema.`,
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
      body: `AuthZEN supplies the interface for an authorization decision. It does not supply the refund rules or ask Alice to approve the refund. If policy requires fresh approval for a sensitive operation, a separate flow such as [step-up authorization](/flows/step-up-authorization/) can collect it.`,
    },
  ],
};
