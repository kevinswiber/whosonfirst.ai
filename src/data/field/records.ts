import type { FieldProfile } from "./model.ts";

// Primary-source review and exclusions: docs/adoption/evidence-review.md.
export const profiles: FieldProfile[] = [
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
          "These sources were added to the field record. Earlier reports and releases keep their own dates.",
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
      "Selected issuer, client and resource-server documentation and one operator roadmap were reviewed. Profile requirements and certification listings were not counted as production deployments or release-stage evidence.",
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
          "These sources were added to the field record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "dpop-keycloak",
          "dpop-oauth4webapi",
          "dpop-spring",
          "dpop-helseid",
        ],
      },
      {
        id: "keycloak-dpop-supported",
        kind: "release",
        date: "2025-09-30",
        summary: "Keycloak 26.4.0 promoted DPoP from preview to supported.",
        evidenceIds: ["dpop-keycloak"],
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
          "These sources were added to the field record. Earlier reports and releases keep their own dates.",
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
          "These sources were added to the field record. Earlier reports and releases keep their own dates.",
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
          "These sources were added to the field record. Earlier reports and releases keep their own dates.",
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
];
