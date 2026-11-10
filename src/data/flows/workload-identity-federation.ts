import type { Flow } from "../types";

export const workloadIdentityFederation: Flow = {
  slug: "workload-identity-federation",
  title: "Workload identity federation",
  short: "Workload identity federation",
  group: "autonomous",
  human: "absent",
  maturity: "stable",
  tagline:
    "Your agent uses an identity established by its runtime to obtain short-lived access from a system that trusts that identity.",
  summary: `An agent uses its runtime identity to obtain access in another trust domain. This diagram shows JWT-based workload access using OIDC discovery; user-level permissions require separate enforcement.`,
  reading: {
    brief: {
      authority:
        "The workload’s own access, granted by the receiving system. This diagram uses a JWT identity credential and OIDC discovery.",
      benefit:
        "For an integration that supports federation, the application owner avoids provisioning a long-lived application secret.",
      cost: "You still protect credentials and maintain trust and permissions. Stopping fresh identity proofs, blocking new exchanges and invalidating issued access are separate controls. [See stopping access](#stopping-access).",
      prerequisites: [
        "The runtime can issue the expected proof. The receiver trusts its specific issuer, requires the intended audience, and matches the intended workload claims.",
        "For the discovery arrangement drawn here, the receiver can reach the registered issuer’s discovery document and signing keys, and validates signature and lifetime.",
        "An administrator grants the matched workload appropriate permissions. The target API accepts the credential the receiver issues and enforces that grant.",
      ],
      responsibilities:
        "This credential carries no person’s grant. A user-facing request still needs trusted user context and object, action and field checks in the application, service or API, before data reaches the person or their agent. [See the report A/report B example](#permissions). A service-only background job instead uses its scoped service permissions.",
      alternatives: [
        {
          condition:
            "If the destination accepts only an API key, it cannot use this trust arrangement.",
          label: "Consider a credential broker.",
          href: "/flows/credential-broker/",
        },
        {
          condition:
            "If the downstream API must enforce a person’s delegated grant itself, it needs a supported user-aware credential.",
          label: "See token exchange.",
          href: "/flows/token-exchange/",
        },
      ],
    },
    phases: [
      {
        title: "Obtain identity proof",
        summary:
          "The platform identifies the workload and supplies its credential.",
        start: 1,
        end: 1,
      },
      {
        title: "Establish receiving trust",
        summary:
          "The receiver verifies the proof and matches its configured trust rule.",
        start: 2,
        end: 5,
      },
      {
        title: "Obtain and use access",
        summary:
          "The receiver issues a credential that the target API accepts.",
        start: 6,
        end: 8,
      },
    ],
    decisions: {
      presentation: "table",
      items: [
        {
          atStep: 5,
          title: "Separate workload identities",
          benefit:
            "Different workloads can have distinct grants and cut-off controls where the receiver enforces them.",
          cost: "More identities, trust rules and grants to create and maintain. Replicas using one identity still share its grant.",
          mitigation: {
            action:
              "Use reusable policy templates, with a specific identity and grant for each workload that needs separation.",
            conditions:
              "The platform must distinguish those workloads, and the receiver must enforce the intended permissions and cut-off per identity. Restrict who can obtain or run as that identity.",
            addedCost:
              "Owners still review each binding and permission change; a shared template needs careful change control.",
            remaining:
              "Separate identities do not constrain a workload beyond its granted access or guarantee immediate invalidation of issued credentials.",
          },
          sources: [
            {
              label: "EKS: service accounts, role trust and permissions",
              href: "https://docs.aws.amazon.com/eks/latest/userguide/associate-service-account-role.html",
            },
          ],
        },
        {
          atStep: 6,
          title: "Shorter issued lifetimes",
          benefit:
            "Within the receiver’s supported range, shorter validity reduces how long a copied credential can be used.",
          cost: "More frequent renewals increase dependency on the issuer and exchange service. Proof and issued-access lifetimes can differ.",
          mitigation: {
            action:
              "Use the supported SDK’s renewal behavior and allow time for renewal before expiry.",
            conditions:
              "The platform and receiver must support the chosen lifetimes; verify how that SDK refreshes each credential in this configuration.",
            addedCost:
              "Monitor renewal failures and handle expiry without sending expired credentials.",
            remaining:
              "Narrower permission limits what can be done; lifetime limits time. An unexpired proof can still obtain new access while trust permits it.",
          },
          sources: [
            {
              label: "JWT expiry (RFC 7519 §4.1.4)",
              href: "https://www.rfc-editor.org/rfc/rfc7519.html#section-4.1.4",
            },
            {
              label: "AWS STS: a provider-specific lifetime example",
              href: "https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html",
            },
          ],
        },
        {
          atStep: 6,
          title: "Reuse valid issued credentials",
          benefit:
            "If the SDK supports reuse, fewer calls need a new exchange. This can bridge a brief issuer outage while the credential remains accepted.",
          cost: "Cached credentials require protection and expiry handling, and may outlive a change to upstream trust or permissions.",
          mitigation: {
            action:
              "Reuse only within a matching workload, receiver, target and effective permission context.",
            conditions:
              "Keep any binding or grant context intact. The credential must remain valid and accepted; caching is an operating choice, not an availability guarantee.",
            addedCost:
              "The SDK or application must isolate cache entries and handle renewal and invalidation correctly.",
            remaining:
              "Blocking new exchanges does not recall an issued credential. Earlier cut-off needs a control the receiver or target actually enforces.",
          },
          sources: [
            {
              label: "AWS: revoking issued role sessions",
              href: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html",
            },
            {
              label: "Kubernetes: offline proof validation limits",
              href: "https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/#schema-for-service-account-private-claims",
            },
          ],
        },
      ],
    },
  },
  fits: [
    "Your runtime can identify the workload and supply an identity credential.",
    "The workload needs its own access in another trust domain, whose receiver supports that proof and whose API accepts the issued credential.",
    "You want to avoid provisioning a long-lived application secret for an integration that supports this trust arrangement.",
  ],
  watchOut: [
    "**Workload access is not a person’s grant.** User-facing requests still need trusted user context and object, action and field checks before data reaches the person or their agent. [See the report authorization example](#permissions).",
    "**Stopping the workload is not instant cut-off.** Fresh proofs, new exchanges and already-issued access have separate controls. [See stopping access](#stopping-access).",
    "**Know who else the issuer serves.** Some issuers sign for many tenants under one URL. GitHub Actions on GitHub.com uses a single issuer for every repository, so trusting that issuer alone trusts all of them. [Check the receiver’s requirements](#fit).",
    "**Match stable workload claims.** Pin a subject or supported claims to the intended service account, repository and environment, or role. Avoid broad matches. Prefer identifiers that cannot be reassigned, such as IDs over names where the issuer offers them; what a receiver can match differs.",
    "**Protect credentials and their source.** A bearer identity or access token can be replayed by whoever holds a valid copy. Certificate-based authentication instead requires the private key, which must stay private. Keep both kinds of secret out of logs, prompts and tool output. Restrict access to credential endpoints: code or tools running inside the workload may otherwise obtain the same credentials.",
  ],
  participants: [
    {
      id: "idp",
      label: "Identity provider",
      sub: "workload’s platform",
      role: "infra",
    },
    { id: "agent", label: "Agent workload", role: "agent" },
    {
      id: "sts",
      label: "Token service",
      sub: "receiving system",
      role: "authz",
    },
    { id: "api", label: "Target API", role: "resource" },
  ],
  steps: [
    {
      from: "idp",
      to: "agent",
      kind: "back",
      label: "Workload identity credential",
      title: "The platform gives the workload an identity credential",
      body: `The workload identity provider is whatever established which workload this is: a cloud’s metadata service, a Kubernetes cluster, a CI system, a SPIFFE implementation. It supplies a short-lived, signed statement of that identity, most often a JWT (RFC 7519) like the one shown. How it arrives depends on the platform: a file that is kept fresh, a local endpoint, a request the workload makes when it needs one. Some receivers accept other proofs instead, such as an X.509 certificate or a signed request.

*Usually handled by the platform, and read by an SDK.*`,
      code: {
        lang: "jsonc",
        text: `// Illustrative claims.
// Names and values depend on the issuer.
{
  "iss": "https://identity.platform.example",
  "sub": "workload:research-agent",
  "aud": "https://sts.receiver.example",
  "iat": 1794268800,
  "exp": 1794272400
}`,
      },
      gain: [["agent", "identity credential (aud: token service)"]],
    },
    {
      from: "agent",
      to: "sts",
      kind: "back",
      label: "Present identity credential",
      title: "The workload presents it to the receiving token service",
      body: `This is the federation step. The receiving token service belongs to the system the agent wants access to: a cloud’s security token service, or an identity platform’s token endpoint. The request has no universal format. Google Cloud uses OAuth token exchange (RFC 8693). Microsoft Entra takes the credential as the client assertion on a client credentials request. AWS has its own operation, \`AssumeRoleWithWebIdentity\`. The [request-format note](#request-formats) sets out the differences.

*Usually handled by an SDK or credential library, once it is told where to find the identity credential and what to ask for.*`,
    },
    {
      from: "sts",
      to: "idp",
      kind: "back",
      label: "Fetch issuer keys",
      title: "The token service finds the issuer’s public keys",
      body: `A signed credential is checked against its issuer’s public keys. Most receivers read them from the issuer’s OpenID Connect discovery document, at \`/.well-known/openid-configuration\` under the issuer URL, which points to a key set (JWKS). They cache what they find. Where the issuer cannot be reached from outside, some receivers let an administrator upload the keys instead. Either way the issuer was registered in advance: a token service does not go looking for the keys of an issuer nobody told it to trust.

*Handled by the receiving system.*`,
    },
    {
      from: "sts",
      kind: "self",
      label: "Validate the credential",
      title: "The token service validates what it was given",
      body: `It checks the signature against the issuer’s keys, that the issuer is one it was configured to trust, that the audience names this token service, and that the credential has not expired. The audience check is what stops a token issued for one recipient from being replayed at another: RFC 7519 requires a recipient to reject a JWT with a present audience claim that does not include it. This arrangement requires that claim; JWT does not require it in every use. What the audience value should be is for the receiver to define, and differs by provider.

So far the receiver knows only that a trusted issuer made this statement, for this recipient, recently. It has not yet decided what the workload may do.

*Handled by the receiving system.*`,
    },
    {
      from: "sts",
      kind: "self",
      label: "Apply the trust rule",
      title: "Match the identity, then apply its permission grant",
      body: `An administrator configures which issuer, audience and specific workload claims the receiver will accept. A role trust policy, federated identity credential or identity-pool condition handles that match, with syntax and supported claims that differ by receiver. A separate permission grant decides what the matched identity may do. A trust rule that admits extra workloads can let them reach the same grant. The illustration shows those two decisions together; it is not vendor syntax.

*Written ahead of time by whoever administers the receiving system. This part is yours to get right.*`,
      code: {
        lang: "yaml",
        text: `# Conceptual trust and permission binding.
# Each receiver has its own syntax.
trust:
  issuer:   https://identity.platform.example
  audience: https://sts.receiver.example
  subject:  workload:research-agent
permission_grant: role/model-inference`,
      },
    },
    {
      from: "sts",
      to: "agent",
      kind: "resp",
      label: "Short-lived credential",
      title: "The token service issues a short-lived credential",
      body: `What comes back depends on the receiver. Google Cloud returns a federated access token, used directly or to impersonate a service account. Microsoft Entra returns an OAuth access token. AWS returns temporary security credentials: an access key ID, a secret access key and a session token. Those sign requests. They are not an OAuth bearer token.

How long the credential lasts is the receiver’s setting, and differs by provider and configuration. When it expires, the exchange is repeated with a fresh identity credential.

*Usually cached and renewed by the SDK.*`,
      gain: [["agent", "short-lived credential (for the target API)"]],
    },
    {
      from: "agent",
      to: "api",
      kind: "back",
      label: "Call API with the credential",
      title: "The agent calls the target API",
      body: `How the credential is used depends on its kind. An OAuth access token is sent as a bearer token in the \`Authorization\` header. AWS credentials are used to sign the request. The identity credential from step 1 is not sent to the API: its audience is the token service.

*Usually handled by the SDK or client library, which attaches the token or signs the request.*`,
    },
    {
      from: "api",
      to: "agent",
      kind: "resp",
      label: "200 OK",
      title: "The API responds",
      body: `The API validates the issued credential and enforces the workload’s permission grant. Its logs can identify the granted role or identity; multiple processes using that identity may still share it.

The credential carries the workload’s access, not a person’s grant. For a user-facing request, trusted application or service code can enforce that person’s object/action permissions while the downstream API authorizes the service. If the downstream API must independently enforce the person’s grant, it needs trustworthy user context through a supported mechanism, such as [token exchange](/flows/token-exchange/). In either case, check access before returning data to the person or their agent. [The report example](#permissions) makes that boundary concrete.`,
    },
  ],
  standards: [
    "rfc7519",
    "oidc-discovery",
    "rfc8693",
    "rfc7523",
    "k8s-sa-tokens",
    "spiffe",
    "github-actions-oidc",
    "aws-oidc-federation",
    "aws-sts-web-identity",
    "aws-outbound-federation",
    "gcp-wif",
    "gcp-wif-x509",
    "entra-wif",
    "aws-iam-roles",
    "gcp-auth",
    "azure-managed-identities",
  ],
  // No single specification defines the pattern. Required here means required by the flow the
  // diagram draws (see `illustrated`): a JWT identity credential and OIDC discovery. Each
  // provider's mechanism, other proofs, and the Kubernetes worked example are variants.
  roles: {
    rfc7519: "required", // the identity credential drawn in step 1 is a JWT; step 4 teaches the audience and expiry rules it sets
    "oidc-discovery": "required", // step 3 shows the discovery document the receiver reads to find the issuer's keys
    rfc8693: "optional", // one request format (Google Cloud, and the worked example); no general step depends on it
    rfc7523: "optional", // the client assertion format Microsoft Entra uses; named, not drawn
    "k8s-sa-tokens": "optional", // the worked example's identity credential; one implementation of step 1
    spiffe: "optional", // one identity provider for workloads outside a cluster or cloud; named in the comparison
    "github-actions-oidc": "optional", // the CI row: one identity provider
    "aws-oidc-federation": "optional", // one receiving system
    "aws-sts-web-identity": "optional", // its request format and what it returns
    "aws-outbound-federation": "optional", // AWS as the identity provider
    "gcp-wif": "optional", // one receiving system
    "gcp-wif-x509": "optional", // a proof other than a JWT, named after the diagram and in the request-format notes; not drawn
    "entra-wif": "optional", // one receiving system
    "aws-iam-roles": "background", // native identity, named as the contrast with federation
    "gcp-auth": "background", // native identity, named as the contrast with federation
    "azure-managed-identities": "background", // native identity, named as the contrast with federation
  },
  basis: ["rfc7519", "oidc-discovery"],
  related: [
    "spiffe-workload-identity",
    "client-credentials",
    "wimse-workload-tokens",
    "token-exchange",
  ],
  notes: [
    {
      title: "What the platform and the SDK do for you",
      body: `In most deployments you write none of the eight steps. The platform issues the identity credential and keeps it fresh. A cloud SDK or credential library, pointed at that credential, makes the exchange, caches what comes back, renews it, and attaches it to requests or signs them. The receiving system does the validation. What is left to you is configuration: which identity the workload runs as, the trust rule on the receiving side, and the access behind it.

**Platform-provided workload identity** means the infrastructure identifies the workload and supplies credentials, so the application owner does not provision a long-lived secret for that integration. A function, virtual machine or container calling its own cloud’s APIs uses that native identity, without federation. **Federation** starts when another trust domain accepts the identity. A Kubernetes cluster and its cloud provider, or a CI service and the account it deploys to, can be separate trust domains without crossing cloud vendors.`,
    },
    {
      id: "request-formats",
      title: "One exchange, several request formats",
      body: `No single specification defines this pattern. What the implementations share is a signed identity credential, usually a JWT, and a published way to find the issuer’s keys, usually OpenID Connect discovery. The exchange itself is where they differ.

**Google Cloud** follows OAuth token exchange (RFC 8693). The workload posts its credential to the Security Token Service as the subject token and receives a federated access token. The service also accepts proofs that are not JWTs, including a signed AWS request and an X.509 client certificate presented over mutual TLS.

**Microsoft Entra** uses the client credentials grant. The outside token goes in \`client_assertion\`, with \`client_assertion_type\` set to the JWT bearer type from RFC 7523, in place of an assertion the application would otherwise sign with its own certificate. Its issuer, subject and audience must match the federated identity credential exactly.

**AWS, inbound.** \`AssumeRoleWithWebIdentity\` takes the token and the role to assume. The call is not signed with AWS credentials. It returns temporary security credentials for signing requests, not an OAuth access token.

**AWS, outbound.** A workload that already has AWS credentials can call \`GetWebIdentityToken\` for a short-lived JWT to present to a service outside AWS. The feature has to be enabled for the account first, and the caller needs permission for the operation. The caller names the audience and the signing algorithm. The token lasts from one minute to an hour, five minutes by default. The issuer URL is specific to the account, and the operation is not available on the STS global endpoint. AWS describes the token as proof of identity, to be exchanged at the outside service for that service’s own credentials.

Audience values, credential lifetimes, the claims a rule can match on and the way keys are discovered are each provider’s own. Do not carry one provider’s settings over to another.`,
    },
    {
      id: "stopping-access",
      title: "Stopping access",
      body: `Cutting off a workload involves three controls. They are not guaranteed to take effect together.

**The platform stops issuing or renewing the identity credential.** Use the platform’s control for ending issuance or renewal. Deleting the workload or disabling its identity can do that; verify the chosen platform’s behavior. This does not by itself recall a credential already handed out. An unexpired copy is still a validly signed statement.

**The receiving system stops accepting that credential in new exchanges.** A receiver that validates a JWT offline, against cached keys, sees a valid signature and an unexpired token. It cannot see that the pod, service account or job behind the token is gone. So a copied token can go on obtaining new downstream credentials after its workload is deleted, for as long as it is unexpired and the trust rule is in place. Removing or narrowing the trust rule is what stops further exchanges, once that change has taken effect.

**Downstream credentials already issued are invalidated.** These have their own validity and their own revocation rules, set by the receiver. Removing the trust rule does not recall them. Some receivers can cut them short: AWS can revoke the sessions a role issued before a given time, by attaching a policy that denies them. Some cannot: Azure says a managed identity’s token cannot be forced to refresh before it expires, and that changes to the identity’s group or role membership can take several hours to apply.

Short lifetimes on both credentials keep the gaps small. Deleting a pod, a service account or a job is not an instant cut-off, and neither is deleting a trust rule.`,
    },
  ],
  illustrated: {
    steps: `The diagram shows a common JWT-based federation flow using OIDC discovery. Other implementations use different proofs and verification mechanisms, such as an X.509 certificate presented over mutual TLS, a signed request, or keys an administrator uploads. A service can also validate the identity credential itself, with no exchange, as the first of the [real implementations](#implementations) does.`,
    references: `These are required by the flow the diagram draws: a JWT identity credential, and OIDC discovery to find the keys that verify it. Neither is required of every implementation of workload identity federation, and each can be replaced separately. A certificate or a signed request can take the place of the JWT. Keys an administrator uploads can take the place of OIDC discovery, and a JWT verified against uploaded keys still depends on RFC 7519. The maturity rating describes the diagram’s flow in the same way.`,
  },
  comparison: {
    title: "The same pattern by environment",
    intro: `Each environment is a place a workload runs. Where it runs and how it gets its initial identity describe platform-provided identity. The receiving system shows where federation comes in, and where it does not.`,
    rowHeading: "Environment",
    fields: [
      { heading: "Where the workload runs", label: "Runs on" },
      {
        heading: "How it gets its initial identity",
        label: "Initial identity",
      },
      {
        heading: "Which system trusts that identity",
        label: "Receiving system",
      },
      {
        heading: "What it receives, and how it is used",
        label: "Resulting credential",
      },
    ],
    rows: [
      {
        name: "AWS",
        values: [
          "A Lambda function, an EC2 instance, an ECS task.",
          "An IAM role attached to the function, instance or task. AWS supplies the role’s temporary credentials to the code.",
          "AWS itself: this is native identity, with nothing to federate. A system outside AWS can trust the workload through outbound federation, where the account has enabled it.",
          "Temporary AWS credentials that sign API requests. For outbound federation, a short-lived JWT from `GetWebIdentityToken`, exchanged at the outside system.",
        ],
      },
      {
        name: "Google Cloud",
        values: [
          "A Cloud Run service or function, a Compute Engine VM.",
          "A service account attached to the resource. Client libraries get its credentials from the metadata server.",
          "Google Cloud itself, natively. An outside system can be configured to trust a Google-signed ID token for the service account.",
          "OAuth access tokens for Google APIs, sent as bearer tokens. For an outside system, an ID token with the audience the workload asks for.",
        ],
      },
      {
        name: "Azure",
        values: [
          "A function app, a virtual machine, a container app.",
          "A managed identity assigned to the resource. Code asks a local endpoint on the platform for tokens.",
          "Microsoft Entra itself, natively. An app registration can also be configured to trust a managed identity, which is federation without leaving Azure.",
          "Microsoft Entra access tokens for the resource the workload names, sent as bearer tokens.",
        ],
      },
      {
        name: "CI/CD",
        values: [
          "A GitHub Actions job. GitLab CI has an equivalent.",
          "The CI system’s OIDC provider issues the job a JWT that describes it: repository, branch or environment, workflow. The job has to be permitted to request it.",
          "A cloud or service configured in advance with the CI issuer and a rule on the token’s claims: an IAM role’s trust policy, a workload identity pool provider, a federated identity credential.",
          "Whatever that receiver issues: temporary AWS credentials, a Google federated access token, a Microsoft Entra access token.",
        ],
      },
      {
        name: "Kubernetes and on-premises",
        values: [
          "A pod in any cluster, or a service on hosts you run.",
          "In a cluster, a service account token signed by the cluster and projected into the pod. Elsewhere, an identity provider you operate, such as a SPIFFE implementation or an existing OIDC or SAML provider.",
          "Any receiver that can be given the issuer and reach its keys. Managed Kubernetes services offer this for their own cloud’s identity system.",
          "The receiver’s short-lived credential, as in the other environments. The [worked example](#example) is this one.",
        ],
      },
    ],
    after: `These are recognizable examples, not a catalog. Not every service offers every path. Audience values, lifetimes and the claims a rule can match on differ by provider, so check the documentation for the combination you need. Managed agent platforms apply the same model to the agents they host: see [agent platforms](/deployments/agent-platforms/) and the other [deployment guides](/deployments/).`,
  },
  example: {
    title: "Worked example: a Kubernetes pod",
    intro: `One concrete case of the steps above: an agent in a pod federates from its cluster to a token service outside it. The details are specific to Kubernetes. Other environments may deliver credentials differently, and their tokens carry different claims.`,
    parts: [
      {
        title: "The pod asks for a projected token",
        body: `The pod spec asks for a service account token with a chosen audience and lifetime. The kubelet obtains it through the TokenRequest API, writes it to a file in the pod, and replaces it before it expires. Set the audience. Left unset, the token is issued for the cluster’s own API server, which is the wrong recipient for an outside service.`,
        code: {
          lang: "yaml",
          text: `volumes:
  - name: agent-identity
    projected:
      sources:
        - serviceAccountToken:
            audience: https://sts.example
            expirationSeconds: 3600
            path: token`,
        },
      },
      {
        title: "The token names the service account and the pod",
        body: `The token is a JWT signed by the cluster. The subject names the namespace and service account. The token is bound to the pod named in the \`kubernetes.io\` claim: the API server stops accepting it once that pod is deleted. The node entry is additional metadata. It does not bind the token to the node, and Kubernetes does not check that the node exists when it authenticates the token.

A receiver outside the cluster that validates the signature offline checks none of this. A token whose pod is gone still verifies until it expires. Kubernetes says a client that needs the binding checked must present the token to the API server through the TokenReview API.

Read the file fresh each time, because it rotates on disk.`,
        code: {
          lang: "jsonc",
          text: `// Illustrative claims from a projected
// service account token.
{
  "iss": "https://oidc.cluster.example",
  "sub": "system:serviceaccount:agents:research-agent",
  "aud": ["https://sts.example"],
  "exp": 1794272400,
  "jti": "5d2f0c0e-6b1a-4c55-9a0e-3f1c6b6f8a21",
  "kubernetes.io": {
    "namespace": "agents",
    "serviceaccount": { "name": "research-agent", "uid": "…" },
    "pod": { "name": "research-agent-7c9f-x2x8k", "uid": "…" },
    "node": { "name": "node-3", "uid": "…" }
  }
}`,
        },
      },
      {
        title: "The cluster publishes its keys",
        body: `The cluster serves a discovery document at \`/.well-known/openid-configuration\` under its issuer URL, and its signing keys at \`/openid/v1/jwks\`. Kubernetes describes these as compatible with OpenID Connect without being strictly compliant. The receiving token service has to be able to fetch both. For a private cluster that means publishing them somewhere reachable, or uploading the keys where the receiver supports it.`,
      },
      {
        title: "The agent exchanges the token",
        body: `The receiver in this example takes OAuth token exchange (RFC 8693), the form Google Cloud’s Security Token Service follows. The request is illustrative: the host, audience and scope are placeholders. Microsoft Entra can take the same **kind** of token as a \`client_assertion\`, and AWS as the \`WebIdentityToken\` parameter of \`AssumeRoleWithWebIdentity\`. The actual token’s audience and registered issuer/subject trust must match that receiver; a token minted for one recipient is not assumed valid at another.`,
        code: {
          lang: "http",
          text: `POST /token HTTP/1.1
Host: sts.example
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&subject_token=<ServiceAccount token>
&subject_token_type=urn:ietf:params:oauth:token-type:jwt
&audience=https://models.example/api
&scope=inference`,
        },
      },
      {
        title: "The trust rule names the service account",
        body: `The receiver pins the cluster’s issuer, the intended audience, and one namespace and service account. A broader rule can admit other service accounts able to obtain an accepted token. The trusted account also needs a permission grant; matching its identity is not itself the application’s access policy.`,
        code: {
          lang: "yaml",
          text: `# Conceptual trust and permission binding.
# Each receiver has its own syntax.
trust:
  issuer:   https://oidc.cluster.example
  audience: https://sts.example
  subject:  system:serviceaccount:agents:research-agent
permission_grant: role/model-inference`,
        },
      },
      {
        title: "On managed Kubernetes",
        body: `EKS, GKE and AKS each tie a Kubernetes service account to an identity in their own cloud, and usually do the exchange for the pod, in an SDK, a node agent or a metadata endpoint. The mechanisms differ: see [reaching the cloud](/deployments/kubernetes/#reaching-the-cloud) in the Kubernetes guide.`,
      },
    ],
  },
  sections: [
    {
      id: "permissions",
      title: "From identity to permissions",
      intro: `A validated credential identifies a principal. Permissions and application rules decide what it may do. Keep issuer trust, identity and enforcement separate; then decide which trusted layer owns the user-facing policy, as the report example below shows.`,
      parts: [
        {
          title: "Trust the issuer",
          body: `The receiver accepts credentials only from issuers it was configured to trust, and checks each one’s signature, audience and expiry. That establishes that the statement is authentic and meant for this receiver. It grants nothing yet.`,
        },
        {
          title: "Identify the workload, or the user",
          body: `The validated claims name the caller: a subject such as a service account, a SPIFFE ID, or a repository and environment. A token issued for a user names that user as well, or instead. Only claims from a validated credential count. A name sent in a request body or a header is only the caller’s word.`,
        },
        {
          title: "Grant and enforce permissions",
          body: `Someone decides what that identity may do, and something enforces the decision on every request: roles and assignments in the receiving system, a gateway’s policy, an authorization service, or the API’s own code. Business rules live here. In the illustration, an invoice agent may read invoices and create reconciliation drafts. It cannot approve payments, because nothing grants it that.`,
          code: {
            lang: "yaml",
            text: `# Illustration only. Not a vendor feature
# and not a tested deployment.
identity: workload:invoice-agent
may:
  - invoices:read
  - reconciliation-drafts:create
# Not granted: payments:approve`,
          },
        },
        {
          title: "The service may read report B; Alice may not",
          body: `Alice may read report A. A reporting service’s workload credential permits it to read both A and B. If Alice asks for B, trusted application or API code must reject the request before B reaches Alice or her agent. The service credential alone cannot decide Alice’s entitlement. An object ID supplied by a caller is something to check, not evidence of permission.

Use authenticated user context and trusted tenant/ownership data to check the requested object and action on every relevant path. Even an allowed object may contain fields the requester must not see. OWASP calls the object failure BOLA (API1) and treats unauthorized property exposure separately (API3). A final chat-output filter is too late once the agent has received forbidden data.

Here the downstream API may authorize only the service. That keeps its integration simpler, while the application owns user policy, context integrity and preventing bypass of its checks. Shared policy code and object-scoped queries can reduce duplication; they still need cross-user and cross-tenant tests and do not remove the service credential’s broad access. This is application authorization outside the credential exchange, illustrated here rather than tested.`,
          sources: [
            {
              label: "OWASP API1: Broken Object Level Authorization",
              href: "https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/",
            },
            {
              label: "OWASP API3: Broken Object Property Level Authorization",
              href: "https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/",
            },
            {
              label: "OWASP Authorization Cheat Sheet",
              href: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
            },
          ],
        },
      ],
      after: `Workload identity can underpin custom roles and permissions like these. It does not define them, and it does not convey a human user’s authority. The API, gateway or authorization service has to enforce the resulting policy.`,
    },
    {
      id: "implementations",
      title: "Real implementations",
      intro: `Three paths the providers document, for agents and services you operate. They are documented implementation paths, read in November 2026. They are not evidence of how widely any of them is used in production, and none was tested here.`,
      parts: [
        {
          title: "An agent acting as itself against a custom service",
          tags: [{ text: "Google Cloud" }, { text: "Preview", tone: "amber" }],
          body: `Google Cloud’s Agent Identity issues an agent an OIDC ID token for the audience the agent asks for. The token is a JWT whose subject is the agent’s SPIFFE ID. A custom API, a gateway or an on-premises service validates it against Google’s public discovery and key endpoints, checking issuer, signature, audience and expiry. The service then authorizes the verified identity. Google’s example compares the subject against an allowlist of agent SPIFFE IDs.

The service accepts the identity token directly, as a bearer token on the request. Nothing is exchanged. Google documents the exchange path separately, for receivers with built-in federation such as Microsoft Entra, so not every integration needs a second token. By default the token is also bound to the agent’s certificate. A receiver can enforce that binding over mutual TLS. One that ignores it is accepting a bearer token.

Google marks this feature Preview, under pre-GA terms and with limited support. That is the product’s release stage. It is separate from the maturity of the standards underneath, JWT and OpenID Connect Discovery, which are stable.`,
          sources: [
            {
              label:
                "Authenticate to external services using an agent’s own identity (Google Cloud)",
              href: "https://docs.cloud.google.com/iam/docs/auth-agent-own-identity-external",
            },
          ],
        },
        {
          title: "A federated workload with application-defined permissions",
          tags: [{ text: "Microsoft Entra" }],
          body: `Two Microsoft documents together establish this path. Neither is a walkthrough for agents.

The first covers authentication. With workload identity federation, a workload outside Azure presents a token from its own identity provider and receives a Microsoft Entra access token, with no client secret or certificate of its own.

The second covers authorization. The designer of a custom API defines application roles on the API’s registration, and an administrator assigns them to the workload. The receiving API validates the access token and checks its \`roles\` claim for the operation being called. Microsoft says an API does not use the scope claim for workloads, and that the API is responsible for enforcing the workload’s access. By default an application role covers every instance of a resource, so anything finer is the API’s own policy.`,
          sources: [
            {
              label:
                "Authorize applications, resources, and workloads with Microsoft Entra ID",
              href: "https://learn.microsoft.com/en-us/entra/architecture/authorize-applications-resources-workloads",
            },
            {
              label:
                "Workload identity federation (Microsoft Entra Workload ID)",
              href: "https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation",
            },
          ],
        },
        {
          title: "An agent carrying a user’s authorization downstream",
          tags: [
            { text: "AWS AgentCore" },
            { text: "Related: user delegation" },
          ],
          body: `This is a related case, here for contrast. The agent is not proving only its own workload identity. A signed-in user’s authorization travels with each request, and the downstream system applies that user’s access. AWS published it in August 2026 as a reference implementation on Amazon Bedrock AgentCore. Its three data sources are protected in three different ways.

**DynamoDB.** The agent passes the user’s Cognito ID token to \`AssumeRoleWithWebIdentity\`. Session tags taken from the signed token, and an IAM policy that keys on them, limit the temporary credentials to the user’s department. IAM refuses a request outside it.

**Salesforce.** AgentCore Identity performs an on-behalf-of token exchange (RFC 8693) and obtains a user-scoped token. Salesforce’s own sharing rules decide what that user sees.

**Knowledge Bases.** The agent adds a metadata filter to its query. AWS calls this application-layer enforcement: it holds only while the agent’s code applies the filter, unlike the DynamoDB restriction, which IAM enforces. For stricter isolation AWS suggests a knowledge base for each department, with IAM policies on each.

Access delegated by a user is the subject of [token exchange](/flows/token-exchange/).`,
          sources: [
            {
              label:
                "Propagate user authorization context in AI agents with Amazon Bedrock AgentCore (AWS Security Blog)",
              href: "https://aws.amazon.com/blogs/security/propagate-user-authorization-context-in-ai-agents-with-amazon-bedrock-agentcore/",
            },
          ],
        },
      ],
      after: `All three keep the same jobs apart: an issuer the receiver trusts, an identity read from validated claims, and permissions the receiving system grants and enforces. For the products themselves, see [agent platforms](/deployments/agent-platforms/).`,
    },
  ],
};
