/**
 * DPoP or OAuth mTLS?
 *
 * Rests on data/flows/dpop.ts and data/flows/oauth-mtls.ts, which hold the
 * full account of each. Nothing here may contradict them, and nothing here is
 * said that one of them does not say.
 */
import type { Comparison } from "./types";

export const dpopVsOauthMtls: Comparison = {
  flows: ["dpop", "oauth-mtls"],
  question: "DPoP or OAuth mTLS?",
  answer:
    "Both bind an access token to a key, so that a copy of the token is not enough to use it. DPoP proves the key in an HTTP header on every request. OAuth mTLS proves it in the TLS connection, with a client certificate. Which one fits depends on whether the agent can hold a certificate, and on where TLS ends.",
  description:
    "Two ways to bind an access token to a key, compared: where the proof travels, what a copied request is worth, what each needs from the agent and the API, and when to choose which.",
  gist: "Two ways to bind a token to a key: a proof in an HTTP header, or the TLS connection itself.",
  shared: `A bearer token works for whoever holds a copy. Both of these make it a **sender-constrained token** instead. The authorization server records in the token which key it belongs to, and the API refuses the token unless the caller proves it holds that key.

Both need the authorization server and the API to take part. An API that accepts the token without checking the binding has gained nothing. And neither stops a compromised agent from using its own key: what they stop is a token being useful somewhere else. So with either one, keep the private key where the model cannot read it.`,
  choose: [
    [
      "The agent is a public client: a desktop, CLI or mobile app that cannot hold a client secret but can hold a key.",
      "TLS ends at a proxy before the request reaches the API, and the API can still verify the request’s original method and URL.",
      "A public client’s refresh token should be bound to the key as well.",
    ],
    [
      "The agent can present a client certificate to both the authorization server and the API, and both support certificate-bound tokens.",
      "The certificate should also authenticate the client to the authorization server. That is a separate choice from binding the token, and one certificate can do both.",
      "The platform already gives workloads certificates. [SPIFFE](/flows/spiffe-workload-identity/) can supply one, in a deployment set up to accept it.",
    ],
  ],
  figure: {
    intro:
      "Here is the same call made both ways: an agent reads a calendar with a token bound to its key. Before you look, make a guess. One of the two leaves something in a log of request headers that a thief could use. Which?",
    legend: "The token is bound with",
    cast: [
      { label: "Agent", sub: "holds the private key", role: "agent" },
      { label: "API", sub: "checks the binding", role: "resource" },
    ],
    asks: "How it holds up",
    questions: [
      "Is a copied token refused?",
      "Is a copied request refused?",
      "Does it work without a certificate?",
      "Does it work behind a proxy that terminates TLS?",
    ],
    sides: [
      {
        hops: ["token, and a proof signed for this request"],
        shows: [
          { step: 5, caption: "What arrives at the API" },
          { step: 3, caption: "What the token says about the key" },
        ],
        findings: [
          {
            verdict: "yes",
            note: "A thief cannot make a proof without the private key.",
          },
          {
            verdict: "partly",
            note: "A token and a proof copied together can be replayed at the same method and URL until the proof ages out, unless the API remembers `jti` values.",
          },
          {
            verdict: "yes",
            note: "The agent generates its own key pair.",
          },
          {
            verdict: "yes",
            note: "The proof is an HTTP header, so it reaches the API. The API has to be able to verify the original method and URL.",
          },
        ],
        so: "The proof travels inside the request. It goes wherever HTTP goes, and needs nothing from the network in between. A copy of the request takes the proof with it: **the proof is good for one method and URL, for a short time, and only an API that remembers `jti` refuses it twice.** The proof does not cover the query string or the body.",
      },
      {
        hops: ["token, on a connection made with its certificate"],
        shows: [
          { step: 5, caption: "What arrives at the API" },
          { step: 4, caption: "What the token says about the key" },
        ],
        findings: [
          {
            verdict: "yes",
            note: "On a connection made with a different certificate, the API answers 401 with `invalid_token`.",
          },
          {
            verdict: "yes",
            note: "The request holds only the token. Using it takes the private key for the certificate, to make the connection.",
          },
          {
            verdict: "no",
            note: "The agent needs a client certificate. In the flow shown, its organization’s certificate authority issues it.",
          },
          {
            verdict: "partly",
            note: "The handshake proves the key to the proxy, not to the API. The proxy has to enforce the binding, or pass the certificate to the API on a path the API trusts.",
          },
        ],
        so: "The proof is the connection itself, so nothing in the request is worth copying. **Everything that terminates TLS becomes part of the check.** A proxy in front of the API has to enforce the binding or hand the certificate on, and a proxy in front of the token endpoint has to do the same for the authorization server.",
      },
    ],
  },
  points: [
    {
      on: "Where the proof is",
      values: [
        "In a `DPoP` header: a JWT the agent signs for each request, naming its method and URL.",
        "In the TLS handshake, where the agent proves it holds the key for its client certificate.",
      ],
      steps: [[4, 5], [5]],
    },
    {
      on: "What the token records",
      values: [
        "`cnf.jkt`: the thumbprint of the agent’s public key.",
        "`cnf.x5t#S256`: a SHA-256 hash of the client certificate.",
      ],
      steps: [[3], [4]],
    },
    {
      on: "How the token is sent",
      values: [
        "`Authorization: DPoP`. The token response says `token_type: DPoP`, and an API that supports both must refuse a bound token sent as `Bearer`.",
        "`Authorization: Bearer`, as for any token. The token response says `token_type: Bearer`.",
      ],
      steps: [
        [3, 5],
        [4, 5],
      ],
    },
    {
      on: "What the agent holds",
      values: [
        "A key pair it generates itself: one for each agent instance, kept for the life of the session or longer.",
        "A private key and a client certificate for it. In the flow shown, the organization’s certificate authority issues the certificate.",
      ],
      steps: [[1], [1]],
    },
    {
      on: "What the API checks",
      values: [
        "The proof’s signature, that its key matches `cnf.jkt`, that the method and URL are this request’s, that it is recent and, where the API keeps track, that its `jti` is new.",
        "It asks for a client certificate during the handshake, then compares that certificate’s thumbprint with `cnf.x5t#S256` in the validated token.",
      ],
      steps: [[6], [5, 6]],
    },
    {
      on: "When TLS ends at a proxy",
      values: [
        "The API still checks the proof itself. Proxies that rewrite URLs are a usual source of trouble, since the proof names the URL.",
        "The proxy enforces the binding, or passes the certificate on. The API must accept it only from that proxy, and the proxy must strip any certificate header a client sent. [RFC 9440](/standards/#rfc9440) defines a header for the handoff.",
      ],
    },
    {
      on: "When the key or certificate changes",
      values: [
        "The key is the agent’s own, and it keeps the same one for the life of the session or longer.",
        "A renewed certificate has a new thumbprint, even with the same key, so a token bound to the old one stops matching. Get a new token with the new certificate before switching to it.",
      ],
    },
    {
      on: "Authenticating the client",
      values: [
        "Not part of it. Any grant type works, and a public client with no secret can use it.",
        "The same certificate can authenticate the client to the authorization server. A server can also do that and leave the token unbound, or bind the token and authenticate another way.",
      ],
    },
  ],
  mixup: {
    belief: "We already use mutual TLS, so our tokens are bound.",
    body: "Mutual TLS on a connection and a token bound to a certificate are separate things. An authorization server can authenticate a client by its certificate and still issue tokens that work for anyone who holds a copy. A token is bound only when the server writes the certificate’s hash into it and the API checks that hash against the connection.",
  },
};
