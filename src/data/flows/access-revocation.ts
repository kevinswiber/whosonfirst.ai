import type { Flow } from "../types";

export const accessRevocation: Flow = {
  slug: "access-revocation",
  title: "Withdrawing an agent’s access",
  short: "Access revocation",
  group: "cross-cutting",
  human: "any",
  maturity: "stable",
  tagline:
    "A server reports that a session has ended. The API applies the change and refuses the agent’s existing token.",
  summary: `Alice has authorized her agent to read her company calendar. An administrator ends the company session that access depends on. The agent is still running and has a signed access token that has not expired. The calendar API starts refusing calls with that token once it has the session’s new state.

The Shared Signals Framework (SSF) delivers security events between services set up to share them. The Continuous Access Evaluation Profile (CAEP) defines event types and what each one reports. Here, the company’s authorization server sends a Session Revoked event and the calendar service closes its matching local sessions.`,
  fits: [
    "A service needs to cut off requests from an ended session before its access tokens expire.",
    "The authorization server and the API can agree on which sessions the events identify and share their current status.",
  ],
  watchOut: [
    "A call can still succeed while an event is in transit or waiting to be applied. The API needs a policy for how old its view of the session may be.",
    "The transmitter sends the event only to configured receivers. A different service’s existing credentials have their own lifetime and revocation rules. That service must learn and enforce a withdrawal itself. Revocation cannot undo a completed write or take back data already disclosed.",
  ],
  lesson: "tokens",
  illustrated: {
    steps:
      "A company authorization server pushes a CAEP event to a calendar service over SSF. The calendar service receives the event and runs the API that enforces it.",
    preconditions: [
      "The agent already holds a signed bearer access token for the calendar API. Its subject is Alice. A field this issuer and API agreed on, `company_session`, names Alice’s company session `cs-418`. The API links each local calendar session to that ID and its issuer.",
      "The company server and the calendar service have set up a push stream for Session Revoked events about the shared sessions. The calendar service knows the trusted transmitter and issuer, the issuer’s event-signing keys, and the event audience that identifies this receiver. The company server knows the receiver’s HTTPS endpoint.",
    ],
    examples:
      "The event listing shows the decoded payload. The actual POST carries the signed token.",
    references:
      "The required references and rating cover this SSF push arrangement and its bearer-token API call.",
  },
  credentials: {
    title: "What each token is for",
    intro:
      "The agent presents the access token to read the calendar. The company server sends the event separately to report the session’s revocation.",
    items: [
      {
        name: "Calendar access token",
        type: "Signed OAuth JWT access token, used as a bearer token",
        issuer: "Company authorization server",
        recipient: "Calendar API",
        meaning:
          "Carries the scope and lifetime of calendar access. In this deployment it also names the company session.",
        binding:
          "The agent presents the token without a separate proof of key ownership.",
      },
      {
        name: "Session Revoked event",
        type: "Signed Security Event Token (SET), a JWT carrying an event",
        issuer: "Company authorization server, acting as the SSF transmitter",
        recipient: "Calendar service, acting as the SSF receiver",
        meaning: "Reports that the company session identified in it ended.",
        binding:
          "The transmitter signs with its event-signing key. The receiver checks the signature and the intended audience.",
      },
    ],
  },
  phases: [
    { title: "The company ends the session", from: 1 },
    { title: "The company tells the calendar service", from: 2 },
    { title: "The calendar service closes matching sessions", from: 5 },
    { title: "The calendar API refuses the next call", from: 6 },
  ],
  parts: {
    company:
      "Ends the company session and stops issuing tokens under it. Sends a signed event to the configured receiver for that session.",
    calendar:
      "Validates and saves the event before acknowledging delivery. Closes the matching local sessions, and consults their current state every time the API receives an access token.",
    agent:
      "Presents the access token to the calendar API. Treats the rejection as a failed call and stops using that token. Continued access requires a new authorization.",
  },
  participants: [
    {
      id: "company",
      label: "Company server",
      sub: "Issuer and transmitter",
      role: "authz",
    },
    {
      id: "calendar",
      label: "Calendar service",
      sub: "Receiver and API",
      role: "resource",
    },
    { id: "agent", label: "Agent", sub: "Holds access token", role: "agent" },
  ],
  steps: [
    {
      from: "company",
      kind: "self",
      label: "End company session",
      title: "The company ends the session",
      body: `An administrator withdraws access for Alice’s session \`cs-418\`. Under company policy, the server marks that session revoked and stops issuing or renewing tokens under it. The agent still holds the token it received earlier, with its original signature and expiry.`,
    },
    {
      from: "company",
      to: "calendar",
      kind: "back",
      label: "Push signed revocation event",
      title: "The company server sends Session Revoked",
      body: `The company server sends a signed Security Event Token (SET) to the calendar service’s event endpoint. It uses an HTTPS POST with content type \`application/secevent+jwt\` and \`Accept: application/json\`. The SET header has type \`secevent+jwt\`. In the payload, the URL under \`events\` names the event type and the subject (\`sub_id\`) identifies the company session. The \`jti\` identifies this SET. The \`event_timestamp\` records when the session was revoked.`,
      code: {
        lang: "json",
        text: `{
  "iss": "https://identity.example.com",
  "aud": "https://calendar.example/signals",
  "iat": 1794268830,
  "jti": "evt-8f40",
  "txn": "withdrawal-8f40",
  "sub_id": { "format": "opaque", "id": "cs-418" },
  "events": {
    "https://schemas.openid.net/secevent/caep/event-type/session-revoked": {
      "event_timestamp": 1794268829
    }
  }
}`,
      },
      gain: [["calendar", "Session Revoked SET"]],
    },
    {
      from: "calendar",
      kind: "self",
      label: "Validate and save event",
      title: "The calendar service checks the event",
      body: `The receiver parses the SET and checks its type and signature using a trusted issuer key. It matches the issuer and audience against the stream configuration and checks that this transmitter is authorized to send this event type about that subject. A SET that fails validation cannot change access. The receiver saves a valid event to a durable queue for processing.`,
    },
    {
      from: "calendar",
      to: "company",
      kind: "resp",
      label: "202 Accepted",
      title: "The calendar service acknowledges delivery",
      body: `The empty \`202 Accepted\` confirms that the receiver accepted the event for processing. The API starts enforcing the change after the receiver updates its local state.`,
    },
    {
      from: "calendar",
      kind: "self",
      label: "Close matching sessions",
      title: "The calendar service applies the revocation",
      body: `CAEP reports that the company session was revoked. [SSF §4.1.5](/standards/#shared-signals) leaves the response to each deployment. Here the receiver uses the trusted issuer and \`cs-418\` to find the matching local sessions. It marks them revoked in the state the API consults on every request. The same SET can arrive more than once. The receiver acknowledges a valid repeat as usual. It makes the state change safe to repeat and uses the issuer and \`jti\` to recognize duplicates. If no local session matches, it records the revocation for that specific issuer and session ID so a late setup cannot reopen it.`,
    },
    {
      from: "agent",
      to: "calendar",
      kind: "back",
      label: "Calendar call + old token",
      title: "The agent presents its existing token",
      body: `The agent has received no event. It calls the calendar API with the same bearer access token it already held.`,
      code: {
        lang: "http",
        text: `GET /events HTTP/1.1
Host: calendar.example
Authorization: Bearer eyJ…`,
      },
    },
    {
      from: "calendar",
      to: "agent",
      kind: "resp",
      label: "401 invalid_token",
      title: "The API refuses the call before reading the calendar",
      body: `The API checks the access token’s type, signature, issuer, audience and expiry. It checks the requested action against the token’s scope and its own policy. The signed \`company_session\` field still points to \`cs-418\`, which the API’s local state now marks revoked. The API treats the token as invalid for this session and returns \`401 Unauthorized\`.`,
      code: {
        lang: "http",
        text: `HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token"`,
      },
    },
  ],
  comparison: {
    title: "How the API learns when to stop",
    rowHeading: "Mechanism",
    fields: [
      { heading: "What the API checks", label: "Check" },
      { heading: "What can delay refusal", label: "Delay" },
    ],
    rows: [
      {
        name: "Token expiry",
        values: [
          "The API checks the deadline set by the token issuer.",
          "With expiry alone, an otherwise acceptable token can work until that deadline, even if the issuer stopped issuing new ones.",
        ],
      },
      {
        name: "Token introspection",
        values: [
          "The API authenticates to the authorization server and asks if the token is active ([RFC 7662](/standards/#rfc7662)). The server reports token state. The API decides whether to allow the action.",
          "A cached `active: true` result can outlive a revocation until the API checks again. If the response gives the token’s expiry (`exp`), the cache cannot use the result past that time.",
        ],
      },
      {
        name: "SSF and CAEP",
        values: [
          "The API checks local session state. A configured receiver updates it after validating and matching the Session Revoked event.",
          "Delivery and processing take time. A missed event or a stale copy of session state can leave access open until the API rechecks it or the token expires.",
        ],
      },
    ],
  },
  sections: [
    {
      id: "oauth-revocation",
      title: "When a user disconnects an OAuth integration",
      intro: `The client stops using the connection. It can also ask the authorization server to invalidate a token through its [revocation endpoint](/standards/#rfc7009).`,
      parts: [
        {
          title: "The client asks the issuer to revoke a token",
          body: `The client submits a token issued to it. RFC 7009 requires support for revoking refresh tokens and recommends support for access-token revocation. A revoked refresh token can no longer obtain new access tokens. When revoking a refresh token, a server that supports access-token revocation should also invalidate access tokens from the same grant (the permission behind those tokens). Whether the grant itself ends depends on the issuer’s policy.`,
        },
        {
          title: "The API needs a way to learn the change",
          body: `The revocation endpoint changes state at the authorization server. An HTTP \`200\` means the submitted token was revoked or was already invalid. APIs get no broadcast from RFC 7009 itself. An API that asks this issuer for a fresh introspection result can learn that the access token is inactive. An API that only checks a signed token locally can still accept it until expiry.`,
        },
      ],
    },
    {
      id: "missed-events",
      title: "If the event arrives late or goes missing",
      intro:
        "The calendar service limits how long it will trust an active session record. This is a deployment choice.",
      parts: [
        {
          title: "Recheck active sessions",
          body: `The calendar service refreshes active session records through an authenticated status check it has set up separately with the company server. The API uses an active result for at most one minute after the status was checked at the company server. If there is no fresh result, the session mapping is missing, or the local state is unavailable, the API refuses the call. An SSF verification event can test whether delivery works. Session status comes from the separate check.`,
        },
        {
          title: "Keep a revoked session closed",
          body: `A delayed active result cannot reopen a session the API already knows was revoked. The calendar service keeps that record until all tokens for the session have expired. A newly authorized session has its own ID, so a late revocation for the old session does not shut down the new one.`,
        },
      ],
    },
  ],
  standards: [
    "caep",
    "shared-signals",
    "rfc8417",
    "rfc9493",
    "rfc8935",
    "rfc9068",
    "rfc6750",
    "rfc7009",
    "rfc7662",
  ],
  basis: ["caep", "shared-signals"],
  roles: {
    caep: "required", // the Session Revoked event
    "shared-signals": "required", // stream configuration and the SET profile
    rfc8417: "required", // the SET and its claims
    rfc9493: "required", // the opaque subject identifier in the SET
    rfc8935: "required", // HTTPS push, validation and acknowledgment
    rfc9068: "required", // the illustrated JWT access token and its validation
    rfc6750: "required", // the bearer request and invalid_token response
    rfc7009: "optional", // client-initiated token revocation, a separate path
    rfc7662: "optional", // a separate way for the API to learn token state
  },
  related: [
    "authorization-code-pkce",
    "cross-app-access",
    "workload-identity-federation",
  ],
};
