/**
 * An agent that reconciles invoices overnight.
 *
 * The starting design gives the agent an identity of its own. Two additions
 * leave that design as it is: a supplier that takes only an API key, and a
 * payment that needs a person's approval. One alternative replaces it: the
 * agent works on one accountant's access, granted earlier.
 *
 * Vendor rows are drawn from the linked documentation and were not tested.
 * `docs/source-review.md` lists what to re-check and where.
 */
import { SRC } from "./sources";
import type { InvoiceExample, Party } from "./types";

const P = {
  rt: {
    id: "rt",
    label: "Agent’s runtime",
    sub: "issues its identity",
    role: "infra",
  },
  agent: {
    id: "agent",
    label: "Invoice agent",
    role: "agent",
  },
  idp: {
    id: "idp",
    label: "Identity platform",
    sub: "the ledger trusts it",
    role: "authz",
  },
  ledger: {
    id: "ledger",
    label: "Ledger API",
    sub: "yours",
    role: "resource",
  },
  proxy: {
    id: "proxy",
    label: "Egress proxy",
    sub: "has the key",
    role: "infra",
  },
  supplier: {
    id: "supplier",
    label: "Supplier portal",
    sub: "API key only",
    role: "resource",
  },
  asrv: {
    id: "asrv",
    label: "Authorization server",
    sub: "can reach people",
    role: "authz",
  },
  approver: {
    id: "approver",
    label: "Controller",
    sub: "on their phone",
    role: "human",
  },
  pay: {
    id: "pay",
    label: "Payments API",
    sub: "yours",
    role: "resource",
  },
  acct: {
    id: "acct",
    label: "Accountant",
    sub: "weeks earlier",
    role: "human",
  },
  backend: {
    id: "backend",
    label: "Trusted backend",
    sub: "token broker",
    role: "infra",
  },
} satisfies Record<string, Party>;

