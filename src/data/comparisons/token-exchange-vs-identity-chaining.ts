/**
 * Token exchange or identity chaining?
 *
 * Rests on data/flows/token-exchange.ts and data/flows/identity-chaining.ts,
 * which hold the full account of each. Nothing here may contradict them, and
 * nothing here is said that one of them does not say.
 */
import type { Comparison } from "./types";

export const tokenExchangeVsIdentityChaining: Comparison = {
  flows: ["token-exchange", "identity-chaining"],
  question: "Token exchange or identity chaining?",
  answer:
    "Both get a caller a new token for the next service in a chain of calls, one that still says who the call is for. Token exchange does it in one request, where every hop trusts the same authorization server. Identity chaining is for a next service in another organization with an authorization server of its own: the caller gets a short-lived grant at home, and the other side’s server turns that into a token of its own. So the question is whether the call crosses that boundary.",
  description:
    "Two ways to carry who a call is for to the next service in a chain, compared: who issues the new token, how many requests it takes, what trust has to exist first, and when to choose which.",
  gist: "A token for the next service in a chain: inside one trust domain, or across to another organization.",
  shared: `Something holds a token and has to call one more service. The token it holds is not the one to send. Where one authorization server stands behind every hop, that token was issued for the service that received it, not for the API behind it, and passing it along makes every hop a place where it can be stolen and replayed. Where the next service belongs to another organization, that organization will not accept the first one’s tokens, and should not.

Both begin with a token exchange request. The caller presents the token it holds as the \`subject_token\` and names what the new credential is for, and an authorization server decides whether this client may have it. In both, who the call is for travels with it. And both repeat for a longer chain: another exchange for another hop, another grant for another boundary.`,
  choose: [
    [
      "A tool, MCP server or sub-agent has to call another API for the same user, and every hop trusts the same authorization server.",
      "One server’s policy should decide the whole chain: which clients may exchange which tokens for which audiences.",
    ],
    [
      "The next service belongs to another organization, cloud or business unit with its own authorization server, which will not accept your tokens.",
      "The two authorization servers have an agreed trust relationship, set up in advance: keys, issuer names and which claims are honored.",
      "Each side has to keep control of its own tokens. The other side issues the token its API accepts, under its own policy, and either side can end the arrangement by itself.",
    ],
  ],
  figure: {
    intro:
      "Here is the same need met both ways: a caller holds a token for Alice and has to call one more service. Both begin with a token exchange request. Before you look, make a guess. In one of the two, that request does not return a token any API should accept. Which?",
    legend: "The caller uses",
    cast: [
      {
        label: "Caller",
        sub: "needs a token for the next call",
        role: "agent",
      },
      {
        label: "Next service",
        sub: "checks the token it gets",
        role: "resource",
      },
    ],
    asks: "What it reaches, and what it takes",
    questions: [
      "Does the next service learn who the call is for?",
      "Does it reach a service in another organization?",
      "Is one request enough to get the token?",
      "Does one authorization server do the whole job?",
    ],
    sides: [
      {
        hops: ["token B, from the authorization server every hop trusts"],
        shows: [
          {
            step: 3,
            caption: "What the caller sends its authorization server",
          },
          { step: 5, caption: "What comes back: a token for the next service" },
        ],
        findings: [
          {
            verdict: "yes",
            note: "Token B keeps the user as its subject. In this flow an `act` claim also names the tool server acting for them.",
          },
          {
            verdict: "no",
            note: "It works inside one trust domain, where a single authorization server can issue a token for any hop. Another organization’s service will not accept those tokens, and should not.",
          },
          {
            verdict: "yes",
            note: "The caller, here a tool server, sends one token exchange request and gets back a token addressed to the downstream API.",
          },
          {
            verdict: "yes",
            note: "In the flow shown, one authorization server issues both tokens, and every hop trusts it.",
          },
        ],
        so: "One authorization server stands behind every hop, so one request to it is the whole job: the caller presents token A and gets token B, addressed to the next service and still naming the user. **That works only inside one trust domain.** A service run by another organization will not accept this server’s tokens, and should not.",
      },
      {
        hops: ["an access token from the other domain’s authorization server"],
        shows: [
          {
            step: 4,
            caption:
              "What the caller gets at home: a grant, not an access token",
          },
          {
            step: 5,
            caption:
              "What the caller sends the other domain’s authorization server",
          },
        ],
        findings: [
          {
            verdict: "yes",
            note: "In domain B’s terms. Domain B maps the incoming subject to its own, and identifiers rarely match across domains, so decide how subjects are mapped.",
          },
          {
            verdict: "yes",
            note: "The other domain issues the access token under its own policy, and its API never sees anything the home domain issued.",
          },
          {
            verdict: "no",
            note: "It takes two. A token exchange at home returns a grant that no API should accept. The caller, here an agent, then presents the grant at the other domain’s token endpoint.",
          },
          {
            verdict: "no",
            note: "Trust between the two authorization servers is set up in advance: keys, issuer names and which claims are honored. The specification does not create it.",
          },
        ],
        so: "The other organization will not accept the home domain’s tokens, so the home authorization server issues a grant addressed to the other side’s authorization server instead. **Each domain validates only what it issued or explicitly agreed to trust**, and either can end the arrangement by itself: one by refusing to issue grants, the other by refusing to honor them. The grant is a bearer credential for obtaining tokens, so keep it short-lived and single-audience.",
      },
    ],
  },
  points: [
    {
      on: "Who issues the token the API accepts",
      values: [
        "The authorization server that every hop trusts. In the flow shown it issued the first token too: both say `iss: https://auth.example`.",
        "The other domain’s authorization server. It is an ordinary access token, issued and revocable by domain B.",
      ],
      steps: [[1, 5], [7]],
    },
    {
      on: "What the exchange asks for",
      values: [
        "A token for the next service. The request names the downstream API in `resource` and asks for the narrowest scope that will do.",
        "A grant for the other domain’s authorization server. The request names that server in `audience` and sets `requested_token_type` to `urn:ietf:params:oauth:token-type:jwt`.",
      ],
      steps: [[3], [2]],
    },
    {
      on: "What comes back",
      values: [
        "Token B, addressed to the downstream API. Only that token goes to the API. The first one stays where it is.",
        "A short-lived JWT authorization grant. Its audience is the other domain’s authorization server and nothing else. It is not an access token and no API should accept it.",
      ],
      steps: [[5, 6], [4]],
    },
    {
      on: "Requests for a token",
      values: [
        "One: a token exchange at the authorization server.",
        "Two: a token exchange at the home authorization server, then a JWT bearer grant at the other domain’s token endpoint.",
      ],
      steps: [[3], [2, 5]],
    },
    {
      on: "Where policy is decided",
      values: [
        "At one control point. The authorization server checks that the token is valid, that this client may exchange tokens, that the audience is permitted for it, and that policy lets it obtain the scope under the user’s grant.",
        "In two places. Domain A decides what crosses its boundary: which clients may obtain grants for which external domains, and which claims about the user are released. Domain B then applies its own policy, and is free to grant less than was asked.",
      ],
      steps: [[4], [3, 6]],
    },
    {
      on: "Who the token says the call is for",
      values: [
        "The user, as `sub`, as in the first token. In this flow an `act` claim also names the tool server acting for them. Servers differ on whether they add it.",
        "Domain B’s idea of who the subject is. Domain B maps the incoming subject and claims to its own. Identifiers rarely match across domains, so decide how subjects are mapped, and what happens when a mapping does not exist.",
      ],
      steps: [
        [1, 5],
        [6, 7],
      ],
    },
    {
      on: "What the API checks",
      values: [
        "That the token is addressed to it. Then it reads who the request is for and who is acting for them, and can log both identities.",
        "A token from its own authorization server. It never sees anything issued by domain A.",
      ],
      steps: [[7], [8]],
    },
    {
      on: "What trust it rests on",
      values: [
        "All hops trust the same authorization server, or servers that trust each other.",
        "Trust between the two authorization servers, set up in advance: keys, issuer names and which claims are honored. Domain B verifies the grant against keys it has agreed to trust for domain A.",
      ],
      steps: [[], [6]],
    },
    {
      on: "What the specification leaves to you",
      values: [
        "RFC 8693 defines the mechanism and leaves policy open. Which clients may exchange which tokens for which audiences is yours to configure, and the default in many products is “anything.”",
        "The trust itself: the specification does not create it for you. Domain B also decides whether the client must authenticate when it presents the grant, and whether a grant can be used twice.",
      ],
      steps: [[], [5, 6]],
    },
  ],
  mixup: {
    belief:
      "We have token exchange, so our agents can already call another organization’s APIs.",
    body: "Token exchange works inside one trust domain, where a single authorization server can issue a token for any hop. A service run by another organization will not accept those tokens, and should not. Identity chaining uses token exchange for its first half only. What comes back there is a short-lived grant addressed to the other organization’s authorization server, which then issues an access token under its own policy. The trust between the two servers is set up in advance, and the specification does not create it for you.",
  },
};
