/**
 * The deployment guides, in the order the index page lists them. The index page
 * and the way on at the end of each guide both read this list, so a guide added
 * here shows up in both. `alsoRead` names the other guides a reader of this one
 * most likely wants next.
 */
export interface Place {
  slug: string;
  href: string;
  title: string;
  blurb: string;
  chips: string[];
  alsoRead: string[];
}

const raw: Omit<Place, "href">[] = [
  {
    slug: "web-apps",
    alsoRead: ["gateways", "kubernetes"],
    title: "Hosted apps and backends",
    blurb:
      "An agent behind a web app, on servers you run, working for whoever is signed in. It can keep a secret, and it holds every user’s tokens in one place.",
    chips: ["Confidential clients", "Per-user tokens", "Unattended work"],
  },
  {
    slug: "kubernetes",
    alsoRead: ["gateways", "agent-platforms"],
    title: "Kubernetes",
    blurb:
      "Five layers of identity for an agent pod: ServiceAccount tokens, federation, certificates and SPIFFE, gateways, and user delegation. With an interactive map.",
    chips: ["Workload identity", "Pod Certificates", "Gateways"],
  },
  {
    slug: "agent-platforms",
    alsoRead: ["web-apps", "gateways"],
    title: "Managed agent platforms",
    blurb:
      "What cloud and identity vendors now offer for agents: per-agent identities, token vaults, on-behalf-of exchange, and administrator-controlled access.",
    chips: ["Agent identity", "Token vaults", "Vendor survey"],
  },
  {
    slug: "local",
    alsoRead: ["sandboxes", "web-apps"],
    title: "Desktop, IDE, CLI and CI",
    blurb:
      "Agents on a person’s machine are public clients. Agents in a pipeline have a platform identity. Neither should carry a pasted API key.",
    chips: ["Public clients", "stdio servers", "CI OIDC"],
  },
  {
    slug: "sandboxes",
    alsoRead: ["local", "gateways"],
    title: "Sandboxes",
    blurb:
      "For agents that run untrusted code: keep credentials outside the sandbox and inject them at the network edge.",
    chips: ["Egress proxies", "Credential injection"],
  },
  {
    slug: "gateways",
    alsoRead: ["web-apps", "kubernetes"],
    title: "MCP and LLM gateways",
    blurb:
      "Not a place an agent runs: a proxy its calls pass through, from any of the others. One in front of the tools, one in front of the models, and what the far side can still tell about the caller.",
    chips: ["Token exchange", "Per-tool policy", "Virtual keys"],
  },
];

export const places: Place[] = raw.map((p) => ({
  ...p,
  href: `/deployments/${p.slug}/`,
}));

/** The guide at an address such as `/deployments/local/`, if there is one. */
export function placeAt(path: string): Place | undefined {
  return places.find((p) => p.href === path);
}

for (const p of places)
  for (const s of p.alsoRead)
    if (s === p.slug || !places.some((q) => q.slug === s))
      throw new Error(
        `Deployment guide "${p.slug}" lists "${s}" in alsoRead, which is not another guide`,
      );