export const invoiceAgent: InvoiceExample = {
  slug: "invoice-agent",
  title: "An agent that reconciles invoices overnight",
  paths: {
    entra: {
      label: "Microsoft Entra, agent on your own Kubernetes",
      fits: "You already use Entra and can register your cluster as an issuer.",
    },
    gcp: {
      label: "Google Cloud, agent on a managed runtime",
      fits: "The agent runs on Agent Runtime or Cloud Run, and the ledger API is yours.",
    },
  },
  blocks: {
    own: {
      design: {
        kind: "Core",
        title: "The agent proves what it is and gets permissions of its own",
        parties: [P.rt, P.agent, P.idp, P.ledger],
        steps: [
          {
            from: "rt",
            to: "agent",
            label: "Identity token for this agent",
            flow: "workload-identity-federation",
          },
          {
            from: "agent",
            to: "idp",
            label: "Presents it",
          },
          {
            from: "idp",
            to: "agent",
            label: "Access token: read invoices, create drafts",
            flow: "workload-identity-federation#permissions",
          },
          {
            from: "agent",
            to: "ledger",
            label: "Read invoices, create a draft",
          },
          {
            from: "ledger",
            label: "Validate the token; check the role",
          },
        ],
        note: "Where the ledger validates the runtime’s token itself, steps 2 and 3 drop out. The Google Cloud path works that way.",
      },
      simpler: [
        [
          "A client secret or API key for the agent",
          "It carries the same authority. But someone has to create, deliver, store and rotate it, and anything that can read the agent’s environment can use it from anywhere.",
        ],
        [
          "Run it under an accountant’s account",
          "Then the log blames a person for the agent’s work, and the agent’s access changes whenever hers does.",
        ],
      ],
      check:
        "With the agent’s credential, call the payment endpoint. Expect a refusal and a log entry naming the agent. Then read an invoice, and expect that to work.",
      rows: [
        {
          job: "Host the agent",
          owner: "Platform",
          cells: {
            entra: {
              text: "Your Kubernetes cluster.",
            },
            gcp: {
              text: "Agent Runtime or Cloud Run.",
            },
          },
        },
        {
          job: "Issue the agent an identity credential",
          owner: "Platform",
          cells: {
            entra: {
              who: "Projected service account token",
              stage: "GA",
              sources: [SRC.k8s],
            },
            gcp: {
              who: "Agent Identity ID token",
              stage: "Preview",
              sources: [SRC.gcpAgent],
            },
          },
        },
        {
          job: "Turn it into a token the ledger accepts",
          owner: "Your configuration",
          cells: {
            entra: {
              who: "Entra workload identity federation",
              note: "You register the cluster’s issuer, subject and audience.",
              sources: [SRC.entraWif],
            },
            gcp: {
              who: "Not needed",
              note: "The ledger validates Google’s token itself.",
            },
          },
        },
        {
          job: "Decide what the agent may do",
          owner: "Your policy",
          cells: {
            entra: {
              who: "Two application roles on the ledger’s registration, assigned to the agent",
              sources: [SRC.entraArch],
            },
            gcp: {
              who: "An allowlist in the ledger: this agent may read invoices and create drafts",
              sources: [SRC.gcpAgent],
            },
          },
        },
        {
          job: "Enforce it on every request",
          owner: "Your code",
          cells: {
            entra: {
              text: "The ledger validates the token and checks its roles claim.",
            },
            gcp: {
              text: "The ledger checks issuer, signature, audience and expiry, then the subject.",
            },
          },
        },
        {
          job: "Take access away",
          owner: "Your operations",
          cells: {
            entra: {
              text: "Remove the role assignment or the federated credential. Tokens already issued run to expiry.",
            },
            gcp: {
              text: "Remove the allowlist entry. A token already issued verifies until it expires.",
            },
          },
        },
      ],
      evidence: {
        entra: {
          chips: [
            {
              level: "capability",
            },
          ],
          text: "Documented by Microsoft across two documents: federation, and application roles. Neither is a walkthrough for agents.",
        },
        gcp: {
          chips: [
            {
              level: "together",
            },
          ],
          text: "Documented by Google as one walkthrough. The feature is in Preview.",
        },
      },
      conditions: {
        entra: [
          "Entra reads your cluster’s issuer document, so the issuer must be reachable.",
          "Issuer, subject and audience must match exactly. No wildcards.",
        ],
        gcp: [
          "Preview, under pre-GA terms.",
          "The token is bound to the agent’s certificate by default. Your API either enforces that over mutual TLS or accepts a bearer token.",
        ],
      },
      setup: {
        entra: [SRC.entraWif, SRC.entraArch, SRC.k8s],
        gcp: [SRC.gcpAgent],
      },
    },
    key: {
      label: "One supplier accepts only an API key",
      design: {
        kind: "Addition",
        title: "A key the agent uses and never holds",
        parties: [P.agent, P.proxy, P.supplier],
        steps: [
          {
            from: "agent",
            to: "proxy",
            label: "Request for the supplier, with a placeholder",
            flow: "credential-broker",
          },
          {
            from: "proxy",
            label: "Allowed host? Fetch the key",
          },
          {
            from: "proxy",
            to: "supplier",
            label: "The same request, with the real key",
          },
          {
            from: "supplier",
            to: "agent",
            label: "Response",
          },
        ],
      },
      delta: [
        [
          "A second credential appears",
          "The supplier’s API key. It is not the agent’s identity, and it carries the same access for every caller.",
        ],
        [
          "The agent must not hold it",
          "The agent reads invoices written by strangers. A key in its environment can be talked out of it.",
        ],
        [
          "A new part",
          "An egress proxy that adds the key to requests for the supplier’s host only, after they leave the agent.",
        ],
        [
          "A new job for you",
          "Make the proxy unavoidable. If the agent can reach the supplier directly, the proxy protects nothing.",
        ],
        [
          "What stays the same",
          "How the agent proves itself, and what it may do in the ledger.",
        ],
      ],
      simpler: [
        [
          "Put the key in an environment variable",
          "The simplest thing, and the key is then one injected instruction away from leaving.",
        ],
        [
          "Ask the supplier for OAuth",
          "If they offer client credentials, use that and drop the proxy. This addition exists because they do not.",
        ],
      ],
      check:
        "From inside the agent’s environment, list the environment and capture an outgoing request. The key is in neither. Then call the supplier without the proxy, and confirm the connection is refused.",
      rows: [
        {
          job: "Keep the supplier’s key outside the agent",
          owner: "Platform",
          cells: {
            entra: {
              who: "Infisical Agent Vault, or a Kubernetes Secret behind the proxy",
              stage: "Not stated",
              sources: [SRC.infisical],
            },
            gcp: {
              who: "Nothing documented on this runtime",
              note: "Google’s auth manager returns the credential to the agent.",
              gap: true,
              sources: [SRC.authMgr],
            },
          },
        },
        {
          job: "Add the key to outgoing requests",
          owner: "Platform",
          cells: {
            entra: {
              who: "Agent Vault’s proxy, or agentgateway",
              note: "Or Agent Substrate’s egress gateway, if you host the agent on Substrate.",
              stage: "Not stated",
              sources: [SRC.agw, SRC.substrate],
            },
            gcp: {
              who: "Nothing documented on this runtime",
              note: "Agent Gateway governs egress and does not describe injecting credentials.",
              gap: true,
              sources: [SRC.agentGw],
            },
          },
        },
        {
          job: "Make the proxy unavoidable",
          owner: "Your operations",
          cells: {
            entra: {
              text: "A network plugin that enforces NetworkPolicy, with all other egress denied.",
            },
            gcp: {
              text: "Depends on the rows above.",
            },
          },
        },
        {
          job: "Limit which hosts get the key",
          owner: "Your configuration",
          cells: {
            entra: {
              text: "An allowlist with the supplier’s host and nothing else.",
            },
            gcp: {
              text: "Depends on the rows above.",
            },
          },
        },
      ],
      evidence: {
        entra: {
          chips: [
            {
              level: "composed",
            },
          ],
          text: "Each part is documented by its own project. Nothing documents them together, and they do not involve Entra.",
        },
        gcp: {
          chips: [
            {
              level: "open",
            },
          ],
          text: "This runtime has no documented way to do it. Hosting the agent on Agent Substrate, on GKE, is a different path.",
        },
      },
      conditions: {
        entra: [],
        gcp: [],
      },
      setup: {
        entra: [SRC.infisical, SRC.agw, SRC.substrate],
        gcp: [SRC.gke, SRC.agentGw, SRC.authMgr],
      },
    },
    approval: {
      label: "It proposes a payment that needs approval",
      design: {
        kind: "Addition",
        title:
          "One person approves one payment, and the Payments API holds it to that",
        parties: [P.agent, P.asrv, P.approver, P.pay],
        steps: [
          {
            from: "agent",
            to: "asrv",
            label: "Asks for approval: who, and the payment’s details",
            flow: "ciba",
          },
          {
            from: "asrv",
            to: "approver",
            label: "Push: pay invoice 1042, $1,250.00, to Acme Ltd?",
          },
          {
            from: "approver",
            to: "asrv",
            label: "Approves on their phone",
          },
          {
            from: "asrv",
            to: "agent",
            label: "Token carrying those payment details",
            flow: "step-up-authorization",
          },
          {
            from: "agent",
            to: "pay",
            label: "Submit the payment, with that token",
          },
          {
            from: "pay",
            label: "Run it only if it matches, once",
          },
        ],
      },
      delta: [
        [
          "A new authority appears",
          "One named person’s approval of one payment. The agent’s own identity still cannot pay.",
        ],
        [
          "A way to reach that person",
          "They are not in a session with the agent. The authorization server contacts them on a device it already knows. That is what backchannel approval gives you: authentication and consent, from someone elsewhere.",
        ],
        [
          "Required: the approval names the payment",
          "Amount and payee travel in the request as structured details and are what the approver sees. The words come from the request, never from the agent’s description of it.",
        ],
        [
          "Required: the Payments API enforces it",
          "It runs only a payment that matches the approved details, once. Without this check an approval is a suggestion.",
        ],
        [
          "Required: something other than the agent picks the approver",
          "From the invoice’s cost center and your approval policy. Never from model output.",
        ],
      ],
      simpler: [
        [
          "Give the agent permission to pay",
          "Then nothing stands between a manipulated agent and the money.",
        ],
        [
          "Ask in chat, and proceed on “yes”",
          "The approval is tied to no amount and no payee, and nothing checks it when the payment runs.",
        ],
      ],
      check:
        "Approve invoice 1042 for $1,250.00. Have the agent submit $12,500.00 with the token it received. The Payments API refuses, and refuses a second use of the same approval.",
      rows: [
        {
          job: "Reach the approver and show them the payment",
          owner: "Platform",
          cells: {
            all: {
              who: "An authorization server with backchannel approval and structured request details",
              note: "Auth0 documents the two together. Okta documents the approval with an authenticator app you supply. Keycloak has a policy for it; its details were not read.",
              sources: [SRC.auth0Async, SRC.oktaCiba, SRC.kcAdmin],
            },
          },
        },
        {
          job: "Choose who is asked",
          owner: "Your policy",
          cells: {
            all: {
              text: "Derived from the invoice and your approval rules, in code the model cannot steer.",
            },
          },
        },
        {
          job: "Put amount and payee in the request",
          owner: "Your code",
          cells: {
            all: {
              text: "As structured details, so the token that comes back carries them.",
            },
          },
        },
        {
          job: "Enforce at execution",
          owner: "Your code",
          cells: {
            all: {
              text: "In the Payments API: compare the payment to the approved details, allow one use, expire quickly.",
            },
          },
        },
      ],
      evidence: {
        entra: {
          chips: [
            {
              level: "composed",
            },
          ],
          text: "Entra’s support for backchannel approval was not read. This path adds a second issuer, and whether your Payments API should trust two is unresolved.",
        },
        gcp: {
          chips: [
            {
              level: "composed",
            },
          ],
          text: "No approval service was read for this runtime. The authorization server is a separate choice.",
        },
      },
      conditions: {
        entra: [],
        gcp: [],
      },
      setup: {
        entra: [SRC.auth0Async, SRC.oktaCiba, SRC.kcAdmin],
        gcp: [SRC.auth0Async, SRC.oktaCiba, SRC.kcAdmin],
      },
    },
    accountant: {
      design: {
        kind: "Alternative",
        title: "The agent works with one accountant’s access, granted earlier",
        parties: [P.acct, P.idp, P.backend, P.agent, P.ledger],
        steps: [
          {
            from: "acct",
            to: "idp",
            label: "Signs in once and consents, weeks earlier",
            flow: "authorization-code-pkce",
          },
          {
            from: "idp",
            to: "backend",
            label: "Access token and refresh token",
            detail:
              "The backend completes the authorization code flow: it receives the code at its callback, then exchanges it at the token endpoint for an access token and, when authorized, a refresh token",
          },
          {
            from: "backend",
            label: "Stores the refresh token, out of the agent’s reach",
            detail: "Stores the refresh token where the agent cannot read it",
          },
          {
            from: "agent",
            to: "backend",
            label: "At 02:00: asks for a token for her",
            detail:
              "At 02:00: authenticates as itself, and asks for an access token for her",
          },
          {
            from: "backend",
            to: "idp",
            label: "Checks, then redeems the refresh token",
            detail:
              "Checks that this agent may ask for her and for this permission. Then redeems the refresh token as the application’s OAuth client, and receives a new access token",
          },
          {
            from: "backend",
            to: "agent",
            label: "Access token only",
            detail:
              "Returns a short-lived access token for the ledger, and never the refresh token",
          },
          {
            from: "agent",
            to: "ledger",
            label: "Read invoices, create a draft, as her",
          },
          {
            from: "ledger",
            label: "Validate; apply her access and the agent’s limits",
          },
        ],
      },
      delta: [
        [
          "Whose name is on the token",
          "The accountant’s. The agent appears as the client acting for her.",
        ],
        [
          "How it works with nobody there",
          "She consented once, earlier. A refresh token from that moment is kept by a trusted backend, which the agent asks for a short-lived access token each night. The agent never receives the refresh token. Nobody being present did not decide the design. Whose work this is did.",
        ],
        [
          "What bounds the agent",
          "Her permissions, narrowed by scope. If her access changes or she leaves, the agent’s changes with it.",
        ],
        [
          "A new thing to protect",
          "The stored grant. Decide where it lives, who can revoke it and who is told when it stops working.",
        ],
      ],
      simpler: [
        [
          "The service-identity design",
          "Simpler to run, and right when the work is the organization’s and not hers.",
        ],
        [
          "Keep her password or session for the agent",
          "It carries everything she can do, and cannot be scoped or revoked on its own.",
        ],
      ],
      check:
        "Remove the accountant’s access to one ledger entity. The next night’s run cannot read it either.",
      rows: [
        {
          job: "Get her consent once, for use when she is away",
          owner: "Your configuration",
          cells: {
            all: {
              text: "Your identity provider, with the authorization code flow and a request for offline access.",
            },
          },
        },
        {
          job: "Receive the token response in a trusted backend, and keep the refresh token there",
          owner: "Your code",
          cells: {
            all: {
              who: "Yours to design and verify",
              note: "The backend receives the authorization code at its callback, and exchanges it at the token endpoint for the tokens. The agent is never passed the refresh token, and cannot read where it is kept. No named vault product is required, and none was confirmed for a ledger API of your own.",
              gap: true,
            },
          },
        },
        {
          job: "Authenticate the agent, check its request, and redeem the refresh token",
          owner: "Your code",
          cells: {
            all: {
              who: "Yours to design and verify",
              note: "The backend checks which agent is asking, for which user and with which permission. Then it redeems the refresh token as the application’s own OAuth client, and returns a short-lived access token and nothing else.",
              gap: true,
              sources: [SRC.rfc6749],
            },
          },
        },
        {
          job: "Enforce her access and the agent’s limits",
          owner: "Your code",
          cells: {
            all: {
              text: "The ledger checks the user, the acting client and the scope.",
            },
          },
        },
        {
          job: "Notice when the grant dies",
          owner: "Your operations",
          cells: {
            all: {
              text: "She leaves, revokes it, or it expires. Decide who finds out, and how.",
            },
          },
        },
      ],
      evidence: {
        all: {
          chips: [
            {
              level: "composed",
            },
            {
              level: "open",
              label: "To design and verify: the trusted backend",
            },
          ],
          text: "Refresh tokens are a documented mechanism, and no build path is written up for this alternative. The component that keeps the refresh token outside the agent still needs to be designed and verified. Nothing here was run.",
        },
      },
    },
  },
};
