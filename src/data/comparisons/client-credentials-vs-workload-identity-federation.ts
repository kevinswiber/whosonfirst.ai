/**
 * Client credentials or workload identity federation?
 *
 * Rests on data/flows/client-credentials.ts and
 * data/flows/workload-identity-federation.ts, which hold the full account of
 * each. Nothing here may contradict them, and nothing here is said that one of
 * them does not say.
 */
import type { Comparison } from "./types";

export const clientCredentialsVsWorkloadIdentityFederation: Comparison = {
  flows: ["client-credentials", "workload-identity-federation"],
  question: "Client credentials or workload identity federation?",
  answer:
    "Both let an agent with no user authenticate as itself and call an API with its own permissions. In client credentials the agent shows the authorization server that it is a client registered there: with a client secret, or, as compared here, with a short-lived proof it signs with a private key it holds. In workload identity federation the place the agent runs supplies a short-lived, signed identity credential, and the receiving system issues access for it. Prefer federation where the platform can identify the workload and the destination supports the trust arrangement, and client credentials with a private key elsewhere.",
  description:
    "Two ways for an agent to authenticate as itself with no user, compared: what the agent holds, who signs what it presents, what is set up in advance, what a copy is worth, and when to choose which.",
  gist: "An agent authenticates as itself: with a key it holds, or with an identity its platform supplies.",
  shared: `In both, there is no user. The agent is the principal: it calls the API with its own permissions, which an administrator set in advance. Neither flow carries a person’s identity or consent. If the agent is acting for a person, that authority has to come from somewhere else, and [token exchange](/flows/token-exchange/) is one such flow.

In both, what the agent is issued should be short-lived, and the agent asks again when it expires. And in both, agents that share one identity are one caller to the API: its log cannot tell them apart.

The two also meet. What the agent authenticates a client credentials request with is a choice: a static client secret, a key it holds, or an identity the platform issues, each better than the one before. One receiver takes the platform’s identity credential as the client assertion on a client credentials request. That is federation, made as a client credentials request.`,
  choose: [
    [
      "No identity provider establishes which workload the agent is: not the platform it runs on, and not one you operate.",
      "The authorization server for the API cannot be configured to trust the platform’s identities, and can register a public key for the agent.",
      "You can keep the private key where the runtime can ask for a signature and cannot read the key: a key management service, a hardware module or a platform keystore.",
    ],
    [
      "The agent runs where the platform can identify the workload: a cloud function, virtual machine or managed container, a Kubernetes pod, a CI job.",
      "The destination can be configured to trust that platform’s identities, with a rule that names this one workload.",
      "You would otherwise deliver a client secret to the workload, and have to manage it.",
    ],
  ],
  figure: {
    intro:
      "Here is the same request made both ways: an agent with no user asks for access to an API, and has to show which agent it is. Both times it presents a short-lived, signed JWT. Before you look, make a guess. Who signed it?",
    legend: "The agent authenticates with",
    cast: [
      { label: "Agent", sub: "acts as itself", role: "agent" },
      { label: "Token service", sub: "checks, then issues", role: "authz" },
    ],
    asks: "How it holds up",
    questions: [
      "Does it work without a key the agent has to keep?",
      "Can an agent be added with no key to register?",
      "Is a copy of what the agent presents refused?",
      "Does it work with no identity provider?",
    ],
    sides: [
      {
        hops: ["a proof it signed with its own private key"],
        shows: [
          { step: 1, caption: "The proof the agent signs" },
          { step: 2, caption: "The request that carries it" },
        ],
        findings: [
          {
            verdict: "no",
            note: "The agent signs with a private key it holds. Keep that key where the runtime can ask for a signature and cannot read the key.",
          },
          {
            verdict: "no",
            note: "The authorization server verifies the proof against the public key registered for this client.",
          },
          {
            verdict: "partly",
            note: "`jti` lets the server refuse a second use, if it keeps track. The short expiry limits a copy either way.",
          },
          {
            verdict: "yes",
            note: "The agent signs the proof itself. The authorization server checks it against the public key registered for the agent.",
          },
        ],
        so: "The agent signs its own proof, and the authorization server knows it by the public key registered for it. **That leaves a private key for the agent to hold, and its public key to register at the authorization server.** A key in a file or an environment variable leaks the same way a client secret does.",
      },
      {
        hops: ["an identity credential its platform signed"],
        shows: [
          { step: 1, caption: "The identity credential the platform supplies" },
          { step: 5, caption: "The trust rule the token service applies" },
        ],
        findings: [
          {
            verdict: "yes",
            note: "The platform supplies the identity credential, and usually keeps it fresh. It is short-lived, and it still needs protecting.",
          },
          {
            verdict: "yes",
            note: "The token service checks the signature against the issuer’s keys, which most receivers read from the issuer’s discovery document. What is written for each agent is a trust rule.",
          },
          {
            verdict: "no",
            note: "The identity credential shown is a JWT, and a bearer token: whoever holds a copy can replay it until it expires. The audience check stops it being replayed at another recipient.",
          },
          {
            verdict: "no",
            note: "Something has to establish which workload this is and sign a statement of it: the platform, or an identity provider you operate.",
          },
        ],
        so: "The platform signs, so there is no long-lived application secret to provision and manage. **What decides the access is the trust rule: one that matches more workloads than you meant gives each of them the access.** The credentials are short-lived and still need protecting. Anything that can make requests from inside the workload may be able to ask the platform for the same credentials.",
      },
    ],
  },
  points: [
    {
      on: "What the agent presents",
      values: [
        "A short-lived JWT the agent signs with its private key. Issuer and subject are both the client ID, and the audience is the authorization server.",
        "A short-lived, signed statement of the workload’s identity, supplied by the platform. It is most often a JWT, and its audience is the token service.",
      ],
      steps: [
        [1, 2],
        [1, 2],
      ],
    },
    {
      on: "What the agent holds",
      values: [
        "A private key. Keep it where the runtime can ask for a signature and cannot read the key: in a file or an environment variable, it leaks the same way a client secret does.",
        "No long-lived application secret. It holds the identity credential, which arrives as the platform delivers it: a file that is kept fresh, a local endpoint, or a request the workload makes when it needs one.",
      ],
      steps: [[1], [1]],
    },
    {
      on: "What is set up in advance",
      values: [
        "The agent’s public key is registered with the authorization server, and an administrator configures its scopes. There is no user to ask, so policy is the only gate.",
        "The issuer is registered with the token service, and an administrator writes a trust rule: credentials from this issuer, for this audience, naming this workload, get that access. The rule is the security boundary.",
      ],
      steps: [[3], [3, 5]],
    },
    {
      on: "What is checked",
      values: [
        "The authorization server verifies the signature against the public key registered for this client, checks audience and expiry, and replay where it keeps track of `jti`.",
        "The token service checks the signature against the issuer’s keys, that the issuer is one it was configured to trust, that the audience names this token service, and that the credential has not expired.",
      ],
      steps: [[3], [3, 4]],
    },
    {
      on: "The request",
      values: [
        "One direct call: `grant_type=client_credentials`, with the proof as `client_assertion`. The `resource` parameter asks for a token that is valid for one API only.",
        "No universal format. It differs by receiver: OAuth token exchange for one, a client assertion on a client credentials request for another, an operation of its own for a third.",
      ],
      steps: [[2], [2]],
    },
    {
      on: "What comes back",
      values: [
        "An access token whose subject is the agent, sent as an ordinary bearer token. No refresh token is issued: the agent asks again.",
        "It depends on the receiver: for one an OAuth access token, sent as a bearer token, and for another temporary credentials that sign the request. When it expires, the exchange is repeated with a fresh identity credential.",
      ],
      steps: [
        [4, 5],
        [6, 7],
      ],
    },
    {
      on: "What the API’s log records",
      values: [
        "The agent’s client ID. If several replicas, runs or sub-agents share that ID, the log cannot tell them apart.",
        "The role or identity the trust rule granted, which traces back to one workload if the rule was written for one.",
      ],
      steps: [[7], [8]],
    },
    {
      on: "Cutting the agent off",
      values: [
        "Keep access tokens short-lived, so that revoking the client takes effect quickly.",
        "Three separate events, and none brings about the others: the platform stops issuing the identity credential, the trust rule is removed or narrowed, and credentials already issued are invalidated. Deleting the workload does only the first.",
      ],
    },
  ],
  mixup: {
    belief:
      "We moved from client credentials to workload identity federation, so the agent has nothing left to steal.",
    body: "What federation removes is the need to provision and manage a long-lived application secret, such as a client secret. It does not remove credentials. The agent still holds the identity credential and whatever is issued in exchange. Both are short-lived, and where one is a bearer token, whoever holds a copy can replay it until it expires. Keep them out of logs, prompts and tool output, and limit what can reach the platform’s credential endpoints.",
  },
};
