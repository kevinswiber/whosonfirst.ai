/**
 * Decision guide: questions, and the rules that turn answers into recommended flows.
 *
 * A rule applies when every key it names matches the selected answer. Questions
 * the reader has not answered yet do not rule anything out.
 */

export interface Question {
  id: string;
  title: string;
  help?: string;
  /** Where the question is explained, for a reader who is not sure what it is asking. */
  more?: { href: string; text: string };
  options: { value: string; label: string; hint?: string }[];
}

export const questions: Question[] = [
  {
    id: "principal",
    title: "Whose authority is the agent using?",
    help: "The single most important question. It decides whose name is on the token.",
    more: {
      href: "/learn/whose-authority/",
      text: "Not sure? Lesson 4 sorts five examples",
    },
    options: [
      {
        value: "user",
        label: "A specific person’s",
        hint: "Their data, their permissions",
      },
      {
        value: "self",
        label: "Its own",
        hint: "A service identity that an admin set up",
      },
    ],
  },
  {
    id: "human",
    title: "Is a person available when access is needed?",
    options: [
      {
        value: "present",
        label: "Yes, in the session",
        hint: "They can click through a sign-in now",
      },
      {
        value: "reachable",
        label: "Reachable, but elsewhere",
        hint: "Phone, chat, email",
      },
      {
        value: "absent",
        label: "No",
        hint: "Scheduled, event-driven, overnight",
      },
    ],
  },
  {
    id: "target",
    title: "What is the agent calling?",
    help: "Choose the interface for this call. An API, MCP server or agent can be yours or someone else’s.",
    options: [
      { value: "api", label: "An HTTP API", hint: "For example, a REST API" },
      { value: "mcp", label: "An MCP server", hint: "Calling tools over MCP" },
      { value: "agent", label: "Another agent", hint: "Handing off a task" },
      { value: "web", label: "A public website", hint: "Browsing web pages" },
    ],
  },
  {
    id: "boundary",
    title: "Who runs the service, and whose identity system does it trust?",
    options: [
      {
        value: "same",
        label: "We run it and share an identity system",
        hint: "Both sides use our organization’s identity system",
      },
      {
        value: "enterprise",
        label: "A vendor that trusts our company sign-in",
        hint: "Both sides trust our company’s identity provider",
      },
      {
        value: "cross",
        label: "It uses a separate identity system",
        hint: "For example, a third-party API with its own accounts",
      },
    ],
  },
  {
    id: "runtime",
    title: "Where does the agent run?",
    options: [
      {
        value: "local",
        label: "On the user’s machine",
        hint: "Desktop app, IDE, CLI",
      },
      {
        value: "headless",
        label: "Remote, with no browser",
        hint: "Container, SSH session, CI job",
      },
      {
        value: "k8s",
        label: "Our own servers or cloud",
        hint: "A hosted app, containers, Kubernetes",
      },
      { value: "managed", label: "A managed agent platform" },
      { value: "sandbox", label: "A sandbox that runs untrusted code" },
    ],
  },
  {
    id: "risk",
    title: "What is the worst it could do?",
    options: [
      { value: "read", label: "Read data" },
      { value: "write", label: "Change things that can be undone" },
      {
        value: "irreversible",
        label: "Something irreversible",
        hint: "Move money, delete, send in someone’s name",
      },
    ],
  },
];

export type Role = "start" | "add" | "consider";

export const ROLE_TITLE: Record<Role, string> = {
  start: "Start with",
  add: "Then add",
  consider: "Worth a look",
};

export interface Rule {
  flow: string;
  role: Role;
  /** question id → acceptable answers */
  when: Record<string, string[]>;
  why: string;
  /** Higher sorts first within a role. */
  weight?: number;
}

