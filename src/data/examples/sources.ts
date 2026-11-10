/**
 * The documents the worked examples cite. `docs/source-review.md` says what to
 * re-check, and when.
 */
import type { Source } from "./types";

export const SRC = {
  k8s: {
    label: "Kubernetes: service account tokens",
    href: "https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/",
  },
  entraWif: {
    label: "Microsoft: workload identity federation",
    href: "https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation",
  },
  entraArch: {
    label: "Microsoft: authorize applications, resources, and workloads",
    href: "https://learn.microsoft.com/en-us/entra/architecture/authorize-applications-resources-workloads",
  },
  entraObo: {
    label: "Microsoft: on-behalf-of flow",
    href: "https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow",
  },
  gcpAgent: {
    label:
      "Google Cloud: authenticate to external services using an agent’s own identity",
    href: "https://docs.cloud.google.com/iam/docs/auth-agent-own-identity-external",
  },
  authMgr: {
    label: "Google Cloud: Agent Identity auth manager",
    href: "https://docs.cloud.google.com/iam/docs/auth-manager-overview",
  },
  agentGw: {
    label: "Google Cloud: Agent Gateway overview",
    href: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/govern/gateways/agent-gateway-overview",
  },
  gke: {
    label: "Google Cloud: agent workloads on GKE",
    href: "https://docs.cloud.google.com/kubernetes-engine/docs/concepts/machine-learning/agent-workloads",
  },
  substrate: {
    label: "Agent Substrate: egress credential injection",
    href: "https://github.com/agent-substrate/substrate/blob/main/docs/guides/egress-credential-injection.md",
  },
  infisical: {
    label: "Infisical: Agent Vault on Kubernetes",
    href: "https://infisical.com/docs/documentation/platform/agent-vault/guides/kubernetes",
  },
  agw: {
    label: "agentgateway: backend authentication",
    href: "https://agentgateway.dev/docs/standalone/latest/configuration/security/backend-authn/",
  },
  auth0Async: {
    label: "Auth0: asynchronous authorization",
    href: "https://auth0.com/ai/docs/intro/asynchronous-authorization",
  },
  oktaCiba: {
    label: "Okta: transactional verification using CIBA",
    href: "https://developer.okta.com/docs/guides/configure-ciba/main/",
  },
  kcAdmin: {
    label: "Keycloak: server administration guide",
    href: "https://www.keycloak.org/docs/latest/server_admin/index.html",
  },
  auth0Tv: {
    label: "Auth0: Token Vault",
    href: "https://auth0.com/docs/secure/call-apis-on-users-behalf/token-vault",
  },
  oktaRefresh: {
    label: "Okta: refresh access tokens",
    href: "https://developer.okta.com/docs/guides/refresh-tokens/main/",
  },
  auth0Refresh: {
    label: "Auth0: refresh tokens",
    href: "https://auth0.com/docs/secure/tokens/refresh-tokens",
  },
  auth0GetRefresh: {
    label: "Auth0: get refresh tokens",
    href: "https://auth0.com/docs/secure/tokens/refresh-tokens/get-refresh-tokens",
  },
  entraRefresh: {
    label: "Microsoft: refresh tokens",
    href: "https://learn.microsoft.com/en-us/entra/identity-platform/refresh-tokens",
  },
  oktaObo: {
    label: "Okta: On-Behalf-Of Token Exchange",
    href: "https://developer.okta.com/docs/guides/set-up-token-exchange/main/",
  },
  auth0Obo: {
    label: "Auth0: on-behalf-of token exchange",
    href: "https://auth0.com/docs/secure/call-apis-on-users-behalf/on-behalf-of-token-exchange",
  },
  kcTx: {
    label: "Keycloak: token exchange",
    href: "https://www.keycloak.org/securing-apps/token-exchange",
  },
  entraAuthCode: {
    label: "Microsoft: OAuth 2.0 authorization code flow",
    href: "https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow",
  },
  entraExpose: {
    label: "Microsoft: configure an application to expose a web API",
    href: "https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-configure-app-expose-web-apis",
  },
  entraConsent: {
    label: "Microsoft: user and admin consent",
    href: "https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/user-admin-consent-overview",
  },
  entraAt: {
    label: "Microsoft: access tokens",
    href: "https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens",
  },
  entraClaims: {
    label: "Microsoft: access token claims reference",
    href: "https://learn.microsoft.com/en-us/entra/identity-platform/access-token-claims-reference",
  },
  oktaPkce: {
    label: "Okta: authorization code flow with PKCE",
    href: "https://developer.okta.com/docs/guides/implement-grant-type/authcodepkce/main/",
  },
  oktaAs: {
    label: "Okta: authorization servers",
    href: "https://developer.okta.com/docs/concepts/auth-servers/",
  },
  oktaCustomize: {
    label: "Okta: create an authorization server",
    href: "https://developer.okta.com/docs/guides/customize-authz-server/main/",
  },
  oktaConsent: {
    label: "Okta: request user consent",
    href: "https://developer.okta.com/docs/guides/request-user-consent/main/",
  },
  oktaValidate: {
    label: "Okta: validate access tokens",
    href: "https://developer.okta.com/docs/guides/validate-access-tokens/dotnet/main/",
  },
  oktaClaims: {
    label: "Okta: OpenID Connect and OAuth 2.0 overview",
    href: "https://developer.okta.com/docs/api/openapi/okta-oauth/guides/overview/",
  },
  auth0Pkce: {
    label: "Auth0: authorization code flow with PKCE",
    href: "https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce",
  },
  auth0At: {
    label: "Auth0: access tokens",
    href: "https://auth0.com/docs/secure/tokens/access-tokens",
  },
  auth0Apis: {
    label: "Auth0: APIs",
    href: "https://auth0.com/docs/get-started/apis",
  },
  auth0Consent: {
    label: "Auth0: user consent and third-party applications",
    href: "https://auth0.com/docs/get-started/applications/confidential-and-public-applications/user-consent-and-third-party-applications",
  },
  auth0Validate: {
    label: "Auth0: validate access tokens",
    href: "https://auth0.com/docs/secure/tokens/access-tokens/validate-access-tokens",
  },
  auth0Profiles: {
    label: "Auth0: access token profiles",
    href: "https://auth0.com/docs/secure/tokens/access-tokens/access-token-profiles",
  },
  rfc6749code: {
    label: "RFC 6749, section 4.1",
    href: "https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1",
  },
  rfc6749: {
    label: "RFC 6749, sections 6 and 10.4",
    href: "https://www.rfc-editor.org/rfc/rfc6749.html#section-6",
  },
  rfc9068: {
    label: "RFC 9068, section 4",
    href: "https://www.rfc-editor.org/rfc/rfc9068.html#section-4",
  },
  awsBlog: {
    label:
      "AWS Security Blog: propagate user authorization context in AI agents",
    href: "https://aws.amazon.com/blogs/security/propagate-user-authorization-context-in-ai-agents-with-amazon-bedrock-agentcore/",
  },
} satisfies Record<string, Source>;
