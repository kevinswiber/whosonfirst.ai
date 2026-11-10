/**
 * A support agent, for the rep who asked.
 *
 * The starting design signs a person in and calls an API with an access token
 * issued for them. Two variations change one requirement each: the console and
 * the agent are separate applications (token exchange), or the work continues
 * after the person has gone home (a refresh token behind a trusted backend).
 * They are separate cases. The two together are not written up.
 *
 * Vendor rows are drawn from the linked documentation and were not tested.
 * `docs/source-review.md` lists what to re-check and where.
 */
import { SRC } from "./sources";
import type { Party, SupportExample } from "./types";

const P = {
  backend: {
    id: "backend",
    label: "Trusted backend",
    sub: "token broker",
    role: "infra",
  },
  worker: {
    id: "worker",
    label: "Agent worker",
    sub: "runs the agent",
    role: "agent",
  },
  rep: {
    id: "rep",
    label: "Dana",
    sub: "support rep",
    role: "human",
  },
  sagent: {
    id: "sagent",
    label: "Support agent",
    sub: "the application",
    role: "agent",
  },
  sas: {
    id: "sas",
    label: "Identity provider",
    sub: "signs in, issues tokens",
    role: "authz",
  },
  crm: {
    id: "crm",
    label: "Records API",
    sub: "the records service",
    role: "resource",
  },
  console: {
    id: "console",
    label: "Support console",
    sub: "Dana signs in here",
    role: "infra",
  },
  svc: {
    id: "svc",
    label: "Agent service",
    sub: "a separate application",
    role: "agent",
  },
} satisfies Record<string, Party>;

