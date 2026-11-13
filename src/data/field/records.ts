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
          "These sources were added to the field record. Earlier reports and releases keep their own dates.",
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
        organization: "Amazon Web Services",
        product: "AWS CLI",
        role: "CLI client",
        summary:
          "Uses device authorization for IAM Identity Center sign-in when invoked with the use-device-code option on AWS CLI 2.22.0 and later.",
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
          "Added the reviewed implementation and deployment sources to the field record.",
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
        organization: "Okta",
        product: "Okta OAuth service apps",
        role: "Authorization server",
        summary:
          "Documents client_credentials and requires private_key_jwt for service apps requesting Okta scopes.",
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
          "Added the reviewed implementation and deployment sources to the field record.",
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
          "Added the reviewed implementation and deployment sources to the field record.",
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
        summary: "These sources were added to the field record.",
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
        summary: "These sources were added to the field record.",
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
];
