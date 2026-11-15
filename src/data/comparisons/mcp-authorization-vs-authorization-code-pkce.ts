/**
 * MCP authorization or authorization code with PKCE?
 *
 * Rests on data/flows/mcp-authorization.ts and
 * data/flows/authorization-code-pkce.ts, which hold the full account of each.
 * Nothing here may contradict them, and nothing here is said that one of them
 * does not say.
 */
import type { Comparison } from "./types";

export const mcpAuthorizationVsAuthorizationCodePkce: Comparison = {
  flows: ["mcp-authorization", "authorization-code-pkce"],
  question: "MCP authorization or authorization code with PKCE?",
  answer:
    "MCP authorization is the authorization code flow with PKCE, with two things added in front. The client discovers which authorization server protects the MCP server, and it can identify itself by a URL instead of a client ID registered in advance. After that it is the same sign-in. An agent that is registered with the authorization server in advance, and calls an API at an address fixed in its code or checked against a list you keep, can use the authorization code flow as it is.",
  description:
    "MCP authorization and the authorization code flow with PKCE, compared: what is the same, what MCP adds in front, what each needs arranged in advance, and when the authorization code flow alone is enough.",
  gist: "The same sign-in, with discovery in front: what MCP adds, and when the plain flow is enough.",
  shared: `Both are a browser sign-in with a person present. The client sends the user to an authorization server, the user signs in and approves there, and the client redeems the code that comes back, with its PKCE verifier, for an access token. In both, the requests name the one server the token is for with the \`resource\` parameter. The token goes in the \`Authorization\` header, and the server that receives it checks above all that the token was issued for it.

The parts are the same four: a user, a client, an authorization server and a resource server. An MCP server is an OAuth resource server, as the API is in the authorization code flow. What differs is what the client knows before it starts.`,
  choose: [
    [
      "The server is a remote MCP server that acts on a user’s data.",
      "The client and the server have no prior relationship. A user adds the server’s URL, and the client has to work out at runtime which authorization server protects it.",
      "The client has not registered with that authorization server, and has to introduce itself at runtime.",
    ],
    [
      "The agent is registered with the authorization server in advance, and has the `client_id` that server gave it.",
      "The token goes to one API, at an address fixed in the code or checked against a list you keep.",
      "Everything the flow depends on has to be a published RFC. MCP authorization requires OAuth 2.1 and recommends Client ID Metadata Documents, and both are IETF working-group drafts that can still change.",
    ],
  ],
  figure: {
    intro:
      "Here is the same moment in both flows: the user has signed in and approved, and the client redeems its code for a token. Before you look, make a guess. How much of that request does MCP authorization change?",
    legend: "The client gets its token by",
    cast: [
      { label: "Client", sub: "has the code", role: "agent" },
      { label: "Authorization server", sub: "issues the token", role: "authz" },
    ],
    asks: "What it takes",
    questions: [
      "Is the token good for one server only?",
      "Can the client start from the server’s URL alone?",
      "Does it work for a client that was never registered?",
      "Is checking tokens all the server has to do?",
      "Does it rest on published RFCs alone?",
    ],
    sides: [
      {
        hops: ["code, PKCE verifier, and a URL for a client ID"],
        shows: [
          { step: 11, caption: "What arrives at the token endpoint" },
          {
            step: 5,
            caption: "What the authorization server finds at that client ID",
          },
          {
            step: 2,
            caption: "What the MCP server answers when the client has no token",
          },
        ],
        findings: [
          {
            verdict: "yes",
            note: "The client must send `resource` on both requests, and the MCP server rejects a token that was not issued for it.",
          },
          {
            verdict: "yes",
            note: "A request with no token gets a 401 that points to the server’s metadata, and that metadata lists its authorization servers.",
          },
          {
            verdict: "yes",
            note: "Where the authorization server supports Client ID Metadata Documents. The `client_id` is then an HTTPS URL the client’s publisher controls, and the authorization server fetches it.",
          },
          {
            verdict: "no",
            note: "It also answers a request that has no token with a 401 that points to its metadata, and publishes that metadata.",
          },
          {
            verdict: "no",
            note: "Its specification is published, but it requires OAuth 2.1 and recommends Client ID Metadata Documents. Both are IETF working-group drafts, and either can still change.",
          },
        ],
        so: "Set beside the other flow’s, this token request has a URL for its `client_id` and no `redirect_uri`. The code, the PKCE verifier and `resource` are there in both. **What MCP puts in front is discovery and a way for the client to say who it is. What follows is authorization code with PKCE.** In return for a client and a server that need no prior arrangement, the server has metadata to publish, every URL in the discovery steps comes from a server the client has never seen, and two things the flow uses rest on drafts. That is about what the flow depends on, not a judgment on how safe it is.",
      },
      {
        hops: ["code, PKCE verifier, and the client ID it was registered with"],
        shows: [{ step: 7, caption: "What arrives at the token endpoint" }],
        findings: [
          {
            verdict: "yes",
            note: "The access token is bound to one audience, and the API rejects a token issued for some other service.",
          },
          {
            verdict: "no",
            note: "No step finds the authorization server. The agent has its `client_id` from that server before the flow starts.",
          },
          {
            verdict: "no",
            note: "`client_id` is the identifier the authorization server gave this client when it was registered.",
          },
          {
            verdict: "yes",
            note: "The API validates every token before answering: signature, issuer, audience, expiry and scope.",
          },
          {
            verdict: "yes",
            note: "It follows the OAuth 2.0 authorization code grant (RFC 6749) with PKCE (RFC 7636), run the way RFC 9700 sets out.",
          },
        ],
        so: "**The agent starts with what an MCP client has to find out: which authorization server to use, and a `client_id` that server knows.** So its first message to the authorization server is the authorization request, and the API has only tokens to check. The token request sends `redirect_uri` because this flow shows the published RFCs, and RFC 6749 requires it whenever the authorization request carried one. What the flow needs in return is the arrangement itself: you register the agent with the authorization server and choose the scopes.",
      },
    ],
  },
  points: [
    {
      on: "Finding the authorization server",
      values: [
        "The client asks the MCP server. A request with no token gets a 401 that points to the server’s protected resource metadata, that document lists its authorization servers, and the client then reads the authorization server’s own metadata.",
        "No step does this. The agent is registered with the authorization server before the flow starts, and its first message there is the authorization request.",
      ],
      steps: [[1, 2, 3, 4], [3]],
    },
    {
      on: "How the client says who it is",
      values: [
        "In order of preference: credentials pre-registered for this server, a Client ID Metadata Document, Dynamic Client Registration (deprecated), or asking the user. With a metadata document, the `client_id` is an HTTPS URL the client’s publisher controls.",
        "With the `client_id` the authorization server gave it when it was registered.",
      ],
      steps: [[5, 6], [3]],
    },
    {
      on: "How the authorization server checks the client",
      values: [
        "Seeing a URL as `client_id`, it fetches it. The `client_id` inside the document must match the URL exactly, and the redirect URI in the request must be listed in it. The fetch needs the usual protections against server-side request forgery.",
        "It gave the client its `client_id` when the client was registered. The redirect URI has to match exactly, except for the port of a loopback redirect, which is chosen when the app runs.",
      ],
      steps: [[7], [3]],
    },
    {
      on: "What the client’s identity proves",
      values: [
        "Control of a URL, not that the software on the user’s machine is the genuine client. So the authorization server must show the redirect URI’s hostname on the consent screen.",
        "As drawn, the agent is a public client with no credential of its own, and PKCE shows only that the app finishing the sign-in is the one that started it. A hosted app can keep a secret, so it is registered as a confidential client and authenticates when it redeems the code.",
      ],
      steps: [[8], []],
    },
    {
      on: "Naming the server the token is for",
      values: [
        "The client must send `resource`, set to the canonical URI of the MCP server, on both the authorization request and the token request, whether or not the authorization server is known to support it.",
        "`resource` is on both requests here too. It matters more for agents than for classic apps, because one agent talks to many servers and a token must be good for exactly one.",
      ],
      steps: [
        [6, 11],
        [3, 7],
      ],
    },
    {
      on: "The token request",
      values: [
        "Has no `redirect_uri`. MCP builds on OAuth 2.1, which removed it from the token request.",
        "Sends `redirect_uri` again, because RFC 6749 requires it here whenever the authorization request carried one. This flow shows the published RFCs, and OAuth 2.1 is an Internet-Draft.",
      ],
      steps: [[11], [7]],
    },
    {
      on: "Checking who answered",
      values: [
        "The authorization server should send `iss` with the code. Before sending the code anywhere, the client compares `iss` with the issuer it recorded, and it rejects the response if the server advertised `iss` and none arrived.",
        "The agent checks `state` and, where the server provides it, that `iss` matches the authorization server it meant to talk to. Where a service sends no `iss`, a hosted app registers a separate redirect address for each service.",
      ],
      steps: [[9, 10], [6]],
    },
    {
      on: "What the server has to do",
      values: [
        "Answer a request that has no token with a 401 that points to its metadata, publish that metadata, and validate every token: issued for this server, by its authorization server, with the scope the tool needs.",
        "Validate every token before answering: signature, issuer, audience, expiry and scope.",
      ],
      steps: [[2, 3, 14], [10]],
    },
    {
      on: "Where the addresses come from",
      values: [
        "Every URL in the discovery steps comes from a server the client has never seen. A client that runs on your servers should refuse any that are not HTTPS or that resolve to private, loopback or link-local addresses.",
        "The token goes only to the API it was issued for, at an address fixed in the code or checked against a list you keep, never one taken from the model.",
      ],
      steps: [[2, 3, 4], [9]],
    },
  ],
  mixup: {
    belief:
      "MCP authorization is just OAuth, so a server that already takes OAuth tokens has nothing to add.",
    body: `The first half is close to right. MCP authorization is a profile of OAuth 2.1 with discovery steps added, its sign-in is authorization code with PKCE, and the server checks above all that the token was issued for it, as the API does in that flow.

What it adds is how a client that has never seen the server gets to that sign-in. The server has to answer a request that has no token with a 401 that points to its metadata, and publish that metadata. The authorization server has to publish its own metadata, and for clients that have never registered with it, it should accept a Client ID Metadata Document.

The server does not have to become an authorization server to do this. That is a separate role, and usually a separate service: the sign-in system your company already runs can be it.`,
  },
};
