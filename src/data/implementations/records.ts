import type { ImplementationProfile } from "./model.ts";

// Primary-source review and exclusions: docs/adoption/evidence-review.md.
export const profiles: ImplementationProfile[] = [
  {
    slug: "authorization-code-pkce",
    reviewedOn: "2026-11-14",
    scope:
      "Authorization code with PKCE, including S256 for the illustrated client. Client libraries and authorization servers supply different parts of this flow.",
    genericParties: ["api"],
    searchNote:
      "Selected authorization-server documentation, one client library and a release announcement were reviewed. Generic OAuth support alone was excluded. No qualifying operator deployment account was selected from these sources. A further search on 14 November 2026 added client libraries, another issuer and three operators’ accounts of moving their own sign-in to PKCE. An API needs nothing particular to PKCE and was not looked for.",
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
      {
        kind: "implementation",
        id: "pkce-aws-cli",
        organization: "Amazon Web Services",
        product: "AWS CLI v2",
        role: "CLI client",
        parties: ["agent"],
        release: {
          stage: "supported",
          label: "Default from 2.22.0",
          detail:
            "AWS announced on 18 November 2024 that the CLI “now supports” the PKCE code flow and made it the default for IAM Identity Center sign-in from 2.22.0.",
        },
        summary:
          "Uses the authorization code flow with PKCE by default for aws sso login and aws configure sso, from version 2.22.0. Device authorization stays available with an option.",
        limits:
          "The announcement covers sign-in to IAM Identity Center. It does not establish use with other authorization servers, or the resource indicator shown on this flow.",
        sources: [
          {
            title: "AWS CLI Adds PKCE-based Authorization for SSO",
            url: "https://aws.amazon.com/blogs/developer/aws-cli-adds-pkce-based-authorization-for-sso",
            publisher: "Amazon Web Services",
            publishedOn: "2024-11-18",
            section: "AWS CLI Adds PKCE-based Authorization for SSO",
            quote:
              "As of version 2.22.0, this new standard is the default behavior when running the aws sso login or aws configure sso commands.",
          },
          {
            title:
              "AWS Command Line Interface adds PKCE-based authorization for single sign-on",
            url: "https://aws.amazon.com/about-aws/whats-new/2024/11/aws-command-line-interface-pkce-single-sign-on",
            publisher: "Amazon Web Services",
            publishedOn: "2024-11-18",
            section:
              "AWS Command Line Interface adds PKCE-based authorization for single sign-on",
            quote:
              "The AWS Command Line Interface (AWS CLI) v2 now supports OAuth 2.0 authorization code flows using the Proof Key for Code Exchange (PKCE) standard.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The vendor’s dated release announcement read for this product, role and mechanism. The stage rests on “now supports” and the change of default.",
        },
      },
      {
        kind: "implementation",
        id: "pkce-go-oauth2",
        organization: "Go project",
        product: "golang.org/x/oauth2",
        role: "Go client library",
        parties: ["agent"],
        release: {
          stage: "unspecified",
          label: "Added in v0.13.0",
          detail:
            "The package documentation marks the PKCE functions as added in v0.13.0. It names no release stage, and the module is versioned below 1.0.",
        },
        summary:
          "Generates a code verifier, adds an S256 challenge to the authorization URL and sends the verifier with the code exchange.",
        limits:
          "A client building block. The documentation warns that not all servers support PKCE. Where tokens are kept and which redirect is used are left to the application.",
        sources: [
          {
            title: "oauth2 package",
            url: "https://pkg.go.dev/golang.org/x/oauth2",
            publisher: "Go project",
            section: "func S256ChallengeOption",
            quote:
              "S256ChallengeOption derives a PKCE code challenge from the verifier with method S256.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The package’s own documentation, generated from its source, read for this role and mechanism. Release wording is limited to the version marker it shows.",
        },
      },
      {
        kind: "implementation",
        id: "pkce-keycloak",
        organization: "Keycloak",
        product: "Keycloak",
        role: "Authorization server",
        parties: ["as"],
        release: {
          stage: "supported",
          label: "Supported",
          detail:
            "The project’s specifications table marks RFC 7636 Supported. The checked sources do not date its introduction.",
        },
        summary:
          "Lists RFC 7636 as supported. An administrator can require S256 for a client; with no method set, PKCE is applied only when the client sends it.",
        limits:
          "A self-hosted server. Requiring PKCE is a per-client setting. The sources do not establish the resource indicator or token audience shown on this flow.",
        sources: [
          {
            title: "Specifications implemented",
            url: "https://www.keycloak.org/securing-apps/specifications",
            publisher: "Keycloak",
            section: "OAuth",
            quote:
              "Proof Key for Code Exchange by OAuth Public Clients (RFC 7636) Supported",
          },
          {
            title: "Server Administration Guide",
            url: "https://www.keycloak.org/docs/latest/server_admin/",
            publisher: "Keycloak",
            section: "Capability Config",
            quote:
              "Keycloak applies to the client PKCE whose code challenge method is S256.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "Primary documentation read for this product, role and mechanism. The specifications table is a table row, quoted as its two cells.",
        },
      },
    ],
    deployments: [
      {
        kind: "deployment",
        id: "pkce-yoto-report",
        organization: "Yoto",
        setting:
          "Yoto Developer API sign-in for third-party CLI and desktop apps",
        attribution: "operator-report",
        summary:
          "Yoto documents sign-in for its developer API with PKCE and a loopback callback for public clients, and says device code for CLIs is deprecated.",
        limits:
          "Yoto’s own developer guide. It gives no date for the change, no count of apps and no date the device code flow ends.",
        sources: [
          {
            title: "Headless / CLI Authentication",
            url: "https://yoto.dev/authentication/headless-cli-auth/",
            publisher: "Yoto",
            section: "How It Works",
            quote:
              "Your app exchanges that code (plus the PKCE verifier) for tokens.",
          },
          {
            title: "Migrating from device_code workflows",
            url: "https://yoto.dev/authentication/device-code-migration/",
            publisher: "Yoto",
            section: "Migrating from `device_code` workflows",
            quote: "Using a device code in CLIs is deprecated.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator documents the mechanism for its own API. Usage and interoperability were not independently tested.",
        },
      },
      {
        kind: "deployment",
        id: "pkce-etsy-report",
        organization: "Etsy",
        setting: "Etsy Open API v3 authorization for third-party apps",
        attribution: "operator-report",
        summary:
          "Etsy documents that its Open API v3 requires a PKCE pair on the authorization and token requests, with S256 as the only method.",
        limits:
          "Etsy’s own developer documentation. It gives no launch date, no count of apps and no statement about which clients are public.",
        sources: [
          {
            title: "Authentication",
            url: "https://developers.etsy.com/documentation/essentials/authentication",
            publisher: "Etsy",
            section: "Requesting an OAuth Token",
            quote:
              "A code verifier and generated code challenge proof key for code exchange (PKCE) pair required in the token request and authorization code request respectively.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator documents the mechanism for its own API. Usage and interoperability were not independently tested.",
        },
      },
      {
        kind: "deployment",
        id: "pkce-canva-report",
        organization: "Canva",
        setting:
          "Canva REST APIs (formerly Connect APIs), public and private apps",
        attribution: "operator-report",
        summary:
          "Canva documents that apps acting for a Canva user use the authorization code flow with PKCE. Its service apps use client credentials instead.",
        limits:
          "Canva’s own developer documentation. It gives no launch date and no count of apps.",
        sources: [
          {
            title: "Authentication",
            url: "https://www.canva.dev/docs/apps/rest-apis/authentication/",
            publisher: "Canva",
            section: "Authentication",
            quote:
              "act on behalf of a Canva user, using the OAuth authorization code flow with Proof Key for Code Exchange (PKCE)",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator documents the mechanism for its own API. Usage and interoperability were not independently tested.",
        },
      },
    ],
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
      {
        id: "authorization-code-pkce-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "pkce-aws-cli",
          "pkce-go-oauth2",
          "pkce-keycloak",
          "pkce-yoto-report",
          "pkce-etsy-report",
          "pkce-canva-report",
        ],
      },
    ],
  },
  {
    slug: "dpop",
    reviewedOn: "2026-11-14",
    scope:
      "OAuth DPoP at the application layer. Proof generation, token binding and resource-server enforcement are separate roles; mTLS and JWT client authentication are outside this record.",
    searchNote:
      "Selected issuer documentation, a client library, a resource-server library, dated releases and the HelseID operator roadmap were reviewed. Certification and protocol requirements alone were excluded as deployment evidence. This is a set of reviewed examples, not a complete implementation inventory. A further search on 14 November 2026 added two issuers, two client libraries, two resource-server components and ID-porten’s guide. No operator’s account of an API enforcing DPoP was found beyond Okta’s own management APIs.",
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
      {
        kind: "implementation",
        id: "dpop-mcp-typescript-sdk",
        organization: "Model Context Protocol project",
        product: "MCP TypeScript SDK client",
        role: "MCP client SDK",
        parties: ["agent"],
        release: {
          stage: "unspecified",
          label: "Added in client 2.1.0",
          detail:
            "The client package changelog lists DPoP support under 2.1.0. It gives no release date or stage word.",
        },
        summary:
          "The @modelcontextprotocol/client package: an MCP client that implements the provider’s dpop() method gets DPoP proofs on token requests and on requests to the MCP server, with one retry on a use_dpop_nonce challenge.",
        limits:
          "Covers the client package. The changelog names SEP-1932 and RFC 9449. The server package’s changelog does not list DPoP verification, so an MCP server has to check proofs itself. Key storage is the application’s.",
        sources: [
          {
            title: "@modelcontextprotocol/client CHANGELOG",
            url: "https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/client/CHANGELOG.md",
            publisher: "Model Context Protocol project",
            section: "2.1.0",
            quote:
              "Add DPoP (RFC 9449 / SEP-1932) sender-constrained access token support to the client.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s own changelog read for this package, role and mechanism. Read from raw.githubusercontent.com.",
        },
      },
      {
        kind: "implementation",
        id: "dpop-nimbus",
        organization: "Connect2id",
        product: "Nimbus OAuth 2.0 SDK with OpenID Connect extensions",
        role: "Java client and resource-server library",
        parties: ["agent", "api"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The example page documents the classes without a version or release stage.",
        },
        summary:
          "A Java library with a proof factory for DPoP token and resource requests, and a verifier a resource server uses to check the proof and the token’s key binding.",
        limits:
          "Library functions only. The page does not name the version that added them. Nonce issuance, replay storage beyond the in-memory checker and key custody are the application’s.",
        sources: [
          {
            title: "OAuth 2.0 DPoP sender-constrained access tokens",
            url: "https://connect2id.com/products/nimbus-oauth-openid-connect-sdk/examples/oauth/dpop",
            publisher: "Connect2id",
            section: "Client DPoP",
            quote:
              "How to generate a client signing EC key and use it to make a DPoP secured token request followed by a DPoP secured protected resource request:",
          },
          {
            title: "OAuth 2.0 DPoP sender-constrained access tokens",
            url: "https://connect2id.com/products/nimbus-oauth-openid-connect-sdk/examples/oauth/dpop",
            publisher: "Connect2id",
            section:
              "DPoP proof and access token binding validation at a resource server",
            quote:
              "The SDK provides a DPoPProtectedResourceRequestVerifier for resource servers to validate requests from clients with a DPoP proof and access token:",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s own documentation read for both roles. No release stage is stated.",
        },
      },
      {
        kind: "implementation",
        id: "dpop-duende-jwtbearer",
        organization: "Duende Software",
        product: "Duende JwtBearer Extensions",
        role: "ASP.NET Core resource-server library",
        parties: ["api"],
        release: {
          stage: "unspecified",
          label: "Version 1.0 announced 2 February 2026",
          detail:
            "Duende announced version 1.0 of the package on 2 February 2026. The post does not use a stage word.",
        },
        summary:
          "Extends the ASP.NET Core JwtBearer handler to check the DPoP scheme, the proof and the cnf binding, with replay detection on by default and optional server nonces.",
        limits:
          "Covers APIs built on ASP.NET Core. Replay detection needs a cache the host provides. The issuer is a separate product.",
        sources: [
          {
            title:
              "DPoP Security for .NET APIs with JwtBearer Extensions v1.0.0",
            url: "https://duendesoftware.com/blog/20260202-dpop-security-for-dotnet-apis-with-jwtbearer-extensions-v1",
            publisher: "Duende Software",
            publishedOn: "2026-02-02",
            section:
              "DPoP Security for .NET APIs with JwtBearer Extensions v1.0.0",
            quote:
              "Today we are excited to announce version 1.0 of our Duende.AspNetCore.Authentication.JwtBearer (JwtBearer Extensions) package, which helps you implement Demonstrating Proof-of-Possession (DPoP) in .NET-powered APIs.",
          },
          {
            title: "Proof-of-Possession: Validating DPoP",
            url: "https://docs.duendesoftware.com/identityserver/apis/aspnetcore/confirmation/",
            publisher: "Duende Software",
            section: "Validating DPoP",
            quote:
              "Replay detection of DPoP proofs is enabled by default, and uses a keyed HybridCache registration.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s release post and API documentation read for this role and mechanism. The post’s date is its publication date.",
        },
      },
      {
        kind: "implementation",
        id: "dpop-kong",
        organization: "Kong",
        product: "Kong Gateway OpenID Connect plugin",
        role: "Gateway verifier",
        parties: ["api"],
        release: {
          stage: "supported",
          label: "Documented with the plugin’s FAPI features",
          detail:
            "Kong lists DPoP among the FAPI features the plugin supports, under a heading marked v3.7+. No release day is given.",
        },
        summary:
          "With proof_of_possession_dpop set to strict, the gateway checks the DPoP header against the access token. It then removes the header and passes the token upstream as a bearer token.",
        limits:
          "The issuer has to bind the token. Upstream services behind the gateway receive a bearer token and rely on the gateway’s check.",
        sources: [
          {
            title: "OpenID Connect plugin",
            url: "https://developer.konghq.com/plugins/openid-connect/",
            publisher: "Kong",
            section: "Demonstrating proof-of-possession (DPoP)",
            quote:
              "When DPoP is enabled, Kong Gateway validates the DPoP header in the request to ensure that the sender is authorized to use the access token.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s plugin documentation read for this role and mechanism. The 3.7+ marker is on the FAPI heading the DPoP row sits under; the stage follows the page’s “supports”.",
        },
        qualification: "The plugin page marks it Enterprise only.",
      },
      {
        kind: "implementation",
        id: "dpop-okta",
        organization: "Okta",
        product: "Okta",
        role: "Authorization server and Okta management APIs",
        parties: ["as", "api"],
        release: {
          stage: "supported",
          label: "GA in Production",
          detail:
            "Okta’s developer release notes list DPoP as GA in Production in release 2023.12.0, and DPoP for Okta management APIs as GA in Production in release 2024.02.0.",
        },
        summary:
          "Issues DPoP-bound access tokens to clients that require DPoP, asks for a server nonce with use_dpop_nonce, and accepts DPoP-bound tokens at Okta’s own management APIs.",
        limits:
          "The release notes cited are Okta’s Classic Engine API notes. Other APIs have to check proofs themselves; the guide lists the checks but does not supply them.",
        sources: [
          {
            title: "Okta Classic Engine API release notes (2023)",
            url: "https://developer.okta.com/docs/release-notes/2023/",
            publisher: "Okta",
            section: "Monthly release 2023.12.0",
            quote: "Demonstrating Proof-of-Possession is GA in Production",
          },
          {
            title: "Okta Classic Engine API release notes (2024)",
            url: "https://developer.okta.com/docs/release-notes/2024/",
            publisher: "Okta",
            section: "Monthly release 2024.02.0",
            quote: "DPoP support for Okta management APIs is GA in Production",
          },
          {
            title: "Configure OAuth 2.0 Demonstrating Proof-of-Possession",
            url: "https://developer.okta.com/docs/guides/dpop/oktaresourceserver/main/",
            publisher: "Okta",
            section: "Make a request to a DPoP-protected resource",
            quote:
              "When you make requests to an Okta resource, there are a few more steps required than when you make requests to a non-Okta resource",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s release notes and guide read for both roles. The notes’ dates are expected-in-preview dates, so no release date is recorded.",
        },
      },
      {
        kind: "implementation",
        id: "dpop-google",
        organization: "Google",
        product: "Google OAuth Platform",
        role: "Authorization server, refresh tokens only",
        parties: ["as"],
        release: {
          stage: "supported",
          label: "Announced 15 October 2026",
          detail:
            "Google’s announcement says the OAuth Platform supports DPoP binding for refresh tokens.",
        },
        summary:
          "Binds refresh tokens to the client’s DPoP key. Access tokens stay bearer tokens, so Google APIs do not check a proof on each call.",
        qualification: "Refresh tokens only.",
        limits:
          "Access tokens are not sender-constrained, so the API half of the diagram does not apply to Google APIs. The post does not say which clients or grants are covered.",
        sources: [
          {
            title:
              "Announcing DPoP Support for Google OAuth: Securing Refresh Tokens",
            url: "https://developers.googleblog.com/announcing-dpop-support-for-google-oauth-securing-refresh-tokens/",
            publisher: "Google",
            publishedOn: "2026-10-15",
            section:
              "Announcing DPoP Support for Google OAuth: Securing Refresh Tokens",
            quote:
              "Google's OAuth Platform supports DPoP binding specifically for refresh tokens.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s own announcement read for this role and mechanism. It describes a narrower binding than the flow page draws, which the summary states.",
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
      {
        kind: "deployment",
        id: "dpop-idporten",
        organization: "Digitaliseringsdirektoratet (Digdir)",
        setting: "ID-porten national login service",
        attribution: "operator-report",
        summary:
          "Digdir’s ID-porten documentation says ID-porten checks the DPoP proof on token calls and returns tokens bound to the client’s key. Refresh tokens are bound too for clients without client authentication.",
        limits:
          "Operator documentation in Norwegian, with no date for first use. It says APIs must check the binding themselves and does not name any that do. Traffic is unknown.",
        sources: [
          {
            title: "DPoP | ID-porten",
            url: "https://docs.digdir.no/docs/idporten/oidc/oidc_func_dpop",
            publisher: "Digitaliseringsdirektoratet",
            section: "Om funksjonaliteten",
            quote:
              "ID-porten validerer at DPoP-headeren er korrekt signert og samsvarer med forespørselen.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator describes this mechanism in its own service’s documentation. Read in Norwegian. No independent operational test.",
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
      {
        id: "dpop-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "dpop-mcp-typescript-sdk",
          "dpop-nimbus",
          "dpop-duende-jwtbearer",
          "dpop-kong",
          "dpop-okta",
          "dpop-google",
          "dpop-idporten",
        ],
      },
    ],
  },
  {
    slug: "mcp-authorization",
    reviewedOn: "2026-11-14",
    scope:
      "Remote HTTP MCP authorization, with the site’s 28 July 2026 revision as context. Each entry covers the named role and features; it is not a claim of complete revision conformance.",
    searchNote:
      "Selected client, library and authorization-server guides and a hosted operator’s documentation were reviewed. Stdio credentials, API-key-only access and generic OAuth were excluded. No live OAuth exchange or endpoint survey was run. A further search on 14 November 2026 added an SDK, another client, a gateway, an issuer and two hosted servers’ own accounts. No VS Code page documenting its discovery or Client ID Metadata Documents was found.",
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
      {
        kind: "implementation",
        id: "mcp-python-sdk",
        organization: "Model Context Protocol project",
        product: "MCP Python SDK",
        role: "Client OAuth provider and resource-server support",
        parties: ["client", "mcp"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a feature release stage.",
        },
        summary:
          "On the server side, the SDK verifies bearer tokens through an application-supplied verifier, publishes RFC 9728 metadata and answers with a 401 that points to it. On the client side, it follows that pointer, discovers the authorization server and runs the code flow with PKCE, using a Client ID Metadata Document where the server advertises support.",
        limits:
          "The application writes the token check itself and reports the token’s audience. The SDK refuses a token issued for another resource only when validate_token_resource is set, which is not yet the default. The client falls back to dynamic registration when the server does not advertise metadata documents. The SDK does not supply sign-in, consent or token issuance.",
        sources: [
          {
            title: "Authorization",
            url: "https://py.sdk.modelcontextprotocol.io/run/authorization/",
            publisher: "MCP Python SDK project",
            section: "Recap",
            quote:
              "The SDK publishes RFC 9728 Protected Resource Metadata at /.well-known/oauth-protected-resource/... and answers unauthenticated requests with a 401 whose WWW-Authenticate header points at it.",
          },
          {
            title: "OAuth clients",
            url: "https://py.sdk.modelcontextprotocol.io/client/oauth-clients/",
            publisher: "MCP Python SDK project",
            section: "What the provider does for you",
            quote:
              "learns which authorization server protects this resource, and fetches that server's metadata",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project documents both roles for this mechanism. The client quote is the middle of a sentence, cut where inline code would break the match; the page’s Client ID Metadata Documents section names the 2026-07-28 revision.",
        },
      },
      {
        kind: "implementation",
        id: "mcp-codex",
        organization: "OpenAI",
        product: "Codex",
        role: "MCP client",
        parties: ["client"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a release stage for this capability.",
        },
        summary:
          "Documents OAuth for Streamable HTTP MCP servers, with Client ID Metadata Documents chosen when the authorization server advertises them and dynamic registration otherwise. It checks the returned issuer and can take scopes from the protected-resource metadata.",
        limits:
          "The page does not name a target MCP revision. A pre-registered client ID skips registration. It does not establish behavior in every Codex surface or with every authorization server.",
        sources: [
          {
            title: "Model Context Protocol",
            url: "https://learn.chatgpt.com/docs/extend/mcp",
            publisher: "OpenAI",
            section: "OAuth client registration",
            quote:
              "Codex supports OAuth Client ID Metadata Documents (CIMD) and Dynamic Client Registration (DCR).",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "Primary documentation read for this product, role and mechanism. developers.openai.com/codex/mcp redirects to this page.",
        },
      },
      {
        kind: "implementation",
        id: "mcp-agentcore-gateway",
        organization: "Amazon Web Services",
        product: "Amazon Bedrock AgentCore Gateway",
        role: "MCP gateway, resource-server side",
        parties: ["mcp"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a release stage for this capability.",
        },
        summary:
          "With JWT inbound authorization, the gateway checks tokens from a configured identity provider against an allowed audience, clients and scopes. A 401 or 403 carries a resource_metadata pointer to its protected-resource metadata.",
        limits:
          "The identity provider is the authorization server. The guide warns that providers differ in whether they use the requested resource URL as the audience. IAM-based inbound authorization is a separate path.",
        sources: [
          {
            title: "Set up inbound authorization for your gateway",
            url: "https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-inbound-auth.html",
            publisher: "Amazon Web Services",
            section: "Scope advertisement in authentication challenges",
            quote:
              "The WWW-Authenticate header includes resource_metadata and scope parameters.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "Primary documentation read for this product, role and mechanism. Release wording is limited to what the cited source states.",
        },
      },
      {
        kind: "implementation",
        id: "mcp-auth0",
        organization: "Auth0",
        product: "Auth0 Auth for MCP",
        role: "Authorization server",
        parties: ["as"],
        release: {
          stage: "supported",
          label: "Generally available 6 May 2026",
          detail:
            "Auth0 announced the general availability of Auth for MCP on 6 May 2026, including Client ID Metadata Document registration and resource identifiers.",
        },
        summary:
          "Issues tokens for MCP servers, supports resource identifiers and registers clients from Client ID Metadata Documents that an administrator enters. Registration by the client itself at runtime is a separate feature in Early Access.",
        limits:
          "A tenant setting turns metadata-document registration on. Dynamic registration at runtime is in Early Access and not every tenant has it. The MCP server still publishes its own metadata and checks tokens.",
        sources: [
          {
            title: "Auth for MCP Is Now Generally Available",
            url: "https://auth0.com/blog/auth0-auth-for-mcp-servers-generally-available/",
            publisher: "Auth0",
            publishedOn: "2026-05-06",
            section:
              "Support for Client ID Metadata Document (CIMD) Client Registration",
            quote:
              "In Auth0, your tenant admin provides that URL, and Auth0 fetches the metadata, validates it, and shows it to the admin for confirmation before creating the client.",
          },
          {
            title: "Register Applications with CIMD",
            url: "https://auth0.com/docs/get-started/auth0-overview/create-applications/register-applications-with-cimd",
            publisher: "Auth0",
            section: "Register applications with CIMD",
            quote:
              "When dynamic CIMD registration is enabled, applications register themselves at runtime via their CIMD URL with Auth0.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The vendor’s dated GA announcement and its product documentation read for this role and mechanism. The stage comes from “General Availability” in the announcement.",
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
      {
        kind: "deployment",
        id: "mcp-github-report",
        organization: "GitHub",
        setting: "Remote GitHub MCP Server",
        attribution: "operator-report",
        summary:
          "GitHub announced its remote MCP server as generally available with OAuth sign-in, and its host guide describes protected-resource discovery from the 401 challenge.",
        limits:
          "The guide follows the 2025-06-18 MCP revision and says dynamic client registration is not supported. Clients use a GitHub App or OAuth App. No count of users or sign-ins.",
        sources: [
          {
            title: "Remote GitHub MCP Server is now generally available",
            url: "https://github.blog/changelog/2025-09-04-remote-github-mcp-server-is-now-generally-available/",
            publisher: "GitHub",
            publishedOn: "2025-09-04",
            section: "Remote GitHub MCP Server is now generally available",
            quote:
              "The remote GitHub MCP Server is now generally available. We’ve introduced OAuth-based authentication, expanded tooling, and improved security guardrails.",
          },
          {
            title: "GitHub Remote MCP Integration Guide for MCP Host Authors",
            url: "https://github.com/github/github-mcp-server/blob/main/docs/host-integration.md",
            publisher: "GitHub",
            section: "Authentication and Authorization",
            quote:
              "Dynamic Client Registration is NOT supported by Remote GitHub MCP Server at this time.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator documents the mechanism for its own hosted service, with a dated release. The exchange was not tested.",
        },
      },
      {
        kind: "deployment",
        id: "mcp-linear-report",
        organization: "Linear",
        setting: "Linear hosted MCP server",
        attribution: "operator-report",
        summary:
          "Linear documents OAuth 2.1 with dynamic client registration for interactive setup of its hosted MCP server, and read-only access through a read scope.",
        limits:
          "Linear’s own documentation, undated. Bearer tokens and API keys are also accepted. It does not name an MCP revision.",
        sources: [
          {
            title: "MCP server",
            url: "https://linear.app/docs/mcp",
            publisher: "Linear",
            section: "General",
            quote:
              "The interactive setup flow uses OAuth 2.1 with dynamic client registration.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator documents the mechanism for its own hosted service. The exchange was not tested.",
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
      {
        id: "mcp-authorization-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "mcp-python-sdk",
          "mcp-codex",
          "mcp-agentcore-gateway",
          "mcp-auth0",
          "mcp-github-report",
          "mcp-linear-report",
        ],
      },
    ],
  },
  {
    slug: "workload-identity-federation",
    reviewedOn: "2026-11-14",
    scope:
      "A workload presents a runtime-established identity across a trust boundary to obtain short-lived access. Issuer, receiving token service and broker roles are distinct.",
    searchNote:
      "Selected issuer and receiving-service documentation and Pulumi’s account of its own CI were reviewed. Same-domain identity, generic OIDC and the pilot’s project count as organizations were excluded. A further search on 14 November 2026 added AWS’s issuer and token service, Kubernetes, client libraries, two package registries that accept federated tokens and Chainguard’s account. No company’s own account of Google Cloud or Entra federation was found.",
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
      {
        kind: "implementation",
        id: "wif-aws-sts",
        organization: "Amazon Web Services",
        product: "AWS STS with IAM OIDC federation",
        role: "Receiving token service",
        parties: ["sts"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The user guide documents the feature without naming a release stage.",
        },
        summary:
          "The AssumeRoleWithWebIdentity call exchanges a JWT from an OIDC-compatible identity provider, such as GitHub Actions, for temporary AWS credentials that map to an IAM role.",
        limits:
          "The receiver allows five minutes past the token’s expiry for clock skew. What a trust policy can match on, and the permissions behind the role, are the account owner’s configuration.",
        sources: [
          {
            title: "OIDC federation",
            url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html",
            publisher: "Amazon Web Services",
            section: "OIDC federation",
            quote:
              "They receive an authentication token, known as a JSON Web Token (JWT), and then exchange that token for temporary security credentials in AWS that map to an IAM role with permissions to use specific resources in your AWS account.",
          },
          {
            title: "AssumeRoleWithWebIdentity",
            url: "https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html",
            publisher: "Amazon Web Services",
            section: "AssumeRoleWithWebIdentity",
            quote:
              "Returns a set of temporary security credentials for users who have been authenticated in a mobile or web application with a web identity provider.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents its token service receiving tokens from another trust domain. The user guide states that OIDC federation supports machine-to-machine authentication such as CI/CD pipelines.",
        },
      },
      {
        kind: "implementation",
        id: "wif-aws-outbound",
        organization: "Amazon Web Services",
        product: "AWS IAM outbound identity federation",
        role: "Runtime identity issuer",
        parties: ["idp"],
        release: {
          stage: "supported",
          label: "Launched 19 November 2025",
          detail:
            "The launch post says the feature is available at no additional cost in all AWS commercial Regions, AWS GovCloud (US) Regions and China Regions.",
        },
        summary:
          "Lets an AWS workload request a short-lived, signed JWT from AWS STS with GetWebIdentityToken, for an external service to verify against keys published at the account’s issuer URL.",
        limits:
          "The feature has to be enabled per account. The external service’s exchange and trust rules are its own, and the pages read do not name services that accept the tokens.",
        sources: [
          {
            title: "Federating AWS identities to external services",
            url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_outbound.html",
            publisher: "Amazon Web Services",
            section: "Federating AWS identities to external services",
            quote:
              "IAM outbound identity federation enables your AWS workloads to securely access external services without storing long-term credentials.",
          },
          {
            title:
              "Simplify access to external services using AWS IAM Outbound Identity Federation",
            url: "https://aws.amazon.com/blogs/aws/simplify-access-to-external-services-using-aws-iam-outbound-identity-federation/",
            publisher: "Amazon Web Services",
            publishedOn: "2025-11-19",
            section: "Additional things to know",
            quote:
              "Availability – AWS IAM outbound identity federation is available at no additional cost in all AWS commercial Regions , AWS GovCloud (US) Regions , and China Regions.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents its platform issuing workload identity credentials for receivers in other trust domains, and its launch post gives the date and availability. The ‘ ,’ spacing in the second quote is the page’s, from link markup. The user guide’s sentence naming GetWebIdentityToken was read in the HTML but the check fetches a Markdown rendering where the name is a link, so a neighbouring sentence is quoted.",
        },
      },
      {
        kind: "implementation",
        id: "wif-kubernetes",
        organization: "Kubernetes project",
        product:
          "Kubernetes service account token projection and issuer discovery",
        role: "Runtime identity issuer",
        parties: ["idp"],
        release: {
          stage: "supported",
          label: "Stable since v1.21",
          detail:
            "The documentation marks service account issuer discovery as stable since Kubernetes v1.21 and token volume projection as stable since v1.20.",
        },
        summary:
          "Issues projected service account tokens to pods and publishes an OIDC discovery document and keys, so that external systems can act as relying parties and validate those tokens.",
        limits:
          "The issuer URL and keys have to be reachable by the receiver, and access to the discovery endpoints is the cluster administrator’s choice. The receiving system’s exchange is not part of Kubernetes.",
        sources: [
          {
            title: "Configure Service Accounts for Pods",
            url: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/",
            publisher: "Kubernetes project",
            section: "Service account issuer discovery",
            quote:
              "The JWKS response contains public keys that a relying party can use to validate the Kubernetes service account tokens.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project documents its issuer role for external relying parties, with a feature-state banner for the stage. It is the self-hosted issuer the flow’s worked example uses.",
        },
      },
      {
        kind: "implementation",
        id: "wif-aws-sdks",
        organization: "Amazon Web Services",
        product: "AWS SDKs and tools, assume role credential provider",
        role: "Credential library",
        parties: ["agent"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The reference lists which SDKs support the provider but names no release stage.",
        },
        summary:
          "Reads an identity token from the file named by web_identity_token_file or AWS_WEB_IDENTITY_TOKEN_FILE and calls AssumeRoleWithWebIdentity on the workload’s behalf.",
        limits:
          "The reference lists partial support in some SDKs for other settings of the provider. The receiver is AWS STS only. The review did not test refresh behaviour.",
        sources: [
          {
            title: "Assume role credential provider",
            url: "https://docs.aws.amazon.com/sdkref/latest/guide/feature-assume-role-credentials.html",
            publisher: "Amazon Web Services",
            section: "Assume role credential provider settings",
            quote:
              "The SDK or developer tool loads the contents of this file and passes it as the WebIdentityToken argument when it calls the AssumeRoleWithWebIdentity operation on your behalf.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents the workload-side exchange across its SDKs and CLI.",
        },
      },
      {
        kind: "implementation",
        id: "wif-google-github-auth",
        organization: "Google",
        product: "google-github-actions/auth",
        role: "CI workload action",
        parties: ["agent"],
        release: {
          stage: "unspecified",
          label: "Not an officially supported Google product",
          detail:
            "The README says it is not an officially supported Google product and is not covered by a Google Cloud support contract.",
        },
        summary:
          "Authenticates a GitHub Actions workflow to Google Cloud through Workload Identity Federation, directly or through a service account, using the job’s OIDC token.",
        limits:
          "GitHub Actions to Google Cloud only. The README notes that gsutil does not use the credentials it exports and that Firebase Admin SDK does not support this option.",
        sources: [
          {
            title: "Authenticate to Google Cloud from GitHub Actions",
            url: "https://github.com/google-github-actions/auth/blob/main/README.md",
            publisher: "Google",
            section: "Authenticate to Google Cloud from GitHub Actions",
            quote:
              "Workload Identity Federation is recommended over Service Account Keys as it obviates the need to export a long-lived credential and establishes a trust delegation relationship between a particular GitHub Actions workflow invocation and permissions on Google Cloud.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s repository documents the workload side between the two products already recorded for this flow. The support disclaimer is recorded as the stage label because it is the source’s own wording.",
        },
      },
      {
        kind: "implementation",
        id: "wif-npm",
        organization: "GitHub",
        product: "npm trusted publishing",
        role: "Registry token exchange, publish API and CLI",
        parties: ["agent", "sts", "api"],
        release: {
          stage: "supported",
          label: "Generally available 31 July 2025",
          detail:
            "The GitHub changelog of 31 July 2025 announces npm trusted publishing with OIDC as generally available.",
        },
        summary:
          "The npm registry accepts publishes from a workflow a package has configured as a trusted publisher. The npm CLI detects the CI job’s OIDC token and exchanges it for a short-lived publish token.",
        limits:
          "Limited to the CI/CD providers npm lists, on cloud-hosted runners only, and it requires npm CLI 11.5.1 or later. It covers publishing and dist-tag changes, not installing private packages, which still needs a token.",
        sources: [
          {
            title: "Trusted publishing for npm packages",
            url: "https://docs.npmjs.com/trusted-publishers",
            publisher: "npm",
            section: "How trusted publishing works",
            quote:
              "The npm CLI automatically detects OIDC environments and uses them for authentication before falling back to traditional tokens.",
          },
          {
            title: "Trusted publishing for npm packages",
            url: "https://docs.npmjs.com/trusted-publishers",
            publisher: "npm",
            section:
              "Step 2: Configure your CI/CD workflow, CircleCI configuration",
            quote:
              "the npm CLI automatically exchanges it for a short-lived publish token.",
          },
          {
            title: "Trusted publishing for npm packages",
            url: "https://docs.npmjs.com/trusted-publishers",
            publisher: "npm",
            section: "How trusted publishing works",
            quote:
              "When you configure a trusted publisher for your package, npm will accept publishes from the specific workflow you've authorized, in addition to traditional authentication methods like npm tokens and manual publishes.",
          },
          {
            title: "npm trusted publishing with OIDC is generally available",
            url: "https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/",
            publisher: "GitHub",
            publishedOn: "2025-07-31",
            section: "npm trusted publishing with OIDC is generally available",
            quote:
              "As of today, npm trusted publishing with OpenID Connect (OIDC) is now generally available.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents the receiver, the publish API and its own CLI as the workload client, and its changelog gives the stage and date. Each of the three parties now rests on its own passage: the CLI detecting the OIDC token, the CLI exchanging it for a publish token, and the registry accepting publishes from the configured workflow.",
        },
      },
      {
        kind: "implementation",
        id: "wif-pypi",
        organization: "Python Software Foundation",
        product: "PyPI trusted publishing",
        role: "Registry token exchange and upload API",
        parties: ["sts", "api"],
        release: {
          stage: "unspecified",
          label: "Launched 20 April 2023",
          detail:
            "The PyPI blog announced trusted publishing on 20 April 2023 without naming a release stage.",
        },
        summary:
          "A PyPI project can trust a CI workflow’s OIDC identity. When that workflow submits its OIDC token, PyPI mints a project-scoped API token, valid for 15 minutes, for it to upload with.",
        limits:
          "The announcement covered GitHub Actions only, and the pages read do not list the CI services trusted today. They establish the service, not how many projects use it.",
        sources: [
          {
            title: "Introducing ‘Trusted Publishers’",
            url: "https://blog.pypi.org/posts/2023-04-20-introducing-trusted-publishers/",
            publisher: "The PyPI Blog",
            publishedOn: "2023-04-20",
            section: "Introducing 'Trusted Publishers'",
            quote:
              "Starting today, PyPI package maintainers can adopt a new, more secure publishing method that does not require long-lived passwords or API tokens to be shared with external systems.",
          },
          {
            title: "Publishing to PyPI with a Trusted Publisher",
            url: "https://docs.pypi.org/trusted-publishers/",
            publisher: "PyPI",
            section: "Quick background: Publishing with OpenID Connect",
            quote:
              "Projects on PyPI can be configured to trust a particular configuration on a particular CI service, making that configuration an OIDC publisher for that project;",
          },
          {
            title: "Publishing to PyPI with a Trusted Publisher",
            url: "https://docs.pypi.org/trusted-publishers/",
            publisher: "PyPI",
            section: "Quick background: Publishing with OpenID Connect",
            quote:
              "The short-lived API token behaves exactly like a normal project-scoped API token, except that it's only valid for 15 minutes from time of creation (enough time for the CI to use it to upload packages).",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "PyPI’s administrators document the receiving side of the registry they run. The second reader recorded it as an implementation rather than a deployment report: the sources describe a feature PyPI offers package maintainers, as npm’s do, not an account of PyPI’s own workloads federating. It is the second entry for the target API.",
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
      {
        kind: "deployment",
        id: "wif-chainguard",
        organization: "Chainguard",
        setting: "Its own GitHub organizations",
        attribution: "operator-report",
        summary:
          "Chainguard reports replacing its long-lived GitHub personal access tokens with short-lived credentials across several GitHub organizations it manages, using Octo STS to exchange OIDC tokens for GitHub credentials.",
        limits:
          "Chainguard built Octo STS, so this is a maker using its own tool. The post dates the report, not the rollout, and does not say how many workflows use it or whether it still runs.",
        sources: [
          {
            title: "The end of GitHub PATs: You can’t leak what you don’t have",
            url: "https://chainguard.dev/unchained/the-end-of-github-pats-you-cant-leak-what-you-dont-have",
            publisher: "Chainguard",
            publishedOn: "2024-04-11",
            section: "TLDR",
            quote:
              "This post outlines how we were able to replace our usage of long-lived GitHub Personal Access Tokens (PATs) with short-lived credentials across several GitHub organizations managed by Chainguard.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator describes its own arrangement in its own words. The target API is GitHub’s, reached through a token service Chainguard runs.",
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
      {
        id: "workload-identity-federation-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "wif-aws-sts",
          "wif-aws-outbound",
          "wif-kubernetes",
          "wif-aws-sdks",
          "wif-google-github-auth",
          "wif-npm",
          "wif-pypi",
          "wif-chainguard",
        ],
      },
    ],
  },
  {
    slug: "spiffe-workload-identity",
    reviewedOn: "2026-11-14",
    scope:
      "SPIFFE X.509-SVID issuance, delivery and use for workload mutual TLS. JWT-SVID use alone and generic mTLS do not establish this illustrated path.",
    searchNote:
      "SPIRE’s architecture, Istio’s SPIRE integration and Indeed’s operator account were reviewed. Ecosystem logos, adopter lists and packaging were not treated as separate implementations or verified deployment counts. A further search on 14 November 2026 added a client library, Teleport, a Google Cloud preview and accounts from Uber and Square.",
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
      {
        kind: "implementation",
        id: "spiffe-go-spiffe",
        organization: "SPIFFE project",
        product: "go-spiffe (v2)",
        role: "Workload library for client and server",
        parties: ["agent", "tool"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The README documents v2 of the library without naming a release stage.",
        },
        summary:
          "Go library that fetches X509-SVIDs and bundles from the Workload API and sets up mutual TLS between workloads. Each peer presents its SVID and is checked against the bundles, which keep updating.",
        limits:
          "The quick-start examples authorize any SPIFFE ID; which IDs a service accepts is the application’s choice. It needs SPIRE or another Workload API provider.",
        sources: [
          {
            title: "go-spiffe (v2)",
            url: "https://github.com/spiffe/go-spiffe/blob/main/README.md",
            publisher: "SPIFFE project",
            section: "Quick Start",
            quote:
              "The X509-SVIDs are presented by each peer and authenticated against the X.509 bundles.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project documents its library on both ends of the illustrated mutual TLS call. It is a library in application code, where the existing entry is a mesh proxy.",
        },
      },
      {
        kind: "implementation",
        id: "spiffe-teleport",
        organization: "Teleport",
        product: "Teleport Workload Identity with tbot",
        role: "SVID issuer and Workload API provider",
        parties: ["server", "node"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The 18.x documentation describes the feature without naming a release stage.",
        },
        summary:
          "A certificate authority in the Teleport cluster issues short-lived X.509 and JWT SVIDs. The tbot agent, installed near the workloads, can expose the SPIFFE Workload API and attest which workload is calling.",
        limits:
          "Workload attestation applies only when the Workload API is used; tbot can also write identities to a directory or a Kubernetes secret. Access to identities is set by Teleport roles. Mutual TLS is left to the workloads.",
        sources: [
          {
            title: "Introduction to Workload Identity",
            url: "https://goteleport.com/docs/machine-workload-identity/workload-identity/introduction/",
            publisher: "Teleport",
            section: "How it works",
            quote:
              "Teleport Workload Identity establishes a root certificate authority within your Teleport cluster that will be responsible for issuing the short-lived JWTs and X509 certificates to workloads.",
          },
          {
            title: "Introduction to Workload Identity",
            url: "https://goteleport.com/docs/machine-workload-identity/workload-identity/introduction/",
            publisher: "Teleport",
            section: "How it works",
            quote: "The tbot agent can expose a SPIFFE Workload API.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents a SPIFFE issuer and a Workload API agent of its own, independent of SPIRE. It is a commercial product, where the existing issuer entry is the project’s reference.",
        },
      },
      {
        kind: "implementation",
        id: "spiffe-google-managed",
        organization: "Google Cloud",
        product: "Managed workload identities",
        role: "Hosted SPIFFE issuer and credential provisioning",
        parties: ["server"],
        release: {
          stage: "preview",
          label: "Preview for GKE",
          detail:
            "The overview marks managed workload identities for GKE as Preview. It gives no stage for Compute Engine or agent identities.",
        },
        summary:
          "Binds attested identities with SPIFFE IDs to GKE and Compute Engine workloads, and to agent identities for agentic workloads, and provisions X.509 credentials and trust anchors from Certificate Authority Service for mutual TLS.",
        limits:
          "The overview does not say how the credentials reach a workload, or that the SPIFFE Workload API delivers them, so the entry is not counted for the SPIRE agent’s part. Compute Engine requires attestation policies; GKE manages them. Mutual TLS is left to the workloads.",
        sources: [
          {
            title: "Managed workload identities overview",
            url: "https://docs.cloud.google.com/iam/docs/managed-workload-identity",
            publisher: "Google Cloud",
            section: "Managed workload identities overview",
            quote:
              "Managed workload identities lets you bind strongly attested identities to your Google Kubernetes Engine (GKE) and Compute Engine workloads.",
          },
          {
            title: "Managed workload identities overview",
            url: "https://docs.cloud.google.com/iam/docs/managed-workload-identity",
            publisher: "Google Cloud",
            section: "Attestation policies",
            quote:
              "Workload attestation policies let you define which workload can be issued a credential for a managed workload identity based on the workload's verifiable attributes, such as project ID or resource name.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents a hosted issuer of SPIFFE-identified X.509 credentials with attestation and provisioning. It is the only hosted issuer in this record, and it names agentic workloads. The sentence on mutual TLS was read on the page; the site serves the check a Markdown rendering in which “mutual TLS (mTLS)” is a link, so the opening sentence is quoted instead.",
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
      {
        kind: "deployment",
        id: "spiffe-uber",
        organization: "Uber",
        setting: "Workloads across GCP, OCI, AWS and on-premises data centers",
        attribution: "operator-report",
        summary:
          "Uber Engineering reported using SPIRE to give identity to workloads in several clouds and its own data centers, from stateless services to CI jobs. An internal library subscribes to the SPIRE agent for SVIDs and uses them in tokens or TLS.",
        limits:
          "A dated account of one operator from November 2023. It says identity is injected as “tokens and/or TLS”, so how much traffic uses X.509-SVID mutual TLS is not established. Its count of 4,500 services is context, not a measure of SPIRE use.",
        sources: [
          {
            title: "Our Journey Adopting SPIFFE/SPIRE at Scale",
            url: "https://www.uber.com/en-US/blog/our-journey-adopting-spiffe-spire/",
            publisher: "Uber Engineering",
            publishedOn: "2023-11-09",
            section: "SPIRE’s Role in Uber Infrastructure",
            quote:
              "We use SPIRE at Uber to provide identity to workloads running in multiple clouds (GCP, OCI, AWS, on-premise) for a variety of jobs, including stateless services, stateful storage, batch and streaming jobs, CI jobs, workflow executions, infrastructure services, and more.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator describes its own production arrangement in its own words. Present-day operation was not established.",
        },
      },
      {
        kind: "deployment",
        id: "spiffe-square",
        organization: "Square",
        setting:
          "Data-center microservices behind an Envoy mesh, and AWS Lambda functions",
        attribution: "operator-report",
        summary:
          "Square reported authenticating its microservices with mutual TLS and gradually migrating them to SPIFFE with SPIRE servers, with a SPIRE agent per node and an Envoy sidecar per service. For Lambda it built its own issuer of SPIFFE-compatible certificates.",
        limits:
          "A 2020 account, describing a migration in progress. The Lambda certificates come from Square’s own system, not SPIRE, and are issued ahead of time without workload registration. Present-day operation was not established.",
        sources: [
          {
            title: "Providing mTLS Identities to Lambdas",
            url: "https://developer.squareup.com/blog/providing-mtls-identities-to-lambdas/",
            publisher: "Square",
            publishedOn: "2020-08-25",
            section: "Introduction",
            quote:
              "We have been using mTLS authentication for years, and have been gradually migrating services to SPIFFE within our infrastructure using SPIRE servers.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator describes its own production arrangement in its own words, with mutual TLS on SPIRE-issued identities in the data center.",
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
      {
        id: "spiffe-workload-identity-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "spiffe-go-spiffe",
          "spiffe-teleport",
          "spiffe-google-managed",
          "spiffe-uber",
          "spiffe-square",
        ],
      },
    ],
  },
  {
    slug: "device-authorization",
    reviewedOn: "2026-11-14",
    scope:
      "RFC 8628 device authorization for input-constrained clients. The client requests a code and polls while the user approves in a browser. Support for resource indicators and specific phishing mitigations is a separate question.",
    genericParties: ["api"],
    searchNote:
      "Selected issuer and client documentation and two first-party CLI reports. Browser-based code flow and generic device sign-in fall outside this review. No survey or production login was run. A further search on 14 November 2026 added another issuer, a client library and Docker’s account of its CLI login. An API needs nothing particular to the device grant and was not looked for.",
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
      {
        kind: "implementation",
        id: "device-spring-authorization-server",
        organization: "Spring",
        product: "Spring Authorization Server",
        role: "Authorization-server framework",
        parties: ["as"],
        release: {
          stage: "supported",
          label: "In the stable reference",
          detail:
            "The checked Spring Authorization Server reference identifies version 1.5.8 as Stable. It does not date the introduction of the device grant.",
        },
        summary:
          "Lists the OAuth 2.0 Device Authorization Grant among its features and provides configurable device authorization and device verification endpoints.",
        limits:
          "A framework. The application supplies the verification page, user sign-in and client registration. The source does not establish resource indicators or the phishing defenses shown on this flow.",
        sources: [
          {
            title: "Protocol Endpoints",
            url: "https://docs.spring.io/spring-authorization-server/reference/protocol-endpoints.html",
            publisher: "Spring Authorization Server",
            section: "OAuth2 Device Authorization Endpoint",
            quote:
              "It defines extension points that let you customize the pre-processing, main processing, and post-processing logic for OAuth2 device authorization requests.",
          },
          {
            title: "Overview",
            url: "https://docs.spring.io/spring-authorization-server/reference/overview.html#feature-list",
            publisher: "Spring Authorization Server",
            section: "Feature List",
            quote: "OAuth 2.0 Device Authorization Grant",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The publisher documents this role and mechanism. The stage follows the reference’s Stable version label, as for the client-credentials entry.",
        },
      },
      {
        kind: "implementation",
        id: "device-msal-dotnet",
        organization: "Microsoft",
        product: "Microsoft Authentication Library for .NET (MSAL.NET)",
        role: ".NET client library",
        parties: ["agent"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited documentation does not name a release stage for this capability.",
        },
        summary:
          "Provides AcquireTokenWithDeviceCode for public client applications signing in with Microsoft Entra ID. The app shows a code, and the user signs in on another device.",
        limits:
          "Tied to the Microsoft identity platform and to public client applications. The guide says Azure AD B2C does not support the flow. It does not establish use with other issuers.",
        sources: [
          {
            title: "Using Device Code Flow in MSAL.NET",
            url: "https://learn.microsoft.com/en-us/entra/msal/dotnet/acquiring-tokens/desktop-mobile/device-code-flow",
            publisher: "Microsoft",
            section: "Why would you use Device Code Flow?",
            quote:
              "Upon successful authentication, the command-line app will receive the required tokens through a back channel and will use it to perform the web API calls it needs.",
          },
          {
            title:
              "Microsoft identity platform and the OAuth 2.0 device authorization grant flow",
            url: "https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code",
            publisher: "Microsoft",
            section:
              "Microsoft identity platform and the OAuth 2.0 device authorization grant flow",
            quote:
              "The Microsoft identity platform supports the device authorization grant, which allows users to sign in to input-constrained devices such as a smart TV, IoT device, or a printer.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The publisher documents this library’s role and the issuer’s device authorization grant. The second source ties Microsoft’s device code flow to the OAuth device grant.",
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
      {
        kind: "deployment",
        id: "device-docker-cli-report",
        organization: "Docker",
        setting: "Docker CLI sign-in to Docker Hub",
        attribution: "operator-report",
        summary:
          "Docker reports that docker login uses a device code flow by default for Docker Hub unless a username is given. It added the flow in Docker Engine 27.2.0, and the CLI polls with the device-code grant type.",
        limits:
          "Covers Docker Hub only; self-hosted registries keep other sign-in. The sources give no count of sign-ins and do not establish the phishing defenses shown on this flow.",
        sources: [
          {
            title: "docker login",
            url: "https://docs.docker.com/reference/cli/docker/login/",
            publisher: "Docker",
            section: "Authentication methods",
            quote:
              "For Docker Hub, the docker login command uses a device code flow by default, unless the --username flag is specified.",
          },
          {
            title: "Docker Engine version 27 release notes",
            url: "https://docs.docker.com/engine/release-notes/27/",
            publisher: "Docker",
            publishedOn: "2024-08-27",
            section: "27.2.0 / Device code login",
            quote:
              "This release adds support for using device code login when authenticating to Docker Hub.",
          },
          {
            title: "docker/cli internal/oauth/api/api.go",
            url: "https://github.com/docker/cli/blob/master/internal/oauth/api/api.go",
            publisher: "Docker",
            section: "func (a API) getDeviceToken",
            quote:
              '"grant_type":  {"urn:ietf:params:oauth:grant-type:device_code"},',
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator documents the mechanism for its own service. The publication date is the date the release notes give for 27.2.0. The CLI source shows the RFC 8628 grant type. Usage was not independently tested.",
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
      {
        id: "device-authorization-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "device-spring-authorization-server",
          "device-msal-dotnet",
          "device-docker-cli-report",
        ],
      },
    ],
  },
  {
    slug: "client-credentials",
    reviewedOn: "2026-11-14",
    scope:
      "OAuth client credentials for access on an application’s own authority. Separate the grant from client authentication. The illustrated flow uses a signed JWT assertion and a resource indicator.",
    searchNote:
      "Selected sources describe client and authorization-server roles, including signed assertions, plus one operator’s live API using the secret-based grant. API keys, federated exchanges and user-delegated grants fall outside this record. A further search on 14 November 2026 added client libraries, a resource-server library, Microsoft Graph and Epic’s backend services, and HelseID’s account of signed client assertions. NHS England’s guide could not be reached.",
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
      {
        kind: "implementation",
        id: "client-creds-ms-graph",
        organization: "Microsoft",
        product: "Microsoft Graph",
        role: "API (resource server)",
        parties: ["api"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The guide documents app-only access without naming a release stage.",
        },
        summary:
          "Exposes application permissions for apps that call it with their own identity, granted by an administrator, and accepts the client credentials token as a bearer token.",
        limits:
          "The documented token request uses a client secret and the /.default scope. The guide does not establish the illustrated signed assertion, resource parameter or client JWT type header, though it points to certificate-based credentials.",
        sources: [
          {
            title: "Get access without a user",
            url: "https://learn.microsoft.com/en-us/graph/auth-v2-service",
            publisher: "Microsoft",
            section: "Step 1: Configure permissions for Microsoft Graph",
            quote:
              "Microsoft Graph exposes application permissions for apps that call Microsoft Graph with their own identity.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents its own API authorizing app-only callers that use the client credentials grant. The page shows a last update of 29 August 2025, which is not a publication date and is not recorded.",
        },
      },
      {
        kind: "implementation",
        id: "client-creds-ms-identity-web",
        organization: "Microsoft",
        product: "Microsoft Identity Web for ASP.NET Core web APIs",
        role: "Resource-server library",
        parties: ["api"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The guide documents the checks without naming a release stage.",
        },
        summary:
          "With ValidateAppRole, a web API called by a daemon app checks that the token’s roles claim holds the expected application permission. The guide also shows code that tells an app-only token from a user’s by comparing its oid and sub claims.",
        limits:
          "The guide says “daemon app”; a companion page says daemon apps use the client credentials flow. It covers tokens from Microsoft Entra ID and does not establish checks for other issuers.",
        sources: [
          {
            title: "Verify scopes and app roles protected web API",
            url: "https://learn.microsoft.com/en-us/entra/identity-platform/scenario-protected-web-api-verification-scope-app-roles",
            publisher: "Microsoft",
            section: "Verify app roles in APIs called by daemon apps",
            quote:
              "You now need to have your API verify that the token it receives contains the roles claim and that this claim has the expected value.",
          },
          {
            title:
              "Acquire tokens to call a web API using a daemon application",
            url: "https://learn.microsoft.com/en-us/entra/identity-platform/scenario-daemon-acquire-token",
            publisher: "Microsoft",
            section: "Acquire a token for a confidential client application",
            quote:
              "Daemon applications and other confidential client apps that run without user interaction use the OAuth 2.0 client credentials flow to acquire app-only access tokens.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents its library in the API role for app-only tokens, and a second page of its own ties daemon apps to the client credentials grant.",
        },
      },
      {
        kind: "implementation",
        id: "client-creds-spring-security",
        organization: "Spring",
        product: "Spring Security OAuth2 Client",
        role: "Client library",
        parties: ["agent"],
        release: {
          stage: "supported",
          label: "In the stable reference",
          detail:
            "The checked Spring Security reference lists 7.1.2 as the latest Stable version.",
        },
        summary:
          "Requests client credentials tokens from a token endpoint, and can authenticate the client with a JWT signed by its private key in the client_assertion parameter.",
        limits:
          "The reference shows private_key_jwt with an authorization code registration and client_secret_jwt with a client credentials one; it does not show the two together. Key custody and the resource parameter were not established.",
        sources: [
          {
            title: "Authorization Grant Support",
            url: "https://docs.spring.io/spring-security/reference/servlet/oauth2/client/authorization-grants.html",
            publisher: "Spring",
            section: "Client Credentials",
            quote:
              "The default implementation of OAuth2AccessTokenResponseClient for the Client Credentials grant is RestClientClientCredentialsTokenResponseClient",
          },
          {
            title: "Client Authentication Support",
            url: "https://docs.spring.io/spring-security/reference/servlet/oauth2/client/client-authentication.html",
            publisher: "Spring",
            section: "JWT Bearer",
            quote:
              "which is a Converter that customizes the Token Request parameters by adding a signed JSON Web Token (JWS) in the client_assertion parameter.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The publisher documents the client role for the grant and for signed client authentication in its current stable reference.",
        },
      },
      {
        kind: "implementation",
        id: "client-creds-msal-python",
        organization: "Microsoft",
        product: "Microsoft Authentication Library (MSAL) for Python",
        role: "Client library",
        parties: ["agent"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The guide documents the method without naming a release stage.",
        },
        summary:
          "Acquires client credentials tokens with acquire_token_for_client, authenticating with a client secret or with a certificate whose public key is registered with Microsoft Entra ID.",
        limits:
          "Documented for Microsoft Entra ID as the issuer. The page does not describe the assertion the certificate signs, and other issuers were not reviewed.",
        sources: [
          {
            title: "Client credentials",
            url: "https://learn.microsoft.com/en-us/entra/msal/python/advanced/client-credentials",
            publisher: "Microsoft",
            section: "Client Credentials with certificate",
            quote:
              "When it wants to acquire a token, the client application will need to call the acquire_token_for_client method by passing the scope as parameter.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents its Python library in the client role with certificate credentials. It adds a Python client to the JavaScript and Java ones.",
        },
      },
      {
        kind: "implementation",
        id: "client-creds-epic-backend",
        organization: "Epic",
        product: "Epic on FHIR backend services",
        role: "Authorization server and FHIR API",
        parties: ["as", "api"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The guide documents backend OAuth 2.0 without naming a release stage.",
        },
        summary:
          "Issues tokens to backend apps through client_credentials with a JWT signed by a pre-registered key. Each health system maps the app’s client ID to an Epic user account that audits its web service calls.",
        limits:
          "Epic says its implementation differs from the SMART Backend Services profile in some respects. Each Epic customer runs its own instance, so availability depends on the customer. The resource parameter was not established.",
        sources: [
          {
            title: "SMART Backend Services (Backend OAuth 2.0)",
            url: "https://fhir.epic.com/Documentation?docId=oauth2&section=BackendOAuth2Guide",
            publisher: "Epic",
            section: "Overview",
            quote:
              "Application vendors pre-register a public key for a given Epic community member on the Epic on FHIR website and then use the corresponding private key to sign a JSON Web Token (JWT) which is presented to the authorization server to obtain an access token.",
          },
          {
            title: "SMART Backend Services (Backend OAuth 2.0)",
            url: "https://fhir.epic.com/Documentation?docId=oauth2&section=BackendOAuth2Guide",
            publisher: "Epic",
            section:
              "Complete Required Epic Community Member Setup to Audit Access from Your Backend Application",
            quote:
              "will need to map your client ID to an Epic user account that will be used for auditing web service calls made by your backend application.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents the token endpoint and the API-side mapping for backend apps. The page carries the whole documentation set in one HTML response; the passages were read in it.",
        },
      },
      {
        kind: "implementation",
        id: "client-creds-epic-client",
        organization: "Epic",
        product: "Epic web API client",
        role: "Outgoing client",
        parties: ["agent"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The guide documents the client without naming a release stage. It shows an update of 23 February 2026.",
        },
        summary:
          "Calls external web APIs on a health system’s behalf with client_credentials, signing a client assertion with a key published at a JWK Set URL that the external authorization server pre-registers.",
        limits:
          "Each health system registers its own client ID and key set URL. The guide does not establish key custody, the resource parameter or which external APIs use it.",
        sources: [
          {
            title:
              "Epic as Backend Client Using OAuth 2.0 Client Credentials Grant",
            url: "https://fhir.epic.com/Documentation?docId=epic_as_client_oauth",
            publisher: "Epic",
            section: "High Level Technical Summary",
            quote:
              "When calling a web API, the Epic client signs a JSON Web Token (JWT) with a private key to obtain an access token with a client_assertion_type of urn:ietf:params:oauth:client-assertion-type:jwt-bearer per RFC 7515 and RFC 7523",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents its product as the client in this grant with a signed assertion. It is a product client, where the other agent entries are libraries. “Updated” is not a publication date and is not recorded as one.",
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
      {
        kind: "deployment",
        id: "client-creds-helseid",
        organization: "Norsk helsenett",
        setting: "HelseID token endpoint",
        attribution: "operator-report",
        summary:
          "Norsk helsenett documents that the HelseID token endpoint supports client_credentials and requires every client to authenticate with a JWT signed by its private key. A resource indicator selects the API the token is for.",
        limits:
          "The page gives the test environment’s address as its example. It establishes the documented service, not traffic, the number of clients or which APIs accept the tokens. DPoP is also required at the token call.",
        sources: [
          {
            title: "The Token endpoint",
            url: "https://utviklerportal.nhn.no/informasjonstjenester/helseid/bruksmoenstre-og-eksempelkode/bruk-av-helseid/docs/teknisk-referanse/endepunkt/token-endepunktet_enmd",
            publisher: "Norsk helsenett",
            publishedOn: "2026-04-27",
            section: "The Token endpoint",
            quote:
              "It supports the authorization_code, client_credentials, refresh_token and token_exchange grant types.",
          },
          {
            title: "The Token endpoint",
            url: "https://utviklerportal.nhn.no/informasjonstjenester/helseid/bruksmoenstre-og-eksempelkode/bruk-av-helseid/docs/teknisk-referanse/endepunkt/token-endepunktet_enmd",
            publisher: "Norsk helsenett",
            publishedOn: "2026-04-27",
            section: "Requests to the Token endpoint",
            quote: "A base64 encoded JWT signed with your private key",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator documents its own service. It is the first deployment report in this record with signed client assertions and a resource indicator. Usage was not tested.",
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
      {
        id: "client-credentials-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "client-creds-ms-graph",
          "client-creds-ms-identity-web",
          "client-creds-spring-security",
          "client-creds-msal-python",
          "client-creds-epic-backend",
          "client-creds-epic-client",
          "client-creds-helseid",
        ],
      },
    ],
  },
  {
    slug: "token-exchange",
    reviewedOn: "2026-11-14",
    scope:
      "RFC 8693 exchanges of an incoming subject token for downstream access. Keep issuer and client roles separate, and distinguish the base grant, actor delegation, and explicitly documented service-specific variants.",
    genericParties: ["agent"],
    searchNote:
      "Selected issuer and client sources, release announcements, and an operator’s documented service variant. A documented example or federation-only exchange does not establish a production delegation chain with an actor. A further search on 14 November 2026 added two issuers, a tool server that exchanges tokens and Infisical’s account of an impersonation variant. The agent sends an ordinary token and was not looked for.",
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
      {
        kind: "implementation",
        id: "exchange-toolhive",
        parties: ["tool", "api"],
        qualification: "Act claim read only when the issuer includes it.",
        organization: "Stacklok",
        product: "ToolHive",
        role: "MCP server proxy: exchanging client and act-claim reader",
        summary:
          "ToolHive’s token exchange middleware presents the user’s access token to the identity provider and passes the new backend-scoped token to the MCP server it fronts. On incoming JWTs it reads an act claim, so audit logs and Cedar policies can tell an agent acting for a user from the user.",
        limits:
          "The identity provider decides what to issue. ToolHive’s exchange does not establish that the issued token carries an act claim, and the docs name no release version or stage for either feature. Its embedded authorization server can also mint delegated tokens; that is not counted here.",
        sources: [
          {
            title: "Backend authentication",
            url: "https://docs.stacklok.com/toolhive/concepts/backend-auth",
            publisher: "Stacklok",
            section: "Token exchange",
            quote:
              "When the backend service trusts the same IdP as your MCP clients, or federation is configured between the two IdPs, ToolHive can exchange the client's token for one scoped to the backend service using RFC 8693 token exchange.",
          },
          {
            title: "Embedded authorization server",
            url: "https://docs.stacklok.com/toolhive/concepts/embedded-auth-server",
            publisher: "Stacklok",
            section: "Delegated identities and the act claim",
            quote:
              "ToolHive reads act from any JWT it validates, regardless of which authorization server minted the token.",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The concept guides, last updated 10 November 2026, do not name a release or stage for token exchange or for reading the act claim.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents both roles for this mechanism. The api party rests on the act-claim reading the embedded authorization server guide describes for any validated JWT.",
        },
      },
      {
        kind: "implementation",
        id: "exchange-workos-connect",
        parties: ["as"],
        qualification: "First-party Connect apps only.",
        organization: "WorkOS",
        product: "WorkOS Connect",
        role: "Authorization server",
        summary:
          "Exchanges an access token issued for one registered resource for a token aimed at another. The new token keeps the user as subject, can only narrow scope, and carries an act claim naming the exchanging application, nested when the token was exchanged before.",
        limits:
          "Only first-party Connect apps that authenticate with a client secret can use the grant. No refresh token or ID token is issued. The reference does not mention an actor_token parameter: the actor is the authenticated client.",
        sources: [
          {
            title: "Token",
            url: "https://workos.com/docs/reference/workos-connect/token",
            publisher: "WorkOS",
            section: "Token exchange grant",
            quote:
              "If the subject_token already has an act claim from an earlier exchange, it is nested as the prior actor, unless the same application is exchanging it again.",
          },
          {
            title: "Token exchange for WorkOS Connect",
            url: "https://workos.com/changelog/token-exchange-for-workos-connect",
            publisher: "WorkOS",
            section: "Token exchange for WorkOS Connect",
            quote:
              "A first-party Connect app can exchange an access token issued for one resource for a new token intended for another registered resource.",
            publishedOn: "2026-11-10",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Announced 10 November 2026",
          detail:
            "The changelog entry of 10 November 2026 says WorkOS Connect now supports token exchange. It does not use a stage word.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s API reference and changelog document this role and mechanism, including the act claim.",
        },
      },
      {
        kind: "implementation",
        id: "exchange-spring-authorization-server",
        parties: ["as"],
        organization: "Spring",
        product: "Spring Authorization Server",
        role: "Authorization-server framework",
        summary:
          "Spring Authorization Server 1.3 added the RFC 8693 grant to its token endpoint. The project’s announcement of the preview says impersonation and delegation are both supported.",
        limits:
          "The application decides which tokens may be exchanged and what the new token says. The sources do not show an issued act claim. The authorization server is now documented in the Spring Security reference, whose stable 7.1.2 edition lists the token-exchange grant at the token endpoint.",
        sources: [
          {
            title: "Spring Authorization Server 1.3 goes GA",
            url: "https://spring.io/blog/2024/05/22/spring-authorization-server-1-3-goes-ga",
            publisher: "Spring",
            publishedOn: "2024-05-22",
            section: "Spring Authorization Server 1.3 goes GA",
            quote:
              "The 1.3 release contains a few noteworthy new features: RFC 8705 OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens (gh-101) RFC 8693 OAuth 2.0 Token Exchange (gh-1525)",
          },
          {
            title: "Token Exchange support in Spring Security 6.3.0-M3",
            url: "https://spring.io/blog/2024/03/19/token-exchange-support-in-spring-security-6-3-0-m3",
            publisher: "Spring",
            publishedOn: "2024-03-19",
            section: "Conclusion",
            quote:
              'See Appendix A of RFC 8693 for additional examples including an example of an additional use case called "delegation" which is also supported.',
          },
          {
            title: "Protocol Endpoints",
            url: "https://docs.spring.io/spring-security/reference/servlet/oauth2/authorization-server/protocol-endpoints.html",
            publisher: "Spring Security",
            section: "OAuth2 Token Endpoint",
            quote:
              "The supported authorization grant types are authorization_code, refresh_token, client_credentials, urn:ietf:params:oauth:grant-type:device_code, and urn:ietf:params:oauth:grant-type:token-exchange.",
          },
        ],
        release: {
          stage: "supported",
          label: "Generally available since 1.3",
          detail:
            "Spring announced the 1.3 release as GA on 22 May 2024, with RFC 8693 among its new features. It was in preview from 1.3.0-M3 on 19 March 2024.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s own release announcement and engineering post document this role and mechanism.",
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
      {
        kind: "deployment",
        id: "exchange-infisical",
        qualification: "Impersonation profile; actor_token refused.",
        organization: "Infisical",
        setting: "Infisical OAuth token endpoint for trusted middleware",
        summary:
          "Infisical documents an RFC 8693 exchange on its token endpoint: a trusted service it calls middleware presents a user’s token from the organization’s identity provider and receives an Infisical token for that same user.",
        limits:
          "Infisical issues an impersonation token indistinguishable from the user’s own. It refuses actor_token, scope, audience and resource. The middleware authenticates as an OAuth application, and the organization must have OIDC single sign-on configured. The page gives no launch date, customers or usage.",
        sources: [
          {
            title: "OAuth token exchange",
            url: "https://infisical.com/docs/documentation/platform/oauth-applications/token-exchange",
            publisher: "Infisical",
            section: "OAuth token exchange",
            quote:
              "Token exchange lets a trusted service you run present a user’s token from your identity provider and receive an Infisical token for that same user.",
          },
          {
            title: "OAuth token exchange",
            url: "https://infisical.com/docs/documentation/platform/oauth-applications/token-exchange",
            publisher: "Infisical",
            section: "Exchanging a token",
            quote:
              "Token exchange follows RFC 8693 on the existing token endpoint, so any RFC 8693-aware client library works.",
          },
        ],
        attribution: "operator-report",
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator documents a service-specific variant for its own service, like the Snowflake entry. Usage was not established.",
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
      {
        id: "token-exchange-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "exchange-toolhive",
          "exchange-workos-connect",
          "exchange-spring-authorization-server",
          "exchange-infisical",
        ],
      },
    ],
  },
  {
    slug: "ciba",
    reviewedOn: "2026-11-14",
    scope:
      "OpenID Connect CIBA, including the backchannel request and the token delivery mode the source describes. User notification, Rich Authorization Requests and API enforcement each need their own evidence.",
    searchNote:
      "Selected client, authorization-server and hosted-provider guides were checked. ICA Banken’s own notices cover its open banking service. Generic push MFA, certification listings and sandbox instructions were excluded as deployment evidence. A further search on 14 November 2026 added two client libraries, Keycloak and a bank identity provider. Nothing found documents an API checking the authorization details of a CIBA token.",
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
      {
        kind: "implementation",
        id: "ciba-auth0-ai-langchain",
        organization: "Auth0",
        product: "Auth0 AI for LangChain (@auth0/ai-langchain)",
        role: "Agent tool SDK",
        parties: ["agent"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The package README describes the feature without a version or release stage.",
        },
        summary:
          "Wraps an agent tool so that calling it starts a CIBA request for the user’s approval, with a binding message and optional authorization_details, and resumes the tool once a token arrives.",
        limits:
          "Works with Auth0 as the authorization server. The README notes the SDK focuses on LangGraph. The application supplies the user ID and the message text; the README does not say how a binding message is kept apart from model output.",
        sources: [
          {
            title: "Auth0 AI for LangChain",
            url: "https://github.com/auth0/auth0-ai-js/blob/main/packages/ai-langchain/README.md",
            publisher: "Auth0",
            section: "CIBA: Client-Initiated Backchannel Authentication",
            quote:
              "This flow allows you to request user authorization asynchronously and resume execution once authorization is granted.",
          },
          {
            title: "Auth0 AI for LangChain",
            url: "https://github.com/auth0/auth0-ai-js/blob/main/packages/ai-langchain/README.md",
            publisher: "Auth0",
            section: "CIBA with RAR (Rich Authorization Requests)",
            quote: "Auth0 supports RAR (Rich Authorization Requests) for CIBA.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s own package README read for the client role. Read from raw.githubusercontent.com.",
        },
      },
      {
        kind: "implementation",
        id: "ciba-nimbus",
        organization: "Connect2id",
        product: "Nimbus OAuth 2.0 SDK with OpenID Connect extensions",
        role: "Java client library",
        parties: ["agent"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The example page documents the classes without a version or release stage.",
        },
        summary:
          "A Java library that builds plain and signed CIBA requests and parses the push-mode token delivery at the client’s notification endpoint.",
        limits:
          "Library functions only. The application runs the notification endpoint and stores the request context. Which authorization servers it has been used with is not stated.",
        sources: [
          {
            title:
              "Client-Initiated Back-channel Authentication (CIBA) with OpenID Connect",
            url: "https://connect2id.com/products/nimbus-oauth-openid-connect-sdk/examples/openid-connect/ciba",
            publisher: "Connect2id",
            section: "Callback processing",
            quote:
              "Example code for processing a callback at the client notification endpoint, assuming the client is registered for the push token delivery method.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s own documentation read for the client role. It adds push delivery, which the recorded client documents only as ping and poll.",
        },
      },
      {
        kind: "implementation",
        id: "ciba-keycloak",
        organization: "Keycloak",
        product: "Keycloak",
        role: "Authorization server",
        parties: ["as"],
        release: {
          stage: "unspecified",
          label: "Documented in the 26.8.2 guide",
          detail:
            "The Server Administration Guide for 26.8.2 documents the CIBA policy without a release stage.",
        },
        summary:
          "Accepts backchannel requests at its CIBA endpoint and hands user authentication to an external authentication entity through a provider interface. Only poll delivery and login_hint are supported.",
        limits:
          "Keycloak does not reach the user’s device itself; the operator runs or writes the authentication entity. The guide does not cover authorization_details for CIBA.",
        sources: [
          {
            title: "Server Administration Guide",
            url: "https://www.keycloak.org/docs/latest/server_admin/index.html",
            publisher: "Keycloak",
            section: "CIBA Policy",
            quote:
              'There are three modes, "poll", "ping" and "push". Keycloak only supports "poll".',
          },
          {
            title: "Server Administration Guide",
            url: "https://www.keycloak.org/docs/latest/server_admin/index.html",
            publisher: "Keycloak",
            section: "Authentication Channel Provider",
            quote:
              "Keycloak delegates this authentication to an external authentication entity.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s own guide read for this role and mechanism. The guide is the latest version, 26.8.2, on the day of the check.",
        },
      },
      {
        kind: "implementation",
        id: "ciba-bankid-biometrics",
        organization: "Stø",
        product: "BankID with biometrics",
        role: "Hosted OpenID provider",
        parties: ["as"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The integration guide lists production and test environments but no release stage.",
        },
        summary:
          "The client registers a permission, such as a payment, before starting CIBA. The service returns a binding message for it, the user approves in the BankID app, and the client polls for the result and can fetch the signed permission.",
        limits:
          "Norwegian BankID users with an up-to-date app only. The permission is BankID’s own API, not RFC 9396 authorization_details. The guide shows polling only. No customer or traffic figure is given.",
        sources: [
          {
            title:
              "OpenID Connect Client-Initiated Backchannel Authentication (CIBA)",
            url: "https://developer.bankid.no/bankid-with-biometrics/flows/ciba",
            publisher: "Stø",
            section: "5. Check if user is able to authenticate with CIBA",
            quote:
              "To be able to authenticate with CIBA, the user must be registered with a sufficiently up-to-date BankID App to support app-required flows.",
          },
          {
            title:
              "OpenID Connect Client-Initiated Backchannel Authentication (CIBA)",
            url: "https://developer.bankid.no/bankid-with-biometrics/flows/ciba",
            publisher: "Stø",
            section: "6. Register the permission upfront",
            quote:
              "On a successful request, you will receive a response body containing a permission ID, a permission token and a binding message:",
          },
          {
            title:
              "OpenID Connect Client-Initiated Backchannel Authentication (CIBA)",
            url: "https://developer.bankid.no/bankid-with-biometrics/flows/ciba",
            publisher: "Stø",
            section:
              "OpenID Connect Client-Initiated Backchannel Authentication (CIBA)",
            quote:
              "Get in touch to discuss your use case and enable CIBA for your client.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The operator’s own integration guide read for the issuer role, recorded as a hosted implementation as Vipps MobilePay is. It shows a transaction registered before approval, which the other issuers recorded do not.",
        },
        qualification: "Enabled per client on request, for certain use cases.",
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
      {
        id: "ciba-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "ciba-auth0-ai-langchain",
          "ciba-nimbus",
          "ciba-keycloak",
          "ciba-bankid-biometrics",
        ],
      },
    ],
  },
  {
    slug: "agent-to-agent",
    reviewedOn: "2026-11-14",
    scope:
      "Agent2Agent protocol discovery, card signing and verification, request authentication and task authorization. Scope support to the documented role, transport and revision. Label older deployment accounts with their reported revision.",
    searchNote:
      "Selected SDK, hosting and integration documentation and one operator account were reviewed. A published Agent Card, partner listing or SDK compatibility claim does not establish deployed enforcement. No live card sample was collected. A further search on 14 November 2026 added a hosted gateway with its own authorization server and a set of preview packages. No second operator’s account and no product documenting the in-task authorization exchange were found.",
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
      {
        kind: "implementation",
        id: "a2a-atlassian-rovo",
        organization: "Atlassian",
        product: "Atlassian Rovo A2A Gateway",
        role: "Hosted remote agent and its authorization server",
        parties: ["remote", "as"],
        release: {
          stage: "supported",
          label: "Generally available; A2A 0.3.0",
          detail:
            "Atlassian’s community announcement says A2A connections are generally available. The gateway guide says it implements A2A protocol version 0.3.0. The announcement’s readable text gives no date.",
        },
        qualification: "A2A 0.3.0, with the card at /.well-known/agent.json.",
        summary:
          "A cloud-hosted A2A server for Rovo. Its public Agent Card declares an OAuth 2.0 authorization code scheme with PKCE and the Atlassian authorization and token URLs. Agents register by Dynamic Client Registration and send the access token as a bearer token. Task execution also needs an administrator to enable A2A for the organization.",
        limits:
          "The sources do not establish A2A 1.0 support, signed Agent Cards, the in-task authorization state or any customer’s deployment. The authorization server is Atlassian’s own, documented here only as the issuer for this gateway.",
        sources: [
          {
            title: "Atlassian Rovo A2A · Authentication",
            url: "https://developer.atlassian.com/cloud/rovo-a2a/authentication/",
            publisher: "Atlassian",
            section: "Authentication",
            quote:
              "The Atlassian A2A Gateway uses the OAuth 2.0 authorization code flow for all authenticated requests.",
          },
          {
            title: "About the Atlassian A2A Gateway",
            url: "https://developer.atlassian.com/cloud/rovo-a2a/",
            publisher: "Atlassian",
            section: "Compatible agents",
            quote:
              "The A2A Gateway implements A2A protocol version 0.3.0 and is designed for agents that implement the A2A protocol specification and can complete the required OAuth 2.0 flow with PKCE.",
          },
          {
            title: "Now GA: Connect any third-party AI agent to Rovo with A2A",
            url: "https://community.atlassian.com/forums/Atlassian-Remote-MCP-Server/Now-GA-Connect-any-third-party-AI-agent-to-Rovo-with-A2A/ba-p/3274964",
            publisher: "Atlassian Community",
            section:
              "Now GA: Connect any third-party AI agent to Rovo with A2A",
            quote:
              "We're excited to announce Agent2Agent (A2A) connections are now generally available.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s developer guides document the gateway as an A2A server whose card names Atlassian’s authorization server, and the maker’s community announcement gives the stage. The announcement is posted by an Atlassian staff author in Atlassian’s forum. Second reading: the community post’s author carries the ‘Atlassian Team’ label in the page data.",
        },
      },
      {
        kind: "implementation",
        id: "a2a-keycard",
        organization: "Keycard Labs",
        product: "Keycard A2A packages",
        role: "Client and server SDK that exchanges tokens at a Keycard zone",
        parties: ["client", "remote"],
        release: {
          stage: "preview",
          label: "Pre-1.0 preview",
          detail:
            "The guide calls the A2A packages in all four SDKs pre-1.0 preview surfaces whose APIs may change. The Python package requires a2a-sdk 1.0 or later; the page names no protocol revision for the others.",
        },
        summary:
          "Packages for Python, Ruby, TypeScript and Go. Before calling a remote agent, the delegation client resolves its card at .well-known/agent-card.json and exchanges the user’s token at a Keycard zone for a token bound to that remote service. The Python and TypeScript packages also build the Agent Card and wire Keycard token checks into the A2A SDK’s server. The Go and Ruby packages leave the server side to Keycard’s MCP packages.",
        limits:
          "The guide documents the SDK side. The Keycard zone that issues the tokens is not documented here. The guide does not establish card signing, the in-task authorization state, conformance testing or a customer deployment.",
        sources: [
          {
            title: "Agent-to-Agent | Keycard",
            url: "https://docs.keycard.ai/sdk/agent-to-agent/",
            publisher: "Keycard Labs",
            section: "Key Exports",
            quote:
              "Python and TypeScript follow a wrap-don’t-reinvent pattern: you implement the executor against the native A2A SDK, and the Keycard package contributes auth wiring, agent card construction, and outbound delegation.",
          },
          {
            title: "Agent-to-Agent | Keycard",
            url: "https://docs.keycard.ai/sdk/agent-to-agent/",
            publisher: "Keycard Labs",
            section: "Note",
            quote:
              "are pre-1.0 preview surfaces. APIs may change between minor versions.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s SDK guide read for the client, server and token-exchange roles. The stage is the guide’s own word. The token exchange is described in the guide’s export tables and code samples; the zone’s exchange endpoint itself was not read. Second reading: the authorization-server party was removed. The packages request tokens; the zone that issues them is Keycard’s hosted service, which this guide does not document and whose stage it does not give.",
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
      {
        id: "agent-to-agent-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: ["a2a-atlassian-rovo", "a2a-keycard"],
      },
    ],
  },
  {
    slug: "step-up-authorization",
    reviewedOn: "2026-11-14",
    scope:
      "RFC 9470 step-up challenges and the authorization-server response. A stronger or fresher login, transaction-specific consent under RFC 9396, and API enforcement each require their own evidence.",
    searchNote:
      "Selected RFC 9470 issuer, client and resource-server documentation, plus Mozilla’s account of its own authorization service. Generic MFA and transaction-specific consent inferred from step-up were outside this search. A further search on 14 November 2026 added an issuer and an API policy product. No second client library and no other operator’s account were found.",
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
      {
        kind: "implementation",
        id: "step-up-duende",
        organization: "Duende Software",
        product: "Duende IdentityServer",
        role: "Authorization server",
        parties: ["as"],
        release: {
          stage: "unspecified",
          label: "Listed among supported specifications",
          detail:
            "The specifications page lists RFC 9470 without a version or release stage.",
        },
        summary:
          "Duende lists RFC 9470 among the specifications IdentityServer implements. Its step-up sample pairs the server with an API that sends step-up challenges and a client that answers them.",
        limits:
          "The API and client in the sample are sample code, not product features, and the sample page links the draft rather than the RFC. The host’s login UI decides how a stronger or fresher login happens.",
        sources: [
          {
            title: "Supported Specifications",
            url: "https://docs.duendesoftware.com/identityserver/overview/specs/",
            publisher: "Duende Software",
            section: "OAuth 2.x",
            quote:
              "OAuth 2.0 Step-up Authentication Challenge Protocol RFC 9470",
          },
          {
            title: "User Interaction Samples",
            url: "https://docs.duendesoftware.com/identityserver/samples/ui/",
            publisher: "Duende Software",
            section: "Step Up",
            quote:
              "Api is a protected resource that uses the IdentityServerHost as its authority and can make Step-Up responses when requests don’t meet its authentication requirements.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s specifications page and sample page read. The parties are limited to the issuer, because the API and client exist only as sample code.",
        },
      },
      {
        kind: "implementation",
        id: "step-up-pingauthorize",
        organization: "Ping Identity",
        product: "PingAuthorize 11.1",
        role: "Policy decision on behalf of the resource server",
        parties: ["api"],
        release: {
          stage: "unspecified",
          label: "Documented in the 11.1 guide",
          detail:
            "The 11.1 Policy Administration Guide describes the feature without a release stage.",
        },
        summary:
          "PingAuthorize checks the acr and auth_time claims in an access token against policy and, when they fall short, returns an insufficient_user_authentication challenge with acr_values and max_age.",
        limits:
          "The authorization server has to put acr and auth_time in the access token. The guide’s example issuer is PingOne. The client still has to read the challenge and ask again.",
        sources: [
          {
            title: "Step-up authentication for APIs",
            url: "https://docs.pingidentity.com/pingauthorize/11.1/pingauthorize_policy_administration_guide/paz_step_up_auth.html",
            publisher: "Ping Identity",
            section: "Using PingAuthorize for step-up authentication",
            quote:
              "If the claims don’t meet the policy requirements, PingAuthorize returns a challenge response instructing the client to reauthenticate.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s own guide read for this role and mechanism. The page names RFC 9470 and shows the challenge.",
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
      {
        id: "step-up-authorization-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: ["step-up-duende", "step-up-pingauthorize"],
      },
    ],
  },
  {
    slug: "cross-app-access",
    reviewedOn: "2026-11-14",
    scope:
      "ID-JAG issuance, exchange and redemption for enterprise-managed authorization, including implementations of the MCP extension. General workforce SSO and generic cross-domain JWT support do not establish ID-JAG.",
    genericParties: ["mcp"],
    searchNote:
      "Selected issuer, client and resource authorization-server guides and release notes, plus one hosted integration from its operator. Draft revision coverage varies and customer uptake is unknown. A further search on 14 November 2026 added two MCP SDKs, Auth0 in early access and accounts from Atlassian and Notion. The MCP server checks an ordinary access token and was not looked for.",
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
      {
        kind: "implementation",
        id: "xaa-mcp-python-sdk",
        parties: ["client", "as"],
        qualification:
          "The application obtains the ID-JAG from its IdP itself.",
        organization: "Model Context Protocol project",
        product: "MCP Python SDK",
        role: "Client provider and authorization-server hook",
        summary:
          "IdentityAssertionOAuthProvider presents an ID-JAG at the MCP authorization server with the JWT bearer grant. The SDK’s own authorization-server routes can also take that grant and hand the assertion to a hook the deployment writes, which returns the access token.",
        limits:
          "The SDK does not make the token exchange at the enterprise IdP: the application does that in a callback. On the server side the SDK authenticates the client and gates the grant but never decodes the ID-JAG, so the deployment validates it. The guide names SEP-990 and no ID-JAG draft revision, and gives no release or stage for the feature.",
        sources: [
          {
            title: "Identity assertion",
            url: "https://py.sdk.modelcontextprotocol.io/client/identity-assertion/",
            publisher: "Model Context Protocol project",
            section: "Two token requests",
            quote:
              "The client presents the ID-JAG under the RFC 7523 jwt-bearer grant",
          },
          {
            title: "Identity assertion",
            url: "https://py.sdk.modelcontextprotocol.io/client/identity-assertion/",
            publisher: "Model Context Protocol project",
            section: "The authorization server",
            quote:
              "The SDK can also be the authorization server: create_auth_routes returns the authorization server's routes as a list any Starlette app can mount, which is how examples/servers/simple-auth/ in the repository runs one.",
          },
          {
            title: "Identity assertion",
            url: "https://py.sdk.modelcontextprotocol.io/client/identity-assertion/",
            publisher: "Model Context Protocol project",
            section: "The authorization server",
            quote:
              "The SDK never decodes the assertion: only your deployment knows which IdP it trusts and which keys that IdP publishes, so everything inside exchange_identity_assertion is load-bearing.",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The SDK guide documents the provider and the authorization-server hook without a stage or a first release.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s own SDK documentation covers both roles for this mechanism.",
        },
      },
      {
        kind: "implementation",
        id: "xaa-mcp-typescript-sdk",
        parties: ["client"],
        organization: "Model Context Protocol project",
        product: "MCP TypeScript SDK v2",
        role: "Client provider",
        summary:
          "CrossAppAccessProvider obtains an MCP access token with a JWT Authorization Grant from the enterprise IdP. The SDK also exports the two exchanges, ID token for grant and grant for access token, as separate functions.",
        limits:
          "The guide names SEP-990 and no ID-JAG draft revision. The application supplies the user’s ID token. No stage or first release is given for the provider.",
        sources: [
          {
            title: "Authenticate without a user",
            url: "https://ts.sdk.modelcontextprotocol.io/v2/clients/machine-auth",
            publisher: "Model Context Protocol project",
            section: "Act for an enterprise user with cross-app access",
            quote:
              "Cross-app access (Enterprise Managed Authorization, SEP-990) lets a service reach an MCP server for a user who already authenticated with the enterprise IdP, with no second consent screen.",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The v2 documentation describes the provider without a stage.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s own SDK guide documents the client role for this mechanism.",
        },
      },
      {
        kind: "implementation",
        id: "xaa-auth0",
        parties: ["client", "as"],
        qualification: "Early Access, with documented limitations.",
        organization: "Auth0",
        product: "Auth0 Cross App Access",
        role: "Resource App authorization server and Requesting App",
        summary:
          "An Auth0 tenant can accept incoming ID-JAGs and issue access tokens for its API, or act as the Requesting App that obtains tokens from another app through XAA and stores them in Token Vault.",
        limits:
          "Auth0 labels the feature Early Access, offers it on Enterprise, B2B Pro and B2B Essential plans under free trial terms, and lists limits, including one XAA-enabled Resource App connection per enterprise IdP issuer. The enterprise IdP is another product, such as Okta. The page does not name a draft revision.",
        sources: [
          {
            title: "Cross App Access (XAA)",
            url: "https://auth0.com/docs/ai-agents-mcp/cross-app-access",
            publisher: "Auth0",
            section: "Set up Auth0 as Resource App",
            quote:
              "Configure your Auth0 tenant as the Resource App Authorization Server so that your SaaS application can accept incoming ID-JAG requests and issue access tokens for your API.",
          },
          {
            title: "Cross App Access (XAA)",
            url: "https://auth0.com/docs/ai-agents-mcp/cross-app-access",
            publisher: "Auth0",
            section: "Set up Auth0 as Requesting App",
            quote:
              "Configure your Auth0 tenant as the Requesting App so that your AI agent or SaaS application can call third-party APIs on a user’s behalf without requiring OAuth consent flows.",
          },
          {
            title: "Cross App Access (XAA)",
            url: "https://auth0.com/docs/ai-agents-mcp/cross-app-access",
            publisher: "Auth0",
            section: "Early Access limitations",
            quote: "XAA Early Access has the following limitations:",
          },
        ],
        release: {
          stage: "preview",
          label: "Early Access",
          detail:
            "Auth0’s guide describes the feature as XAA Early Access and lists its limitations. No date is given.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s documentation describes both roles for this mechanism. Early Access is recorded as preview.",
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
      {
        kind: "deployment",
        id: "xaa-atlassian-rovo",
        qualification: "Private beta at publication.",
        organization: "Atlassian",
        setting: "Atlassian OAuth and the Rovo MCP server",
        summary:
          "Atlassian describes adding Enterprise-Managed Authorization to its Rovo MCP server: Atlassian OAuth validates the ID-JAG a client presents with the JWT bearer grant, then issues a normal Atlassian access token for Rovo MCP.",
        limits:
          "The 29 June 2026 post says the feature is in private beta. It names Claude as an example client and gives no usage figures or draft revision.",
        sources: [
          {
            title:
              "How We Brought Enterprise-Managed Authorization to Rovo MCP with XAA and ID-JAG",
            url: "https://www.atlassian.com/blog/development/enterprise-managed-authorization-rovo-mcp-xaa-id-jag",
            publisher: "Atlassian",
            publishedOn: "2026-06-29",
            section:
              "How We Brought Enterprise-Managed Authorization to Rovo MCP with XAA and ID-JAG",
            quote:
              "We recently added support for Enterprise-Managed Authorization in Atlassian Rovo MCP server using Cross-App Access (XAA) and the Identity Assertion JWT Authorization Grant (ID-JAG).",
          },
          {
            title:
              "How We Brought Enterprise-Managed Authorization to Rovo MCP with XAA and ID-JAG",
            url: "https://www.atlassian.com/blog/development/enterprise-managed-authorization-rovo-mcp-xaa-id-jag",
            publisher: "Atlassian",
            publishedOn: "2026-06-29",
            section:
              "How We Brought Enterprise-Managed Authorization to Rovo MCP with XAA and ID-JAG",
            quote: "This feature is currently in private beta.",
          },
        ],
        attribution: "operator-report",
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator’s engineering blog describes its own service. Private beta is stated as of publication; later status was not established.",
        },
      },
      {
        kind: "deployment",
        id: "xaa-notion",
        qualification: "Enterprise plan with SAML SSO.",
        organization: "Notion",
        setting: "Notion MCP token endpoint",
        summary:
          "Notion documents accepting an ID-JAG at its MCP token endpoint, so an MCP client can trade it for a Notion MCP access token without a browser or consent screen.",
        limits:
          "Notion limits the feature to the Enterprise plan and to workspaces using SAML SSO, with each IdP issuer bound to one workspace. The guide gives no launch date or usage.",
        sources: [
          {
            title: "Enterprise-managed authorization",
            url: "https://developers.notion.com/guides/mcp/enterprise-managed-authorization",
            publisher: "Notion",
            section: "Enterprise-managed authorization",
            quote:
              "Notion MCP accepts an ID-JAG (Identity Assertion JWT Authorization Grant) at its token endpoint.",
          },
          {
            title: "Enterprise-managed authorization",
            url: "https://developers.notion.com/guides/mcp/enterprise-managed-authorization",
            publisher: "Notion",
            section: "Requirements",
            quote:
              "Enterprise-managed authorization is part of the Enterprise plan.",
          },
        ],
        attribution: "operator-report",
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The named operator documents the mechanism for its own service. Usage was not established.",
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
      {
        id: "cross-app-access-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "xaa-mcp-python-sdk",
          "xaa-mcp-typescript-sdk",
          "xaa-auth0",
          "xaa-atlassian-rovo",
          "xaa-notion",
        ],
      },
    ],
  },
  {
    slug: "identity-chaining",
    reviewedOn: "2026-11-14",
    scope:
      "Cross-domain chaining with an RFC 8693 exchange for an assertion targeted at a second authorization server, then RFC 7523 redemption for that server’s access token. Support for the separate ID-JAG profile does not by itself establish this chain.",
    genericParties: ["api"],
    searchNote:
      "Selected a configuration guide and an implementer’s draft report. Cross-domain building blocks, draft acknowledgments, public demos and interoperability claims without a named operator do not establish production use. A further search on 14 November 2026 found no new implementation and corrected authgent’s entry from its current standards report. The API sees only its own domain’s token and was not looked for.",
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
        qualification: "Maintainer’s own report, mapped to draft -17.",
        organization: "authgent project",
        product: "authgent",
        role: "Reference authorization server",
        summary:
          "The maintainer’s standards report maps the issuing of chaining grants in domain A, and their redemption with the JWT bearer grant in domain B, to authgent’s code against revision -17.",
        limits:
          "This is the maintainer’s own account, with its own tests. The June implementation-status draft, which tracked -15, says no interoperability test against a second, independent implementation had been made, and the standards report, last updated 9 August 2026 for authgent 0.3.x, reports none.",
        sources: [
          {
            publisher: "authgent project",
            title: "Standards Implementation Report",
            url: "https://raw.githubusercontent.com/authgent/authgent/main/STANDARDS.md",
            section:
              "draft-ietf-oauth-identity-chaining (rev -17) — section by section",
            quote:
              "The two-step flow is implemented as two distinct code paths:",
          },
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
          label: "Maintainer’s reference implementation",
          detail:
            "The standards report lists identity chaining as a “WG-track reference impl”, apart from the RFCs it marks Production. The June draft called the project experimental to operational.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
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
    reviewedOn: "2026-11-14",
    scope:
      "Implementations of the IETF OAuth Transaction Tokens draft for signed transaction context carried across calls within a trust domain. A generic JWT, RFC 8693 exchange, or the separate agent-context draft does not establish this capability.",
    searchNote:
      "Selected transaction-token services and verification integrations from their project documentation. The reviewed sources describe examples, demos and release artifacts. They did not establish a named production deployment. A further search on 14 November 2026 added Janssen, whose claim names follow an earlier draft. No gateway beyond kontxt, no agent-side SDK and no deployment were found.",
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
        qualification: "Maintainer’s own report, mapped to draft -11.",
        organization: "authgent project",
        product: "authgent",
        role: "Reference transaction-token issuer",
        summary:
          "The maintainer’s standards report maps the token exchange request and transaction-token issuance to authgent’s OAuth server against revision -11.",
        limits:
          "This is the maintainer’s own account, with its own tests and a demo. It says that when the subject token carries no scope, any request that names a scope is refused. No test against an independent implementation is reported.",
        sources: [
          {
            publisher: "authgent project",
            title: "Standards Implementation Report",
            url: "https://raw.githubusercontent.com/authgent/authgent/main/STANDARDS.md",
            section: "§13.6 / §13.14 Scope policy",
            quote:
              "Enforced inline — an absent or empty scope claim on the subject_token yields an empty available-scope set, so any non-empty request is rejected rather than passed through unconstrained:",
          },
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
          label: "Maintainer’s reference implementation",
          detail:
            "The standards report lists transaction tokens as a “WG-track reference impl”, apart from the RFCs it marks Production. The June draft called the project experimental to operational.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "Primary documentation identifies the product, role and mechanism. Support is scoped to the behavior and conditions described by the publisher.",
        },
      },
      {
        kind: "implementation",
        id: "txn-janssen",
        parties: ["tts"],
        qualification: "Claims follow an early draft; no revision named.",
        organization: "Janssen Project",
        product: "Janssen Server",
        role: "Transaction-token service",
        summary:
          "Janssen Server’s authorization server issues and replaces transaction tokens at its token endpoint through a token exchange request with the txn_token requested token type. A custom script can change the token’s claims, response or lifetime.",
        limits:
          "The page names no draft revision. Its sample token uses the claims azd and purp, where the site’s revision -11 has tctx and scope, and a typ header of N_A rather than txntoken+jwt. It documents issuance only, not a gateway, a workload or a verifier, and gives no stage.",
        sources: [
          {
            title: "OAuth Transaction Token",
            url: "https://docs.jans.io/stable/janssen-server/auth-server/tokens/oauth-tx-tokens/",
            publisher: "Janssen Project",
            section: "Transaction Token Obtain/Replace",
            quote: "Transaction Tokens can be obtained at Token Endpoint",
          },
          {
            title: "OAuth Transaction Token",
            url: "https://docs.jans.io/stable/janssen-server/auth-server/tokens/oauth-tx-tokens/",
            publisher: "Janssen Project",
            section: "TxToken custom script",
            quote:
              "Custom script allows to modify TxToken JWT payload claim, response or lifetime.",
          },
        ],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The stable documentation, which the page files under v2.6.1, describes the feature without a stage or a first release.",
        },
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s own documentation describes this role and mechanism, with a sample request using the txn_token token type. Revision conformance was not established.",
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
      {
        id: "transaction-tokens-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: ["txn-janssen"],
      },
    ],
  },
  {
    slug: "oauth-mtls",
    reviewedOn: "2026-11-14",
    scope:
      "RFC 8705 certificate-bound OAuth access tokens. Issuer binding, presentation of the same client certificate and enforcement by the protected resource are distinct from mTLS client authentication at the token endpoint.",
    searchNote:
      "Selected issuer and resource-server documentation and one operator’s own payment API documentation. Certifications, ecosystem requirements and mTLS client authentication alone did not count as deployment evidence. A further search on 14 November 2026 added three issuers and a gateway. WSO2’s documentation refused the request and waits for the next run.",
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
        qualification: "The plugin page marks it Enterprise only.",
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
      {
        kind: "implementation",
        id: "oauth-mtls-microsoft-identity-web",
        organization: "Microsoft",
        product: "Microsoft Identity Web with Microsoft Entra ID",
        role: "Client library, with Entra ID as issuer",
        parties: ["agent", "as"],
        release: {
          stage: "preview",
          label: "Private preview",
          detail:
            "The guide says not all clients may obtain mTLS PoP certificates because the feature is in private preview.",
        },
        summary:
          "The library asks Entra ID for an access token bound to an X.509 certificate, then calls the API over mutual TLS with that certificate. The token carries the certificate’s SHA-256 thumbprint in cnf.",
        qualification: "Private preview; not all clients may use it.",
        limits:
          "Application (app-only) tokens only; delegated tokens are not supported. The guide sends the token under an MTLS_POP authorization scheme, not Bearer. The API-side check in the guide is sample code the developer writes, not a library feature. Which clients are admitted is not stated.",
        sources: [
          {
            title:
              "Configure token binding with mTLS Proof-of-Possession (mTLS PoP)",
            url: "https://learn.microsoft.com/en-us/entra/msidweb/call-downstream-apis/token-binding",
            publisher: "Microsoft",
            section: "Note",
            quote:
              "Not all clients are allowed to obtain mTLS PoP certificates because this feature is currently in private preview.",
          },
          {
            title:
              "Configure token binding with mTLS Proof-of-Possession (mTLS PoP)",
            url: "https://learn.microsoft.com/en-us/entra/msidweb/call-downstream-apis/token-binding",
            publisher: "Microsoft",
            section: "Use MicrosoftIdentityMessageHandler with token binding",
            quote:
              "MicrosoftIdentityMessageHandler supports mTLS PoP token binding through the AddMicrosoftIdentityMessageHandler extension methods.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s own guide read for the client role and the issuer’s binding. Stage follows the guide’s “private preview”.",
        },
      },
      {
        kind: "implementation",
        id: "oauth-mtls-keycloak",
        organization: "Keycloak",
        product: "Keycloak",
        role: "Authorization server",
        parties: ["as"],
        release: {
          stage: "unspecified",
          label: "Client setting in the 26.8.2 guide",
          detail:
            "The Server Administration Guide for 26.8.2 documents the client setting without a release stage.",
        },
        summary:
          "A per-client setting binds access and refresh tokens to the client certificate from the TLS handshake. Keycloak checks the certificate on refresh, UserInfo and its own logout endpoint.",
        limits:
          "Keycloak’s client adapters treat the tokens as bearer tokens, so an API needs its own check. Bound tokens cannot be the subject token in Standard Token Exchange.",
        sources: [
          {
            title: "Server Administration Guide",
            url: "https://www.keycloak.org/docs/latest/server_admin/index.html",
            publisher: "Keycloak",
            section: "OpenID Connect Compatibility Modes",
            quote:
              "Mutual TLS binds an access token and a refresh token together with a client certificate, which is exchanged during a TLS handshake.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s own guide read for this role and mechanism. The guide is the latest version, 26.8.2, on the day of the check.",
        },
      },
      {
        kind: "implementation",
        id: "oauth-mtls-auth0",
        organization: "Auth0",
        product: "Auth0",
        role: "Authorization server",
        parties: ["as"],
        release: {
          stage: "supported",
          label: "Generally available with Highly Regulated Identity",
          detail:
            "The 28 May 2024 changelog entry announces Highly Regulated Identity as generally available and lists mTLS for client authentication and token binding.",
        },
        summary:
          "Auth0 binds an access token to the client certificate from the mTLS handshake by putting its x5t#S256 thumbprint in cnf.",
        qualification:
          "Enterprise plan with the Highly Regulated Identity add-on.",
        limits:
          "Covers Auth0-issued tokens, for confidential clients only. The API has to check the certificate against cnf. Auth0’s guide recommends sending the token under the DPoP authorization scheme, which RFC 8705 does not require.",
        sources: [
          {
            title: "mTLS Sender Constraining",
            url: "https://auth0.com/docs/secure/sender-constraining/mtls-sender-constraining",
            publisher: "Auth0",
            section: "Prerequisites",
            quote:
              "Have an Enterprise Plan with the Highly Regulated Identity add-on for your Auth0 tenant.",
          },
          {
            title: "mTLS Sender Constraining",
            url: "https://auth0.com/docs/secure/sender-constraining/mtls-sender-constraining",
            publisher: "Auth0",
            section:
              "Step 3: Auth0 Authorization Server processes request and binds token",
            quote:
              "The cnf claim contains the x5t#S256 parameter, which is the Base64url-encoded SHA-256 thumbprint of the client certificate.",
          },
          {
            title:
              "Auth0 Changelog · Highly Regulated Identity is now Generally Available",
            url: "https://auth0.com/changelog",
            publisher: "Auth0",
            publishedOn: "2024-05-28",
            section: "Highly Regulated Identity is now Generally Available",
            quote:
              "Mutual TLS (mTLS) for client authentication and token binding",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s guide and changelog read for this role and mechanism. The changelog’s date sits above the entry heading, as the earlier run noted for this page.",
        },
      },
      {
        kind: "implementation",
        id: "oauth-mtls-gravitee",
        organization: "Gravitee",
        product: "Gravitee API Management JWT plan",
        role: "Gateway verifier",
        parties: ["api"],
        release: {
          stage: "unspecified",
          label: "Documented for API Management 4.13",
          detail:
            "The JWT plan page for 4.13 lists the option without a release stage.",
        },
        summary:
          "A JWT plan can check the certificate thumbprint in the access token against the certificate the client presents, or one passed in a header by a proxy that ends mTLS.",
        limits:
          "Covers JWT access tokens. An option skips the check for tokens with no cnf. The issuer has to bind the token.",
        sources: [
          {
            title: "JWT",
            url: "https://documentation.gravitee.io/apim/secure-and-expose-apis/plans/jwt",
            publisher: "Gravitee",
            section: "Configuration",
            quote:
              "Validates the certificate thumbprint extracted from the access_token against the one provided by the client",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s own plan documentation read for this role and mechanism. No release stage is stated.",
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
      {
        id: "oauth-mtls-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "oauth-mtls-microsoft-identity-web",
          "oauth-mtls-keycloak",
          "oauth-mtls-auth0",
          "oauth-mtls-gravitee",
        ],
      },
    ],
  },
  {
    slug: "url-elicitation",
    reviewedOn: "2026-11-14",
    scope:
      "MCP URL-mode elicitation for a tool call that needs an out-of-band user interaction. The flow illustrates 2026-07-28 multi-round-trip requests. Earlier server-initiated URL requests are labeled separately.",
    genericParties: ["third"],
    searchNote:
      "Reviewed client, server SDK and gateway documentation for explicit URL mode. The search found no qualifying operator account for a tool using the illustrated retry path. A further search on 14 November 2026 added the TypeScript SDK and VS Code. No operator’s account of a server using URL mode was found. The third-party service is ordinary OAuth and was not looked for.",
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
      {
        kind: "implementation",
        id: "url-elicitation-typescript",
        organization: "Model Context Protocol project",
        product: "MCP TypeScript SDK v2",
        role: "Server SDK and client retry support",
        parties: ["mcp", "client"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited v2 documentation does not name a feature release stage.",
        },
        summary:
          "A v2 server handler can return an input-required result carrying a URL-mode request, built with inputRequired.elicitUrl, and an opaque request state. On the client, the same elicitation handler answers a pushed request or one the SDK fulfils inside a tool-call round, which the SDK retries up to a set number of rounds.",
        limits:
          "On a 2026-07-28 connection the older elicitInput call throws, and that revision’s flow has no completion notification. The request-state codec is signed, not encrypted.",
        sources: [
          {
            title: "input_required",
            url: "https://ts.sdk.modelcontextprotocol.io/v2/servers/input-required.html",
            publisher: "MCP TypeScript SDK project",
            section: "Pick the embedded request kind",
            quote:
              "inputRequired.elicit (form), inputRequired.elicitUrl (out-of-band URL), inputRequired.createMessage (sampling)",
          },
          {
            title: "Handle server requests",
            url: "https://ts.sdk.modelcontextprotocol.io/v2/clients/server-requests.html",
            publisher: "MCP TypeScript SDK project",
            section: "Register each handler once",
            quote:
              "The same handler answers a request the server pushes to your client and a request the SDK fulfils for you inside a callTool() round",
          },
          {
            title: "Elicitation",
            url: "https://ts.sdk.modelcontextprotocol.io/v2/servers/elicitation.html",
            publisher: "MCP TypeScript SDK project",
            section: "Signal that the URL flow finished",
            quote: "This notification exists on 2025-11-25 connections only",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project documents both roles for the 2026-07-28 multi-round-trip path. The client page’s handler branches on mode url; the input-required page names the URL builder.",
        },
      },
      {
        kind: "implementation",
        id: "url-elicitation-vscode",
        organization: "Microsoft",
        product: "Copilot in Visual Studio Code",
        role: "MCP client host",
        parties: ["client"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The cited guide does not name a release stage for this capability.",
        },
        summary:
          "The extension guide says Copilot supports form and URL elicitation during an active turn, with the host rendering the input. Requests are canceled in Autopilot and declined when no turn is active.",
        limits:
          "The guide says support depends on the Copilot harness that runs the session and the client that presents it. It names no MCP revision, so it does not establish the 2026-07-28 retry path, and it does not describe how the URL is shown or opened.",
        sources: [
          {
            title: "Integrate MCP servers with Copilot",
            url: "https://code.visualstudio.com/api/extension-guides/ai/mcp",
            publisher: "Microsoft",
            section: "Elicitation",
            quote:
              "Copilot supports form and URL elicitation during an active turn.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The publisher documents URL mode for this product in the client role. Release wording and revision are limited to what the guide states.",
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
      {
        id: "url-elicitation-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: ["url-elicitation-typescript", "url-elicitation-vscode"],
      },
    ],
  },
  {
    slug: "aauth",
    reviewedOn: "2026-11-14",
    scope:
      "AAuth Internet-Draft -11 Person Server authorization. Record demonstrable parts of the signed request, person-token, resource-token and auth-token path. Separate adjacent access modes and generic HTTP message signatures.",
    searchNote:
      "Checked the draft’s implementation notes, project code and examples. Exploratory SDKs provide specific protocol components. No qualifying production account was found in the reviewed sources. A further search on 14 November 2026 added a Go library, agent packages and a hosted person server. No operator running the person-server path was found.",
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
      {
        kind: "implementation",
        id: "aauth-go",
        organization: "aauth-go project",
        product: "aauth-go v0.3.0",
        role: "Go library for every role: agent, resource, Person Server and agent provider",
        parties: ["agent", "api", "ps", "ap"],
        release: {
          stage: "unspecified",
          label: "v0.3.0, draft -11",
          detail:
            "The changelog dates v0.3.0 to 26 October 2026 and says it tracks draft -11. The README says the drafts are works in progress and the module’s minor version moves with them; it names no release stage.",
        },
        summary:
          "A Go module with an agent transport that answers agent-token, person-token and auth-token challenges, a resource guard, a Person Server handler with person and auth token endpoints, and a library for running a hosted agent provider. Its own coverage table marks sections 5 to 11 of draft -11 implemented and tested, and names the x509 Signature-Key scheme and Rich Resource Requests as not implemented.",
        limits:
          "The coverage table is the project’s own account. The draft’s implementation section does not list it, and the sources do not establish interoperability testing, a hosted service or a deployment. Policy and storage are left to the application.",
        sources: [
          {
            title: "aauth-go README",
            url: "https://github.com/aauth-dev/aauth-go/blob/main/README.md",
            publisher: "aauth-go project",
            section: "aauth-go",
            quote:
              "The module covers every role: agent, resource, Person Server (PS), Access Server (AS), and hosted agent provider (AP).",
          },
          {
            title: "aauth-go README",
            url: "https://github.com/aauth-dev/aauth-go/blob/main/README.md",
            publisher: "aauth-go project",
            section: "Drafts implemented",
            quote:
              "The drafts are works in progress, and each revision can change the wire format; the module's minor version moves with them until the protocol stabilizes.",
          },
          {
            title: "aauth-go CHANGELOG",
            url: "https://github.com/aauth-dev/aauth-go/blob/main/CHANGELOG.md",
            publisher: "aauth-go project",
            publishedOn: "2026-10-26",
            section: "[v0.3.0] - 2026-10-26",
            quote: "Completes the agent side of draft -11 resource access",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s README and changelog read for each role it claims. The parties are those its coverage table marks implemented for sections 5 to 7 of draft -11. The access server role is left out because this diagram has no such party. Second reading: the summary now gives what the coverage table marks, not only its legend.",
        },
      },
      {
        kind: "implementation",
        id: "aauth-js-agent",
        organization: "Hellō",
        product: "@aauth/agent 4.1.1 and @aauth/bootstrap 2.0.0",
        role: "Agent library and self-hosted agent provider CLI",
        parties: ["agent", "ap"],
        release: {
          stage: "experimental",
          label: "Exploratory TypeScript packages",
          detail:
            "Draft -11 section 16 lists the TypeScript packages, including agent token issuance, as exploratory. The protocol package says it tracks draft -11.",
        },
        summary:
          "The agent library signs requests, obtains person tokens, answers challenges, exchanges resource tokens for auth tokens at the person server and polls deferred responses. The bootstrap CLI makes a key, binds it to a self-hosted agent provider and a person server, and generates agent tokens.",
        limits:
          "The repository README says call chaining and four-party federation are not yet supported. The sources do not establish a hosted agent provider, conformance testing or a deployment.",
        sources: [
          {
            title: "@aauth/agent README",
            url: "https://github.com/aauth-dev/packages-js/blob/main/agent/README.md",
            publisher: "Hellō",
            section: "@aauth/agent",
            quote:
              "Signs HTTP requests, obtains person tokens, handles AAuth challenge-response flows, exchanges resource tokens for auth tokens at the person server, and polls 202 deferred responses.",
          },
          {
            title: "@aauth/bootstrap README",
            url: "https://github.com/aauth-dev/packages-js/blob/main/bootstrap/README.md",
            publisher: "Hellō",
            section: "Quick Start",
            quote:
              "`create` detects available keystores (YubiKey PIV, macOS Secure Enclave, software), generates a key in the chosen one (default: software/Ed25519), binds it to the agent provider, and binds a person server.",
          },
          {
            title: "@aauth/protocol README",
            url: "https://github.com/aauth-dev/packages-js/blob/main/protocol/README.md",
            publisher: "Hellō",
            section: "@aauth/protocol",
            quote: "Tracks `draft-hardt-oauth-aauth-protocol-11`.",
          },
          {
            title: "AAuth Protocol -11, section 16",
            url: "https://www.ietf.org/archive/id/draft-hardt-oauth-aauth-protocol-11.html#section-16",
            publisher: "Dick Hardt, IETF Internet-Draft",
            publishedOn: "2026-09-25",
            section: "16. Implementation Status",
            quote:
              "Organization: Hellō. Coverage: agent token issuance, HTTP Message Signatures, resource token exchange, PS token endpoint. Level of maturity: exploratory.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s package READMEs read for the agent and agent-provider roles. The stage comes from the draft’s implementation section, whose author is Hellō’s. Versions are from each package’s package.json on main.",
        },
      },
      {
        kind: "implementation",
        id: "aauth-hello-person-server",
        organization: "Hellō",
        product: "Hellō Person Server (person.hello.coop)",
        role: "Hosted Person Server",
        parties: ["ps"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The host page names the role and nothing else. Hellō’s bootstrap CLI binds it as the default person server. Neither names a stage or a draft revision.",
        },
        summary:
          "Hellō runs a host that states it implements the AAuth Person Server role. Hellō’s agent-provider CLI binds new agents to it by default.",
        limits:
          "The page gives no terms, availability, revision or account of use. This review did not read its discovery document or send it any request, so the endpoints it serves are not established.",
        sources: [
          {
            title: "Hellō Person Server",
            url: "https://person.hello.coop/",
            publisher: "Hellō",
            section: "Hellō Person Server",
            quote:
              "This host implements the AAuth Person Server role for Hellō.",
          },
          {
            title: "@aauth/bootstrap README",
            url: "https://github.com/aauth-dev/packages-js/blob/main/bootstrap/README.md",
            publisher: "Hellō",
            section: "Quick Start",
            quote:
              "Register an agent provider: generate a key, bind it, and bind the default # person server (person.hello.coop)",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The operator’s own host page states the role, and the operator’s CLI documentation names it the default. The bootstrap quote spans two comment lines of a code block; the # is the comment marker, which the check drops. Second reading: kept, because the bootstrap README is the maker’s documentation naming the host as its default person server, but the compact card now says that only the role is stated.",
        },
        qualification:
          "The host page states the role only; nothing documents what it supports.",
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
      {
        id: "aauth-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "aauth-go",
          "aauth-js-agent",
          "aauth-hello-person-server",
        ],
      },
    ],
  },
  {
    slug: "wimse-workload-tokens",
    reviewedOn: "2026-11-14",
    scope:
      "Workload Identity Token (workload credentials draft -03) with a Workload Proof Token (draft -02). Issuance and propagation are recorded as separate components from proof generation and verification.",
    searchNote:
      "Reviewed an exact-revision Rust reference implementation, experimental SPIRE issuance and an alpha mesh integration. No qualifying operator deployment or cross-product interoperability evidence was found. A further search on 14 November 2026 added two issuers in preview or beta and an experimental client library. No deployment and no second gateway were found.",
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
      {
        kind: "implementation",
        id: "wimse-defakto",
        organization: "Defakto Security",
        product: "Defakto Mint",
        role: "WIT-SVID issuer and Workload API delivery",
        parties: ["issuer"],
        release: {
          stage: "preview",
          label: "Preview, off by default",
          detail:
            "The documentation marks WIT-SVID a preview feature, off by default and enabled through Defakto support, and says it is not yet recommended for production use.",
        },
        summary:
          "Issues WIT-SVIDs that carry the workload’s proof-of-possession public key in a cnf claim. The agent generates the key pair and hands the workload the token and the private key over the Workload API, renewing before expiry.",
        limits:
          "The page names no draft revision. It covers issuance and delivery; it does not establish how the workload proves possession to a receiver, or a WPT verifier. The key pair is generated by the agent host, not by the workload.",
        sources: [
          {
            title: "WIT-SVID (Workload Identity Token)",
            url: "https://d.spirl.com/mint/configuration/svid-issuance/wit-svid",
            publisher: "Defakto Security",
            section: "WIT-SVID (Workload Identity Token)",
            quote:
              "The token format follows a draft IETF/SPIFFE specification that may still change, so it is not yet recommended for production use.",
          },
          {
            title: "WIT-SVID (Workload Identity Token)",
            url: "https://d.spirl.com/mint/configuration/svid-issuance/wit-svid",
            publisher: "Defakto Security",
            section: "How it works",
            quote:
              "The workload calls the Workload API and receives both the token and its private key.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker documents its product as a WIT issuer, in preview. The draft’s implementation section listed it as alpha, which is the project’s self-report and was used only as a lead. It is a commercial issuer beside the project reference (SPIRE) and the pre-alpha one (wimsey).",
        },
      },
      {
        kind: "implementation",
        id: "wimse-open-agent-auth",
        organization: "Alibaba",
        product: "Open Agent Auth",
        role: "Agent identity provider, agent client and resource-server verifier",
        parties: ["issuer", "agent", "tool"],
        release: {
          stage: "preview",
          label: "Public beta, v0.1.0-beta.1",
          detail:
            "The README says Open Agent Auth v0.1.0-beta.1 is in public beta and that a 1.0.0 release for mission-critical production is still to come.",
        },
        summary:
          "A Java framework for AI agents. Its agent identity provider issues a WIT bound to a public key the agent generates, the agent signs a WPT for a request to a protected resource, and the resource server checks the WIT, then the WPT with the key in the WIT’s cnf claim.",
        limits:
          "It names the drafts but no revisions. Its WIT also binds a user and its example carries an aud claim, and its WPT can bind further tokens of its own; the header names it uses were not established. No pairing with another WIT issuer or verifier was established.",
        sources: [
          {
            title: "Token Reference",
            url: "https://github.com/alibaba/open-agent-auth/blob/main/docs/architecture/01-token.md",
            publisher: "Alibaba",
            section: "WPT Generation Process",
            quote:
              "The Resource Server validates the WPT by extracting the WIT from the request headers and verifying its signature and expiration.",
          },
          {
            title: "Token Reference",
            url: "https://github.com/alibaba/open-agent-auth/blob/main/docs/architecture/01-token.md",
            publisher: "Alibaba",
            section: "Workload Lifecycle and Management",
            quote:
              "When an agent requests a workload creation, it submits the user's ID Token and a newly generated public key to the Agent IDP.",
          },
          {
            title: "Open Agent Auth README",
            url: "https://github.com/alibaba/open-agent-auth/blob/main/README.md",
            publisher: "Alibaba",
            section: "Roadmap, Current Release",
            quote:
              "Open Agent Auth v0.1.0-beta.1 is in public beta — feature-complete, actively evolving, and ready for you to explore.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s repository documents all three roles for WIT and WPT. It is the first entry from an organization other than the draft’s own community that documents WPT verification at the tool service, with extensions recorded as limits.",
        },
      },
      {
        kind: "implementation",
        id: "wimse-go-spiffe",
        organization: "SPIFFE project",
        product: "go-spiffe",
        role: "Workload library",
        parties: ["agent"],
        qualification: "Proof generation and verification unverified.",
        release: {
          stage: "experimental",
          label: "Experimental since 2.7.0",
          detail:
            "The changelog lists experimental support for WIT-SVIDs under 2.7.0, dated 3 June 2026.",
        },
        summary:
          "Go library that can fetch and watch WIT-SVIDs and WIT bundles from the Workload API, with experimental packages for WIT-SVIDs and their bundles.",
        limits:
          "The changelog does not establish that the library creates or verifies a WPT, or which draft revision it follows. It depends on an issuer that serves WIT-SVIDs over the Workload API, such as SPIRE 1.16.0.",
        sources: [
          {
            title: "go-spiffe CHANGELOG",
            url: "https://github.com/spiffe/go-spiffe/blob/main/CHANGELOG.md",
            publisher: "SPIFFE project",
            publishedOn: "2026-06-03",
            section: "[2.7.0] - 2026-06-03, Added",
            quote:
              "Workload API client support for fetching and watching WIT-SVIDs and WIT bundles",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s changelog documents the workload side of WIT-SVID delivery, the counterpart to SPIRE’s experimental issuance already recorded.",
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
      {
        id: "wimse-workload-tokens-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "wimse-defakto",
          "wimse-open-agent-auth",
          "wimse-go-spiffe",
        ],
      },
    ],
  },
  {
    slug: "web-bot-auth",
    reviewedOn: "2026-11-14",
    scope:
      "Web Bot Auth signing, key discovery and verification. The site illustrates IETF working-group draft -01, which uses a labeled Signature-Agent member with a direct key-set URL. Older profiles are identified by their documented wire form.",
    searchNote:
      "Reviewed primary signer and verifier documentation. The selected products document earlier or differing wire forms. No selected source established full support for the illustrated -01 profile. A further search on 14 November 2026 added two signers, a gateway policy and a demonstration module for a website. No site operator’s own account was found.",
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
      {
        kind: "implementation",
        id: "web-bot-auth-agentcore-browser",
        organization: "Amazon Web Services",
        product: "Amazon Bedrock AgentCore Browser",
        role: "Hosted browser that signs requests and registers its keys",
        parties: ["op", "agent"],
        release: {
          stage: "preview",
          label: "Preview since 30 October 2025",
          detail:
            "AWS announced Web Bot Auth for AgentCore Browser as a preview on 30 October 2025. The guide says the preview follows a draft that may change, and names no revision.",
        },
        qualification: "Off by default; enabled when the browser is created.",
        summary:
          "When enabled, the browser signs each HTTP request and adds Signature, Signature-Input and Signature-Agent headers. AWS generates the keys and registers them with bot control vendors, so the customer does not register with each vendor or run verification infrastructure.",
        limits:
          "The guide names the IETF architecture draft but no revision, and does not show the Signature-Agent value, so the wire form is unverified. It does not establish how sites treat the traffic; AWS says support varies by vendor and site policy.",
        sources: [
          {
            title: "Reducing CAPTCHAs with Web Bot Auth",
            url: "https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-web-bot-auth.html",
            publisher: "Amazon Web Services",
            section: "Overview",
            quote:
              "When Web Bot Auth is enabled, Amazon Bedrock AgentCore Browser automatically signs each HTTP request with a private key and includes verification headers.",
          },
          {
            title: "Reducing CAPTCHAs with Web Bot Auth",
            url: "https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/browser-web-bot-auth.html",
            publisher: "Amazon Web Services",
            section: "Reducing CAPTCHAs with Web Bot Auth",
            quote:
              "is based on the draft IETF Web Bot Auth protocol, which is subject to change as the specification evolves toward finalization.",
          },
          {
            title:
              "Amazon Bedrock AgentCore Browser now reduces CAPTCHAs with Web Bot Auth (Preview)",
            url: "https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-bedrock-agentcore-browser-web-bot-auth-preview",
            publisher: "Amazon Web Services",
            publishedOn: "2025-10-30",
            section:
              "Amazon Bedrock AgentCore Browser now reduces CAPTCHAs with Web Bot Auth (Preview)",
            quote:
              "It automatically generates security credentials, signs HTTP requests with private keys, and registers verified identities - getting you started immediately without the need to register with multiple WAF providers or manage verification infrastructure.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s developer guide and dated announcement read for signing and key registration. The operator party is filled because AWS, not the customer, holds and registers the keys, per the announcement. Stage is the announcement’s and the guide’s word. Second reading: the summary’s claim about the key directory was narrowed to what the announcement says.",
        },
      },
      {
        kind: "implementation",
        id: "web-bot-auth-everruns",
        organization: "Everruns",
        product: "Everruns 0.51.0",
        role: "Self-hosted agent platform that signs egress and serves the key directory",
        parties: ["op", "agent"],
        release: {
          stage: "unspecified",
          label: "Changed in 0.51.0",
          detail:
            "The changelog entry of 4 November 2026 says signing moved to the current IETF draft in 0.51.0. The feature guide says Everruns follows the working-group draft and stays compatible with Cloudflare’s verifier; neither names a revision number or a stage.",
        },
        qualification: "Sends a quoted origin, the form Cloudflare accepts.",
        summary:
          "The platform’s egress layer signs requests from its fetch tool and shell, covering method, authority, path and Signature-Agent. The deployment serves its key directory at the well-known path, signed once per key, and names its own origin in Signature-Agent.",
        limits:
          "A community project; the operator is whoever deploys it. A quoted origin in Signature-Agent is the earlier form, not the -01 dictionary with a direct key-set URL. The sources do not establish acceptance by any verifier or a deployment.",
        sources: [
          {
            title: "Request Signing",
            url: "https://everruns.com/docs/features/request-signing/",
            publisher: "Everruns",
            section: "How It Works in Everruns",
            quote:
              "When it is configured, requests made by the `web_fetch` tool and by `curl` in the Bashkit shell are signed.",
          },
          {
            title: "Request Signing",
            url: "https://everruns.com/docs/features/request-signing/",
            publisher: "Everruns",
            section: "Signing (outbound)",
            quote:
              '`Signature-Agent`: the deployment’s origin as a quoted string, for example `"https://app.example.com"`.',
          },
          {
            title: "Request signing now verifies with Cloudflare Web Bot Auth",
            url: "https://everruns.com/docs/changelog/2026-11-04-web-bot-auth-signing/",
            publisher: "Everruns",
            publishedOn: "2026-11-04",
            section:
              "Request signing now verifies with Cloudflare Web Bot Auth",
            quote:
              "The key directory at `/.well-known/http-message-signatures-directory` is signed per key, which Cloudflare requires before you can register it as a verified bot.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s feature guide and changelog read for signing and the key directory. The site serves Markdown to the check’s Accept header and HTML to browsers; the quotes avoid links so both match. It adds a self-hosted signer, a kind the hosted and first-party signers in the record do not cover. The page describes the project as a free, non-commercial community ecosystem.",
        },
      },
      {
        kind: "implementation",
        id: "web-bot-auth-zuplo",
        organization: "Zuplo",
        product: "Zuplo Web Bot Auth policy",
        role: "API gateway verifier",
        parties: ["edge"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The policy reference names no release stage or date. It applies to managed edge, dedicated and self-hosted gateways.",
        },
        summary:
          "An inbound gateway policy checks the Signature and Signature-Input headers with the web-bot-auth npm package, extracts the bot identity, and allows or blocks the request against a configured list of bots. The identity is available to later policies and handlers.",
        limits:
          "The page does not mention Signature-Agent or the operator’s key directory. Keys come from a directory URL the gateway owner sets, a JSON object of bot names and keys, and the page describes cryptographic verification only when one is set. It names no draft revision; the npm package it uses names an individual draft. The source does not establish a deployment.",
        sources: [
          {
            title: "Web Bot Auth Policy",
            url: "https://zuplo.com/docs/policies/web-bot-auth-inbound",
            publisher: "Zuplo",
            section: "Web Bot Auth Policy",
            quote:
              "Authenticate bots using HTTP Message Signatures via the official web-bot-auth npm package.",
          },
          {
            title: "Web Bot Auth Policy",
            url: "https://zuplo.com/docs/policies/web-bot-auth-inbound",
            publisher: "Zuplo",
            section: "Bot Directory",
            quote:
              "If you specify a directoryUrl, the policy will fetch the directory of known bots from that URL.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s policy reference read for verification and allowlisting. A gateway the API owner configures is a different kind of verifier from the two CDN and WAF entries. Second reading: the page’s key source is a directory the gateway owner configures, not the URL the request names, so the summary, limits and qualification now say so.",
        },
        qualification:
          "Verifies against keys from a directory the gateway owner configures.",
      },
      {
        kind: "implementation",
        id: "web-bot-auth-apache",
        organization: "web-bot-auth-apache project",
        product: "Apache Web Bot Auth Module (demo)",
        role: "Origin web server verifier",
        parties: ["edge", "site"],
        release: {
          stage: "experimental",
          label: "Demo module",
          detail:
            "The README calls it a demo and a sample module. Draft -01’s implementations appendix lists it under the individual architecture draft -03.",
        },
        summary:
          "An Apache module checks each request for the three signature headers, fetches the key set from the Signature-Agent URL and verifies an Ed25519 signature, so a website can verify without a CDN in front.",
        limits:
          "Sample code by one author. The README calls it a framework with hooks for your own verification logic; the source verifies Ed25519 only. It reads the Signature-Agent value as a bare URL, which is neither the quoted string of earlier drafts nor the -01 dictionary. Policy after verification is left to the site.",
        sources: [
          {
            title: "Apache Web Bot Auth Module (demo)",
            url: "https://github.com/garyillyes/web-bot-auth-apache/blob/main/README.md",
            publisher: "Gary Illyes",
            section: "Apache Web Bot Auth Module (demo) (web-bot-auth-apache)",
            quote:
              "This is a sample Apache module that provides a framework for implementing the web-bot-auth specification.",
          },
          {
            title: "Apache Web Bot Auth Module (demo)",
            url: "https://github.com/garyillyes/web-bot-auth-apache/blob/main/README.md",
            publisher: "Gary Illyes",
            section: "How it Works",
            quote:
              "It checks for the Signature, Signature-Input, and Signature-Agent headers.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project README read, and the source checked for the Ed25519 verification call and how it reads Signature-Agent. Lead from draft -01 Appendix F. It fills the website party because the site verifies for itself; it fills the verifier party because that is what it does.",
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
      {
        id: "web-bot-auth-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "web-bot-auth-agentcore-browser",
          "web-bot-auth-everruns",
          "web-bot-auth-zuplo",
          "web-bot-auth-apache",
        ],
      },
    ],
  },
  {
    slug: "agent-payments",
    reviewedOn: "2026-11-14",
    scope:
      "AP2 v0.2 autonomous payments using linked open and closed Checkout and Payment Mandates and signed receipts. Generic agent checkout, AP2 v0.1 and implementation intent are separate.",
    searchNote:
      "Checked the tagged SDK, the project’s reference materials, a Google codelab and provider announcements. The selected SDK is an implementation component. The search found no qualifying named deployment of the v0.2 autonomous path. A further search on 14 November 2026 added one vendor’s v0.2 mandate service, announced without a stage. No deployment and no credential provider’s documentation were found.",
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
      {
        kind: "implementation",
        id: "agent-payments-truvera",
        organization: "Dock Labs",
        product: "Truvera AP2 mandate issuance and verification",
        role: "Hosted mandate issuance and verification service",
        parties: ["agent", "cp", "merchant"],
        release: {
          stage: "unspecified",
          label: "Announced as available, 29 July 2026",
          detail:
            "The announcement says the AP2 mandate support is available now, without naming a release stage. It names AP2 v0.2.",
        },
        qualification: "Offered through Truvera’s MCP servers and API.",
        summary:
          "Truvera says it creates and signs open and closed Checkout and Payment Mandates and verifies mandate signatures and the whole chain. In autonomous flows it checks that the mandate is bound to the authorized agent and that the final checkout and payment stay within the user’s constraints. It also offers an npm package for signed receipts.",
        limits:
          "A vendor announcement; no developer documentation for the AP2 feature was found. The post points readers to the Truvera team to begin. It does not say which party holds which signing key, does not name the receipt package, and does not establish a customer deployment or settlement.",
        sources: [
          {
            title:
              "Truvera Enables AP2 Mandate Issuance. Start Building for Agentic Commerce Today.",
            url: "https://www.dock.io/post/truvera-enables-ap2-mandate-issuance-start-building-for-agentic-commerce-today",
            publisher: "Dock Labs",
            publishedOn: "2026-07-29",
            section: "How Truvera Supports AP2",
            quote:
              "Truvera handles the creation and signing of open and closed Checkout and Payment Mandates, including selective disclosure and the cryptographic links between the user’s authorization, checkout and payment.",
          },
          {
            title:
              "Truvera Enables AP2 Mandate Issuance. Start Building for Agentic Commerce Today.",
            url: "https://www.dock.io/post/truvera-enables-ap2-mandate-issuance-start-building-for-agentic-commerce-today",
            publisher: "Dock Labs",
            publishedOn: "2026-07-29",
            section: "How Truvera Supports AP2",
            quote:
              "In autonomous flows, it also validates that the mandate is bound to the authorized agent and that the final checkout and payment match the constraints approved by the user.",
          },
          {
            title:
              "Truvera Enables AP2 Mandate Issuance. Start Building for Agentic Commerce Today.",
            url: "https://www.dock.io/post/truvera-enables-ap2-mandate-issuance-start-building-for-agentic-commerce-today",
            publisher: "Dock Labs",
            publishedOn: "2026-07-29",
            section: "Get Started",
            quote: "Truvera's AP2 mandate support is available now.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s own dated announcement read for the v0.2 mandate types, the autonomous binding check and availability. It is the first entry from outside the AP2 project. The parties follow the announcement’s issuance and verification roles; it names merchant platforms, payment providers, wallets and agents as users. Stage left unspecified because ‘available now’ is not a stage word. Second reading: ‘available now’ is the only availability statement, beside a call to contact the team; the stage stays unspecified and the limits now say how the post says to start.",
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
      {
        id: "agent-payments-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: ["agent-payments-truvera"],
      },
    ],
  },
  {
    slug: "tool-call-authorization",
    reviewedOn: "2026-11-14",
    scope:
      "AuthZEN evaluations for individual requests. A policy enforcement point maps the request and enforces the response. A policy decision point evaluates it. The draft COAZ mapping for MCP is a separate part of the flow.",
    genericParties: ["agent"],
    searchNote:
      "Gateway and policy engine references, release notes and the working group’s interoperability results were reviewed. The searches found implementations and demonstrations. No named AuthZEN tool-call deployment was established in the sources reviewed. A further search on 14 November 2026 added three decision points and two enforcement points. No operator account of an AuthZEN deployment was found. The agent needs nothing particular to AuthZEN.",
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
      {
        kind: "implementation",
        id: "authzen-cerbos",
        organization: "Cerbos",
        product: "Cerbos PDP",
        role: "Policy decision point",
        parties: ["policy"],
        release: {
          stage: "unspecified",
          label: "Released in v0.48.0",
          detail:
            "The v0.48.0 release notes list the AuthZEN Authorization API 1.0 endpoints under Features. They name no separate stage for it.",
        },
        summary:
          "Exposes AuthZEN metadata, single evaluation and batch evaluation endpoints, and maps each request onto a Cerbos resource check.",
        limits:
          "The API reference calls the support partial. It reserves action properties for future use, so a duration sent there, as in the diagram, would have to go in resource or subject attributes instead.",
        sources: [
          {
            title:
              "Cerbos API: Request and response formats (AuthZEN Authorization API)",
            url: "https://docs.cerbos.dev/cerbos/latest/api/index.html",
            publisher: "Cerbos",
            section: "Request and response formats (AuthZEN Authorization API)",
            quote:
              "The AuthZEN API uses a simplified entity model that maps to Cerbos PDP’s native authorization model.",
          },
          {
            title: "Cerbos v0.48.0 release notes",
            url: "https://docs.cerbos.dev/cerbos/latest/releases/v0.48.0",
            publisher: "Cerbos",
            section: "Features",
            quote:
              "The Cerbos PDP now exposes API endpoints that are compatible with the AuthZEN authorization API specification.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s API reference and release notes, read for the decision-point role. The mapping table shows action.properties marked “Reserved for future use”.",
        },
      },
      {
        kind: "implementation",
        id: "authzen-gravitee",
        organization: "Gravitee",
        product: "Gravitee Gamma Authorization Management",
        role: "Policy decision point",
        parties: ["policy"],
        release: {
          stage: "unspecified",
          label: "Documented in Gamma 4.13",
          detail:
            "The Gamma 4.13 release notes, dated 22 October 2026, record decisions asked through an AuthZEN endpoint. They do not name a stage for it.",
        },
        summary:
          "A PDP gateway can expose its policy engine as an AuthZEN 1.0 API, with evaluation, batch evaluation, search and metadata routes. An AuthZEN policy can answer the same requests on an existing API.",
        limits:
          "The endpoint’s own plan is keyless, so the guide points to the AuthZEN policy for authenticated callers. Gravitee’s PEP policy for API and MCP proxy traffic is a separate way to ask: it goes to the gateway’s default engine, not through the AuthZEN endpoint.",
        sources: [
          {
            title: "AuthZEN endpoint",
            url: "https://documentation.gravitee.io/authorization-management/evaluate/ask-for-a-decision/authzen-endpoint.md",
            publisher: "Gravitee",
            section: "AuthZEN endpoint",
            quote:
              "An AuthZEN endpoint exposes the engine of a PDP gateway as an AuthZEN 1.0 API, at a path on your gateways.",
          },
          {
            title: "Gravitee Gamma 4.13 release notes",
            url: "https://documentation.gravitee.io/platform-management/gamma-release-notes.md",
            publisher: "Gravitee",
            publishedOn: "2026-10-22",
            section: "Authorization Management",
            quote:
              "A decision is recorded by what asked for it: the PEP policy, an AuthZEN endpoint of a PDP gateway, or the AuthZEN policy.",
          },
          {
            title: "Ask for a decision",
            url: "https://documentation.gravitee.io/authorization-management/evaluate/ask-for-a-decision.md",
            publisher: "Gravitee",
            section: "Ask for a decision",
            quote:
              "The Authorization PEP policy and the AuthZEN PDP policy always ask the default engine of the gateway.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s guide and release notes. The HTML pages build their text by script, so the Markdown versions Gravitee publishes at the same paths with .md are cited and were read.",
        },
      },
      {
        kind: "implementation",
        id: "authzen-authdog",
        organization: "Authdog",
        product: "Authdog AuthZEN API",
        role: "Hosted policy decision point",
        parties: ["policy"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The product page documents the hosted endpoints without naming a release stage or date.",
        },
        summary:
          "A hosted service answers AuthZEN 1.0 evaluation, batch and search requests at fixed paths. A server-side environment secret identifies whose policies decide.",
        limits:
          "Action names are normalized to create, read, update or delete, and an unknown name falls back to read. A tool-specific action such as adding a focus block would have to be mapped onto one of those verbs.",
        sources: [
          {
            title: "AuthZEN API",
            url: "https://authdog.com/docs/authzen",
            publisher: "Authdog",
            section: "AuthZEN API",
            quote:
              "Your application acts as the Policy Enforcement Point (PEP) and calls Authdog as the Policy Decision Point (PDP): send a subject, an action, and a resource; get back permit or deny.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s product documentation, read for the hosted decision-point role. It is the first hosted PDP in this record. No endpoint was called.",
        },
      },
      {
        kind: "implementation",
        id: "authzen-zuplo",
        organization: "Zuplo",
        product: "Zuplo AuthZEN Authorization Policy",
        role: "Policy enforcement point",
        parties: ["tool"],
        release: {
          stage: "unspecified",
          label: "Enterprise plans",
          detail:
            "The policy reference says production use needs an enterprise plan. It names no release stage.",
        },
        summary:
          "A gateway policy builds an AuthZEN request from request or context values, sends it to a configured decision point and lets the request through on a permit.",
        limits:
          "The reference shows HTTP request mapping. It does not show MCP tool arguments being mapped, or name an AuthZEN revision, though a custom policy can set the request in code. A setting can let calls through when the decision point cannot be reached.",
        sources: [
          {
            title: "AuthZEN Authorization Policy",
            url: "https://zuplo.com/docs/policies/authzen-inbound",
            publisher: "Zuplo",
            section: "AuthZEN Authorization Policy",
            quote:
              "This policy will authorize requests using a PDP (Policy Decision Point) service that is compatible with the AuthZen standard.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s policy reference, read for the enforcement role. The same page says “This policy is only available as part of our enterprise plans.” and documents throwOnError.",
        },
      },
      {
        kind: "implementation",
        id: "authzen-apisix-twogenidentity",
        organization: "TwoGenIdentity",
        product: "APISIX AuthZEN Plugin",
        role: "Gateway plugin, policy enforcement point",
        parties: ["tool"],
        release: {
          stage: "preview",
          label: "Beta",
          detail:
            "The README says the software is in beta and not recommended for production use.",
        },
        summary:
          "An Apache APISIX plugin that sends AuthZEN requests for HTTP and MCP traffic. It can enforce only on tools/call and map tool arguments with the COAZ-MCP path syntax.",
        limits:
          "A community plugin, not part of Apache APISIX. Its overview links AuthZEN Implementer’s Draft 1, and it names no revision of the COAZ-MCP draft. It relies on another plugin to validate the token first. TLS certificate checks on the call to the decision point are off unless configured.",
        sources: [
          {
            title: "APISIX AuthZEN Plugin README",
            url: "https://github.com/twogenidentity/apisix-authzen/blob/main/README.md",
            publisher: "TwoGenIdentity",
            section: "Main Features",
            quote:
              "Builds AuthZEN resource identifiers from request URI, static values, or MCP context; maps HTTP methods or MCP tool arguments to actions",
          },
          {
            title: "APISIX AuthZEN Plugin README",
            url: "https://github.com/twogenidentity/apisix-authzen/blob/main/README.md",
            publisher: "TwoGenIdentity",
            section: "Considerations",
            quote:
              "Beta Software Notice: This software is currently in beta and is provided AS IS without any warranties.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s own README, read for the enforcement role. Its examples enforce on tools/call and map tool arguments through the COAZ-MCP CEL syntax.",
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
      {
        id: "tool-call-authorization-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "authzen-cerbos",
          "authzen-gravitee",
          "authzen-authdog",
          "authzen-zuplo",
          "authzen-apisix-twogenidentity",
        ],
      },
    ],
  },
  {
    slug: "access-revocation",
    reviewedOn: "2026-11-14",
    scope:
      "Session Revoked events sent over Shared Signals Framework (SSF) using the Continuous Access Evaluation Profile (CAEP). Signal transmission, reception and enforcement are separate roles. OAuth token revocation at the issuer is covered separately in the guide.",
    genericParties: ["agent"],
    searchNote:
      "The review read transmitter and receiver documentation and the OpenID Foundation’s final-spec report on one interoperability exercise at the Authenticate 2025 conference. The sources reviewed did not establish a named live deployment of the Session Revoked flow. A further search on 14 November 2026 added an experimental Keycloak transmitter and a receiver library. No deployment report was found. The agent needs nothing particular to Shared Signals.",
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
      {
        kind: "implementation",
        id: "caep-keycloak",
        organization: "Keycloak project",
        product: "Keycloak",
        role: "Signal transmitter",
        parties: ["company"],
        release: {
          stage: "experimental",
          label: "Experimental in 26.7.0",
          detail:
            "The 9 July 2026 release notes list the SSF transmitter as experimental, behind the ssf feature flag.",
        },
        summary:
          "Sends signed CAEP and RISC events to registered receivers by push or poll. Its own session revocations map to CAEP events, and events wait in a durable outbox until delivered.",
        limits:
          "Covers the transmitter only. The announcement says the receiver role is not in scope and each client has one stream.",
        sources: [
          {
            title: "Keycloak 26.7.0 released",
            url: "https://www.keycloak.org/2026/07/keycloak-2670-released",
            publisher: "Keycloak project",
            publishedOn: "2026-07-09",
            section:
              "Real-time security signals to downstream applications (experimental)",
            quote:
              "Keycloak can now act as an SSF Transmitter, delivering signed Security Event Tokens (SETs) to registered receivers.",
          },
          {
            title: "Experimental Shared Signals Framework support",
            url: "https://www.keycloak.org/2026/07/experimental-ssf-support",
            publisher: "Keycloak project",
            publishedOn: "2026-07-03",
            section: "What’s in the experimental release",
            quote:
              "Native Keycloak events (login, logout, credential change, session revocation, …) are mapped to the right CAEP / RISC events automatically.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s release notes and its announcement, read for the transmitter role. The announcement names session-revoked among the events sent to Apple Business and says it was first available in the nightly release. It is the first self-hosted, open-source transmitter in this record.",
        },
      },
      {
        kind: "implementation",
        id: "caep-easyssf",
        organization: "easyssf project",
        product: "easyssf",
        role: "Receiver library",
        parties: ["calendar"],
        release: {
          stage: "unspecified",
          label: "0.7, pre-1.0",
          detail:
            "The site lists version 0.7 on every platform and says the API may still change. It names no support stage.",
        },
        summary:
          "A receiver library for Java, .NET, Go, Rust and Python. It verifies incoming events, rejects the access tokens of a revoked session at the resource server and ends the matching local sessions.",
        limits:
          "A library inside the receiving application. The site shows a resource-server integration for each platform; on the JVM, a framework other than Spring Boot or Quarkus wires the parts in itself. It does not identify a deployment.",
        sources: [
          {
            title:
              "easyssf: Shared Signals Framework support for Java, .NET, Go, Rust and Python",
            url: "https://easyssf.org/",
            publisher: "easyssf project",
            section: "Use cases: Reject revoked access tokens",
            quote:
              "With a CAEP session-revoked event the API learns that the session is over and rejects the tokens of that session, or all tokens of the user issued before the event, from the next request on.",
          },
          {
            title:
              "easyssf: Shared Signals Framework support for Java, .NET, Go, Rust and Python",
            url: "https://easyssf.org/",
            publisher: "easyssf project",
            section: "Test your receiver",
            quote: "easyssf is pre-1.0 and its API may still change.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s own site, read for the receiving API role. It is the first library in this record for the calendar party, and the passage matches the diagram’s rejection of the old token.",
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
      {
        id: "access-revocation-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: ["caep-keycloak", "caep-easyssf"],
      },
    ],
  },
  {
    slug: "biscuit-delegation",
    reviewedOn: "2026-11-14",
    scope:
      "Biscuit authorization tokens that holders can narrow offline by appending checks, with the receiving service verifying the token and applying those checks.",
    searchNote:
      "The review read the project’s library, an agent mesh implementation and reports from two operators. The reports cover separate uses in messaging and data access. Format versions and deployed policy details are limited to what the operators describe. A further search on 14 November 2026 added three more of the project’s libraries and a gateway that uses one. No new operator account was found.",
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
      {
        kind: "implementation",
        id: "biscuit-haskell",
        organization: "Eclipse Biscuit project",
        product: "biscuit-haskell",
        role: "Token issuer, attenuator and verifier library",
        parties: ["issuer", "parent", "worker", "api"],
        release: {
          stage: "unspecified",
          label: "Supports v3.0 to v3.3",
          detail:
            "The README lists the token versions it supports. It names no release stage.",
        },
        summary:
          "A Haskell implementation, separate from the Rust one, that mints, attenuates and authorizes tokens. Companion packages add Servant and WAI middleware for an API.",
        limits:
          "The README says only Ed25519 signatures are supported. A library; it does not establish a deployment.",
        sources: [
          {
            title: "biscuit-haskell: main library README",
            url: "https://github.com/eclipse-biscuit/biscuit-haskell/blob/main/biscuit/README.md",
            publisher: "Eclipse Biscuit project",
            section: "Creating (and attenuating) biscuit tokens",
            quote:
              "Biscuit tokens are created from a secret key, and can be attenuated without it.",
          },
          {
            title: "biscuit-haskell: main library README",
            url: "https://github.com/eclipse-biscuit/biscuit-haskell/blob/main/biscuit/README.md",
            publisher: "Eclipse Biscuit project",
            section: "biscuit-haskell",
            quote:
              "Main library for biscuit tokens support, providing minting and signature verification of biscuit tokens, as well as a datalog engine allowing to compute the validity of a token in a given context.",
          },
          {
            title: "biscuit-haskell repository README",
            url: "https://github.com/eclipse-biscuit/biscuit-haskell/blob/main/README.md",
            publisher: "Eclipse Biscuit project",
            section: "Biscuit",
            quote: "Servant combinators, for a smooth integration in your API",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s own READMEs. The library README’s example appends a TTL check with addBlock and says the secret key is not needed. Its version line reads “supports v3.0 to v3.3 biscuits (both open and sealed)”; it is not quoted because link markup splits it. It is the first implementation here that does not wrap the Rust library.",
        },
      },
      {
        kind: "implementation",
        id: "biscuit-python",
        organization: "Eclipse Biscuit project",
        product: "biscuit-python",
        role: "Token issuer, attenuator and verifier library",
        parties: ["issuer", "parent", "worker", "api"],
        release: {
          stage: "unspecified",
          label: "Pre-1.0",
          detail:
            "The README says to expect API changes before 1.0. It names no release stage.",
        },
        summary:
          "Python bindings to the Rust library that build tokens, append blocks, parse and authorize tokens, and query an authorizer.",
        limits:
          "Built on the Rust library, so it adds a language rather than a separate implementation. The specification’s feature table marks its third-party block support as partial; the flow does not use them.",
        sources: [
          {
            title: "Python bindings for biscuit",
            url: "https://github.com/eclipse-biscuit/biscuit-python/blob/main/README.md",
            publisher: "Eclipse Biscuit project",
            section: "Python bindings for biscuit",
            quote: "appending a (first-party or third-party) block to a token",
          },
          {
            title: "Python bindings for biscuit",
            url: "https://github.com/eclipse-biscuit/biscuit-python/blob/main/README.md",
            publisher: "Eclipse Biscuit project",
            section: "Python bindings for biscuit",
            quote:
              "As it is a pre-1.0 version, you can expect some API changes.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s own README, read for each listed use case. The documentation site at python.biscuitsec.org has a section on appending a block.",
        },
      },
      {
        kind: "implementation",
        id: "biscuit-wasm",
        organization: "Eclipse Biscuit project",
        product: "biscuit-wasm (@biscuit-auth/biscuit-wasm)",
        role: "Token issuer, attenuator and verifier library",
        parties: ["issuer", "parent", "worker", "api"],
        release: {
          stage: "unspecified",
          label: "0.6.0 documented",
          detail: "The README pins version 0.6.0. It names no release stage.",
        },
        summary:
          "Wraps the Rust library in WebAssembly for Node.js and browsers. The usage guide shows creating, attenuating, sealing and authorizing a token, and an Express middleware.",
        limits:
          "Built on the Rust library. Neither source names the format versions it reads. The guide says Node.js needs a flag to enable WebAssembly modules, and its install example still shows an older version than the README.",
        sources: [
          {
            title: "NodeJS",
            url: "https://doc.biscuitsec.org/usage/nodejs",
            publisher: "Eclipse Biscuit project",
            section: "Attenuate a token",
            quote:
              'const attenuatedToken = token.append(block`check if operation("read")`);',
          },
          {
            title: "NodeJS",
            url: "https://doc.biscuitsec.org/usage/nodejs",
            publisher: "Eclipse Biscuit project",
            section: "NodeJS",
            quote:
              "It wraps the Biscuit Rust library in WebAssembly, and it provides both CommonJS and EcmaScript module interfaces.",
          },
          {
            title: "Biscuit-wasm README",
            url: "https://github.com/eclipse-biscuit/biscuit-wasm/blob/main/README.md",
            publisher: "Eclipse Biscuit project",
            section: "Biscuit-wasm",
            quote:
              "It provides both EcmaScript and CommonJS modules, along with TypeScript type definitions.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s own usage guide and README. The attenuation passage is a code line under the guide’s “Attenuate a token” heading.",
        },
      },
      {
        kind: "implementation",
        id: "biscuit-otoroshi",
        organization: "Cloud APIM",
        product: "Otoroshi Biscuit Studio",
        role: "API gateway extension: token forge and verifier",
        parties: ["issuer", "api"],
        release: {
          stage: "unspecified",
          label: "2.0.0 release documented",
          detail:
            "The README links the 2.0.0 release of the extension. It names no release stage.",
        },
        summary:
          "An extension to the Otoroshi gateway that forges Biscuit tokens, verifies incoming ones on routes against configured rules and policies, and can attenuate tokens at the gateway.",
        limits:
          "Its build pins the Java Biscuit library 4.0.1, which the build file marks as spec 3.2, so it may not read every 3.3 construct the flow allows. Attenuation here happens at the gateway, not in the agent.",
        sources: [
          {
            title: "Overview",
            url: "https://cloud-apim.github.io/otoroshi-biscuit-studio/docs/overview",
            publisher: "Cloud APIM",
            section: "Supported Entities in Otoroshi Biscuit Studio",
            quote:
              "Manage and configure verifiers that check the validity of incoming Eclipse Biscuit tokens against defined rules and policies, ensuring proper authorization and security.",
          },
          {
            title: "Overview",
            url: "https://cloud-apim.github.io/otoroshi-biscuit-studio/docs/overview",
            publisher: "Cloud APIM",
            section: "Supported Plugins in Otoroshi Biscuit Studio",
            quote:
              "Add attenuator plugins to your Otoroshi routes that apply attenuation to a token, allowing you to reduce or modify the scope of access granted by a token.",
          },
          {
            title: "otoroshi-biscuit-studio build.sbt",
            url: "https://github.com/cloud-apim/otoroshi-biscuit-studio/blob/main/build.sbt",
            publisher: "Cloud APIM",
            section: "libraryDependencies",
            quote:
              '"org.biscuitsec" % "biscuit" % "4.0.1", // biscuit spec 3.2',
          },
          {
            title: "Cloud APIM - Otoroshi Biscuit Studio README",
            url: "https://github.com/cloud-apim/otoroshi-biscuit-studio/blob/main/README.md",
            publisher: "Cloud APIM",
            section: "Cloud APIM - Otoroshi Biscuit Studio",
            quote:
              "The Otoroshi Biscuit Studio is set of Otoroshi plugins to use Biscuit Tokens into your Gateway.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s documentation and build file. It is the first gateway product in this record and fills the verifying API side; the agent-side attenuation is not what it documents.",
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
      {
        id: "biscuit-delegation-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "biscuit-haskell",
          "biscuit-python",
          "biscuit-wasm",
          "biscuit-otoroshi",
        ],
      },
    ],
  },
  {
    slug: "gnap",
    reviewedOn: "2026-11-14",
    scope:
      "GNAP grant requests and continuation, plus the resource server’s token checks. Implementations may cover a particular profile or part of RFC 9635. RFC 9767 resource-server capabilities need separate evidence.",
    searchNote:
      "The review read a server targeting RFC 9635, Open Payments client and server documentation, and the IETF shepherd report. The deployment account covers the GNAP-based Open Payments profile at a public wallet provider. The full interoperability profile illustrated in the guide remains unverified in this setting. A further search on 14 November 2026 added a Java client and an experimental Go server. The Open Payments availability report lists GateHub as the only active provider.",
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
      {
        kind: "implementation",
        id: "gnap-open-payments-java",
        organization: "Interledger Foundation",
        product: "Open Payments Java SDK 1.3.0",
        role: "Grant client",
        parties: ["agent"],
        release: {
          stage: "unspecified",
          label: "1.3.0, Open Payments 1.4.0",
          detail:
            "The README gives the Maven version 1.3.0 and says the SDK implements Open Payments specification v1.4.0. It names no release stage, and links the GNAP draft rather than RFC 9635.",
        },
        summary:
          "The JVM SDK requests an interactive outgoing-payment grant, sends the user to the authorization server, and finalizes the pending grant with the interaction reference. It also requests wallet-ownership subject grants.",
        limits:
          "Covers the Open Payments profile of GNAP, not the full interoperability profile in this guide. The sources do not establish an RFC 9635 or RFC 9767 conformance claim or a deployment.",
        sources: [
          {
            title: "Open Payments Java SDK README",
            url: "https://github.com/interledger/open-payments-java/blob/main/README.md",
            publisher: "Interledger Foundation",
            section: "Open Payments specification support",
            quote:
              "The SDK implements [Open Payments specification v1.4.0](https://github.com/interledger/open-payments-specifications/releases/tag/v1.4.0).",
          },
          {
            title: "Open Payments Java SDK README",
            url: "https://github.com/interledger/open-payments-java/blob/main/README.md",
            publisher: "Interledger Foundation",
            section: "Open Payments specification support",
            quote:
              "Use `continuation(sender, Limits.debit(debitAmount), …)`, which returns a `PendingGrant`, and `finalize(PendingGrant, …)`.",
          },
          {
            title: "Client libraries and test wallet",
            url: "https://openpayments.dev/sdk/before-you-begin/",
            publisher: "Open Payments project",
            section: "Client libraries and test wallet",
            quote:
              "The Open Payments SDKs provide you with pre-built functions that simplify interactions with the Open Payments APIs.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s README read for the version, the specification version and the interactive grant continuation; the Open Payments SDK page lists it as an official SDK. It adds a second language and a stated version beside the JavaScript client.",
        },
      },
      {
        kind: "implementation",
        id: "gnap-twigbush",
        organization: "TwigBush project",
        product: "TwigBush",
        role: "Authorization server and resource-server toolkit",
        parties: ["as", "api"],
        release: {
          stage: "experimental",
          label: "Early-stage, experimental",
          detail:
            "The README calls TwigBush an early-stage, experimental implementation and says it is not production-ready. No version is named.",
        },
        summary:
          "A Go authorization server with grant, continue and introspection endpoints, and resource-server libraries for token introspection, discovery and resource registration. It names RFC 9635 and RFC 9767 and supports HTTP message signatures, detached JWS and mTLS proofs.",
        limits:
          "The project’s own account; no conformance or interoperability testing is established. The bundled client is an example. Not production-ready by its own statement.",
        sources: [
          {
            title: "TwigBush README",
            url: "https://github.com/TwigBush/TwigBush/blob/main/README.md",
            publisher: "TwigBush project",
            section: "TwigBush",
            quote: "This project is not production-ready.",
          },
          {
            title: "TwigBush README",
            url: "https://github.com/TwigBush/TwigBush/blob/main/README.md",
            publisher: "TwigBush project",
            section: "Features",
            quote:
              "**Resource Server Toolkit**: RS discovery, introspection, and resource registration (per RFC 9767)",
          },
          {
            title: "Introduction to TwigBush",
            url: "https://twigbush.github.io/docs/en/getting-started/introduction",
            publisher: "TwigBush project",
            section: "What is TwigBush?",
            quote:
              "TwigBush is an early open source implementation of the Grant Negotiation and Authorization Protocol (GNAP, RFC 9635) written in Go.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The project’s README and documentation read for the authorization server and resource-server roles. It is the first record that names RFC 9767 for the API’s token check, which the scope asks to keep as separate evidence; the claim is the project’s and was not tested.",
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
      {
        id: "gnap-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: ["gnap-open-payments-java", "gnap-twigbush"],
      },
    ],
  },
  {
    slug: "credential-broker",
    reviewedOn: "2026-11-14",
    scope:
      "An intermediary holds the upstream secret outside the agent’s execution environment and attaches it only to selected outbound requests. The intermediary can be a sandbox egress proxy or a service that brokers a specific API.",
    genericParties: ["agent", "api"],
    searchNote:
      "The review read sandbox and proxy documentation and two accounts of operated systems. The examples differ in where the intermediary runs and which requests it lets through. A further search on 14 November 2026 added two hosted vault-and-proxy services and Fly.io’s account of its own token proxy, a variant in which an application server is the caller. The agent and the API need nothing particular to the pattern.",
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
      {
        kind: "implementation",
        id: "credential-broker-infisical",
        organization: "Infisical",
        product: "Infisical Agent Vault",
        role: "Credential vault and egress proxy",
        parties: ["proxy", "vault"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail:
            "The documentation describes the product without naming a release stage. The standalone open-source binary it replaces is no longer recommended for new setups.",
        },
        summary:
          "Infisical stores each service’s credential, host, and allowed methods and paths. A proxy outside the agent’s environment checks a time-bound session token, attaches the credential and forwards the request.",
        limits:
          "The proxy can replace a placeholder in the path or query string as well as a header. A host no service covers is either forwarded without credentials or refused, depending on the proxy’s traffic policy. The session token is a bearer credential for the session’s lifetime.",
        sources: [
          {
            title: "How Agent Vault works",
            url: "https://infisical.com/docs/documentation/platform/agent-vault/how-it-works",
            publisher: "Infisical",
            section: "Proxies",
            quote:
              "A proxy runs outside the agent's environment. It intercepts every outbound request, authorizes the request against the session's access bundle, attaches the matching service's credential, and forwards the request to the upstream host.",
          },
          {
            title: "How Agent Vault works",
            url: "https://infisical.com/docs/documentation/platform/agent-vault/how-it-works",
            publisher: "Infisical",
            section: "Sessions",
            quote:
              "The agent never sees the real credentials inside the bundle.",
          },
          {
            title: "How Agent Vault works",
            url: "https://infisical.com/docs/documentation/platform/agent-vault/how-it-works",
            publisher: "Infisical",
            section: "Proxies",
            quote:
              "The proxy attaches the credential as a header, or replaces a placeholder that the agent sent in the headers, path, or query string.",
          },
          {
            title: "Agent Vault repository README",
            url: "https://github.com/Infisical/agent-vault/blob/main/README.md",
            publisher: "Infisical",
            section: "Agent Vault",
            quote:
              "This open-source Agent Vault project is no longer the recommended way to run Agent Vault for any use case, including personal projects.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s documentation, read for both the vault and proxy roles. Its GitHub API example walks through TLS interception, host matching, method and path rules and header injection. The open-source repository’s README now points new setups to this product.",
        },
      },
      {
        kind: "implementation",
        id: "credential-broker-fly-sprites",
        organization: "Fly.io",
        product: "Sprites Connectors",
        role: "Hosted credential store and API gateway",
        parties: ["proxy", "vault"],
        release: {
          stage: "unspecified",
          label: "Stage unspecified",
          detail: "The documentation and product page name no release stage.",
        },
        summary:
          "Fly.io stores a credential for the organization and attaches it at a gateway URL that a Sprite sandbox calls without a token. An access policy, deny by default, decides which Sprites and which provider paths may use it, and expiring OAuth tokens are refreshed.",
        limits:
          "The agent calls the gateway URL explicitly; this is not transparent interception of its outbound traffic. A custom connector can put the token in the query string or URL path. Calls must come from inside a running Sprite.",
        sources: [
          {
            title: "Connectors",
            url: "https://docs.sprites.dev/concepts/connectors/",
            publisher: "Fly.io",
            section: "Connectors",
            quote:
              "Connectors solve this by storing the credential once, in your organization, and routing API calls through the Sprites gateway.",
          },
          {
            title: "Connectors",
            url: "https://docs.sprites.dev/concepts/connectors/",
            publisher: "Fly.io",
            section: "How it works",
            quote: "The Sprite never holds the provider token.",
          },
          {
            title:
              "Hook your agent up to your APIs without handing it the keys",
            url: "https://fly.io/connectors",
            publisher: "Fly.io",
            section: "Fresh token, self service discovery",
            quote: "When OAuth tokens expire, Connectors refresh them.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The maker’s documentation and product page, read for the vault and gateway roles. The documentation’s Custom API setup lists header, query string or URL path as places the token can go. It is the first hosted store in this record that refreshes OAuth tokens itself, as the diagram’s vault does.",
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
      {
        kind: "deployment",
        id: "credential-broker-fly-tokenizer",
        organization: "Fly.io",
        setting: "Rails API calls to third-party OAuth APIs through Tokenizer",
        attribution: "operator-report",
        summary:
          "Fly.io reports encrypting third-party API secrets to Tokenizer’s public key, so its Rails API holds only sealed secrets. Requests go through Tokenizer, which decrypts the secret, injects it and can restrict each secret to allowed hosts.",
        limits:
          "The caller is Fly.io’s own application server, not an agent sandbox, and it carries the sealed secret in a request header rather than nothing. The 2023 post does not say the deployment is still running or how much traffic it carries.",
        sources: [
          {
            title: "Tokenized Tokens",
            url: "https://fly.io/blog/tokenized-tokens/",
            publisher: "Fly.io",
            publishedOn: "2023-07-12",
            section: "Tokenizer: The Fabled 4th Way",
            quote:
              "Our API server can handle the (encrypted) tokenized secret, but it can’t read or use it directly.",
          },
          {
            title: "Tokenized Tokens",
            url: "https://fly.io/blog/tokenized-tokens/",
            publisher: "Fly.io",
            publishedOn: "2023-07-12",
            section: "Tokenizer: The Fabled 4th Way",
            quote:
              "To mitigate that, we built the obvious feature: you can lock requests for specific secrets down to a list of allowed hosts or host regexp patterns.",
          },
        ],
        review: {
          state: "accepted",
          checkedOn: "2026-11-14",
          rationale:
            "The operator’s own engineering post about its own system, published 12 July 2023. It is a variant: the secret is sealed to the proxy rather than held in a separate vault, and the caller is an application server.",
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
      {
        id: "credential-broker-added-2026-11-14",
        kind: "evidence-added",
        date: "2026-11-14",
        summary:
          "These sources were added to the implementation record. Earlier reports and releases keep their own dates.",
        evidenceIds: [
          "credential-broker-infisical",
          "credential-broker-fly-sprites",
          "credential-broker-fly-tokenizer",
        ],
      },
    ],
  },
];
