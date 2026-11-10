import type { Flow } from "../types";

export const tokenExchange: Flow = {
  slug: "token-exchange",
  title: "Token exchange (on-behalf-of)",
  short: "Token exchange",
  group: "delegation",
  human: "any",
  maturity: "stable",
  tagline:
    "Obtain a token for the next API, with user and actor identity when the supported profile carries both.",
  summary: `A reporting tool exchanges Alice’s token for a separate token addressed to the warehouse. This diagram shows an actor-aware delegation profile; the warehouse still enforces Alice’s permissions and the tool’s allowed actions.`,
  reading: {
    brief: {
      authority:
        "Alice’s delegated grant, with the reporting tool identified as the current actor in this illustration.",
      benefit:
        "The warehouse receives a token intended for it and can apply policy to both Alice and the tool.",
      cost: "Every fresh exchange adds a call to the issuer. Changing or revoking the input grant does not automatically invalidate an issued warehouse token. [See the consequence at step 5](#step-5).",
      prerequisites: [
        "Alice already authorized the reporting task. The tool validates its incoming token and authenticates to the exchange server.",
        "The exchange server trusts the input issuer and token type, permits this tool’s exchange, and maps the requested operation to allowed downstream actions.",
        "The warehouse accepts the new credential and trusts its issuer. This actor-aware arrangement also needs an issuance profile that supplies trusted actor evidence and an API that enforces it.",
      ],
      responsibilities:
        "The exchange server decides what it may issue. The warehouse must still enforce Alice’s allowed objects and fields and the tool’s permitted actions. A valid delegated token does not supply those business rules. [See the API’s checks](#step-7).",
      alternatives: [
        {
          condition:
            "If the warehouse cannot accept a suitable delegated credential or actor evidence, this arrangement does not meet that goal.",
          label: "Review the enforcement boundary.",
          href: "#step-7",
        },
        {
          condition:
            "If a trusted application will enforce user policy while the downstream API authorizes the service, workload access may fit.",
          label: "Workload identity federation",
          href: "/flows/workload-identity-federation/",
        },
      ],
    },
    phases: [
      {
        title: "Establish the request",
        summary: "The tool receives and validates the user’s token.",
        start: 1,
        end: 2,
      },
      {
        title: "Issue downstream access",
        summary:
          "The issuer evaluates the exchange and creates a token for the warehouse.",
        start: 3,
        end: 5,
      },
      {
        title: "Enforce and return",
        summary:
          "The warehouse applies policy before data returns through the tool.",
        start: 6,
        end: 9,
      },
    ],
    decisions: {
      presentation: "inline",
      items: [
        {
          atStep: 5,
          title: "A fresh exchange or a valid cached token",
          benefit:
            "A separate warehouse token keeps audiences apart; a fresh exchange lets the issuer evaluate the request again.",
          cost: "Fresh exchanges add latency and issuer availability dependence. An already-issued token has its own lifetime and revocation behavior.",
          mitigation: {
            action:
              "Where supported, reuse an issued token while it remains valid.",
            conditions:
              "Keep cache entries separate by user, current actor, target, effective permissions, sender binding and any required grant context. Reuse only within the same context.",
            addedCost:
              "The tool owns cache isolation, protected storage, expiry and renewal handling. This is deployment advice, not a feature guaranteed by token exchange.",
            remaining:
              "A cached token may remain usable after upstream authority changes unless the deployment can cut off that issued access. Short validity limits time; it does not eliminate misuse of permitted calls.",
          },
          sources: [
            {
              label: "RFC 8693 §2.1: input and output tokens",
              href: "https://www.rfc-editor.org/rfc/rfc8693.html#section-2.1",
            },
            {
              label: "RFC 8693 §4.1: actor identity",
              href: "https://www.rfc-editor.org/rfc/rfc8693.html#section-4.1",
            },
          ],
        },
      ],
    },
  },
  fits: [],
  watchOut: [],
  participants: [
    { id: "agent", label: "Agent", sub: "Has user’s token", role: "agent" },
    { id: "tool", label: "Tool server", sub: "Middle tier", role: "agent" },
    { id: "as", label: "Authorization server", role: "authz" },
    { id: "api", label: "Downstream API", role: "resource" },
  ],
  steps: [
    {
      from: "agent",
      to: "tool",
      kind: "back",
      label: "Call tool with user’s token",
      title: "The agent calls a tool for the user",
      body: `The agent already holds an access token obtained with the user’s consent. Its audience is the tool server. The listing shows selected illustrative claims, not a complete JWT.`,
      code: {
        lang: "json",
        text: `{
  "iss": "https://auth.example",
  "sub": "user:alice",
  "client_id": "research-agent",
  "aud": "https://tools.example/mcp",
  "scope": "reports.generate"
}`,
      },
      gain: [["agent", "token A (aud: tool)"]],
    },
    {
      from: "tool",
      kind: "self",
      label: "Validate; needs downstream data",
      title: "The tool validates the token and hits a wall",
      body: `The tool validates token A and checks that Alice may request this report operation. To build the report it must also read warehouse data. Token A is addressed to the tool, not the warehouse, so the tool must not forward it. The MCP specification forbids this token passthrough. The warehouse’s data-access checks still follow at [step 7](#step-7).`,
      gain: [["tool", "token A (aud: tool)"]],
    },
    {
      from: "tool",
      to: "as",
      kind: "back",
      label: "Token exchange request",
      title: "The tool asks for a token for the next hop",
      body: `The tool authenticates as itself and presents token A as the \`subject_token\`, requesting the target and actions it needs. In this illustrative profile the issuer establishes the tool’s actor identity from the authenticated client and its policy. Other profiles may require an \`actor_token\` and its type. Client authentication and actor establishment must be agreed with this issuer; a caller-supplied actor name is not evidence. [RFC 8693 §2.1](https://www.rfc-editor.org/rfc/rfc8693.html#section-2.1) defines the request parameters, not a universal delegation policy.`,
      code: {
        lang: "http",
        text: `POST /token HTTP/1.1
Host: auth.example
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <tool server credentials>

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&subject_token=<token A>
&subject_token_type=urn:ietf:params:oauth:token-type:access_token
&resource=https://warehouse.example/api
&scope=sales.read`,
      },
    },
    {
      from: "as",
      kind: "self",
      label: "Policy: may tool act for user?",
      title: "The authorization server decides",
      body: `The issuer validates token A under its accepted token profile, permits this tool to exchange it, and checks the requested target and actions against policy. Here it maps the user-authorized \`reports.generate\` operation at the tool to the permitted \`sales.read\` action at the warehouse. These scope strings belong to different APIs; comparing the strings cannot prove that authority was narrowed. The issuer owns that mapping and issues only the downstream access this request is allowed.`,
    },
    {
      from: "as",
      to: "tool",
      kind: "resp",
      label: "Token B: sub=user, act=tool",
      title: "A new token that records the delegation",
      body: `Token B is addressed to the warehouse and keeps Alice as its subject. The \`act\` claim is the issuer’s identification of the current actor, the reporting tool. It does not by itself prove that whoever presents this bearer token holds the tool’s key. The listing shows selected illustrative claims, not a complete RFC 9068 token.

A profile may preserve earlier actors as nested \`act\` claims. [RFC 8693 §4.1](https://www.rfc-editor.org/rfc/rfc8693.html#section-4.1) makes that history informational: prior actors are not inputs to access-control decisions. Issuance and consumption of actor evidence depend on the profile and implementation. Verify both with the tokens you will receive; exchange support alone does not promise this output.`,
      code: {
        lang: "json",
        text: `{
  "iss": "https://auth.example",
  "sub": "user:alice",
  "aud": "https://warehouse.example/api",
  "scope": "sales.read",
  "exp": 1794269100,
  "act": {
    "sub": "https://tools.example/mcp"
  }
}`,
      },
      gain: [["tool", "token B (aud: API, act: tool)"]],
    },
    {
      from: "tool",
      to: "api",
      kind: "back",
      label: "Call with token B",
      title: "The tool calls the downstream API",
      body: `Token A stays where it is. Only token B crosses this boundary.`,
    },
    {
      from: "api",
      kind: "self",
      label: "Check aud; read sub and act",
      title: "The API sees both parties",
      body: `The warehouse validates the credential from its trusted issuer, including validity and the warehouse audience. This profile requires accepted current-actor evidence; missing or unrecognized evidence fails that policy. Another format may identify the actor differently, so absence of \`act\` is not a universal test for impersonation.

The warehouse then enforces Alice’s allowed rows, objects and fields **and** the reporting tool’s permitted actions, such as reading sales but not payroll. A valid delegated token does not implement these business rules. These [application authorization checks](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) sit outside the exchange protocol. If the warehouse cannot enforce the intended identities, this actor-aware arrangement does not fit; a separately authorized downstream connection or trusted application policy is a different composition.`,
    },
    {
      from: "api",
      to: "tool",
      kind: "resp",
      label: "Data",
      title: "The API responds",
      body: `The response goes to the tool.`,
    },
    {
      from: "tool",
      to: "agent",
      kind: "resp",
      label: "Tool result",
      title: "The tool returns its result",
      body: `The agent never held the warehouse credential. A stolen token A cannot be used directly at a warehouse that enforces its audience. But a compromised agent may still invoke the tool’s permitted operations and receive their results. Credential separation does not prevent misuse of that allowed access or disclosure of returned data.`,
    },
  ],
  standards: ["rfc8693", "rfc8707", "rfc9068", "mcp-authorization"],
  related: [
    "cross-app-access",
    "identity-chaining",
    "transaction-tokens",
    "authorization-code-pkce",
  ],
  notes: [
    {
      title: "Where the agent shows up",
      body: `In this picture the agent appears in token A as \`client_id\` and is absent from token B unless the issuer’s profile carries it forward. Earlier actors may be preserved as informational history; they do not automatically become downstream policy inputs. Several current drafts explore representing an agent separately from its hosting application. See the [standards tracker](/standards/?topic=delegation).`,
    },
    {
      title: "A documented implementation",
      body: `AWS describes an on-behalf-of exchange for agents in a reference implementation on Amazon Bedrock AgentCore: [Propagate user authorization context in AI agents](https://aws.amazon.com/blogs/security/propagate-user-authorization-context-in-ai-agents-with-amazon-bedrock-agentcore/), published in August 2026. AgentCore Identity exchanges the signed-in user’s identity at Salesforce’s token endpoint for a user-scoped token, and Salesforce’s sharing rules decide what comes back. It is a documented path, described from the article and not tested here.

The same article protects two other data sources using mechanisms other than RFC 8693 token exchange, with different enforcement boundaries. DynamoDB access is limited by IAM, through \`AssumeRoleWithWebIdentity\` with session tags. A knowledge base is filtered in the agent’s own code, which AWS calls application-layer enforcement.

In [workload identity federation](/flows/workload-identity-federation/) the workload proves what it is and receives access of its own. A trusted application can still enforce user permissions while using that service access. Here, instead, the downstream credential carries the user’s delegated authority for the receiver to enforce. An agent often needs both its own identity to authenticate the exchange and the user’s token as the subject.`,
    },
  ],
};