export const supportAgent: SupportExample = {
  slug: "support-agent",
  title: "A support agent, for the rep who asked",
  paths: {
    okta: {
      label: "Okta",
      fits: "Reps sign in with Okta, and the records API is yours.",
    },
    auth0: {
      label: "Auth0",
      fits: "Reps sign in through Auth0, and the records API is yours.",
    },
    entra: {
      label: "Microsoft Entra",
      fits: "Reps and the records API are both in your Entra tenant.",
    },
    salesforce: {
      label: "The records are in Salesforce",
      fits: "You do not control the receiving system, and it can be set up to accept an exchange.",
    },
  },
  designs: {
    base: {
      kind: "Core",
      title:
        "Dana signs in, and the application calls the records API with an access token issued for that",
      parties: [P.rep, P.sas, P.sagent, P.crm],
      steps: [
        {
          from: "sagent",
          to: "sas",
          label: "Sends Dana to sign in",
          detail: "Sends Dana to the identity provider to sign in",
          flow: "authorization-code-pkce",
        },
        {
          from: "rep",
          to: "sas",
          label: "Signs in; consent as policy requires",
          detail:
            "Signs in. Consent is hers or an administrator’s, as your policy requires",
        },
        {
          from: "sas",
          to: "sagent",
          label: "Access token for the records API",
          detail:
            "Access token: for Dana, issued to this application, intended for the records API, read only",
        },
        {
          from: "rep",
          to: "sagent",
          label: "Asks for customer 8841",
        },
        {
          from: "sagent",
          to: "crm",
          label: "Read customer 8841, with the access token",
          detail: "Reads customer 8841, with the access token",
        },
        {
          from: "crm",
          label: "Validate token; check permission and region; log",
          detail:
            "Validates the token, checks the read permission and its own region rule, and logs the user and the application the token names",
        },
      ],
    },
    "separate-apps": {
      kind: "Alternative",
      title:
        "The console’s token is intended for the agent service, so the agent service exchanges it",
      parties: [P.rep, P.console, P.sas, P.svc, P.crm],
      steps: [
        {
          from: "rep",
          to: "console",
          label: "Signs in, and asks for customer 8841",
          detail:
            "Signs in to the console through the identity provider, and asks for customer 8841",
        },
        {
          from: "sas",
          to: "console",
          label: "Access token for the agent service",
          detail:
            "Access token: for Dana, issued to the console, intended for the agent service",
          flow: "authorization-code-pkce",
        },
        {
          from: "console",
          to: "svc",
          label: "Dana’s request, with that token",
          detail: "Sends Dana’s request, with that token",
        },
        {
          from: "svc",
          to: "sas",
          label: "Asks to exchange it",
          detail:
            "Validates the token, then asks to exchange it for one intended for the records API",
          flow: "token-exchange",
        },
        {
          from: "sas",
          to: "svc",
          label: "If allowed: token for the records API",
          detail:
            "If its policy allows: an access token for Dana, issued to the agent service, intended for the records API",
        },
        {
          from: "svc",
          to: "crm",
          label: "Read customer 8841",
          detail: "Reads customer 8841, with the second token",
        },
        {
          from: "crm",
          label: "Validate token; check permission and region; log",
          detail:
            "Validates the token, checks the read permission and its own region rule, and logs the user and the application the token names",
        },
      ],
    },
    unattended: {
      kind: "Alternative",
      title:
        "Dana has gone home, and the agent worker gets access tokens from a trusted backend",
      parties: [P.rep, P.sas, P.backend, P.worker, P.crm],
      steps: [
        {
          from: "rep",
          to: "sas",
          label: "Earlier: signs in and consents to follow-up work",
          flow: "authorization-code-pkce",
        },
        {
          from: "sas",
          to: "backend",
          label: "Access token and refresh token",
          detail:
            "The backend completes the authorization code flow: it receives the code at its callback, then exchanges it at the token endpoint for an access token and, when authorized, a refresh token",
        },
        {
          from: "backend",
          label: "Stores the refresh token, out of the worker’s reach",
          detail:
            "Stores the refresh token where the agent worker cannot read it",
        },
        {
          from: "worker",
          to: "backend",
          label: "Later: asks for a token for Dana",
          detail:
            "Later: authenticates as itself, and asks for an access token for the task it was given for Dana",
        },
        {
          from: "backend",
          to: "sas",
          label: "Checks, then redeems the refresh token",
          detail:
            "Checks that this worker may ask for this user and this permission. Then redeems the refresh token as the application’s OAuth client, and receives a new access token",
        },
        {
          from: "backend",
          to: "worker",
          label: "Access token only",
          detail:
            "Returns a short-lived access token for the records API, and never the refresh token",
        },
        {
          from: "worker",
          to: "crm",
          label: "Read customer 8841",
          detail: "Reads customer 8841, with the access token",
        },
        {
          from: "crm",
          label: "Validate token; check permission and region; log",
          detail:
            "Validates the token, checks the read permission and its own region rule, and logs the user and the application the token names",
        },
      ],
      note: "For anything sensitive, reach the rep where they are instead of relying on the stored grant. That is backchannel approval.",
    },
  },
  rows: {
    base: [
      {
        job: "Sign Dana in, and get an access token for the records API",
        owner: "Platform",
        cells: {
          okta: {
            who: "Authorization code flow with PKCE, on a custom authorization server",
            note: "The server’s audience is the records API. Okta’s built-in org server issues tokens for Okta’s own APIs, not for yours.",
            sources: [SRC.oktaPkce, SRC.oktaAs],
          },
          auth0: {
            who: "Authorization code flow with PKCE",
            note: "The records API is registered in Auth0, and the token is issued with it as the audience.",
            sources: [SRC.auth0Pkce, SRC.auth0At],
          },
          entra: {
            who: "Authorization code flow with PKCE",
            note: "The application asks for a scope the records API exposes, and the token’s audience is the records API.",
            sources: [SRC.entraAuthCode],
          },
        },
      },
      {
        job: "Register the records API and its read permission",
        owner: "Your configuration",
        cells: {
          okta: {
            who: "An audience and a read scope, on the authorization server",
            note: "Each custom authorization server has one audience.",
            sources: [SRC.oktaCustomize],
          },
          auth0: {
            who: "An API, with a read permission",
            note: "What the application asks for travels to the API as scopes in the token.",
            sources: [SRC.auth0Apis],
          },
          entra: {
            who: "A scope the API exposes",
            note: "Each scope is marked as open to user consent, or to administrators only.",
            sources: [SRC.entraExpose],
          },
        },
      },
      {
        job: "Decide who consents: each rep, or an administrator for all",
        owner: "Your policy",
        cells: {
          okta: {
            who: "Set on each scope, and on the application",
            note: "A scope prompts only if you set it to. An application marked as trusted skips the prompt.",
            sources: [SRC.oktaConsent],
          },
          auth0: {
            who: "Set on the API, for applications you own",
            note: "An application you own can skip the prompt if the API allows it. A third-party application always asks.",
            sources: [SRC.auth0Consent],
          },
          entra: {
            who: "User consent settings, or admin consent",
            note: "Reps are asked at sign-in if your tenant lets users consent. An administrator can consent for the whole organization instead.",
            sources: [SRC.entraConsent],
          },
        },
      },
      {
        job: "Validate the token at the records API",
        owner: "Your code",
        cells: {
          okta: {
            who: "Signature, issuer, expiry and audience",
            note: "The audience must equal the one set on your authorization server.",
            sources: [SRC.oktaValidate],
          },
          auth0: {
            who: "Signature, issuer, expiry and audience",
            note: "Auth0 says an access token should be validated only by the API it was intended for. The audience can list more than one value, and yours must be among them.",
            sources: [SRC.auth0Validate],
          },
          entra: {
            who: "Signature, issuer, expiry and audience",
            note: "Microsoft: an API must only accept tokens whose audience is that API.",
            sources: [SRC.entraAt],
          },
        },
      },
      {
        job: "Hold the application to reading",
        owner: "Your code",
        cells: {
          okta: {
            who: "Check the scp claim",
            note: "An array of the scopes granted. Refuse a change, whatever else the token says.",
            sources: [SRC.oktaClaims],
          },
          auth0: {
            who: "Check the scope claim",
            note: "A space-separated list. Auth0 adds a permissions claim as well, if you turn on role-based access control for the API.",
            sources: [SRC.auth0Validate, SRC.auth0Profiles],
          },
          entra: {
            who: "Check the scp claim",
            note: "Microsoft says to make authorization decisions on its value.",
            sources: [SRC.entraClaims],
          },
        },
      },
      {
        job: "Apply the customer-region rule",
        owner: "Your code",
        cells: {
          all: {
            text: "The records API looks up Dana’s region and the customer’s. No identity product does this for you.",
          },
        },
      },
      {
        job: "Log the user and the application",
        owner: "Your code",
        cells: {
          okta: {
            who: "uid for the user, cid for the application",
            note: "Read both from the token and write them down. Nothing logs them for you.",
            sources: [SRC.oktaClaims],
          },
          auth0: {
            who: "sub for the user, azp for the application",
            note: "Under Auth0’s RFC 9068 token profile the application is in client_id instead. Read both from the token and write them down. Nothing logs them for you.",
            sources: [SRC.auth0Profiles],
          },
          entra: {
            who: "oid or sub for the user, azp for the application",
            note: "In version 1.0 tokens the application is in appid. Read both from the token and write them down. Nothing logs them for you.",
            sources: [SRC.entraClaims],
          },
        },
      },
    ],
    "separate-apps": [
      {
        job: "Sign Dana in at the console, with a token intended for the agent service",
        owner: "Platform",
        cells: {
          okta: {
            text: "As in the starting design. On Okta the audience belongs to the authorization server, which matters for the next row.",
          },
          auth0: {
            text: "As in the starting design, with the agent service’s API as the token’s audience.",
          },
          entra: {
            text: "As in the starting design, with the agent service as the token’s audience.",
          },
          salesforce: {
            text: "Your identity provider. In AWS’s example, Amazon Cognito.",
          },
        },
      },
      {
        job: "Exchange it for a token intended for the records API",
        owner: "Platform",
        cells: {
          okta: {
            who: "On-behalf-of token exchange",
            note: "A service app that stands for the agent service makes the exchange on a custom authorization server. For the records API to have an audience of its own, it needs a second authorization server that trusts the first.",
            sources: [SRC.oktaObo],
          },
          auth0: {
            who: "On-behalf-of token exchange",
            note: "The agent service is a Custom API client, linked to the API the console’s token was issued for. The new token keeps the same user and has the records API as its audience.",
            sources: [SRC.auth0Obo],
          },
          entra: {
            who: "On-behalf-of flow",
            note: "Its own grant, the JWT bearer type, not RFC 8693. It works for user principals only.",
            sources: [SRC.entraObo],
          },
          salesforce: {
            who: "Amazon Bedrock AgentCore Identity brokers the exchange at Salesforce’s token endpoint",
            sources: [SRC.awsBlog],
          },
        },
      },
      {
        job: "Say which service may exchange, and for which recipient",
        owner: "Your configuration",
        cells: {
          okta: {
            who: "An access policy and rule",
            note: "For the service app, on the authorization server that issues the new token.",
            sources: [SRC.oktaObo],
          },
          auth0: {
            who: "A client grant",
            note: "A user-delegated grant between the agent service’s client and the records API. Auth0 says to skip user consent for it, because the client is one you own.",
            sources: [SRC.auth0Obo],
          },
          entra: {
            text: "The agent service’s registration needs a permission for the records API, and nothing more.",
          },
          salesforce: {
            text: "In Salesforce: an auth provider, a token exchange handler and the connected app.",
          },
        },
      },
      {
        job: "Validate each token where it is intended",
        owner: "Your code",
        cells: {
          okta: {
            text: "The agent service validates the console’s token, and the records API validates the exchanged one. With one authorization server they share an audience, so each must check scopes as well.",
          },
          auth0: {
            text: "The agent service validates the console’s token. The records API validates the exchanged one. Neither should accept the other’s.",
          },
          entra: {
            text: "The agent service validates the console’s token. The records API validates the exchanged one. Neither should accept the other’s.",
          },
          salesforce: {
            text: "The agent service validates the console’s token. Salesforce validates the one it issued.",
          },
        },
      },
      {
        job: "Apply Dana’s access and the agent service’s limits",
        owner: "Your code",
        cells: {
          okta: {
            text: "The records API checks what the token permits, then its own region rule.",
          },
          auth0: {
            who: "The records API checks what the token permits, then its own region rule",
            note: "Auth0 bases the scopes of the new token on the user’s role-based access control policies.",
            sources: [SRC.auth0Obo],
          },
          entra: {
            text: "The records API checks what the token permits, then its own region rule.",
          },
          salesforce: {
            who: "Salesforce sharing rules",
            note: "Your configuration, in a system you do not own. Salesforce enforces it.",
          },
        },
      },
      {
        job: "Log the user and the application that acted",
        owner: "Your code",
        cells: {
          okta: {
            who: "sub for the user, an act claim for the service",
            note: "Okta’s guide shows the decoded token: act names the service app that asked for the exchange. Check a real token before relying on it.",
            sources: [SRC.oktaObo],
          },
          auth0: {
            who: "sub for the user, azp and act for the service",
            note: "Auth0’s page shows the decoded token: azp is the client that exchanged, and act records the chain of services. Check a real token before relying on it.",
            sources: [SRC.auth0Obo],
          },
          entra: {
            who: "Not shown on Microsoft’s on-behalf-of page",
            note: "Its claims reference says azp or appid is the client using a token. No decoded on-behalf-of token was read to confirm that this is the agent service.",
            gap: true,
            sources: [SRC.entraClaims],
          },
          salesforce: {
            who: "Not established what Salesforce records about the agent",
            note: "Its own audit log is the record. What it shows was not read.",
            gap: true,
          },
        },
      },
    ],
    unattended: [
      {
        job: "Ask for a grant that outlasts the session",
        owner: "Platform",
        cells: {
          okta: {
            who: "A refresh token",
            note: "Turn on the Refresh Token grant type for the application, and ask for the offline_access scope.",
            sources: [SRC.oktaRefresh],
          },
          auth0: {
            who: "A refresh token",
            note: "Ask for the offline_access scope, with Allow Offline Access turned on for the records API.",
            sources: [SRC.auth0GetRefresh, SRC.auth0Refresh],
          },
          entra: {
            who: "A refresh token",
            note: "Ask for the offline_access scope. The token is bound to the user and the application, and lasts 90 days by default.",
            sources: [SRC.entraAuthCode, SRC.entraRefresh],
          },
        },
      },
      {
        job: "Receive the token response in a trusted backend, and keep the refresh token there",
        owner: "Your code",
        cells: {
          okta: {
            who: "Yours to design and verify",
            note: "The backend receives the authorization code at its callback, and exchanges it at the token endpoint for the tokens. The agent worker is never passed the refresh token, and cannot read where it is kept. Okta says applications must store refresh tokens securely.",
            gap: true,
            sources: [SRC.oktaRefresh],
          },
          auth0: {
            who: "Yours to design and verify",
            note: "The backend receives the authorization code at its callback, and exchanges it at the token endpoint for the tokens. The agent worker is never passed the refresh token, and cannot read where it is kept. Auth0 says applications must store refresh tokens securely. Its Token Vault is documented for tokens from supported external providers, and this design does not depend on it.",
            gap: true,
            sources: [SRC.auth0Refresh, SRC.auth0Tv],
          },
          entra: {
            who: "Yours to design and verify",
            note: "The backend receives the authorization code at its callback, and exchanges it at the token endpoint for the tokens. The agent worker is never passed the refresh token, and cannot read where it is kept. Microsoft says to store refresh tokens as safely as application credentials.",
            gap: true,
            sources: [SRC.entraRefresh],
          },
        },
      },
      {
        job: "Authenticate the worker, check its request, and redeem the refresh token",
        owner: "Your code",
        cells: {
          okta: {
            who: "Yours to design and verify",
            note: "The backend checks which worker is asking, for which user and with which permission. Then it redeems the refresh token as the application’s own OAuth client, and returns a short-lived access token and nothing else.",
            gap: true,
            sources: [SRC.rfc6749],
          },
          auth0: {
            who: "Yours to design and verify",
            note: "The backend checks which worker is asking, for which user and with which permission. Then it redeems the refresh token as the application’s own OAuth client, and returns a short-lived access token and nothing else.",
            gap: true,
            sources: [SRC.rfc6749],
          },
          entra: {
            who: "Yours to design and verify",
            note: "The backend checks which worker is asking, for which user and with which permission. Then it redeems the refresh token as the application’s own OAuth client, and returns a short-lived access token and nothing else. Microsoft’s refresh tokens are not tied to one resource, so the backend also has to fix which API and scope it asks for.",
            gap: true,
            sources: [SRC.rfc6749, SRC.entraRefresh],
          },
        },
      },
      {
        job: "Decide how long the grant lasts, and who can end it",
        owner: "Your policy",
        cells: {
          okta: {
            who: "A follow-up window, not forever",
            note: "Okta has a refresh token lifetime setting, and can rotate refresh tokens and detect the reuse of an old one.",
            sources: [SRC.oktaRefresh],
          },
          auth0: {
            who: "A follow-up window, not forever",
            note: "Auth0 offers refresh token rotation and expiry. A refresh token on its deny list gets no more access tokens.",
            sources: [SRC.auth0Refresh],
          },
          entra: {
            who: "A follow-up window, not forever",
            note: "Entra revokes refresh tokens on a credential change, a user action or an administrator’s action.",
            sources: [SRC.entraRefresh],
          },
        },
      },
    ],
  },
  cases: [
    {
      id: "base",
      name: "the starting design",
      paths: ["okta", "auth0", "entra"],
      rows: ["base"],
      evidence: {
        okta: {
          chips: [
            {
              level: "together",
            },
          ],
          text: "Okta documents sign-in, the access token and its validation as one flow. The region rule and the log are your code.",
        },
        auth0: {
          chips: [
            {
              level: "together",
            },
          ],
          text: "Auth0 documents sign-in, the access token and its validation as one flow. The region rule and the log are your code.",
        },
        entra: {
          chips: [
            {
              level: "together",
            },
          ],
          text: "Microsoft documents the flow, exposing an API and validating its tokens for one platform. The region rule and the log are your code.",
        },
      },
      conditions: {
        okta: [
          "Custom authorization servers need API Access Management, which is an add-on in production.",
          "Check a real token before relying on uid and cid.",
        ],
        auth0: [
          "Which claim names the application depends on the access token profile set for the API.",
          "A token issued without the records API as its audience will not validate there.",
        ],
        entra: [
          "Whether the API receives version 1.0 or 2.0 tokens is set in its registration, and decides whether the application appears as appid or azp.",
        ],
      },
      setup: {
        okta: [SRC.oktaPkce, SRC.oktaCustomize, SRC.oktaValidate],
        auth0: [SRC.auth0Pkce, SRC.auth0Apis, SRC.auth0Validate],
        entra: [SRC.entraAuthCode, SRC.entraExpose, SRC.entraAt],
      },
      check:
        "Sign in as a rep who cannot see customer 8841, and ask the agent for it. The records API refuses, and its log names the rep and the application.",
    },
    {
      id: "separate-apps",
      name: "the support console and the agent are separate applications",
      paths: ["okta", "auth0", "entra", "salesforce"],
      rows: ["separate-apps"],
      evidence: {
        okta: {
          chips: [
            {
              level: "together",
            },
          ],
          text: "Okta documents the whole chain on its own platform: an application, a service that exchanges, and an API behind it.",
        },
        auth0: {
          chips: [
            {
              level: "together",
            },
          ],
          text: "Auth0 documents the whole chain on its own platform: an application, a service that exchanges, and an API behind it.",
        },
        entra: {
          chips: [
            {
              level: "together",
            },
            {
              level: "open",
              label: "Not confirmed: the agent service in the token",
            },
          ],
          text: "Microsoft documents the exchange as one flow. What its token shows about the agent service is not confirmed: see the last row.",
        },
        salesforce: {
          chips: [
            {
              level: "together",
            },
            {
              level: "open",
              label: "Not established: what Salesforce logs about the agent",
            },
          ],
          text: "Documented together, as a reference implementation on AWS’s security blog, August 2026. What Salesforce records about the agent is not established: see the last row.",
        },
      },
      conditions: {
        okta: [
          "In Okta’s single-server example both tokens carry the same audience, so only their scopes tell them apart.",
          "A service app cannot ask for refresh tokens or ID tokens in this flow.",
          "Custom authorization servers need API Access Management, which is an add-on in production.",
        ],
        auth0: [
          "Only a Custom API client, linked to an API, can make this exchange.",
          "The chain of services recorded in act is limited to five levels.",
          "Auth0 rate-limits these exchanges separately from other requests.",
        ],
        entra: [
          "Not RFC 8693. Tools that expect the standard grant need to know.",
        ],
        salesforce: [
          "This is the Salesforce architecture written up here, taken from AWS’s article. It does not mean Salesforce needs token exchange. Simpler integrations may exist, and none is written up.",
          "The same article limits two other data sources differently. Only the Salesforce part is an exchange.",
        ],
      },
      setup: {
        okta: [SRC.oktaObo],
        auth0: [SRC.auth0Obo],
        entra: [SRC.entraObo],
        salesforce: [SRC.awsBlog],
      },
      check:
        "Ask for customer 8841 through the console, as a rep who cannot see it. The records API refuses. Then send the console’s own token straight to the records API. It should refuse that too. If it accepts, the two tokens are not being told apart.",
    },
    {
      id: "unattended",
      name: "the agent keeps working after Dana has gone home",
      paths: ["okta", "auth0", "entra"],
      extends: "base",
      rows: ["base", "unattended"],
      evidence: {
        okta: {
          chips: [
            {
              level: "capability",
              label: "Capability documented: refresh tokens",
            },
            {
              level: "composed",
            },
            {
              level: "open",
              label: "To design and verify: the trusted backend",
            },
          ],
          text: "Refresh-token mechanism documented by Okta. The component that keeps the refresh token outside the agent worker still needs to be designed and verified. Nothing here was run.",
        },
        auth0: {
          chips: [
            {
              level: "capability",
              label: "Capability documented: refresh tokens",
            },
            {
              level: "composed",
            },
            {
              level: "open",
              label: "To design and verify: the trusted backend",
            },
          ],
          text: "Refresh-token mechanism documented by Auth0. The component that keeps the refresh token outside the agent worker still needs to be designed and verified. Nothing here was run.",
        },
        entra: {
          chips: [
            {
              level: "capability",
              label: "Capability documented: refresh tokens",
            },
            {
              level: "composed",
            },
            {
              level: "open",
              label: "To design and verify: the trusted backend",
            },
          ],
          text: "Refresh-token mechanism documented by Microsoft. The component that keeps the refresh token outside the agent worker still needs to be designed and verified. Nothing here was run.",
        },
      },
      conditions: {
        all: [
          "To design and verify: how the backend keeps the refresh token where the worker’s process cannot read it.",
          "How the backend authenticates the worker, and how it decides which user and which permission a worker may ask for.",
          "How Dana, or an administrator, ends the grant.",
          "No named vault product is required for this, and none was confirmed for a records API of your own.",
        ],
      },
      setup: {
        okta: [SRC.oktaRefresh],
        auth0: [SRC.auth0GetRefresh, SRC.auth0Refresh],
        entra: [SRC.entraRefresh],
      },
      check:
        "From inside the agent worker, try to read the refresh token, and ask the backend for a token for a rep whose case the worker was not given. Both should fail. Then end Dana’s grant and have the worker ask again. It should get no access token.",
    },
  ],
};