export const rules: Rule[] = [
  // ── a person's authority, person present ──
  {
    flow: "mcp-authorization",
    role: "start",
    weight: 10,
    when: {
      principal: ["user"],
      human: ["present"],
      target: ["mcp"],
      boundary: ["same", "cross"],
    },
    why: "MCP defines the whole sequence for this case: discover the authorization server, identify the client by URL, sign in, and get a token bound to that one server.",
  },
  {
    flow: "authorization-code-pkce",
    role: "start",
    weight: 9,
    when: {
      principal: ["user"],
      human: ["present"],
      target: ["api", "agent", "web"],
      runtime: ["local", "k8s", "managed"],
    },
    why: "A person is present and a browser is available. This is the baseline everything else is measured against.",
  },
  {
    flow: "gnap",
    role: "consider",
    when: {
      principal: ["user"],
      human: ["present"],
      target: ["api"],
      runtime: ["local", "k8s", "managed"],
    },
    why: "If the API and its authorization server support GNAP, the agent can sign a grant request, send the user to approve it in a browser, then resume the request to get a token.",
  },
  {
    flow: "device-authorization",
    role: "start",
    weight: 9,
    when: {
      principal: ["user"],
      human: ["present"],
      runtime: ["headless", "sandbox"],
    },
    why: "There is no browser where the agent runs, so the user approves on another device. Run this from the program that controls the agent, outside any sandbox, so the tokens never land where untrusted code runs. Show the user only a code your own program has just requested: a code that arrives any other way may belong to an attacker’s sign-in.",
  },
  // Two rules for one flow. The first, for a person in the session or reachable,
  // does not name the human question: naming it would make it match one more
  // answer and lift it above authorization code for a person at a browser. When
  // no one is there, the second matches one more answer and replaces it. Its
  // weight is below the authorization code rule for no one present, which a
  // reader who has not said who runs the thing being called should see first.
  // The first has to stay above the second, in this list and in weight: of two
  // rules that match as many answers, the page keeps the earlier, and the
  // Markdown copy, which lists rules by weight, says it keeps the first listed.
  {
    flow: "cross-app-access",
    role: "start",
    weight: 11,
    when: {
      principal: ["user"],
      boundary: ["enterprise"],
      target: ["mcp", "api"],
    },
    why: "Both sides trust your company identity provider, so let it decide. Employees sign in once and administrators control which agents reach which applications.",
  },
  {
    flow: "cross-app-access",
    role: "start",
    weight: 5,
    when: {
      principal: ["user"],
      human: ["absent"],
      boundary: ["enterprise"],
      target: ["mcp", "api"],
    },
    why: "No one has to be there each time, but the employee has to have signed in first. If the agent asked for offline access at that sign-in, the identity provider may give it a refresh token. With that token the agent can get new grants without a new sign-in, for as long as the identity provider still honors the token and its policy allows each request. When the token stops working, the employee signs in again. The application’s authorization server should not issue a refresh token of its own. The identity provider’s token can reach every application the policy allows, with no one asked.",
  },

  // ── a person's authority, person elsewhere or absent ──
  {
    flow: "ciba",
    role: "start",
    weight: 10,
    when: { principal: ["user"], human: ["reachable"] },
    why: "The user is not in the session. The authorization server contacts them on a device it already knows and the agent waits for the answer.",
  },
  {
    flow: "authorization-code-pkce",
    role: "start",
    weight: 6,
    when: {
      principal: ["user"],
      human: ["absent"],
      boundary: ["same", "cross"],
    },
    why: "Someone has to consent once. Obtain the grant while the user is present, with the narrowest scope that works. Where the authorization server issues a refresh token, the agent can then run unattended on it. Plan how the grant is revoked.",
  },
  {
    flow: "ciba",
    role: "consider",
    weight: 5,
    when: { principal: ["user"], human: ["absent"], risk: ["irreversible"] },
    why: "If the agent can do irreversible things for a user who is not watching, find a way to make them reachable for those moments.",
  },

  {
    flow: "aauth",
    role: "consider",
    weight: 3,
    when: {
      principal: ["user"],
      human: ["present", "reachable"],
      target: ["api"],
      boundary: ["cross"],
    },
    why: "A separate draft protocol for agents that were not registered as clients at each API. A user-chosen person server asserts identity and consent; the API still maps the person to an account and enforces access. The walkthrough shows one calendar-read scenario. Treat it as experimental.",
  },

  // ── approvals ──
  {
    flow: "step-up-authorization",
    role: "add",
    weight: 8,
    when: {
      principal: ["user"],
      human: ["present"],
      risk: ["write", "irreversible"],
    },
    why: "Keep the everyday token weak. Let the API demand a fresh, specific approval when the agent reaches a sensitive action.",
  },
  {
    flow: "url-elicitation",
    role: "add",
    weight: 6,
    when: {
      principal: ["user"],
      human: ["present"],
      target: ["mcp"],
      boundary: ["cross", "enterprise"],
    },
    why: "If the MCP server fronts another service, it can collect the user’s grant for that service in a browser, without the credential passing through the agent.",
  },

  // ── delegation down a chain ──
  {
    flow: "token-exchange",
    role: "add",
    weight: 7,
    when: {
      principal: ["user"],
      boundary: ["same"],
      target: ["mcp", "api", "agent"],
    },
    why: "Any tool or sub-agent that calls another service for the same user should exchange the token it received for a new one, never forward it.",
  },
  {
    flow: "transaction-tokens",
    role: "add",
    weight: 8,
    when: {
      principal: ["user"],
      target: ["api", "mcp", "agent"],
      boundary: ["same"],
    },
    why: "If the call fans out across services in one trust domain, carry the user and the fixed details of the request in a short-lived token. Use workload identity to authenticate each hop.",
  },
  {
    flow: "biscuit-delegation",
    role: "consider",
    when: { target: ["api", "mcp", "agent"] },
    why: "If the agent hands work to a tool or worker and the receiving service supports Biscuit, give the worker a restricted copy of the token without asking the issuer for a new one.",
  },
  {
    flow: "identity-chaining",
    role: "add",
    weight: 6,
    when: {
      boundary: ["cross"],
      target: ["api", "agent", "mcp"],
      human: ["reachable", "absent"],
    },
    why: "If the receiving service’s authorization server trusts yours, obtain a grant from yours and redeem it there. Each side keeps control of its own tokens.",
  },

  // ── the agent's own authority ──
  {
    flow: "workload-identity-federation",
    role: "start",
    weight: 10,
    // Every target is named so that this rule matches as many answers as the client
    // credentials rule below, and stays above it.
    when: {
      principal: ["self"],
      runtime: ["k8s", "managed", "headless"],
      target: ["mcp", "api", "agent", "web"],
    },
    why: "The platform can vouch for the agent. Use the identity it establishes to get short-lived access, with no long-lived secret to provision.",
  },
  {
    flow: "client-credentials",
    role: "start",
    weight: 8,
    when: {
      principal: ["self"],
      target: ["mcp", "api", "agent"],
      runtime: ["headless", "k8s", "managed", "sandbox"],
    },
    why: "The agent authenticates as itself. Use a signed assertion instead of a client secret wherever the authorization server allows.",
  },
  // On a person's machine the agent has an identity of its own only where its
  // installation was given a credential no other copy holds (RFC 8252, section
  // 8.4). The first rule is for that case, the second for every other.
  {
    flow: "client-credentials",
    role: "start",
    weight: 6,
    when: {
      principal: ["self"],
      target: ["mcp", "api", "agent"],
      runtime: ["local"],
    },
    why: "Only where this installation was given a credential of its own, one that no other copy holds. Keep it in the operating system’s credential store, and prefer a key to a secret. A secret built into the app is the same in every copy, so it proves nothing about this one.",
  },
  {
    flow: "authorization-code-pkce",
    role: "start",
    weight: 5,
    when: { principal: ["self"], runtime: ["local"] },
    why: "Where the installation has no credential of its own, the agent has no identity to prove, and the access is really a person’s. Have the person who runs it sign in, and act for them.",
  },
  {
    flow: "spiffe-workload-identity",
    role: "start",
    weight: 9,
    when: {
      runtime: ["k8s"],
      target: ["api", "mcp", "agent"],
      boundary: ["same"],
    },
    why: "Between workloads you operate, give each a cryptographic identity and authenticate both ends of every connection.",
  },
  {
    flow: "wimse-workload-tokens",
    role: "consider",
    weight: 4,
    when: {
      runtime: ["k8s", "managed"],
      target: ["api", "mcp", "agent"],
    },
    why: "If both workloads can use the same workload identity scheme and gateways terminate TLS between them, a key-bound token with per-request proof survives the hop. The specifications are still working-group drafts.",
  },

  // ── agents and the web ──
  {
    flow: "agent-to-agent",
    role: "start",
    weight: 9,
    when: { target: ["agent"] },
    why: "The remote agent’s card declares what credentials it accepts. Obtain them with one of the other flows here.",
  },
  {
    flow: "web-bot-auth",
    role: "start",
    weight: 9,
    when: { target: ["web"] },
    why: "Sign requests so sites can tell which operator your agent belongs to. It identifies the agent. For anything personal the user still has to sign in, and they do that themselves: the agent never collects their password.",
  },
  {
    flow: "agent-payments",
    role: "consider",
    weight: 5,
    when: { target: ["web", "agent"], risk: ["irreversible"] },
    why: "If the irreversible thing is a purchase, signed mandates give merchants and payment providers evidence of what the user approved.",
  },

  // ── hardening ──
  {
    flow: "tool-call-authorization",
    role: "consider",
    weight: 5,
    when: {
      principal: ["user"],
      target: ["api", "mcp", "agent"],
      boundary: ["same"],
      risk: ["write", "irreversible"],
    },
    why: "The service you run can ask a policy service about the specific action, record and arguments before it changes anything.",
  },
  {
    flow: "access-revocation",
    role: "add",
    when: {
      principal: ["user"],
      target: ["api", "mcp", "agent"],
    },
    why: "If ending a user’s session needs to cut off access before the token expires, the authorization server can report the change and the receiving service can enforce it. Both have to agree on which session the event identifies.",
  },
  {
    flow: "credential-broker",
    role: "start",
    weight: 12,
    when: { runtime: ["sandbox"] },
    why: "An agent running untrusted code should not hold secrets. Keep them outside the sandbox and inject them at the network edge.",
  },
  {
    flow: "credential-broker",
    role: "add",
    weight: 5,
    when: { runtime: ["managed", "headless"], target: ["api", "mcp", "web"] },
    why: "Where the platform offers a credential vault or egress proxy, use it so the model never sees a token.",
  },
  {
    flow: "dpop",
    role: "add",
    weight: 4,
    when: {
      runtime: ["local", "headless", "k8s", "sandbox", "managed"],
      target: ["api", "mcp", "agent"],
      risk: ["write", "irreversible"],
    },
    why: "Bind tokens to a key held where the model cannot read it. A token copied from a log is then refused by any API that checks the binding.",
  },
  {
    flow: "dpop",
    role: "consider",
    weight: 2,
    when: { target: ["api", "mcp", "agent"], risk: ["read"] },
    why: "Sender-constrained tokens are cheap insurance wherever both ends support them.",
  },
  {
    flow: "oauth-mtls",
    role: "consider",
    when: { target: ["api", "mcp", "agent"] },
    why: "If the authorization server and receiving service support certificate-bound OAuth tokens, present the same client certificate at both. The receiving service checks that it matches the token’s binding.",
  },
];

