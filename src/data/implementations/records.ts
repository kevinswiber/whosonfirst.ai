import type { ImplementationProfile } from "./model.ts";

// Primary-source review and exclusions: docs/adoption/evidence-review.md.
export const profiles: ImplementationProfile[] = [
  {
    slug: "authorization-code-pkce",
    reviewedOn: "2026-11-12",
    scope:
      "Authorization code with PKCE, including S256 for the illustrated client. Client libraries and authorization servers supply different parts of this flow.",
    searchNote:
      "Selected authorization-server documentation, one client library and a release announcement were reviewed. Generic OAuth support alone was excluded. No qualifying operator deployment account was selected from these sources.",
    implementations: [
      {
        kind: "implementation",
        organization: "Amazon Web Services",
        product: "Amazon Cognito user pools",
        role: "Authorization server",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "pkce-cognito",
        parties: ["as"],
        summary:
          "Documents authorization code with S256 for a public app client, followed by code redemption with the verifier.",
        limits:
          "This guide does not establish support for every callback, resource indicator or token audience in the illustrated flow.",
        sources: [
          {
            title: "Using PKCE in authorization code grants",
            url: "https://docs.aws.amazon.com/cognito/latest/developerguide/using-pkce-in-authorization-code.html",
            publisher: "Amazon Web Services",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
      {
        kind: "implementation",
        organization: "oauth4webapi project",
        product: "oauth4webapi",
        role: "Client library",
        release: {
          stage: "supported",
          label: "v3.x supported",
          detail:
            "The project lists v3.x under Supported Versions; it does not date the introduction of PKCE.",
        },
        id: "pkce-oauth4webapi",
        parties: ["agent"],
        summary:
          "Provides JavaScript client routines for the authorization code flow with PKCE.",
        limits:
          "A client building block. This review did not test a native-app integration or a pairing with a particular authorization server.",
        sources: [
          {
            title: "oauth4webapi: features and supported versions",
            url: "https://github.com/panva/oauth4webapi/blob/main/README.md#features",
            publisher: "oauth4webapi project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
      {
        kind: "implementation",
        organization: "GitHub",
        product: "GitHub OAuth Apps and GitHub Apps",
        role: "Authorization server",
        release: {
          stage: "supported",
          label: "Released 14 July 2025",
          detail:
            "GitHub labels the announcement a release; it describes an enforcement exception for existing apps.",
        },
        id: "pkce-github",
        parties: ["as"],
        qualification: "Secretless native-client support not established.",
        summary:
          "Announced S256 PKCE for user authorization in both app types. A sent challenge requires the verifier at code exchange, with the rollout exception described in the announcement.",
        limits:
          "PKCE was optional at launch. This is not evidence for a secretless native client or a count of apps using PKCE.",
        sources: [
          {
            title: "PKCE support for OAuth and GitHub App authentication",
            url: "https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/",
            publisher: "GitHub",
            publishedOn: "2025-07-14",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
    ],
    deployments: [],
    observations: [],
    events: [
      {
        id: "authorization-code-pkce-review",
        kind: "evidence-added",
        date: "2026-11-12",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: ["pkce-cognito", "pkce-oauth4webapi", "pkce-github"],
      },
      {
        id: "github-pkce-release",
        kind: "release",
        date: "2025-07-14",
        summary:
          "GitHub announced S256 PKCE support for OAuth Apps and GitHub Apps.",
        evidenceIds: ["pkce-github"],
      },
    ],
  },
  {
    slug: "dpop",
    reviewedOn: "2026-11-12",
    scope:
      "OAuth DPoP at the application layer. Proof generation, token binding and resource-server enforcement are separate roles; mTLS and JWT client authentication are outside this record.",
    searchNote:
      "Selected issuer documentation, a client library, a resource-server library, dated releases and the HelseID operator roadmap were reviewed. Certification and protocol requirements alone were excluded as deployment evidence. This is a set of reviewed examples, not a complete implementation inventory.",
    implementations: [
      {
        kind: "implementation",
        organization: "Keycloak",
        product: "Keycloak",
        role: "Authorization server",
        release: {
          stage: "supported",
          label: "Supported since 26.4.0",
          detail:
            "The 30 September 2025 release announcement explicitly promotes DPoP from preview to supported.",
        },
        id: "dpop-keycloak",
        parties: ["as"],
        summary:
          "Promoted DPoP from preview to supported in 26.4.0, including options for public-client refresh-token binding and DPoP at Keycloak’s own protected endpoints.",
        limits:
          "A downstream API still needs its own proof and token-binding validation.",
        sources: [
          {
            title: "Keycloak 26.4.0 released",
            url: "https://www.keycloak.org/2025/09/keycloak-2640-released",
            publisher: "Keycloak",
            publishedOn: "2025-09-30",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
      {
        kind: "implementation",
        organization: "oauth4webapi project",
        product: "oauth4webapi",
        role: "Client library",
        release: {
          stage: "supported",
          label: "v3.x supported",
          detail:
            "The project lists v3.x as supported. The API documentation describes the DPoP handle.",
        },
        id: "dpop-oauth4webapi",
        parties: ["agent"],
        summary:
          "Creates DPoP proofs from a key pair and handles server-issued nonces.",
        limits:
          "Private-key custody, application policy and interoperability with a particular issuer or API were not tested.",
        sources: [
          {
            title: "oauth4webapi API: DPoP",
            url: "https://github.com/panva/oauth4webapi/blob/main/docs/README.md#dpop",
            publisher: "oauth4webapi project",
          },
          {
            title: "oauth4webapi: features and supported versions",
            url: "https://github.com/panva/oauth4webapi/blob/main/README.md#features",
            publisher: "oauth4webapi project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
      {
        kind: "implementation",
        organization: "Spring",
        product: "Spring Security",
        role: "Resource-server verifier",
        release: {
          stage: "supported",
          label: "In the stable reference",
          detail:
            "The reference identifies 7.1.2 as stable; the API marks the provider as available since 6.5. The first release day was not established.",
        },
        id: "dpop-spring",
        parties: ["api"],
        summary:
          "Provides DPoPAuthenticationProvider to authenticate DPoP-bound access tokens on protected servlet requests.",
        limits:
          "The claim covers the servlet provider. Specific issuer pairings and deployed enforcement were not tested.",
        sources: [
          {
            title: "DPoPAuthenticationProvider",
            url: "https://docs.spring.io/spring-security/reference/api/java/org/springframework/security/oauth2/server/resource/authentication/DPoPAuthenticationProvider.html",
            publisher: "Spring Security",
          },
          {
            title: "OAuth 2.0 DPoP-bound Access Tokens",
            url: "https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/dpop-tokens.html",
            publisher: "Spring Security",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
      {
        kind: "implementation",
        organization: "Auth0",
        product: "Auth0",
        role: "Authorization server",
        release: {
          stage: "supported",
          label: "Generally available on Enterprise plans",
          detail:
            "The 11 March 2026 changelog identifies the Enterprise plan and the token-issuer feature.",
        },
        id: "dpop-auth0",
        parties: ["as"],
        qualification: "Enterprise plans.",
        summary:
          "Auth0 issues RFC 9449 tokens bound to a client-held key and can require DPoP for public clients or all clients.",
        limits:
          "This entry covers Auth0-issued tokens. The API still has to check the proof and key binding. The upstream Enterprise Connections feature has its own release.",
        sources: [
          {
            title:
              "Auth0 Changelog · DPoP generally available on Enterprise plans",
            url: "https://auth0.com/changelog",
            publisher: "Auth0",
            publishedOn: "2026-03-11",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary product or project documentation establishes the named role and mechanism. Release wording follows the source.",
        },
      },
      {
        kind: "implementation",
        organization: "Curity",
        product: "Curity Identity Server",
        role: "Authorization server",
        release: {
          stage: "supported",
          label: "Released in 11.4",
          detail:
            "Curity announced broader OAuth token binding in Identity Server 11.4 on 11 August 2026.",
        },
        id: "dpop-curity",
        parties: ["as"],
        summary:
          "Curity documents RFC 9449 binding for supported grants, a server nonce at the token endpoint and optional authorization-code binding with dpop_jkt.",
        limits:
          "Which tokens are bound depends on the grant, client type and policy. Curity protects its own documented resource endpoints. Downstream APIs need their own proof validation.",
        sources: [
          {
            title: "Curity Identity Server 11.4 release announcement",
            url: "https://curity.io/blog/curity-identity-server-11-4/",
            publisher: "Curity",
            publishedOn: "2026-08-11",
          },
          {
            title: "DPoP (Demonstrating Proof of Possession)",
            url: "https://curity.io/docs/identity-server/profiles/token-profile/clients/client-config/dpop/",
            publisher: "Curity",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary product or project documentation establishes the named role and mechanism. Release wording follows the source.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        organization: "Norsk helsenett",
        setting: "HelseID authorization service",
        attribution: "operator-report",
        id: "dpop-helseid",
        summary:
          "The operator reports that HelseID uses DPoP in production. Its completed-changes list dates the token-call proof requirement to 1 June 2026.",
        limits:
          "One authorization-service operator. First use, traffic volume and downstream API adoption are unknown. Its roadmap gives separate future dates for downstream API requirements.",
        sources: [
          {
            title: "HelseID: planned and completed changes",
            url: "https://utviklerportal.nhn.no/informasjonstjenester/helseid/planlagde-endringar/vegkart/docs/planlagde_endringar_enmd",
            publisher: "Norsk helsenett",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The named operator describes its own deployed service or production arrangement. No independent operational test or prevalence estimate.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "dpop-review",
        kind: "evidence-added",
        date: "2026-11-12",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "dpop-keycloak",
          "dpop-oauth4webapi",
          "dpop-spring",
          "dpop-helseid",
          "dpop-auth0",
          "dpop-curity",
        ],
      },
      {
        id: "keycloak-dpop-supported",
        kind: "release",
        date: "2025-09-30",
        summary: "Keycloak 26.4.0 promoted DPoP from preview to supported.",
        evidenceIds: ["dpop-keycloak"],
      },
      {
        id: "dpop-auth0-issuer-ga",
        kind: "release",
        date: "2026-03-11",
        summary:
          "Auth0 announced general availability of DPoP token issuance on Enterprise plans.",
        evidenceIds: ["dpop-auth0"],
      },
      {
        id: "dpop-curity-11-4",
        kind: "release",
        date: "2026-08-11",
        summary:
          "Curity announced expanded DPoP binding across OAuth endpoints in Identity Server 11.4.",
        evidenceIds: ["dpop-curity"],
      },
    ],
  },
  {
    slug: "mcp-authorization",
    reviewedOn: "2026-11-12",
    scope:
      "Remote HTTP MCP authorization, with the site’s 28 July 2026 revision as context. Each entry covers the named role and features; it is not a claim of complete revision conformance.",
    searchNote:
      "Selected client, library and authorization-server guides and a hosted operator’s documentation were reviewed. Stdio credentials, API-key-only access and generic OAuth were excluded. No live OAuth exchange or endpoint survey was run.",
    implementations: [
      {
        kind: "implementation",
        organization: "Anthropic",
        product: "Claude Code",
        role: "MCP client",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "mcp-claude-code",
        parties: ["client"],
        summary:
          "Documents protected-resource metadata discovery and Client ID Metadata Documents, alongside preconfigured client credentials and dynamic-registration compatibility.",
        limits:
          "The cited sections do not name a target MCP revision. This claim does not cover other Claude products or every requirement of the illustrated revision.",
        sources: [
          {
            title: "Connect Claude Code to tools via MCP",
            url: "https://code.claude.com/docs/en/mcp",
            publisher: "Anthropic",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
      {
        kind: "implementation",
        organization: "Cloudflare",
        product: "Workers OAuth Provider",
        role: "Authorization and resource-server library",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "mcp-cloudflare",
        parties: ["as", "mcp"],
        summary:
          "Documents separate OAuth roles for Workers against MCP’s 28 July 2026 revision, including client metadata documents, protected-resource discovery and resource-specific token checks.",
        limits:
          "The integration supplies sign-in, consent and application scope policy. A library example is not an operator deployment or a tested product pairing.",
        sources: [
          {
            title: "OAuth 2.1 Provider Framework for Cloudflare Workers",
            url: "https://github.com/cloudflare/workers-oauth-provider",
            publisher: "Cloudflare",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
      {
        kind: "implementation",
        organization: "Keycloak",
        product: "Keycloak",
        role: "Authorization server",
        release: {
          stage: "experimental",
          label: "Experimental",
          detail:
            "The guide explicitly marks support for this revision and the resource-indicators and cimd features as experimental.",
        },
        id: "mcp-keycloak",
        parties: ["as"],
        summary:
          "Documents its authorization-server role for the 28 July 2026 MCP revision. Resource indicators and client metadata documents require experimental feature flags.",
        limits:
          "The MCP resource server must publish its own metadata and validate tokens. This does not establish end-to-end conformance.",
        sources: [
          {
            title: "Integrating with Model Context Protocol",
            url: "https://www.keycloak.org/securing-apps/mcp-authz-server",
            publisher: "Keycloak",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        organization: "Stripe",
        setting: "Hosted remote MCP service",
        attribution: "operator-report",
        id: "mcp-stripe",
        summary:
          "Stripe documents OAuth consent for access to live-mode Stripe accounts and sandboxes through its hosted MCP server.",
        limits:
          "An operator-documented service. This review did not test the OAuth exchange, verify every specification requirement, or establish a launch date or customer count.",
        sources: [
          {
            title: "Model Context Protocol",
            url: "https://docs.stripe.com/mcp",
            publisher: "Stripe",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The named operator describes its own deployed service or production arrangement. No independent operational test or prevalence estimate.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "mcp-authorization-review",
        kind: "evidence-added",
        date: "2026-11-12",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "mcp-claude-code",
          "mcp-cloudflare",
          "mcp-keycloak",
          "mcp-stripe",
        ],
      },
    ],
  },
  {
    slug: "workload-identity-federation",
    reviewedOn: "2026-11-12",
    scope:
      "A workload presents a runtime-established identity across a trust boundary to obtain short-lived access. Issuer, receiving token service and broker roles are distinct.",
    searchNote:
      "Selected issuer and receiving-service documentation and Pulumi’s account of its own CI were reviewed. Same-domain identity, generic OIDC and the pilot’s project count as organizations were excluded.",
    implementations: [
      {
        kind: "implementation",
        organization: "GitHub",
        product: "GitHub Actions",
        role: "Runtime identity issuer",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "wif-github",
        parties: ["idp"],
        summary:
          "Issues an OIDC JWT for a workflow job that can be presented to a receiving service configured to trust its issuer and claims.",
        limits:
          "Receiver configuration and the credential returned by that receiver vary.",
        sources: [
          {
            title: "OpenID Connect in GitHub Actions",
            url: "https://docs.github.com/en/actions/concepts/security/openid-connect#understanding-the-oidc-token",
            publisher: "GitHub",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
      {
        kind: "implementation",
        organization: "Google Cloud",
        product: "IAM Workload Identity Federation",
        role: "Receiving token service",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "wif-google",
        parties: ["sts"],
        summary:
          "Uses Security Token Service to exchange an external credential for a federated token under RFC 8693. IAM can grant direct access or service-account impersonation.",
        limits:
          "This describes Google Cloud’s exchange and IAM model; it does not describe every deployment of workload federation.",
        sources: [
          {
            title: "Workload Identity Federation",
            url: "https://docs.cloud.google.com/iam/docs/workload-identity-federation",
            publisher: "Google Cloud",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        organization: "Pulumi",
        setting: "Its own continuous-integration pipelines",
        attribution: "operator-report",
        id: "wif-pulumi",
        summary:
          "Pulumi reports exchanging GitHub Actions job tokens for Pulumi Cloud tokens, then opening ESC environments that obtain short-lived cloud credentials through OIDC login providers.",
        limits:
          "The reported rollout covered more than 70 Pulumi provider repositories: one operator, not 70 organizations. The report does not establish exact rollout dates or present-day operation.",
        sources: [
          {
            title: "How We Eliminated Long-Lived CI Secrets Across 70+ Repos",
            url: "https://www.pulumi.com/blog/eliminating-ci-secrets-with-pulumi-esc/",
            publisher: "Pulumi Engineering",
            publishedOn: "2026-03-31",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The named operator describes its own deployed service or production arrangement. No independent operational test or prevalence estimate.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "workload-identity-federation-review",
        kind: "evidence-added",
        date: "2026-11-12",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: ["wif-github", "wif-google", "wif-pulumi"],
      },
      {
        id: "pulumi-ci-report",
        kind: "report-published",
        date: "2026-03-31",
        summary:
          "Pulumi published its account of replacing long-lived CI credentials. The deployment date is not stated.",
        evidenceIds: ["wif-pulumi"],
      },
    ],
  },
  {
    slug: "spiffe-workload-identity",
    reviewedOn: "2026-11-12",
    scope:
      "SPIFFE X.509-SVID issuance, delivery and use for workload mutual TLS. JWT-SVID use alone and generic mTLS do not establish this illustrated path.",
    searchNote:
      "SPIRE’s architecture, Istio’s SPIRE integration and Indeed’s operator account were reviewed. Ecosystem logos, adopter lists and packaging were not treated as separate implementations or verified deployment counts.",
    implementations: [
      {
        kind: "implementation",
        organization: "SPIFFE project",
        product: "SPIRE",
        role: "Identity issuer and workload identity provider",
        release: {
          stage: "supported",
          label: "Project describes it as production-ready",
          detail:
            "This is the project’s stated readiness, not a general-availability certification or an endorsement.",
        },
        id: "spiffe-spire",
        parties: ["server", "node"],
        summary:
          "SPIRE Server and Agent perform attestation, issue X.509-SVIDs and deliver them through the local SPIFFE Workload API.",
        limits:
          "Server and Agent are components of one product. Applications or proxies still need to consume the identity material and establish mutual TLS.",
        sources: [
          {
            title: "SPIRE concepts",
            url: "https://spiffe.io/docs/latest/spire-about/spire-concepts/",
            publisher: "SPIFFE project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
      {
        kind: "implementation",
        organization: "Istio project",
        product: "Istio with SPIRE",
        role: "Mesh identity integration",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "spiffe-istio",
        parties: ["agent", "tool"],
        summary:
          "Documents Envoy proxies obtaining SPIRE-issued identity material through Secret Discovery Service over a Unix socket.",
        limits:
          "Depends on SPIRE issuance and workload registration. This is a documented integration, not an independent identity issuer or a claim about other modes.",
        sources: [
          {
            title: "SPIRE integration",
            url: "https://istio.io/latest/docs/ops/integrations/spire/",
            publisher: "Istio project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        organization: "Indeed",
        setting: "Kubernetes clusters and the Istio service mesh",
        attribution: "operator-report",
        id: "spiffe-indeed",
        summary:
          "Indeed Engineering reported SPIRE in production for over a year and described using SPIRE-issued X.509 identities for mutual TLS in its Istio mesh.",
        limits:
          "A historical account of one operator, published in July 2024. Exact launch dates and present-day use were not established.",
        sources: [
          {
            title:
              "Secure Workload Identity with SPIRE and OIDC: A Guide for Kubernetes and Istio Users",
            url: "https://engineering.indeedblog.com/blog/2024/07/workload-identity-with-spire-oidc-for-k8s-istio/",
            publisher: "Indeed Engineering",
            publishedOn: "2024-07-03",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The named operator describes its own deployed service or production arrangement. No independent operational test or prevalence estimate.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "spiffe-workload-identity-review",
        kind: "evidence-added",
        date: "2026-11-12",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: ["spiffe-spire", "spiffe-istio", "spiffe-indeed"],
      },
      {
        id: "indeed-spire-report",
        kind: "report-published",
        date: "2024-07-03",
        summary:
          "Indeed published its SPIRE and Istio deployment account. This dates the report, not the start of production use.",
        evidenceIds: ["spiffe-indeed"],
      },
    ],
  },
  {
    slug: "device-authorization",
    reviewedOn: "2026-11-12",
    scope:
      "RFC 8628 device authorization for input-constrained clients. The client requests a code and polls while the user approves in a browser. Support for resource indicators and specific phishing mitigations is a separate question.",
    searchNote:
      "Selected issuer and client documentation and two first-party CLI reports. Browser-based code flow and generic device sign-in fall outside this review. No survey or production login was run.",
    implementations: [
      {
        kind: "implementation",
        id: "device-github-issuer",
        parties: ["as"],
        organization: "GitHub",
        product: "GitHub OAuth Apps and GitHub Apps",
        role: "Authorization server",
        summary:
          "Supports the OAuth device authorization grant for both app types, allowing the user to approve on a device with a browser.",
        limits:
          "The announcement covers the grant for the named app types. It does not establish resource indicators or the defenses illustrated on this flow.",
        sources: [
          {
            publisher: "GitHub",
            title: "OAuth 2.0 Device Authorization Flow now GA",
            url: "https://github.blog/changelog/2020-12-04-oauth-2-0-device-authorization-flow-now-ga/",
            publishedOn: "2020-12-04",
          },
        ],
        release: {
          stage: "supported",
          label: "Generally available",
          detail:
            "GitHub used this stage in its 4 December 2020 release announcement.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The publisher documents this role and mechanism. Availability is stated only within the cited release conditions.",
        },
      },
      {
        kind: "implementation",
        id: "device-keycloak-issuer",
        parties: ["as"],
        organization: "Keycloak",
        product: "Keycloak",
        role: "Authorization server",
        summary:
          "Lists RFC 8628 as supported and documents a client setting for enabling the device authorization grant.",
        limits:
          "The feature needs client configuration. The checked sources do not date its introduction.",
        sources: [
          {
            publisher: "Keycloak",
            title: "Specifications implemented",
            url: "https://www.keycloak.org/securing-apps/specifications",
          },
          {
            publisher: "Keycloak",
            title: "Server Administration Guide",
            url: "https://www.keycloak.org/docs/latest/server_admin/",
          },
        ],
        release: {
          stage: "supported",
          label: "Supported",
          detail:
            "The project’s specifications table marks the RFC 8628 grant Supported.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The publisher documents this role and mechanism. Availability is stated only within the cited release conditions.",
        },
      },
      {
        kind: "implementation",
        id: "device-aws-cli",
        parties: ["agent"],
        organization: "Amazon Web Services",
        product: "AWS CLI",
        role: "CLI client",
        summary:
          "For IAM Identity Center sign-in, AWS CLI 2.22.0 and later use device authorization with the use-device-code option.",
        limits:
          "The guide scopes this behavior to IAM Identity Center. The CLI defaults to PKCE from 2.22.0. The date of device authorization’s introduction is unstated.",
        sources: [
          {
            publisher: "Amazon Web Services",
            title:
              "Configuring IAM Identity Center authentication with the AWS CLI",
            url: "https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a release stage for this capability.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The publisher documents this role and mechanism. Availability is stated only within the cited release conditions.",
        },
      },
      {
        kind: "implementation",
        id: "device-github-go",
        parties: ["agent"],
        organization: "GitHub",
        product: "cli/oauth",
        role: "Go client library",
        summary:
          "Provides device authorization for Go client applications, including verification in a separate browser.",
        limits:
          "The project says it tested the library with GitHub. The source does not establish interoperability with other issuers.",
        sources: [
          {
            publisher: "GitHub",
            title: "cli/oauth README",
            url: "https://github.com/cli/oauth#readme",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a release stage for this capability.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The publisher documents this role and mechanism. Availability is stated only within the cited release conditions.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        id: "device-github-cli-report",
        organization: "GitHub",
        setting: "GitHub CLI sign-in to GitHub",
        summary:
          "GitHub reported that its CLI uses device authorization on the login command in its 2020 release announcement.",
        limits:
          "The account dates GitHub’s report. It gives no count of sign-ins, adoption by other apps, or date of first use.",
        sources: [
          {
            publisher: "GitHub",
            title: "OAuth 2.0 Device Authorization Flow now GA",
            url: "https://github.blog/changelog/2020-12-04-oauth-2-0-device-authorization-flow-now-ga/",
            publishedOn: "2020-12-04",
          },
        ],
        attribution: "operator-report",
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The named operator documents the mechanism for its own service. Usage and interoperability were not independently tested.",
        },
      },
      {
        kind: "deployment",
        id: "device-vercel-cli-report",
        organization: "Vercel",
        setting: "Vercel CLI sign-in to Vercel accounts",
        summary:
          "Vercel reported moving the vercel login command to the OAuth device authorization grant, with approval in a browser.",
        limits:
          "The changelog links RFC 8628 and describes Vercel’s own sign-in. It provides no adoption figures or evidence of support for third-party clients.",
        sources: [
          {
            publisher: "Vercel",
            title: "New Vercel CLI login flow",
            url: "https://vercel.com/changelog/new-vercel-cli-login-flow",
            publishedOn: "2025-09-12",
          },
        ],
        attribution: "operator-report",
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The named operator documents the mechanism for its own service. Usage and interoperability were not independently tested.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "device-authorization-evidence-added",
        kind: "evidence-added",
        date: "2026-11-12",
        summary:
          "Added the reviewed implementation and deployment sources to the implementation record.",
        evidenceIds: [
          "device-github-issuer",
          "device-keycloak-issuer",
          "device-aws-cli",
          "device-github-go",
          "device-github-cli-report",
          "device-vercel-cli-report",
        ],
      },
      {
        id: "device-github-ga",
        kind: "release",
        date: "2020-12-04",
        summary:
          "GitHub announced general availability of device authorization for GitHub OAuth Apps and GitHub Apps.",
        evidenceIds: ["device-github-issuer"],
      },
      {
        id: "device-vercel-report-published",
        kind: "report-published",
        date: "2025-09-12",
        summary:
          "Vercel announced that its CLI sign-in now uses device authorization.",
        evidenceIds: ["device-vercel-cli-report"],
      },
    ],
  },
  {
    slug: "client-credentials",
    reviewedOn: "2026-11-12",
    scope:
      "OAuth client credentials for access on an application’s own authority. Separate the grant from client authentication. The illustrated flow uses a signed JWT assertion and a resource indicator.",
    searchNote:
      "Selected sources describe client and authorization-server roles, including signed assertions, plus one operator’s live API using the secret-based grant. API keys, federated exchanges and user-delegated grants fall outside this record.",
    implementations: [
      {
        kind: "implementation",
        id: "client-creds-entra",
        parties: ["as"],
        qualification:
          "Uses /.default scope; the illustrated resource parameter is unverified.",
        organization: "Microsoft",
        product: "Microsoft identity platform",
        role: "Authorization server",
        summary:
          "Accepts client_credentials with a certificate-signed JWT client assertion for an application’s configured permissions.",
        limits:
          "The documented request uses a resource identifier suffixed with /.default in scope. The guide does not establish support for the illustrated resource parameter or its client JWT type header.",
        sources: [
          {
            publisher: "Microsoft",
            title:
              "OAuth 2.0 client credentials flow on the Microsoft identity platform",
            url: "https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow#second-case-access-token-request-with-a-certificate",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a release stage for this capability.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The publisher documents this role and mechanism. Availability is stated only within the cited release conditions.",
        },
      },
      {
        kind: "implementation",
        id: "client-creds-okta",
        parties: ["as"],
        organization: "Okta",
        product: "Okta OAuth service apps",
        role: "Authorization server",
        summary:
          "Requires private_key_jwt for client_credentials requests from service apps accessing Okta APIs.",
        limits:
          "This guide covers access to Okta APIs under configured scopes and admin roles. It does not establish the same client authentication requirement for every custom authorization server.",
        sources: [
          {
            publisher: "Okta",
            title: "Implement OAuth for Okta with a service app",
            url: "https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/main/",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a release stage for this capability.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The publisher documents this role and mechanism. Availability is stated only within the cited release conditions.",
        },
      },
      {
        kind: "implementation",
        id: "client-creds-spring",
        parties: ["as"],
        organization: "Spring",
        product: "Spring Authorization Server",
        role: "Authorization-server framework",
        summary:
          "Lists the Client Credentials grant and private_key_jwt client authentication among the supported features.",
        limits:
          "The application configures its own client registration and resource policy. The feature list does not establish RFC 8707 resource indicators or date the first release of this combination.",
        sources: [
          {
            publisher: "Spring Authorization Server",
            title: "Overview",
            url: "https://docs.spring.io/spring-authorization-server/reference/overview.html#feature-list",
          },
        ],
        release: {
          stage: "supported",
          label: "In the stable reference",
          detail:
            "The checked Spring Authorization Server reference identifies version 1.5.8 as Stable.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The publisher documents this role and mechanism. Availability is stated only within the cited release conditions.",
        },
      },
      {
        kind: "implementation",
        id: "client-creds-oauth4webapi",
        parties: ["agent"],
        organization: "oauth4webapi project",
        product: "oauth4webapi",
        role: "Client library",
        summary:
          "Provides JavaScript routines for requesting client credentials tokens and for digitally signed private_key_jwt client authentication.",
        limits:
          "The library supplies client-side operations. The review did not test an issuer pairing, key custody, or support for all fields shown in this flow.",
        sources: [
          {
            publisher: "oauth4webapi project",
            title: "oauth4webapi API reference",
            url: "https://github.com/panva/oauth4webapi/blob/main/docs/README.md#client-credentials-grant",
          },
          {
            publisher: "oauth4webapi project",
            title: "oauth4webapi features and supported versions",
            url: "https://github.com/panva/oauth4webapi/blob/main/README.md#features",
          },
        ],
        release: {
          stage: "supported",
          label: "v3.x supported",
          detail:
            "The project lists v3.x under Supported Versions. It does not give a feature introduction date.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The publisher documents this role and mechanism. Availability is stated only within the cited release conditions.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        id: "client-creds-ebay",
        qualification: "Client-secret authentication.",
        organization: "eBay",
        setting: "Production Browse API and OAuth token endpoint",
        summary:
          "eBay documents a production OAuth token endpoint for the client credentials grant. Its Browse API requires the resulting Application access token.",
        limits:
          "The documented token request uses a client ID and secret. This account establishes one live service’s grant, with no signed-assertion claim, traffic measure or third-party adoption count.",
        sources: [
          {
            publisher: "eBay",
            title: "Authorization",
            url: "https://developer.ebay.com/develop/guides/sell/authorization",
          },
          {
            publisher: "eBay",
            title: "Browse API",
            url: "https://developer.ebay.com/develop/api/buy/browse_api",
          },
        ],
        attribution: "operator-report",
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The named operator documents the mechanism for its own service. Usage and interoperability were not independently tested.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "client-credentials-evidence-added",
        kind: "evidence-added",
        date: "2026-11-12",
        summary:
          "Added the reviewed implementation and deployment sources to the implementation record.",
        evidenceIds: [
          "client-creds-entra",
          "client-creds-okta",
          "client-creds-spring",
          "client-creds-oauth4webapi",
          "client-creds-ebay",
        ],
      },
    ],
  },
  {
    slug: "token-exchange",
    reviewedOn: "2026-11-12",
    scope:
      "RFC 8693 exchanges of an incoming subject token for downstream access. Keep issuer and client roles separate, and distinguish the base grant, actor delegation, and explicitly documented service-specific variants.",
    searchNote:
      "Selected issuer and client sources, release announcements, and an operator’s documented service variant. A documented example or federation-only exchange does not establish a production delegation chain with an actor.",
    implementations: [
      {
        kind: "implementation",
        id: "exchange-keycloak-v2",
        parties: ["as"],
        qualification: "Actor delegation is Preview; no resource parameter.",
        organization: "Keycloak",
        product: "Keycloak Standard Token Exchange V2",
        role: "Authorization server",
        summary:
          "Exchanges an access token issued for one client for a token targeted at another client in the same realm.",
        limits:
          "The requesting client must be confidential, authenticate the request and have Standard token exchange enabled. The supported base exchange is internal to the realm. The guide separately labels RFC 8693 actor delegation Preview and says the resource parameter is unsupported.",
        sources: [
          {
            publisher: "Keycloak",
            title: "Configuring and using token exchange",
            url: "https://www.keycloak.org/securing-apps/token-exchange",
          },
          {
            publisher: "Keycloak",
            title: "Keycloak 26.2.0 released",
            url: "https://www.keycloak.org/2025/04/keycloak-2620-released",
            publishedOn: "2025-04-11",
          },
        ],
        release: {
          stage: "supported",
          label: "Supported since 26.2.0",
          detail:
            "The 11 April 2025 release introduced supported Standard Token Exchange. The later delegation feature has its own stage.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The publisher documents this role and mechanism. Availability is stated only within the cited release conditions.",
        },
      },
      {
        kind: "implementation",
        id: "exchange-okta",
        parties: ["as"],
        qualification: "Actor-token delegation not established.",
        organization: "Okta",
        product: "Okta On-Behalf-Of Token Exchange",
        role: "Authorization server",
        summary:
          "Exchanges an upstream user access token for a new scoped downstream token within one custom authorization server or across trusted custom servers in the same tenant.",
        limits:
          "The example uses audience and scope. It does not show an actor token or establish the illustrated act claim. The release notes mark GA in Production without giving a production rollout day.",
        sources: [
          {
            publisher: "Okta",
            title: "Set up OAuth 2.0 On-Behalf-Of Token Exchange",
            url: "https://developer.okta.com/docs/guides/set-up-token-exchange/main/",
          },
          {
            publisher: "Okta",
            title: "Okta Classic Engine API release notes (2023)",
            url: "https://developer.okta.com/docs/release-notes/2023/",
          },
        ],
        release: {
          stage: "supported",
          label: "GA in Production",
          detail:
            "Okta used this wording in its 2023.05.0 release notes for the named feature.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The publisher documents this role and mechanism. Availability is stated only within the cited release conditions.",
        },
      },
      {
        kind: "implementation",
        id: "exchange-spring-client",
        parties: ["tool"],
        organization: "Spring",
        product: "Spring Security OAuth2 Client",
        role: "Client library",
        summary:
          "Provides a servlet token-exchange client for the RFC 8693 grant, with a configurable actor-token resolver.",
        limits:
          "The library sends requests to an authorization server. Token issuance, actor validation and any resulting act claim are the issuer’s responsibility.",
        sources: [
          {
            publisher: "Spring Security",
            title: "Authorization Grant Support",
            url: "https://docs.spring.io/spring-security/reference/servlet/oauth2/client/authorization-grants.html",
          },
        ],
        release: {
          stage: "supported",
          label: "In the stable reference",
          detail:
            "The checked Spring Security reference identifies 7.1.2 as Stable. The grant’s first release date was not established.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The publisher documents this role and mechanism. Availability is stated only within the cited release conditions.",
        },
      },
      {
        kind: "implementation",
        id: "exchange-aws-agentcore",
        parties: ["tool"],
        organization: "Amazon Web Services",
        product: "Amazon Bedrock AgentCore Identity",
        role: "Token-exchange client and broker",
        summary:
          "In RFC 8693 mode the credential provider submits the inbound token as the subject token. It can supply an actor token from machine-to-machine credentials or AWS IAM, or omit it for an issuer configured accordingly.",
        limits:
          "The external authorization server decides what to issue. AgentCore also documents a separate RFC 7523 mode. AWS’s GA announcement named 14 regions at launch.",
        sources: [
          {
            publisher: "Amazon Web Services",
            title: "On-behalf-of token exchange with AgentCore Identity",
            url: "https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/on-behalf-of-token-exchange.html",
          },
          {
            publisher: "Amazon Web Services",
            title:
              "Amazon Bedrock AgentCore Identity now supports On-Behalf-Of (OBO) token exchange",
            url: "https://aws.amazon.com/about-aws/whats-new/2026/04/amazon-bedrock-agentcore/",
            publishedOn: "2026-04-30",
          },
        ],
        release: {
          stage: "supported",
          label: "Generally available at announcement",
          detail:
            "AWS stated general availability for the On-Behalf-Of capability on 30 April 2026 in the listed regions.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The publisher documents this role and mechanism. Availability is stated only within the cited release conditions.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        id: "exchange-snowflake",
        qualification: "Impersonation profile; no actor_token.",
        organization: "Snowflake",
        setting: "Hosted Snowflake OAuth token endpoint and sessions",
        summary:
          "Snowflake documents an RFC 8693-based exchange of a user credential for a short-lived Snowflake access token. A caller can constrain the session with a Restricted Session Scope.",
        limits:
          "Snowflake documents a service-specific impersonation variant. It does not authenticate the exchange client, accepts no actor_token, and uses the caller’s unverified act value as a session audit label. This is operator documentation, with no customer deployment, usage or launch date established.",
        sources: [
          {
            publisher: "Snowflake",
            title: "OAuth token exchange for agent delegation",
            url: "https://docs.snowflake.com/en/user-guide/oauth-token-exchange",
          },
        ],
        attribution: "operator-report",
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The named operator documents the mechanism for its own service. Usage and interoperability were not independently tested.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "token-exchange-evidence-added",
        kind: "evidence-added",
        date: "2026-11-12",
        summary:
          "Added the reviewed implementation and deployment sources to the implementation record.",
        evidenceIds: [
          "exchange-keycloak-v2",
          "exchange-okta",
          "exchange-spring-client",
          "exchange-aws-agentcore",
          "exchange-snowflake",
        ],
      },
      {
        id: "exchange-keycloak-26-2",
        kind: "release",
        date: "2025-04-11",
        summary:
          "Keycloak released supported Standard Token Exchange for the documented same-realm case.",
        evidenceIds: ["exchange-keycloak-v2"],
      },
      {
        id: "exchange-agentcore-ga",
        kind: "release",
        date: "2026-04-30",
        summary:
          "AWS announced general availability of AgentCore Identity on-behalf-of token exchange in 14 regions.",
        evidenceIds: ["exchange-aws-agentcore"],
      },
    ],
  },
  {
    slug: "ciba",
    reviewedOn: "2026-11-12",
    scope:
      "OpenID Connect CIBA, including the backchannel request and the token delivery mode the source describes. User notification, Rich Authorization Requests and API enforcement each need their own evidence.",
    searchNote:
      "Selected client, authorization-server and hosted-provider guides were checked. ICA Banken’s own notices cover its open banking service. Generic push MFA, certification listings and sandbox instructions were excluded as deployment evidence.",
    implementations: [
      {
        kind: "implementation",
        organization: "openid-client project",
        product: "openid-client",
        role: "Client library",
        release: {
          stage: "supported",
          label: "v6.x supported",
          detail:
            "The project lists v6.x under Supported Versions. The feature introduction date is unstated.",
        },
        id: "ciba-openid-client",
        parties: ["agent"],
        summary:
          "The JavaScript client library starts a backchannel authentication request and polls the token endpoint for the result. Its example also shows token retrieval after a ping callback.",
        limits:
          "The application supplies the ping callback endpoint and handles the user-facing workflow.",
        sources: [
          {
            title: "openid-client README",
            url: "https://github.com/panva/openid-client#client-initiated-backchannel-authentication-ciba",
            publisher: "openid-client project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary product or project documentation establishes the named role and mechanism. Release wording follows the source.",
        },
      },
      {
        kind: "implementation",
        organization: "Auth0",
        product: "Auth0",
        role: "Authorization server",
        release: {
          stage: "supported",
          label: "Generally available on Enterprise plans",
          detail:
            "Auth0 announced general availability for Enterprise plan customers on 21 May 2025.",
        },
        id: "ciba-auth0",
        parties: ["as"],
        qualification: "Enterprise plans.",
        summary:
          "Auth0 documents decoupled CIBA with a Guardian SDK mobile app for the user and Rich Authorization Requests (RFC 9396) for supplying context.",
        limits:
          "The source describes the feature and its use cases. Each protected API still needs to enforce the approved authorization details.",
        sources: [
          {
            title: "Auth0 Changelog · CIBA generally available",
            url: "https://auth0.com/changelog",
            publisher: "Auth0",
            publishedOn: "2025-05-21",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary product or project documentation establishes the named role and mechanism. Release wording follows the source.",
        },
      },
      {
        kind: "implementation",
        organization: "Duende Software",
        product: "Duende IdentityServer",
        role: "Authorization server",
        release: {
          stage: "unspecified",
          label: "Documented for named editions",
          detail:
            "The guide lists Standard, Advanced, Custom and legacy Enterprise editions, with a compatible license key needed for legacy customers.",
        },
        id: "ciba-duende",
        parties: ["as"],
        qualification: "Edition restrictions apply.",
        summary:
          "IdentityServer exposes a backchannel authentication endpoint and supports poll-mode retrieval at the token endpoint.",
        limits:
          "The host supplies user identification and notification and implements the approval interaction. The documentation specifies poll mode.",
        sources: [
          {
            title:
              "Implementing Client-Initiated Backchannel Authentication (CIBA)",
            url: "https://docs.duendesoftware.com/identityserver/ui/ciba/",
            publisher: "Duende Software",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary product or project documentation establishes the named role and mechanism. Release wording follows the source.",
        },
      },
      {
        kind: "implementation",
        organization: "Vipps MobilePay",
        product: "Vipps MobilePay Login API",
        role: "Hosted OpenID provider",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The integration guide documents the flow without a release stage.",
        },
        id: "ciba-vipps-mobilepay",
        parties: ["as"],
        summary:
          "A merchant can start login by phone number, let the user complete it in the Vipps or MobilePay app, and poll the token endpoint for ID and access tokens.",
        limits:
          "Scope is the in-app CIBA login path. The same guide separately documents a browser redirect variant with a proprietary grant.",
        sources: [
          {
            title: "Merchant-initiated login",
            url: "https://developer.vippsmobilepay.com/docs/APIs/login-api/api-guide/merchant-initiated-login-integration",
            publisher: "Vipps MobilePay",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary product or project documentation establishes the named role and mechanism. Release wording follows the source.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        organization: "ICA Banken",
        setting: "PSD2 open banking APIs",
        attribution: "operator-report",
        id: "ciba-ica-banken",
        summary:
          "ICA Banken announced a CIBA-based decoupled strong authentication flow for its PSD2 APIs and later documented changes to that flow in its production Payments API.",
        limits:
          "The account documents one bank’s service. It does not identify third-party clients, transaction volume, the detailed token delivery mode, or current availability.",
        sources: [
          {
            title: "Latest News – Open Banking",
            url: "https://www.icabanken.se/open-banking/latest-news-open-banking/",
            publisher: "ICA Banken Open Banking Team",
            publishedOn: "2024-05-31",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The named operator describes its own arrangement. The account was not tested independently.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "ciba-review",
        kind: "evidence-added",
        date: "2026-11-12",
        summary: "These sources were added to the implementation record.",
        evidenceIds: [
          "ciba-openid-client",
          "ciba-auth0",
          "ciba-duende",
          "ciba-vipps-mobilepay",
          "ciba-ica-banken",
        ],
      },
      {
        id: "ciba-auth0-release",
        kind: "release",
        date: "2025-05-21",
        summary:
          "Auth0 announced general availability of CIBA on Enterprise plans, including Rich Authorization Requests.",
        evidenceIds: ["ciba-auth0"],
      },
      {
        id: "ciba-ica-banken-report",
        kind: "report-published",
        date: "2024-05-31",
        summary:
          "ICA Banken published its CIBA availability notice. It lists 30 May 2024 as the availability date.",
        evidenceIds: ["ciba-ica-banken"],
      },
    ],
  },
  {
    slug: "agent-to-agent",
    reviewedOn: "2026-11-12",
    scope:
      "Agent2Agent protocol discovery, card signing and verification, request authentication and task authorization. Scope support to the documented role, transport and revision. Label older deployment accounts with their reported revision.",
    searchNote:
      "Selected SDK, hosting and integration documentation and one operator account were reviewed. A published Agent Card, partner listing or SDK compatibility claim does not establish deployed enforcement. No live card sample was collected.",
    implementations: [
      {
        kind: "implementation",
        organization: "A2A project",
        product: "A2A Python SDK",
        role: "Client and server SDK",
        release: {
          stage: "unspecified",
          label: "A2A 1.0 documented",
          detail:
            "The compatibility matrix names the protocol version and transports. These sources do not date a release of card signing.",
        },
        id: "a2a-python-sdk",
        parties: ["client", "remote"],
        summary:
          "The SDK documents A2A 1.0 clients and servers over JSON-RPC, HTTP+JSON and gRPC. A sample shows signing an Agent Card and verifying it with a configured allowlist of signing algorithms and key-set URLs.",
        limits:
          "Card signatures authenticate the card under a configured trust policy. API authentication, authorization and acquiring credentials still belong to the integration.",
        sources: [
          {
            title: "A2A Python SDK · Compatibility",
            url: "https://github.com/a2aproject/a2a-python#-compatibility",
            publisher: "A2A Python SDK project",
          },
          {
            title: "A2A Python SDK — Samples",
            url: "https://a2aproject.github.io/a2a-python/samples/",
            publisher: "A2A Python SDK project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary product or project documentation establishes the named role and mechanism. Release wording follows the source.",
        },
      },
      {
        kind: "implementation",
        organization: "Amazon Web Services",
        product: "Amazon Bedrock AgentCore Runtime",
        role: "Hosted server runtime",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The guides document the A2A runtime integration without naming its feature stage.",
        },
        id: "a2a-agentcore",
        parties: ["remote"],
        qualification: "A2A 0.3.0 example; 1.0 support unverified.",
        summary:
          "The runtime hosts an A2A JSON-RPC server with Agent Card discovery and SigV4 or OAuth 2.0 inbound authentication. Its protocol contract describes a 401 challenge when OAuth credentials are missing.",
        limits:
          "The hosted application supplies the A2A server. The contract’s example card uses A2A 0.3.0; it does not establish 1.0 compatibility, card-signing support, in-task authorization or a customer deployment.",
        sources: [
          {
            title: "Deploy A2A servers in AgentCore Runtime",
            url: "https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-a2a.html",
            publisher: "Amazon Web Services",
          },
          {
            title: "A2A protocol contract",
            url: "https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-a2a-protocol-contract.html",
            publisher: "Amazon Web Services",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary product or project documentation establishes the named role and mechanism. Release wording follows the source.",
        },
      },
      {
        kind: "implementation",
        organization: "A2A project",
        product: "A2A Java SDK",
        role: "Client and server SDK",
        release: {
          stage: "supported",
          label: "First GA release in 1.0.0.Final",
          detail:
            "The project dated its first generally available SDK release to 10 June 2026. The task authorization guide consulted is for SDK 1.5.0.Final.",
        },
        id: "a2a-java-sdk",
        parties: ["client", "remote"],
        summary:
          "The Java SDK supplies client and server bindings for JSON-RPC, gRPC and HTTP+JSON. Its 1.5.0.Final server guide documents a configurable provider for per-user task access checks.",
        limits:
          "The host supplies the authenticated user and ownership policy. Task access checks do not establish support for the separate in-task user authorization exchange.",
        sources: [
          {
            title: "A2A Java SDK 1.0.0.Final Released",
            url: "https://a2aproject.github.io/a2a-java/posts/a2a-java-sdk-1-0-0-final-released/",
            publisher: "A2A Java SDK project",
            publishedOn: "2026-06-10",
          },
          {
            title: "Task Authorization · A2A Java SDK 1.5.0.Final",
            url: "https://a2aproject.github.io/a2a-java/1_5_0_Final/authorization/",
            publisher: "A2A Java SDK project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary product or project documentation establishes the named role and mechanism. Release wording follows the source.",
        },
      },
      {
        kind: "implementation",
        organization: "Google",
        product: "Agent Development Kit for Python",
        role: "Client agent integration",
        release: {
          stage: "supported",
          label: "Documented as supported in ADK Python",
          detail:
            "The Python guide states support and documents compatibility with A2A Python SDK 1.x and 0.3.x. The feature release date is unstated.",
        },
        id: "a2a-google-adk",
        parties: ["client"],
        summary:
          "The Python integration takes an Agent Card or its URL, calls a remote agent from the local orchestrator, and exposes hooks for request metadata and headers.",
        limits:
          "This is a Python client integration. The sample does not establish automatic credential acquisition, card signature verification or remote enforcement.",
        sources: [
          {
            title: "Quickstart: Consuming a remote agent via A2A",
            url: "https://adk.dev/a2a/quickstart-consuming/",
            publisher: "Google Agent Development Kit",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "Primary product or project documentation establishes the named role and mechanism. Release wording follows the source.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        organization: "Eon",
        setting: "Buzz assistant and three specialist agents",
        attribution: "operator-report",
        id: "a2a-eon",
        summary:
          "Eon reported using A2A 0.3 to delegate tasks from its Buzz assistant to three separately deployed specialists. The orchestrator reads Agent Cards to import skills and route requests.",
        limits:
          "The author says the deployment used 0.3 when reported. The sample card is illustrative. Eon owned both sides of the identity mapping, and the account does not establish A2A 1.0 migration, card signing, or general credential enforcement.",
        sources: [
          {
            title: "What We Learned Putting A2A Into Production",
            url: "https://aaif.io/blog/what-we-learned-putting-a2a-into-production",
            publisher:
              "Agentic AI Foundation · account by Rachel Neriya Schifter",
            publishedOn: "2026-08-26",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-12",
          rationale:
            "The named operator describes its own arrangement. The account was not tested independently.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "a2a-review",
        kind: "evidence-added",
        date: "2026-11-12",
        summary: "These sources were added to the implementation record.",
        evidenceIds: [
          "a2a-python-sdk",
          "a2a-agentcore",
          "a2a-java-sdk",
          "a2a-google-adk",
          "a2a-eon",
        ],
      },
      {
        id: "a2a-eon-report",
        kind: "report-published",
        date: "2026-08-26",
        summary:
          "Eon published its account of running three Buzz specialists behind A2A 0.3. The date is for the report.",
        evidenceIds: ["a2a-eon"],
      },
      {
        id: "a2a-java-sdk-ga",
        kind: "release",
        date: "2026-06-10",
        summary:
          "The A2A Java SDK project announced its first generally available release, 1.0.0.Final.",
        evidenceIds: ["a2a-java-sdk"],
      },
    ],
  },
  {
    slug: "step-up-authorization",
    reviewedOn: "2026-11-13",
    scope:
      "RFC 9470 step-up challenges and the authorization-server response. A stronger or fresher login, transaction-specific consent under RFC 9396, and API enforcement each require their own evidence.",
    searchNote:
      "Selected RFC 9470 issuer, client and resource-server documentation, plus Mozilla’s account of its own authorization service. Generic MFA and transaction-specific consent inferred from step-up were outside this search.",
    implementations: [
      {
        kind: "implementation",
        id: "step-up-pingone",
        parties: ["as", "api"],
        qualification: "Transaction-specific consent not established.",
        organization: "Ping Identity",
        product: "PingOne SSO and API Access Management",
        role: "Authorization server and resource-server challenge",
        summary:
          "PingOne API Access Management can enforce an authentication requirement and return an RFC 9470 challenge. PingOne SSO can apply the named authentication policy and issue a new token.",
        limits:
          "The guide assigns separate roles to the two products. It does not document RFC 9396 consent for a specific transaction.",
        sources: [
          {
            publisher: "Ping Identity",
            title: "Step-up authentication for APIs",
            url: "https://docs.pingidentity.com/pingone/authentication/p1_stepup_authentication_for_apis.html",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a release stage for this capability.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
      {
        kind: "implementation",
        id: "step-up-authlete",
        parties: ["as"],
        organization: "Authlete",
        product: "Authlete",
        role: "Authorization-server backend",
        summary:
          "Supports RFC 9470 from version 2.3. It associates authentication context and time with access tokens and exposes those values for resource-server checks.",
        limits:
          "The integrating application supplies the user authentication and protected-resource policy. The guide gives no release day for version 2.3.",
        sources: [
          {
            publisher: "Authlete",
            title:
              "RFC 9470 OAuth 2.0 Step Up Authentication Challenge Protocol",
            url: "https://developers.authlete.com/protocols-and-flows/advanced-flows/oauth-2-0-step-up-authentication-challenge-protocol-rfc-9470",
          },
        ],
        release: {
          stage: "supported",
          label: "Supported from 2.3",
          detail:
            "Authlete’s implementation section explicitly names 2.3 as the starting version.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
      {
        kind: "implementation",
        id: "step-up-sdxc",
        parties: ["agent", "api"],
        organization: "sdxc project",
        product: "@sdxc/auth",
        role: "Client and resource-server library",
        summary:
          "Creates RFC 9470 challenges from authentication strength and age requirements, and parses the challenge so a relying party can start a new authorization request.",
        limits:
          "The library provides integration functions. Authorization policy, user authentication, and transaction details depend on the application and issuer.",
        sources: [
          {
            publisher: "sdxc project",
            title: "Release 2026.10.25",
            url: "https://github.com/sergiodxa/monorepo/releases/tag/v2026.10.25",
            publishedOn: "2026-10-25",
          },
        ],
        release: {
          stage: "supported",
          label: "In release 2026.10.25",
          detail:
            "The project’s 25 October 2026 release notes list the client and resource-server changes.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        id: "step-up-mozilla",
        organization: "Mozilla",
        setting: "Mozilla Accounts authorization service",
        summary:
          "Mozilla documents the authorization-server half of RFC 9470 in Mozilla Accounts, including a fresh two-factor check through acr_values and max_age.",
        limits:
          "Relying parties implement the resource-server challenge. The guide ties a silent-request error redirect to the release containing FXA-12860. The account does not establish that release date, a complete relying-party deployment, or traffic.",
        sources: [
          {
            publisher: "Mozilla",
            title: "Step-up authentication",
            url: "https://raw.githubusercontent.com/mozilla/ecosystem-platform/master/docs/relying-parties/how-tos/step-up-authentication.md",
          },
        ],
        attribution: "operator-report",
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The named operator describes this mechanism for its own service. The checked source does not establish traffic or independent interoperability.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "step-up-authorization-evidence-added",
        kind: "evidence-added",
        date: "2026-11-13",
        summary: "Added the reviewed sources to the implementation record.",
        evidenceIds: [
          "step-up-pingone",
          "step-up-authlete",
          "step-up-sdxc",
          "step-up-mozilla",
        ],
      },
      {
        id: "step-up-sdxc-release",
        kind: "release",
        date: "2026-10-25",
        summary:
          "The sdxc project released RFC 9470 challenge and client response support in @sdxc/auth.",
        evidenceIds: ["step-up-sdxc"],
      },
    ],
  },
  {
    slug: "cross-app-access",
    reviewedOn: "2026-11-13",
    scope:
      "ID-JAG issuance, exchange and redemption for enterprise-managed authorization, including implementations of the MCP extension. General workforce SSO and generic cross-domain JWT support do not establish ID-JAG.",
    searchNote:
      "Selected issuer, client and resource authorization-server guides and release notes, plus one hosted integration from its operator. Draft revision coverage varies and customer uptake is unknown.",
    implementations: [
      {
        kind: "implementation",
        id: "xaa-okta",
        parties: ["idp", "as"],
        qualification:
          "Org authorization server does not accept external ID-JAGs.",
        organization: "Okta",
        product: "Okta Cross App Access",
        role: "Identity provider and resource authorization server",
        summary:
          "Documents policy-controlled ID-JAG issuance and redemption at a resource authorization server. A custom authorization server can accept a grant from a trusted external issuer.",
        limits:
          "Okta’s org authorization server does not accept external ID-JAGs. The cited September release applies to the named custom app and resource app capability; the concepts guide does not name a draft revision.",
        sources: [
          {
            publisher: "Okta",
            title: "Cross App Access (XAA)",
            url: "https://developer.okta.com/docs/concepts/xaa/",
          },
          {
            publisher: "Okta",
            title:
              "Okta Identity Engine Production release notes, version 2026.09.0",
            url: "https://help.okta.com/oie/en-us/content/topics/releasenotes/versions/release-prod-2026-09-0.htm",
            publishedOn: "2026-09-15",
          },
        ],
        release: {
          stage: "supported",
          label: "Generally available for the named app configuration",
          detail:
            "Okta Identity Engine release 2026.09.0 lists XAA for custom SSO-agentic requesting apps and SSO resource apps under Generally Available.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
      {
        kind: "implementation",
        id: "xaa-claude",
        parties: ["client"],
        qualification:
          "Team and Enterprise; Claude-issued assertions are beta.",
        organization: "Anthropic",
        product: "Claude",
        role: "MCP client",
        summary:
          "Claude documents obtaining an identity assertion and presenting it at the connector’s token endpoint under MCP Enterprise-Managed Authorization.",
        limits:
          "Anthropic lists Team and Enterprise plans. It documents customer-IdP assertions and separately labels Claude-issued assertions beta. The guide does not establish IETF draft revision conformance.",
        sources: [
          {
            publisher: "Anthropic",
            title: "Enterprise Managed Auth for connectors",
            url: "https://claude.com/docs/connectors/building/enterprise-managed-auth",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Available on Team and Enterprise",
          detail:
            "Anthropic names these plans for Enterprise Managed Auth. The separate Claude-issued assertion option is beta.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
      {
        kind: "implementation",
        id: "xaa-pingfederate",
        parties: ["idp", "as"],
        organization: "Ping Identity",
        product: "PingFederate",
        role: "ID-JAG issuer and resource authorization server",
        summary:
          "PingFederate 13.1 release notes document ID-JAG issuance through OAuth token exchange and acceptance through the JWT bearer grant.",
        limits:
          "The release notes give June 2026, with no exact publication day or ID-JAG draft revision in the feature entry. Deployment and interoperability are separate.",
        sources: [
          {
            publisher: "Ping Identity",
            title: "PingFederate 13.1 (June 2026)",
            url: "https://docs.pingidentity.com/pingfederate/13.1/release_notes/pf_release_notes_131.html",
          },
        ],
        release: {
          stage: "supported",
          label: "In PingFederate 13.1",
          detail:
            "The 13.1 release notes list both issuer and receiver support.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
      {
        kind: "implementation",
        id: "xaa-keycloak",
        parties: ["as"],
        qualification: "Draft -01 receiver.",
        organization: "Keycloak",
        product: "Keycloak ID-JAG receiver",
        role: "Resource authorization server",
        summary:
          "Keycloak documents using an external ID-JAG as a JWT authorization grant to obtain a scoped local access token.",
        limits:
          "The guide follows draft revision -01, requires the identity-assertion-jwt feature flag, and does not document a completed issuer implementation.",
        sources: [
          {
            publisher: "Keycloak",
            title: "Identity Assertion JWT Authorization Grant",
            url: "https://www.keycloak.org/securing-apps/identity-assertion-jwt-authorization-grant",
          },
        ],
        release: {
          stage: "experimental",
          label: "Experimental receiver",
          detail:
            "Keycloak describes this feature as experimental and advises against production use.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        id: "xaa-posthog",
        qualification: "Scale or Enterprise platform add-on.",
        organization: "PostHog",
        setting: "Hosted PostHog authorization service for API and MCP access",
        summary:
          "PostHog documents validating an ID-JAG and issuing a scoped access token for its own services. Its Claude guide describes an integration with its MCP server.",
        limits:
          "The operator limits the feature to organizations on the Scale or Enterprise platform add-on. The guides do not date deployment or establish user volume, support by every listed IdP, or conformance to a particular revision.",
        sources: [
          {
            publisher: "PostHog",
            title: "ID-JAG (XAA) authentication",
            url: "https://posthog.com/docs/settings/authentication/id-jag",
          },
          {
            publisher: "PostHog",
            title: "Connect Claude with enterprise-managed authorization",
            url: "https://posthog.com/docs/model-context-protocol/claude-managed-authorization",
          },
        ],
        attribution: "operator-report",
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The named operator describes this mechanism for its own service. The checked source does not establish traffic or independent interoperability.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "cross-app-access-evidence-added",
        kind: "evidence-added",
        date: "2026-11-13",
        summary: "Added the reviewed sources to the implementation record.",
        evidenceIds: [
          "xaa-okta",
          "xaa-claude",
          "xaa-pingfederate",
          "xaa-keycloak",
          "xaa-posthog",
        ],
      },
      {
        id: "xaa-okta-2026-09-release",
        kind: "release",
        date: "2026-09-15",
        summary:
          "Okta Identity Engine 2026.09.0 listed Cross App Access for custom SSO-agentic requesting apps and SSO resource apps as generally available.",
        evidenceIds: ["xaa-okta"],
      },
    ],
  },
  {
    slug: "identity-chaining",
    reviewedOn: "2026-11-13",
    scope:
      "Cross-domain chaining with an RFC 8693 exchange for an assertion targeted at a second authorization server, then RFC 7523 redemption for that server’s access token. Support for the separate ID-JAG profile does not by itself establish this chain.",
    searchNote:
      "Selected a configuration guide and an implementer’s draft report. Cross-domain building blocks, draft acknowledgments, public demos and interoperability claims without a named operator do not establish production use.",
    implementations: [
      {
        kind: "implementation",
        id: "identity-chain-keycloak",
        parties: ["asa", "asb"],
        organization: "Keycloak",
        product: "Keycloak",
        role: "Issuing and receiving authorization servers",
        summary:
          "Documents a two-realm or two-server chain. Standard Token Exchange in the first realm produces a JWT targeted at the second, which redeems it through JWT Authorization Grant.",
        limits:
          "The guide combines two supported features and names no draft revision. The sample does not establish support for all discovery metadata, request fields, or cross-vendor interoperability.",
        sources: [
          {
            publisher: "Keycloak",
            title: "OAuth Identity and Authorization Chaining Across Domains",
            url: "https://www.keycloak.org/securing-apps/oauth-identity-authorization-chaining-across-domains",
          },
          {
            publisher: "Keycloak",
            title: "Keycloak 26.6.0 released",
            url: "https://www.keycloak.org/2026/04/keycloak-2660-released",
            publishedOn: "2026-04-08",
          },
        ],
        release: {
          stage: "supported",
          label: "Uses supported Keycloak features",
          detail:
            "Keycloak 26.6.0 promoted the receiving JWT Authorization Grant from preview to supported. The guide combines it with supported Standard Token Exchange.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
      {
        kind: "implementation",
        id: "identity-chain-authgent",
        parties: ["asa", "asb"],
        qualification: "Overview names draft -14; later revisions unverified.",
        organization: "authgent project",
        product: "authgent",
        role: "Reference authorization server",
        summary:
          "The maintainer’s implementation report maps issuance and redemption of chaining grants to authgent’s code and identifies revision -15 as its target at publication.",
        limits:
          "The project overview still refers to -14. This claim describes the dated report, with no verification against the site’s later revision. The report identifies a demo and says it did not test against an independent implementation.",
        sources: [
          {
            publisher: "Dhruv Agnihotri",
            title:
              "Implementation Status of OAuth Identity Chaining and Transaction Tokens",
            url: "https://datatracker.ietf.org/doc/html/draft-agnihotri-oauth-agent-impl-status-02",
            publishedOn: "2026-06-23",
          },
        ],
        release: {
          stage: "experimental",
          label: "Maintainer report: experimental to operational",
          detail:
            "The report uses this range for project maturity. It does not give a GA stage for the chaining feature.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
    ],
    deployments: [],
    observations: [],
    events: [
      {
        id: "identity-chaining-evidence-added",
        kind: "evidence-added",
        date: "2026-11-13",
        summary: "Added the reviewed sources to the implementation record.",
        evidenceIds: ["identity-chain-keycloak", "identity-chain-authgent"],
      },
      {
        id: "identity-chain-keycloak-jwt-release",
        kind: "release",
        date: "2026-04-08",
        summary:
          "Keycloak 26.6.0 promoted its receiving JWT Authorization Grant from preview to supported.",
        evidenceIds: ["identity-chain-keycloak"],
      },
    ],
  },
  {
    slug: "transaction-tokens",
    reviewedOn: "2026-11-13",
    scope:
      "Implementations of the IETF OAuth Transaction Tokens draft for signed transaction context carried across calls within a trust domain. A generic JWT, RFC 8693 exchange, or the separate agent-context draft does not establish this capability.",
    searchNote:
      "Selected transaction-token services and verification integrations from their project documentation. The reviewed sources describe examples, demos and release artifacts. They did not establish a named production deployment.",
    implementations: [
      {
        kind: "implementation",
        id: "txn-tokenetes",
        parties: ["tts", "tool"],
        organization: "Tokenetes project",
        product: "Tokenetes",
        role: "Transaction-token service and sidecar verifier",
        summary:
          "The project documents a service that issues Transaction Tokens and a Kubernetes sidecar that verifies them against configured request rules.",
        limits:
          "The guide links the IETF draft without naming a revision. It documents issuer and sidecar components of the same project. The versioned release does not establish current-draft conformance or deployment.",
        sources: [
          {
            publisher: "Tokenetes project",
            title: "Introduction to Tokenetes",
            url: "https://tokenetes.io/docs/",
          },
          {
            publisher: "Tokenetes project",
            title: "Tokenetes releases",
            url: "https://github.com/tokenetes/tokenetes/releases",
          },
        ],
        release: {
          stage: "supported",
          label: "Published service release 1.0.1",
          detail:
            "The project release page lists service image 1.0.1. The docs do not give a separate release stage for verification.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
      {
        kind: "implementation",
        id: "txn-kontxt",
        parties: ["edge", "tts", "tool"],
        qualification: "Later draft revisions unverified.",
        organization: "kontxt project",
        product: "kontxt",
        role: "Transaction-token service, client and verifier",
        summary:
          "Implements the project’s documented draft -08 path for Kubernetes. Its Envoy adapter exchanges an access token at the edge and verifies the transaction token on downstream requests. A Go SDK supplies direct client and verification functions.",
        limits:
          "The checked README names revision -08. It does not establish release stage, interoperability with another implementation, or support for the site’s later revision.",
        sources: [
          {
            publisher: "kontxt project",
            title: "kontxt README",
            url: "https://github.com/aramase/kontxt",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a release stage for this capability.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
      {
        kind: "implementation",
        id: "txn-authgent",
        parties: ["tts"],
        qualification:
          "Scope-subset check skipped when the subject token has no scope.",
        organization: "authgent project",
        product: "authgent",
        role: "Reference transaction-token issuer",
        summary:
          "The maintainer’s implementation report maps the token exchange request and transaction-token issuance to its OAuth server against draft revision -08.",
        limits:
          "This is a self-report with a test harness and a demo. The report says the issuer skips the scope-subset check when the subject token has no scope. Independent interoperability and support for later revisions remain unverified.",
        sources: [
          {
            publisher: "Dhruv Agnihotri",
            title:
              "Implementation Status of OAuth Identity Chaining and Transaction Tokens",
            url: "https://datatracker.ietf.org/doc/html/draft-agnihotri-oauth-agent-impl-status-02",
            publishedOn: "2026-06-23",
          },
        ],
        release: {
          stage: "experimental",
          label: "Maintainer report: experimental to operational",
          detail:
            "The report uses this range for project maturity. It does not give a GA stage for transaction tokens.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
    ],
    deployments: [],
    observations: [],
    events: [
      {
        id: "transaction-tokens-evidence-added",
        kind: "evidence-added",
        date: "2026-11-13",
        summary: "Added the reviewed sources to the implementation record.",
        evidenceIds: ["txn-tokenetes", "txn-kontxt", "txn-authgent"],
      },
    ],
  },
  {
    slug: "oauth-mtls",
    reviewedOn: "2026-11-13",
    scope:
      "RFC 8705 certificate-bound OAuth access tokens. Issuer binding, presentation of the same client certificate and enforcement by the protected resource are distinct from mTLS client authentication at the token endpoint.",
    searchNote:
      "Selected issuer and resource-server documentation and one operator’s own payment API documentation. Certifications, ecosystem requirements and mTLS client authentication alone did not count as deployment evidence.",
    implementations: [
      {
        kind: "implementation",
        id: "oauth-mtls-authlete",
        parties: ["as"],
        organization: "Authlete",
        product: "Authlete",
        role: "Authorization-server backend",
        summary:
          "Documents issuing RFC 8705 certificate-bound access tokens using the client certificate from the token request. Binding can be enabled independently of mTLS client authentication.",
        limits:
          "The integrating authorization server passes the certificate to Authlete. This source does not show enforcement by a specific protected resource.",
        sources: [
          {
            publisher: "Authlete",
            title: "Issuing mutual-TLS certificate-bound access tokens",
            url: "https://developers.authlete.com/configuration-reference/tokens-and-claims/issuing-mutual-tls-certificate-bound-access-tokens",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a release stage for this capability.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
      {
        kind: "implementation",
        id: "oauth-mtls-duende",
        parties: ["as"],
        organization: "Duende Software",
        product: "Duende IdentityServer",
        role: "Authorization server",
        summary:
          "Documents binding an access token to the TLS client certificate and putting its SHA-256 thumbprint into the confirmation claim.",
        limits:
          "An API still has to enforce the binding. The setup guide shows the client presenting the certificate to the token endpoint and to the API. It does not establish a deployment or release stage.",
        sources: [
          {
            publisher: "Duende Software",
            title: "Proof-of-Possession Access Tokens",
            url: "https://docs.duendesoftware.com/identityserver/tokens/pop/",
          },
          {
            publisher: "Duende Software",
            title: "mTLS Setup Guide",
            url: "https://docs.duendesoftware.com/identityserver/tokens/mtls-setup/",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a release stage for this capability.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
      {
        kind: "implementation",
        id: "oauth-mtls-kong",
        parties: ["api"],
        organization: "Kong",
        product: "Kong Gateway OpenID Connect plugin",
        role: "Gateway verifier",
        summary:
          "The plugin can require certificate-bound tokens and verify their binding. It separately supports a certificate supplied by a trusted TLS-terminating proxy in 3.15 and later.",
        limits:
          "An upstream authorization server must issue bound tokens. The proxy and gateway must be configured to protect the certificate handoff.",
        sources: [
          {
            publisher: "Kong",
            title: "OpenID Connect plugin",
            url: "https://developer.konghq.com/plugins/openid-connect/",
          },
        ],
        release: {
          stage: "supported",
          label: "Documented for Kong Gateway 3.7+",
          detail:
            "Kong includes certificate-bound access tokens in the plugin’s FAPI 3.7+ features. Certificate forwarding in a header is separately documented for 3.15+.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        id: "oauth-mtls-cielo",
        organization: "Cielo",
        setting: "Production Pix payments API",
        summary:
          "Cielo says its Pix API uses RFC 8705 certificate-bound access tokens. Its integration manual separates the production mTLS API from the sandbox.",
        limits:
          "This is operator documentation for one production service. It does not establish a launch date, traffic volume, or use by other payment operators.",
        sources: [
          {
            publisher: "Cielo",
            title: "API PIX",
            url: "https://developercielo.github.io/manual/apipix",
          },
        ],
        attribution: "operator-report",
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The named operator describes this mechanism for its own service. The checked source does not establish traffic or independent interoperability.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "oauth-mtls-evidence-added",
        kind: "evidence-added",
        date: "2026-11-13",
        summary: "Added the reviewed sources to the implementation record.",
        evidenceIds: [
          "oauth-mtls-authlete",
          "oauth-mtls-duende",
          "oauth-mtls-kong",
          "oauth-mtls-cielo",
        ],
      },
    ],
  },
  {
    slug: "url-elicitation",
    reviewedOn: "2026-11-13",
    scope:
      "MCP URL-mode elicitation for a tool call that needs an out-of-band user interaction. The flow illustrates 2026-07-28 multi-round-trip requests. Earlier server-initiated URL requests are labeled separately.",
    searchNote:
      "Reviewed client, server SDK and gateway documentation for explicit URL mode. The search found no qualifying operator account for a tool using the illustrated retry path.",
    implementations: [
      {
        id: "url-elicitation-python",
        parties: ["client", "mcp"],
        kind: "implementation",
        organization: "Model Context Protocol project",
        product: "MCP Python SDK",
        role: "Server SDK and client retry support",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a feature release stage.",
        },
        summary:
          "The Python SDK documents URL-mode input requests over 2026-07-28 multi-round-trip calls. The client handles the URL and retries the tool call, carrying the opaque request state.",
        limits:
          "The SDK’s legacy server-initiated URL request and completion notification are separate APIs. The tool still has to verify that the external action completed.",
        sources: [
          {
            title: "Multi-round-trip requests",
            url: "https://py.sdk.modelcontextprotocol.io/handlers/multi-round-trip/",
            publisher: "MCP Python SDK project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
      {
        id: "url-elicitation-claude-code",
        parties: ["client"],
        kind: "implementation",
        organization: "Anthropic",
        product: "Claude Code",
        role: "MCP client",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a feature release stage.",
        },
        summary:
          "Claude Code asks the user whether to open the elicitation URL in a browser. The MCP 2026-07-28 exchange requires its v2 client runtime.",
        limits:
          "Runtime selection depends on the installed Claude Code version and session. The 2026-07-28 wire path requires the v2 runtime and a server that supports that revision. Older runtimes and connection types have separate elicitation limits in the linked guide.",
        sources: [
          {
            title: "Connect Claude Code to tools via MCP",
            url: "https://code.claude.com/docs/en/mcp",
            publisher: "Anthropic",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
      {
        id: "url-elicitation-agentcore",
        parties: ["mcp"],
        kind: "implementation",
        organization: "Amazon Web Services",
        product: "Amazon Bedrock AgentCore Gateway",
        role: "MCP gateway relay",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a feature release stage.",
        },
        summary:
          "AgentCore Gateway matches the client’s declared URL-elicitation capability and relays the exchange. For 2026-07-28 it authorizes and forwards requestState without storing it.",
        limits:
          "The downstream server supplies and validates the state and checks completion. The guide also documents the older exception-based retry path.",
        sources: [
          {
            title: "Use elicitation with your AgentCore gateway",
            url: "https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-mcp-elicitation.html",
            publisher: "Amazon Web Services",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
      {
        id: "url-elicitation-cloudflare-agents",
        parties: ["client"],
        qualification: "Earlier server-initiated exchange.",
        kind: "implementation",
        organization: "Cloudflare",
        product: "Cloudflare Agents SDK",
        role: "MCP client SDK",
        release: {
          stage: "unspecified",
          label: "Announced 13 July 2026",
          detail:
            "The dated changelog announces the feature without stating its release stage.",
        },
        summary:
          "The Agents SDK lets a developer register a URL-mode elicitation handler on the MCP client and pass the request to the application’s user interface.",
        limits:
          "The announcement shows server-initiated elicitation/create and an optional completion notification. It does not establish the 2026-07-28 multi-round-trip exchange.",
        sources: [
          {
            title: "Agents can respond to MCP elicitation requests",
            url: "https://developers.cloudflare.com/changelog/post/2026-07-13-mcp-client-elicitation/",
            publisher: "Cloudflare",
            publishedOn: "2026-07-13",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
    ],
    deployments: [],
    observations: [],
    events: [
      {
        id: "url-elicitation-review",
        kind: "evidence-added",
        date: "2026-11-13",
        summary: "These sources were added to the implementation record.",
        evidenceIds: [
          "url-elicitation-python",
          "url-elicitation-claude-code",
          "url-elicitation-agentcore",
          "url-elicitation-cloudflare-agents",
        ],
      },
      {
        id: "url-elicitation-cloudflare-announcement",
        kind: "release",
        date: "2026-07-13",
        summary:
          "Cloudflare announced form and URL-mode handlers for the Agents SDK, using the earlier server-initiated exchange.",
        evidenceIds: ["url-elicitation-cloudflare-agents"],
      },
    ],
  },
  {
    slug: "aauth",
    reviewedOn: "2026-11-13",
    scope:
      "AAuth Internet-Draft -11 Person Server authorization. Record demonstrable parts of the signed request, person-token, resource-token and auth-token path. Separate adjacent access modes and generic HTTP message signatures.",
    searchNote:
      "Checked the draft’s implementation notes, project code and examples. Exploratory SDKs provide specific protocol components. No qualifying production account was found in the reviewed sources.",
    implementations: [
      {
        id: "aauth-dotnet",
        parties: ["agent", "api"],
        kind: "implementation",
        organization: "AAuth .NET SDK project",
        product: "AAuth .NET SDK",
        role: "Agent and resource SDK; Person Server samples",
        release: {
          stage: "experimental",
          label: "Exploratory SDK",
          detail:
            "The -11 draft lists it as exploratory. The SDK repository says it is not yet spec-complete.",
        },
        summary:
          "The SDK documents agent challenge handling and resource middleware for the three-party Person Server flow. Its sample requests a person token, then exchanges the resource and presented person tokens before retrying.",
        limits:
          "This is an SDK and sample system. The project describes evolving wire formats and does not establish full -11 conformance, interoperability or a production deployment.",
        sources: [
          {
            title: "AAuth SDK for .NET",
            url: "https://github.com/aauth-dev/dotnet-samples",
            publisher: "AAuth .NET SDK project",
          },
          {
            title: "AAuth Protocol -11, section 16",
            url: "https://www.ietf.org/archive/id/draft-hardt-oauth-aauth-protocol-11.html#section-16",
            publisher: "Dick Hardt, IETF Internet-Draft",
            publishedOn: "2026-09-25",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
      {
        id: "aauth-js-resource",
        parties: ["api"],
        kind: "implementation",
        organization: "Hellō",
        product: "@aauth/resource",
        role: "Resource-side verification library",
        release: {
          stage: "experimental",
          label: "Exploratory TypeScript package",
          detail:
            "The -11 draft describes the TypeScript implementation as exploratory.",
        },
        summary:
          "Pinned verifier code checks agent, person and auth tokens, validates required token claims and compares the token’s confirmation key with the HTTP signature key.",
        limits:
          "This is a resource-side component. The verifier source does not establish a deployed Person Server, a complete authorization exchange or full draft conformance.",
        sources: [
          {
            title: "@aauth/resource token verifier at 9002b28",
            url: "https://raw.githubusercontent.com/aauth-dev/packages-js/9002b289db6fe9614831fe734d142c119139463b/resource/src/verify-token.ts",
            publisher: "Hellō",
          },
          {
            title: "AAuth Protocol -11, section 16",
            url: "https://www.ietf.org/archive/id/draft-hardt-oauth-aauth-protocol-11.html#section-16",
            publisher: "Dick Hardt, IETF Internet-Draft",
            publishedOn: "2026-09-25",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
    ],
    deployments: [],
    observations: [],
    events: [
      {
        id: "aauth-review",
        kind: "evidence-added",
        date: "2026-11-13",
        summary: "These sources were added to the implementation record.",
        evidenceIds: ["aauth-dotnet", "aauth-js-resource"],
      },
    ],
  },
  {
    slug: "wimse-workload-tokens",
    reviewedOn: "2026-11-13",
    scope:
      "Workload Identity Token (workload credentials draft -03) with a Workload Proof Token (draft -02). Issuance and propagation are recorded as separate components from proof generation and verification.",
    searchNote:
      "Reviewed an exact-revision Rust reference implementation, experimental SPIRE issuance and an alpha mesh integration. No qualifying operator deployment or cross-product interoperability evidence was found.",
    implementations: [
      {
        id: "wimse-wimsey",
        parties: ["issuer", "agent", "tool"],
        kind: "implementation",
        organization: "wimsey project",
        product: "wimsey",
        role: "Reference issuer, client and verifier",
        release: {
          stage: "experimental",
          label: "Pre-alpha",
          detail:
            "The project labels the implementation pre-alpha and says it is not production-ready.",
        },
        summary:
          "The Rust project documents issuing and verifying WITs and creating and verifying WPTs. Its spec map pins workload credentials -03 and WPT -02.",
        limits:
          "The documented CLI and reference code exercise those components. The project does not establish production use or interoperability with other products.",
        sources: [
          {
            title: "wimsey README",
            url: "https://github.com/kanywst/wimsey",
            publisher: "wimsey project",
          },
          {
            title: "wimsey spec map",
            url: "https://github.com/kanywst/wimsey/blob/main/SPEC-MAP.md",
            publisher: "wimsey project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
      {
        id: "wimse-spire",
        parties: ["issuer"],
        qualification: "HTTP proof generation and verification unverified.",
        kind: "implementation",
        organization: "SPIFFE project",
        product: "SPIRE",
        role: "WIT-SVID issuer and delivery service",
        release: {
          stage: "experimental",
          label: "Experimental in SPIRE 1.16.0",
          detail:
            "The 1.16.0 release notes name the experimental feature and its opt-in server and agent settings.",
        },
        summary:
          "Issues SPIFFE-profile WIT-SVIDs through the Workload API, with a fetch command and configurable lifetimes.",
        limits:
          "This is the SPIFFE credential profile and Workload API. The release notes do not establish HTTP WPT generation, verification or cross-product interoperability.",
        sources: [
          {
            title: "SPIRE 1.16.0 changelog",
            url: "https://raw.githubusercontent.com/spiffe/spire/v1.16.0/CHANGELOG.md",
            publisher: "SPIFFE project",
            publishedOn: "2026-11-05",
          },
          {
            title: "SPIFFE Workload API, WIT-SVID profile",
            url: "https://spiffe.io/docs/latest/spiffe-specs/spiffe_workload_api/#7-wit-svid-profile",
            publisher: "SPIFFE project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
      {
        id: "wimse-solo",
        parties: ["proxy"],
        qualification: "Proof verification unverified.",
        kind: "implementation",
        organization: "Solo.io",
        product: "Solo Enterprise for Istio with agentgateway",
        role: "Mesh waypoint and identity propagation",
        release: {
          stage: "experimental",
          label: "Enterprise alpha",
          detail:
            "The 1.30.x guide labels WIMSE/WIT support alpha and says it is not supported for production.",
        },
        summary:
          "With agentgateway as the waypoint, the mesh can expose authenticated workload claims to policy and forward or exchange a WIT on outbound HTTP requests.",
        limits:
          "The guide describes WIT propagation, including a source authenticated by mTLS. It does not establish a WPT verifier or name the draft revisions.",
        sources: [
          {
            title: "Workload identity tokens (WIMSE)",
            url: "https://docs.solo.io/istio/1.30.x/ambient/security/wimse/",
            publisher: "Solo.io",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
    ],
    deployments: [],
    observations: [],
    events: [
      {
        id: "wimse-workload-tokens-review",
        kind: "evidence-added",
        date: "2026-11-13",
        summary: "These sources were added to the implementation record.",
        evidenceIds: ["wimse-wimsey", "wimse-spire", "wimse-solo"],
      },
      {
        id: "wimse-spire-1-16",
        kind: "release",
        date: "2026-11-05",
        summary:
          "SPIRE 1.16.0 added experimental WIT-SVID issuance and Workload API delivery.",
        evidenceIds: ["wimse-spire"],
      },
    ],
  },
  {
    slug: "web-bot-auth",
    reviewedOn: "2026-11-13",
    scope:
      "Web Bot Auth signing, key discovery and verification. The site illustrates IETF working-group draft -01, which uses a labeled Signature-Agent member with a direct key-set URL. Older profiles are identified by their documented wire form.",
    searchNote:
      "Reviewed primary signer and verifier documentation. The selected products document earlier or differing wire forms. No selected source established full support for the illustrated -01 profile.",
    implementations: [
      {
        id: "web-bot-auth-cloudflare",
        parties: ["edge"],
        qualification: "Rejects the format this guide illustrates.",
        kind: "implementation",
        organization: "Cloudflare",
        product: "Cloudflare Verified Bots",
        role: "Edge verifier",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a feature release stage.",
        },
        summary:
          "Cloudflare documents checking Web Bot Auth signatures for registered bots and agents. It cites predecessor drafts and accepts a quoted Signature-Agent string.",
        limits:
          "The product guide explicitly rejects the dictionary form from later drafts. The separate Cloudflare libraries and examples do not establish support in this hosted verifier.",
        sources: [
          {
            title: "Web Bot Auth",
            url: "https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/",
            publisher: "Cloudflare",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
      {
        id: "web-bot-auth-google",
        parties: ["op", "agent"],
        qualification: "Uses an origin where this guide uses the key-set URL.",
        kind: "implementation",
        organization: "Google",
        product: "Google-Agent",
        role: "Request signer",
        release: {
          stage: "experimental",
          label: "Experimental signing",
          detail:
            "Google marks Web Bot Auth signing experimental and limits it to a subset of traffic.",
        },
        summary:
          "Google describes a subset of Google-Agent requests signed with Web Bot Auth and supplies an HTTPS key directory for verification.",
        limits:
          "The guide shows a labeled Signature-Agent member containing an origin, with the key directory at a separate URL. That differs from the direct key-set URL in working-group draft -01.",
        sources: [
          {
            title:
              "Google’s Guide to Authenticating Requests with Web Bot Auth (Experimental)",
            url: "https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth",
            publisher: "Google",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
      {
        id: "web-bot-auth-aws-waf",
        parties: ["edge"],
        qualification:
          "Support for the illustrated draft -01 profile unverified.",
        kind: "implementation",
        organization: "Amazon Web Services",
        product: "AWS WAF Bot Control",
        role: "Edge verifier",
        release: {
          stage: "unspecified",
          label: "Available since November 2025",
          detail:
            "AWS states availability from that month, without naming a release stage or giving a day.",
        },
        summary:
          "AWS WAF Bot Control validates signatures and applies labels for use in site rules. The guide names Bot Control rule group 4.0 or later for WBA.",
        limits:
          "The source’s example uses an origin URL in Signature-Agent. It does not establish support for the -01 dictionary containing a direct key-set URL.",
        sources: [
          {
            title:
              "Authenticate legitimate AI agent traffic with AWS WAF Bot Control",
            url: "https://aws.amazon.com/blogs/security/authenticate-legitimate-ai-agent-traffic-with-aws-waf-bot-control/",
            publisher: "Amazon Web Services",
            publishedOn: "2026-07-14",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
    ],
    deployments: [
      {
        id: "web-bot-auth-openai",
        qualification: "Earlier header and key-discovery format.",
        kind: "deployment",
        organization: "OpenAI",
        setting: "ChatGPT Work Cloud browser outbound HTTP",
        summary:
          "OpenAI says its Cloud browser signs outbound HTTP requests using Web Bot Auth and documents how sites can verify them.",
        limits:
          "The operator shows a quoted origin in Signature-Agent and a separate well-known key directory. The account does not establish current working-group -01 behavior, request volume or how many sites allow the traffic.",
        sources: [
          {
            title: "ChatGPT Work’s Cloud browser allowlisting",
            url: "https://help.openai.com/en/articles/11845367-chatgpt-works-cloud-browser-allowlisting",
            publisher: "OpenAI",
          },
        ],
        attribution: "operator-report",
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The named operator describes how its own service signs requests.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "web-bot-auth-review",
        kind: "evidence-added",
        date: "2026-11-13",
        summary: "These sources were added to the implementation record.",
        evidenceIds: [
          "web-bot-auth-cloudflare",
          "web-bot-auth-google",
          "web-bot-auth-aws-waf",
          "web-bot-auth-openai",
        ],
      },
    ],
  },
  {
    slug: "agent-payments",
    reviewedOn: "2026-11-13",
    scope:
      "AP2 v0.2 autonomous payments using linked open and closed Checkout and Payment Mandates and signed receipts. Generic agent checkout, AP2 v0.1 and implementation intent are separate.",
    searchNote:
      "Checked the tagged SDK, the project’s reference materials, a Google codelab and provider announcements. The selected SDK is an implementation component. The search found no qualifying named deployment of the v0.2 autonomous path.",
    implementations: [
      {
        id: "agent-payments-ap2-python",
        parties: ["agent", "cp", "merchant"],
        kind: "implementation",
        organization: "AP2 project",
        product: "AP2 Python reference SDK",
        role: "Mandate and receipt library",
        release: {
          stage: "unspecified",
          label: "Released in AP2 v0.2.0",
          detail:
            "The reference SDK is in the AP2 v0.2.0 release. The release notes do not name a production support stage.",
        },
        summary:
          "The tagged Python SDK exposes APIs to sign open Checkout and Payment Mandates, append a closed mandate as a delegation hop, verify the chain, and build and verify receipts.",
        limits:
          "The SDK supplies protocol building blocks. Merchant, credential-provider and payment-network policy, real settlement and operating use require separate evidence.",
        sources: [
          {
            title: "AP2 Python SDK README at v0.2.0",
            url: "https://github.com/google-agentic-commerce/AP2/blob/v0.2.0/code/sdk/python/ap2/sdk/README.md",
            publisher: "AP2 project",
          },
          {
            title: "AP2 v0.2.0 release",
            url: "https://github.com/google-agentic-commerce/AP2/releases/tag/v0.2.0",
            publisher: "AP2 project",
            publishedOn: "2026-04-28",
          },
          {
            title: "Google donates Agent Payments Protocol to FIDO Alliance",
            url: "https://blog.google/products-and-platforms/platforms/google-pay/agent-payments-protocol-fido-alliance/",
            publisher: "Google",
            publishedOn: "2026-04-28",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project or vendor documents this mechanism in the named role and scope.",
        },
      },
    ],
    deployments: [],
    observations: [],
    events: [
      {
        id: "agent-payments-review",
        kind: "evidence-added",
        date: "2026-11-13",
        summary: "These sources were added to the implementation record.",
        evidenceIds: ["agent-payments-ap2-python"],
      },
      {
        id: "agent-payments-ap2-v0-2",
        kind: "release",
        date: "2026-04-28",
        summary:
          "The AP2 project released v0.2.0 with a focus on human-not-present flows and a tagged Python reference SDK.",
        evidenceIds: ["agent-payments-ap2-python"],
      },
    ],
  },
  {
    slug: "tool-call-authorization",
    reviewedOn: "2026-11-13",
    scope:
      "AuthZEN evaluations for individual requests. A policy enforcement point maps the request and enforces the response. A policy decision point evaluates it. The draft COAZ mapping for MCP is a separate part of the flow.",
    searchNote:
      "Gateway and policy engine references, release notes and the working group’s interoperability results were reviewed. The searches found implementations and demonstrations. No named AuthZEN tool-call deployment was established in the sources reviewed.",
    implementations: [
      {
        kind: "implementation",
        organization: "Traefik Labs",
        product: "Traefik Hub MCP Gateway and API Gateway",
        role: "Policy enforcement point",
        release: {
          stage: "supported",
          label: "Generally available in v3.21.0",
          detail:
            "Traefik lists AuthZEN authorization among features that graduated to GA on 30 September 2026. The preceding Early Access entry names both gateway surfaces.",
        },
        id: "authzen-traefik-hub",
        parties: ["tool"],
        qualification: "COAZ binding revision unverified.",
        summary:
          "MCP Gateway maps the caller and tool arguments to an external AuthZEN evaluation and enforces the result. API Gateway documents a separate middleware for HTTP requests.",
        limits:
          "The MCP guide shows a gateway-configured COAZ mapping. The sources leave the supported binding revision and coverage of tool-declared mappings unverified.",
        sources: [
          {
            title: "AuthZEN for MCP Gateway",
            url: "https://doc.traefik.io/traefik-hub/mcp-gateway/guides/authzen-mcp",
            publisher: "Traefik Labs",
          },
          {
            title: "AuthZEN for API Gateway",
            url: "https://doc.traefik.io/traefik-hub/api-gateway/reference/routing/http/middlewares/ref-authzen",
            publisher: "Traefik Labs",
          },
          {
            title: "Traefik Hub Gateway v3.21.0 release notes",
            url: "https://doc.traefik.io/traefik-hub/api-gateway/release-notes#gateway-v3210",
            publisher: "Traefik Labs",
            publishedOn: "2026-09-30",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The MCP reference maps a transfer destination to the resource identifier. The HTTP reference maps a refund request. The release notes group both middleware surfaces under AuthZEN authorization.",
        },
      },
      {
        kind: "implementation",
        organization: "OpenFGA project",
        product: "OpenFGA",
        role: "Policy decision point",
        release: {
          stage: "experimental",
          label: "Opt-in experimental API",
          detail:
            "The project requires the authzen experimental flag and says the API can change.",
        },
        id: "authzen-openfga",
        parties: ["policy"],
        summary:
          "Provides single and batch AuthZEN access evaluation against an OpenFGA authorization model, plus search and endpoint discovery.",
        limits:
          "The application or gateway still maps requests and enforces decisions. The docs leave the minimum version unspecified.",
        sources: [
          {
            title: "AuthZEN API (Experimental)",
            url: "https://openfga.dev/docs/interacting/authzen",
            publisher: "OpenFGA project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project’s documentation links the final AuthZEN specification and explains how to enable its decision endpoints.",
        },
      },
      {
        kind: "implementation",
        organization: "Keycloak project",
        product: "Keycloak",
        role: "Policy decision point",
        release: {
          stage: "experimental",
          label: "Experimental in 26.7.0",
          detail:
            "The 9 July 2026 release notes name both evaluation endpoints and the opt-in authzen feature.",
        },
        id: "authzen-keycloak",
        parties: ["policy"],
        summary:
          "Evaluates subject, resource and action against configured Keycloak authorization policies using the AuthZEN 1.0 single and batch evaluation APIs.",
        limits:
          "The release covers the policy decision API. A separate caller has to map and enforce each tool request.",
        sources: [
          {
            title: "Keycloak 26.7.0 released",
            url: "https://www.keycloak.org/2026/07/keycloak-2670-released",
            publisher: "Keycloak project",
            publishedOn: "2026-07-09",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The shipped release confirms the experimental policy decision role described in the earlier announcement.",
        },
      },
      {
        kind: "implementation",
        organization: "ID Partners",
        product: "coaz-pep",
        role: "Policy enforcement engine",
        release: {
          stage: "unspecified",
          label: "Released image documented",
          detail:
            "The setup reference uses image 0.4.2. It leaves the support stage unspecified.",
        },
        id: "authzen-id-partners",
        parties: ["tool"],
        summary:
          "Maps MCP tool calls through declared mappings and sends requests to an AuthZEN decision point. The engine exposes an Envoy authorization service and an HTTP check API.",
        limits:
          "The project’s demonstration uses stand-in authorization and policy servers. The sources do not identify a deployment or claim conformance to a particular binding revision.",
        sources: [
          {
            title: "Federated Enforcement: AuthZEN for AI agents",
            url: "https://federated-enforcement.idpartners.global/",
            publisher: "ID Partners",
          },
          {
            title: "coaz-pep reference",
            url: "https://federated-enforcement.idpartners.global/docs/coaz-pep.html",
            publisher: "ID Partners",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project documents released artifacts, individual tool-call mappings and the limits of its demo setup.",
        },
      },
    ],
    deployments: [],
    observations: [],
    events: [
      {
        id: "tool-call-authorization-review",
        kind: "evidence-added",
        date: "2026-11-13",
        summary:
          "The reviewed sources were added to the implementation record.",
        evidenceIds: [
          "authzen-traefik-hub",
          "authzen-openfga",
          "authzen-keycloak",
          "authzen-id-partners",
        ],
      },
      {
        id: "authzen-traefik-ga",
        kind: "release",
        date: "2026-09-30",
        summary:
          "Traefik Hub listed AuthZEN authorization among features that graduated to general availability in Gateway v3.21.0.",
        evidenceIds: ["authzen-traefik-hub"],
      },
      {
        id: "authzen-keycloak-release",
        kind: "release",
        date: "2026-07-09",
        summary:
          "Keycloak 26.7.0 shipped an experimental AuthZEN decision API.",
        evidenceIds: ["authzen-keycloak"],
      },
    ],
  },
  {
    slug: "access-revocation",
    reviewedOn: "2026-11-13",
    scope:
      "Session Revoked events sent over Shared Signals Framework (SSF) using the Continuous Access Evaluation Profile (CAEP). Signal transmission, reception and enforcement are separate roles. OAuth token revocation at the issuer is covered separately in the guide.",
    searchNote:
      "The review read transmitter and receiver documentation and the OpenID Foundation’s final-spec report on one interoperability exercise at the Authenticate 2025 conference. The sources reviewed did not establish a named live deployment of the Session Revoked flow.",
    implementations: [
      {
        kind: "implementation",
        organization: "Okta",
        product: "Okta SSF Transmitter",
        role: "Signal transmitter",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "caep-okta-transmitter",
        parties: ["company"],
        summary:
          "Maps Okta’s user.session.end event to CAEP Session Revoked and delivers it to a configured receiver as a Security Event Token.",
        limits:
          "The receiver has to accept the event and apply its own session policy. This reference covers the transmitter.",
        sources: [
          {
            title: "SSF Transmitter API",
            url: "https://developer.okta.com/docs/api/openapi/okta-management/management/tags/ssftransmitter",
            publisher: "Okta",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The API reference names the Session Revoked event and the originating Okta event.",
        },
      },
      {
        kind: "implementation",
        organization: "Google",
        product: "Google Workspace Shared Signals",
        role: "Signal receiver",
        release: {
          stage: "preview",
          label: "Closed Beta",
          detail:
            "Google’s guide describes closed enrollment for partner transmitters and Workspace customers.",
        },
        id: "caep-google-workspace",
        parties: ["calendar"],
        summary:
          "Receives the CAEP Session Revoked signal for a Workspace user. Google describes the expected effect as logging out the user’s Workspace sessions.",
        limits:
          "The enrollment guide covers Workspace’s receiver. It gives neither a downstream API denial time nor proof that outstanding access tokens stop working.",
        sources: [
          {
            title:
              "Google Workspace Shared Signals Framework Integration Guide",
            url: "https://developers.google.com/workspace/shared-signals/api/ssf-api",
            publisher: "Google",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The integration guide specifies the receiver’s initial event, sample payload and enrollment stage.",
        },
      },
      {
        kind: "implementation",
        organization: "SailPoint",
        product: "SailPoint Shared Signals Framework",
        role: "Signal transmitter and receiver",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "caep-sailpoint",
        parties: ["company", "calendar"],
        summary:
          "Supports Session Revoked on both transmitter and receiver streams. Operators configure workflows to act on received events.",
        limits:
          "A configured workflow determines what happens after receipt. The guide gives no response time for downstream services.",
        sources: [
          {
            title: "Shared Signals Framework",
            url: "https://documentation.sailpoint.com/saas/help/shared_signals/index.html",
            publisher: "SailPoint",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The supported-event lists include Session Revoked in both roles and the workflow section explains how receivers handle events.",
        },
      },
      {
        kind: "implementation",
        organization: "Omnissa",
        product: "Omnissa Access and Security Events Service",
        role: "Signal transmitter",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "caep-omnissa-access",
        parties: ["company"],
        summary:
          "Configures the Security Events Service to send Session Revoked and Credential Change from Omnissa Access to Apple Business Manager or Apple School Manager.",
        limits:
          "The integration guide documents the Apple pairing. It leaves the deployment setting and timing of downstream session enforcement unspecified.",
        sources: [
          {
            title:
              "Configuring Omnissa Access as an Identity Provider for Apple Business Manager or Apple School Manager",
            url: "https://docs.omnissa.com/AccessABM/ConfigureAccessABMintegration/",
            publisher: "Omnissa",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The operator setup guide names the source events and their CAEP mapping and identifies Apple as the receiver.",
        },
      },
    ],
    deployments: [],
    observations: [
      {
        kind: "observation",
        measure: "reported-count",
        unit: "implementations",
        numerator: 8,
        population:
          "Implementations that passed the transmitter criteria in the OpenID Foundation’s final SSF and CAEP test at Authenticate 2025, held 13–15 October.",
        id: "caep-interop-2025-transmitters",
        summary:
          "The OpenID Foundation’s table lists eight implementations with a transmitter pass. Five also passed as receivers.",
        limits:
          "The table gives no event-level breakdown. Two entries are SGNL implementations. This is one interoperability exercise.",
        sources: [
          {
            title: "Top firms test interoperability of final SSF and CAEP",
            url: "https://openid.net/top-firms-test-interoperability-of-final-ssf-and-caep/",
            publisher: "OpenID Foundation",
            publishedOn: "2025-10-30",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The event organizer’s table reports role-specific test outcomes. The count uses implementation rows and the underlying exercise spans three days.",
        },
      },
    ],
    events: [
      {
        id: "access-revocation-review",
        kind: "evidence-added",
        date: "2026-11-13",
        summary:
          "The reviewed sources were added to the implementation record.",
        evidenceIds: [
          "caep-okta-transmitter",
          "caep-google-workspace",
          "caep-sailpoint",
          "caep-omnissa-access",
          "caep-interop-2025-transmitters",
        ],
      },
    ],
  },
  {
    slug: "biscuit-delegation",
    reviewedOn: "2026-11-13",
    scope:
      "Biscuit authorization tokens that holders can narrow offline by appending checks, with the receiving service verifying the token and applying those checks.",
    searchNote:
      "The review read the project’s library, an agent mesh implementation and reports from two operators. The reports cover separate uses in messaging and data access. Format versions and deployed policy details are limited to what the operators describe.",
    implementations: [
      {
        kind: "implementation",
        organization: "Eclipse Biscuit project",
        product: "biscuit-auth Rust library",
        role: "Token issuer, attenuator and verifier",
        release: {
          stage: "unspecified",
          label: "6.0.0 release documented",
          detail:
            "The project publishes a 6.0.0 release for biscuit-auth. It gives no separate support stage for these functions.",
        },
        id: "biscuit-rust",
        parties: ["issuer", "parent", "worker", "api"],
        summary:
          "Creates a signed Biscuit, appends narrower checks without the issuer’s private key and evaluates the resulting token with an authorizer.",
        limits:
          "The caller supplies its own application facts and policy. The release applies to the Rust library.",
        sources: [
          {
            title: "biscuit-auth 6.0.0 crate documentation",
            url: "https://docs.rs/crate/biscuit-auth/6.0.0",
            publisher: "Eclipse Biscuit project",
          },
          {
            title: "biscuit-auth 6.0.0 release",
            url: "https://github.com/eclipse-biscuit/biscuit-rust/releases/tag/biscuit-auth-6.0.0",
            publisher: "Eclipse Biscuit project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The Rust project’s example shows both the appended block and request-time authorization.",
        },
      },
      {
        kind: "implementation",
        organization: "Google’s open-source Agent Mesh project",
        product: "Agent Mesh",
        role: "Credential issuer, delegator and verifier",
        release: {
          stage: "unspecified",
          label: "Pre-1.0 project",
          detail:
            "The repository describes Agent Mesh as pre-1.0 and says it is outside Google’s officially supported products.",
        },
        id: "biscuit-agent-mesh",
        parties: ["issuer", "parent", "api"],
        qualification:
          "Pre-1.0; outside Google’s officially supported products.",
        summary:
          "The control plane signs short-lived Biscuit credentials. The agent SDK can append restrictions offline before handing one to a sub-agent.",
        limits:
          "The example uses Agent Mesh’s own transport, peer identity and policies. It builds on the Eclipse Biscuit Go library.",
        sources: [
          {
            title: "Agent Mesh architecture and delegation examples",
            url: "https://google.github.io/agentmesh/",
            publisher: "Agent Mesh project",
          },
          {
            title: "Agent Mesh repository README",
            url: "https://raw.githubusercontent.com/google/agentmesh/main/README.md",
            publisher: "Agent Mesh project",
          },
          {
            title: "Agent Mesh Go dependencies",
            url: "https://raw.githubusercontent.com/google/agentmesh/main/go.mod",
            publisher: "Agent Mesh project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project documents offline attenuation for sub-agents, verification at the node and a Biscuit Go dependency.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        organization: "Clever Cloud",
        setting:
          "Managed Apache Pulsar and an internal remote administration agent",
        attribution: "operator-report",
        id: "biscuit-clever-cloud-pulsar",
        summary:
          "Clever Cloud reports using its Java Biscuit plugin for Pulsar. In its internal example, each agent instance receives a narrower token for its own topic and a short-lived token to reply on one temporary topic.",
        limits:
          "The post describes Clever Cloud’s own use as a Biscuit originator. The date of first use and the current internal agent setup are unspecified.",
        sources: [
          {
            title: "Biscuit, the foundation for your authorization systems",
            url: "https://clever-cloud.com/blog/engineering/2021/04/12/introduction-to-biscuit/",
            publisher: "Clever Cloud",
            publishedOn: "2021-04-12",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The operator describes actual internal use, including how it attenuated a token and how the Pulsar plugin checks the request.",
        },
      },
      {
        kind: "deployment",
        organization: "Space and Time",
        setting: "Data platform table authorization",
        attribution: "operator-report",
        id: "biscuit-space-and-time",
        summary:
          "Space and Time reports using Biscuit tokens to authorize access to platform resources. Its developer guide describes verifying requests against a table’s public key and adding checks to narrow an existing Biscuit before sharing it.",
        limits:
          "The sources establish platform use for resources such as tables. They do not identify any customer’s use of delegated tokens.",
        sources: [
          {
            title: "Biscuit Authorization Part I",
            url: "https://www.spaceandtime.io/blog/biscuit-authorization",
            publisher: "Space and Time",
            publishedOn: "2025-03-26",
          },
          {
            title: "About Biscuit Authorization",
            url: "https://docs.spaceandtime.io/docs/biscuit-authorization",
            publisher: "Space and Time",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The operator states that it uses Biscuit for resource authorization. Its guide describes signature verification and attenuation separately from that report.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "biscuit-delegation-review",
        kind: "evidence-added",
        date: "2026-11-13",
        summary:
          "The reviewed sources were added to the implementation record.",
        evidenceIds: [
          "biscuit-rust",
          "biscuit-agent-mesh",
          "biscuit-clever-cloud-pulsar",
          "biscuit-space-and-time",
        ],
      },
      {
        id: "biscuit-space-and-time-report",
        kind: "report-published",
        date: "2025-03-26",
        summary:
          "Space and Time published its account of Biscuit authorization on its data platform.",
        evidenceIds: ["biscuit-space-and-time"],
      },
      {
        id: "biscuit-clever-cloud-report",
        kind: "report-published",
        date: "2021-04-12",
        summary:
          "Clever Cloud published its account of Biscuit authorization in Apache Pulsar.",
        evidenceIds: ["biscuit-clever-cloud-pulsar"],
      },
    ],
  },
  {
    slug: "gnap",
    reviewedOn: "2026-11-13",
    scope:
      "GNAP grant requests and continuation, plus the resource server’s token checks. Implementations may cover a particular profile or part of RFC 9635. RFC 9767 resource-server capabilities need separate evidence.",
    searchNote:
      "The review read a server targeting RFC 9635, Open Payments client and server documentation, and the IETF shepherd report. The deployment account covers the GNAP-based Open Payments profile at a public wallet provider. The full interoperability profile illustrated in the guide remains unverified in this setting.",
    implementations: [
      {
        kind: "implementation",
        organization: "SUNET",
        product: "SUNET Auth Server",
        role: "Authorization server",
        release: {
          stage: "unspecified",
          label: "Described as production-ready",
          detail:
            "The repository uses production-ready wording and lists features and known limitations. It does not name a support stage.",
        },
        id: "gnap-sunet",
        parties: ["as"],
        qualification:
          "No HTTP Message Signatures, key-bound access tokens or RFC 9767 introspection.",
        summary:
          "Targets RFC 9635 and documents grant requests, transaction continuation and browser interaction for consent.",
        limits:
          "The project lists HTTP Message Signatures, key-bound access tokens and RFC 9767 token introspection as unsupported.",
        sources: [
          {
            title: "SUNET Auth Server README",
            url: "https://raw.githubusercontent.com/SUNET/sunet-auth-server/main/README.md",
            publisher: "SUNET",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The project documents the endpoints and known limitations of the server. Repository readiness wording alone does not establish a live deployment.",
        },
      },
      {
        kind: "implementation",
        organization: "Interledger Foundation",
        product: "Rafiki auth and backend services",
        role: "Authorization server and resource-server introspection",
        release: {
          stage: "preview",
          label: "Beta releases documented",
          detail:
            "The project tags its 2.x releases beta and describes the auth service as a reference implementation.",
        },
        id: "gnap-rafiki",
        parties: ["as", "api"],
        qualification: "Full RFC interoperability unverified.",
        summary:
          "Rafiki provides a GNAP authorization server for Open Payments grants. Its backend uses a GNAP introspection client to check access tokens with the auth service.",
        limits:
          "This is the Open Payments profile. The project’s documentation does not claim the full RFC 9635 interoperability profile or RFC 9767 conformance.",
        sources: [
          {
            title: "Open Payments in Rafiki",
            url: "https://rafiki.dev/overview/concepts/open-payments/",
            publisher: "Interledger Foundation",
          },
          {
            title: "Rafiki auth service",
            url: "https://rafiki.dev/integration/deployment/services/auth-service/",
            publisher: "Interledger Foundation",
          },
          {
            title: "Rafiki releases",
            url: "https://github.com/interledger/rafiki/releases",
            publisher: "Interledger Foundation",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The auth service guide names grants, continuation and the library used by the resource-server side. Release tags provide the beta wording.",
        },
      },
      {
        kind: "implementation",
        organization: "Interledger Foundation",
        product: "Open Payments JavaScript client",
        role: "Grant client",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "gnap-open-payments-js",
        parties: ["agent"],
        summary:
          "The client can continue an Open Payments GNAP grant after browser interaction, sending the interaction reference and continuation token to the server’s continuation endpoint.",
        limits:
          "The SDK uses the Open Payments profile. Its examples do not establish compatibility with other GNAP profiles.",
        sources: [
          {
            title: "Grant negotiation and authorization",
            url: "https://openpayments.dev/identity/grants/",
            publisher: "Open Payments project",
          },
          {
            title: "Continue a grant request",
            url: "https://openpayments.dev/sdk/grant-continue/",
            publisher: "Open Payments project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The Open Payments grant documentation names GNAP. The SDK guide shows the actual JavaScript continuation call and its arguments.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        organization: "GateHub",
        setting: "Public Open Payments wallet",
        attribution: "project-report",
        id: "gnap-gatehub-open-payments",
        qualification: "Report predates RFC 9635.",
        summary:
          "The Interledger Foundation reports that GateHub announced a public launch of Open Payments at a 2024 community call. The Foundation’s availability report lists GateHub as an active Open Payments wallet provider in the EU.",
        limits:
          "The evidence applies to the GNAP-based Open Payments profile. The launch report predates RFC 9635 and leaves GateHub’s implementation, supported GNAP revision, exact launch day and traffic unspecified.",
        sources: [
          {
            title: "Community Call Explained!",
            url: "https://community.interledger.org/chiara/community-call-explained-3oh5",
            publisher: "Interledger Foundation",
            publishedOn: "2024-05-21",
          },
          {
            title: "Open Payments Availability Report",
            url: "https://interledger.github.io/reports/availability",
            publisher: "Interledger Foundation",
          },
          {
            title: "Grant negotiation and authorization",
            url: "https://openpayments.dev/identity/grants/",
            publisher: "Open Payments project",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The Foundation relays the operator’s public launch statement and tracks current service availability. The profile documentation establishes Open Payments’ GNAP basis.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "gnap-review",
        kind: "evidence-added",
        date: "2026-11-13",
        summary:
          "The reviewed sources were added to the implementation record.",
        evidenceIds: [
          "gnap-sunet",
          "gnap-rafiki",
          "gnap-open-payments-js",
          "gnap-gatehub-open-payments",
        ],
      },
      {
        id: "gnap-gatehub-report",
        kind: "report-published",
        date: "2024-05-21",
        summary:
          "The Interledger Foundation published its account of GateHub’s public Open Payments launch announcement.",
        evidenceIds: ["gnap-gatehub-open-payments"],
      },
    ],
  },
  {
    slug: "credential-broker",
    reviewedOn: "2026-11-13",
    scope:
      "An intermediary holds the upstream secret outside the agent’s execution environment and attaches it only to selected outbound requests. The intermediary can be a sandbox egress proxy or a service that brokers a specific API.",
    searchNote:
      "The review read sandbox and proxy documentation and two accounts of operated systems. The examples differ in where the intermediary runs and which requests it lets through.",
    implementations: [
      {
        kind: "implementation",
        organization: "Anthropic",
        product: "Claude Managed Agents vaults",
        role: "Managed sandbox egress",
        release: {
          stage: "preview",
          label: "Beta",
          detail:
            "Anthropic marks vaults Beta in its Managed Agents documentation.",
        },
        id: "credential-broker-anthropic",
        parties: ["proxy", "vault"],
        summary:
          "Environment-variable credentials require a managed sandbox. It places an opaque variable there, then substitutes the real secret in configured locations on egress to allowed hosts.",
        limits:
          "Environment variable credentials are unavailable for self-hosted sandboxes. Substitution does not cover local request signing, and tokens returned by an upstream exchange can reach the sandbox.",
        sources: [
          {
            title: "Authenticate with vaults",
            url: "https://platform.claude.com/docs/en/managed-agents/vaults",
            publisher: "Anthropic",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The beta reference documents placeholders, outbound host restrictions, injection locations and unsupported cases.",
        },
      },
      {
        kind: "implementation",
        organization: "Docker",
        product: "Docker Sandboxes",
        role: "Local sandbox host proxy",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "credential-broker-docker",
        parties: ["proxy"],
        summary:
          "The host-side proxy finds the credential for a matching service and overwrites the outbound authentication header. The agent sees a sentinel or placeholder.",
        limits:
          "This entry covers proxy-managed local credentials. A kit can opt into OAuth token passthrough. Custom placeholder replacement applies to headers.",
        sources: [
          {
            title: "Manage credentials in local Docker Sandboxes",
            url: "https://docs.docker.com/ai/sandboxes/configuration/credentials/",
            publisher: "Docker",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The local credential guide specifies host-side interception and which modes can pass a real credential through.",
        },
      },
      {
        kind: "implementation",
        organization: "Vercel",
        product: "Vercel Sandbox firewall",
        role: "Sandbox egress firewall",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "credential-broker-vercel",
        parties: ["proxy"],
        summary:
          "Injects credentials into allowed egress requests while keeping them outside the sandbox. A rule can limit injection by path, method, query or header.",
        limits:
          "Requests that match no transformation can reach an allowed domain without the credential. Postgres and traffic allowed by IP range bypass credential brokering.",
        sources: [
          {
            title: "Sandbox firewall",
            url: "https://vercel.com/docs/sandbox/concepts/firewall",
            publisher: "Vercel",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The firewall reference documents header transformation, request matchers and traffic that bypasses credential injection.",
        },
      },
      {
        kind: "implementation",
        organization: "Cloudflare",
        product: "Cloudflare Sandboxes with Workers",
        role: "Developer-configured credential intermediary",
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The source documents the feature without naming its release stage.",
        },
        id: "credential-broker-cloudflare",
        parties: ["proxy"],
        summary:
          "A Container’s HTTPS request can be intercepted by a Worker that checks the request and adds a token stored outside the sandbox. A Dynamic Worker can call a specific method supplied by the host Worker.",
        limits:
          "The developer supplies the rules and forwarding code. The example limits the credential to GitHub’s GET /user request.",
        sources: [
          {
            title: "Call an authenticated API from a sandbox",
            url: "https://developers.cloudflare.com/sandbox/network/call-an-authenticated-api/",
            publisher: "Cloudflare",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The current integration guide gives separate Container and Dynamic Worker paths, both with the credential held by the host Worker.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        organization: "Listen Labs",
        setting: "Claude Agent SDK file generation in an E2B sandbox",
        attribution: "operator-report",
        id: "credential-broker-listen-labs",
        summary:
          "Listen Labs reports setting a dummy key and directing the SDK to its own proxy. The proxy checks a sandbox-session credential before adding the real API key and forwarding the request.",
        limits:
          "The report describes Listen Labs’ own application proxy for particular services. It gives no publication date or general sandbox escape assessment.",
        sources: [
          {
            title: "We Lied to Our Claude Code Agent (to Make it Safe)",
            url: "https://listenlabs.ai/blog/we-lied-to-our-claude-code-agent",
            publisher: "Listen Labs",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "The engineering account describes its deployed architecture, the restricted network path and the upstream key swap.",
        },
      },
      {
        kind: "deployment",
        organization: "Postman",
        setting: "Internal developer and coding-agent API access",
        attribution: "operator-report",
        id: "credential-broker-postman",
        qualification: "No sandbox boundary claimed.",
        summary:
          "Postman reports replacing keys on developer machines with credential references. A daemon routes calls to a corporate-network proxy that checks the request’s identity and scope, resolves the reference in a vault and calls the API.",
        limits:
          "This is a developer-machine proxy deployment. The report does not describe a sandbox boundary or establish that unrelated traffic is mediated.",
        sources: [
          {
            title: "Postman Passport Case Study",
            url: "https://www.postman.com/customer-stories/postman-passport/",
            publisher: "Postman",
          },
          {
            title: "How Postman Ended Credential Sprawl with Passport",
            url: "https://blog.postman.com/credential-sprawl/",
            publisher: "Postman",
            publishedOn: "2026-10-06",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-13",
          rationale:
            "Postman’s account describes its own rollout, including actual daemon deployment and call-time credentials kept on the proxy side.",
        },
      },
    ],
    observations: [],
    events: [
      {
        id: "credential-broker-review",
        kind: "evidence-added",
        date: "2026-11-13",
        summary:
          "The reviewed sources were added to the implementation record.",
        evidenceIds: [
          "credential-broker-anthropic",
          "credential-broker-docker",
          "credential-broker-vercel",
          "credential-broker-cloudflare",
          "credential-broker-listen-labs",
          "credential-broker-postman",
        ],
      },
      {
        id: "credential-broker-postman-report",
        kind: "report-published",
        date: "2026-10-06",
        summary:
          "Postman published its account of deploying Passport for internal API access.",
        evidenceIds: ["credential-broker-postman"],
      },
    ],
  },
];