export interface Caution {
  when: Record<string, string[]>;
  text: string;
}

export const cautions: Caution[] = [
  {
    when: { principal: ["self"], human: ["present", "reachable"] },
    text: "If this agent serves several people under its own identity, the API cannot tell them apart. One user may be able to steer it into fetching another’s data. Carry each user’s delegation instead. Where you cannot, your code, not the model, has to keep users apart.",
  },
  {
    when: { principal: ["user"], human: ["absent"] },
    text: "An unattended agent can go on using a person’s grant while that person is unavailable. Scope it narrowly, bind it to a key where both sides support that, and make sure someone can revoke it.",
  },
  {
    when: { risk: ["irreversible"], human: ["absent"] },
    text: "Irreversible actions with no human available leave policy as the only control. Put hard limits at the API or a gateway, not in the prompt.",
  },
  {
    when: { target: ["web"], principal: ["user"] },
    text: "Most websites have no way to accept a delegated token. The flows here that issue one apply only to a site that does. At any other, an agent signing in with the user’s own password is impersonation, with all of the user’s power and none of the audit trail. Never collect the password. Have the person sign in for themselves, keep the session out of the model’s reach, and put your own limits in front of it.",
  },
  {
    when: { runtime: ["local"] },
    text: "A local agent is a public client unless its installation was given a credential of its own. Never build a secret into the app: every copy would hold the same one. Use PKCE and a loopback redirect, and keep tokens and keys in the operating system’s credential store.",
  },
];

export const deployLinks: Record<string, { href: string; label: string }> = {
  local: { href: "/deployments/local/", label: "Desktop, IDE and CLI agents" },
  headless: {
    href: "/deployments/local/#headless-and-remote-agents",
    label: "Headless and CI agents",
  },
  k8s: {
    href: "/deployments/",
    label: "Where the agent runs, platform by platform",
  },
  managed: {
    href: "/deployments/agent-platforms/",
    label: "Managed agent platforms",
  },
  sandbox: { href: "/deployments/sandboxes/", label: "Sandboxed agents" },
};
