/**
 * The worked examples, and how the rest of the site points into them.
 *
 * A link to a variation is the page plus the variation's own anchor, so it
 * lands on that variation with or without JavaScript.
 */
import { invoiceAgent } from "./invoice-agent";
import { supportAgent } from "./support-agent";
import type { Cell, Evidence, Owner, Responsibility, Source } from "./types";

export { invoiceAgent, supportAgent };

/**
 * When the examples' sources were read. It is their own date, not the site's
 * review date: change it only when those sources have been read again.
 */
export const SOURCES_READ = "November 2026";

export interface ResolvedBuild {
  evidence: Evidence;
  rows: { job: string; owner: Owner; cell: Cell }[];
  conditions: string[];
  setup: Source[];
}

/** The cell a row has for a path: its own, or the one it has for every path. */
export function cellFor(row: Responsibility, path: string): Cell {
  const cell = row.cells[path] ?? row.cells.all;
  if (!cell)
    throw new Error(`example: row "${row.job}" has no cell for "${path}"`);
  return cell;
}

/** Everything one case of the support example needs on one path. */
export function supportBuild(caseId: string, path: string): ResolvedBuild {
  const find = (id: string) => {
    const c = supportAgent.cases.find((x) => x.id === id);
    if (!c) throw new Error(`example: unknown case "${id}"`);
    return c;
  };
  const c = find(caseId);
  if (!c.paths.includes(path))
    throw new Error(`example: case "${caseId}" has no path "${path}"`);
  const evidence = c.evidence[path];
  if (!evidence)
    throw new Error(`example: no evidence for "${caseId}" on "${path}"`);
  const base = c.extends ? find(c.extends) : undefined;
  const per = <T>(m: Record<string, T[]>) => m[path] ?? m.all ?? [];
  return {
    evidence,
    rows: c.rows.flatMap((set) => {
      const rows = supportAgent.rows[set];
      if (!rows) throw new Error(`example: unknown row set "${set}"`);
      return rows.map((r) => ({
        job: r.job,
        owner: r.owner,
        cell: cellFor(r, path),
      }));
    }),
    conditions: [...(base ? per(base.conditions) : []), ...per(c.conditions)],
    setup: [...(base ? per(base.setup) : []), ...per(c.setup)],
  };
}

/** Everything one block of the invoice example needs on one path. */
export function invoiceBuild(
  blockId: keyof typeof invoiceAgent.blocks,
  path: string,
): ResolvedBuild {
  const b = invoiceAgent.blocks[blockId];
  const per = <T>(m: Record<string, T> | undefined): T | undefined =>
    m?.[path] ?? m?.all;
  const evidence = per(b.evidence);
  if (!evidence)
    throw new Error(`example: no evidence for "${blockId}" on "${path}"`);
  return {
    evidence,
    rows: b.rows.map((r) => ({
      job: r.job,
      owner: r.owner,
      cell: cellFor(r, path),
    })),
    conditions: per(b.conditions) ?? [],
    setup: per(b.setup) ?? [],
  };
}

export interface ExampleEntry {
  slug: string;
  title: string;
  /** One sentence: the situation. */
  summary: string;
  actsFor: string;
  explains: string;
  /** Variations a reader can go straight to. */
  variations: { href: string; label: string; note: string }[];
  writtenFor: string;
}

export const examples: ExampleEntry[] = [
  {
    slug: supportAgent.slug,
    title: supportAgent.title,
    summary:
      "A rep asks for a customer’s record, and the agent should see only what that rep may see.",
    actsFor: "The rep who asked",
    explains:
      "Signing a person in, and calling an API with an access token issued for them",
    variations: [
      {
        href: "/examples/support-agent/#separate-apps",
        label: "A separate console and agent",
        note: "which shows one common reason for token exchange",
      },
      {
        href: "/examples/support-agent/#unattended",
        label: "Work that continues after the rep has gone home",
        note: "an authored design whose trusted backend is still to be designed and verified",
      },
    ],
    writtenFor:
      "Okta, Auth0 and Microsoft Entra. The exchange variation also has a path for records kept in Salesforce.",
  },
  {
    slug: invoiceAgent.slug,
    title: invoiceAgent.title,
    summary:
      "Nobody is signed in when it runs, and it should read invoices and write drafts and nothing else.",
    actsFor: "The organization, not a person",
    explains:
      "Workload identity federation, and permissions of the agent’s own",
    variations: [
      {
        href: "/examples/invoice-agent/#key-only-supplier",
        label: "A service that only gives out an API key",
        note: "how an agent can use a key it never holds",
      },
      {
        href: "/examples/invoice-agent/#payment-approval",
        label: "A payment that needs approval",
        note: "what an approval has to be tied to",
      },
      {
        href: "/examples/invoice-agent/#accountants-access",
        label: "One accountant’s access, granted earlier",
        note: "a different core, whose trusted backend is still to be designed and verified",
      },
    ],
    writtenFor: "Microsoft Entra with Kubernetes, and Google Cloud.",
  },
];

/** Flow slug → the places a worked example uses that flow. */
export const usedBy: Record<string, { href: string; label: string }[]> = {
  "authorization-code-pkce": [
    {
      href: "/examples/support-agent/#design",
      label: "A support agent, for the rep who asked",
    },
  ],
  "token-exchange": [
    {
      href: "/examples/support-agent/#separate-apps",
      label:
        "A support agent, when the console and the agent are separate applications",
    },
  ],
  dpop: [
    {
      href: "/examples/support-agent/#not-proved",
      label: "A support agent: what its starting design does not prove",
    },
  ],
  "workload-identity-federation": [
    {
      href: "/examples/invoice-agent/#design",
      label: "An agent that reconciles invoices overnight",
    },
  ],
  "credential-broker": [
    {
      href: "/examples/invoice-agent/#key-only-supplier",
      label:
        "An agent that reconciles invoices overnight, when a supplier gives only an API key",
    },
  ],
  ciba: [
    {
      href: "/examples/invoice-agent/#payment-approval",
      label:
        "An agent that reconciles invoices overnight, when a payment needs approval",
    },
  ],
  "step-up-authorization": [
    {
      href: "/examples/invoice-agent/#payment-approval",
      label:
        "An agent that reconciles invoices overnight, when a payment needs approval",
    },
  ],
};

/**
 * Each example as answers to the decision guide, with the reason for each.
 * Keys are question ids and values are answer values from `src/data/guide.ts`;
 * the guide page fails the build if either is unknown.
 */
export const guideAnswers: Record<
  string,
  { title: string; href: string; answers: Record<string, [string, string]> }
> = {
  "support-agent": {
    title: supportAgent.title,
    href: "/examples/support-agent/",
    answers: {
      principal: [
        "user",
        "Dana’s. What the agent may see differs from rep to rep.",
      ],
      human: ["present", "Dana is signed in and waiting for the answer."],
      target: ["api", "The records API."],
      boundary: ["same", "Your own team."],
      accept: [
        "tokens",
        "It trusts the identity provider the reps sign in with.",
      ],
      runtime: ["k8s", "The agent application’s backend, in your own cloud."],
      risk: ["read", "It looks records up."],
    },
  },
  "invoice-agent": {
    title: invoiceAgent.title,
    href: "/examples/invoice-agent/",
    answers: {
      principal: [
        "self",
        "The work is the organization’s, and an administrator assigns its access. Running overnight is not the reason.",
      ],
      human: [
        "absent",
        "Nobody is. If a payment ever needs approval, someone becomes reachable for that one moment.",
      ],
      target: ["api", "The ledger’s API."],
      boundary: ["same", "The finance platform team."],
      accept: [
        "tokens",
        "You control the ledger, so you can make it trust the issuer of the agent’s identity.",
      ],
      runtime: ["k8s", "Your own cluster."],
      risk: [
        "write",
        "It creates drafts. Add payments, and this answer changes.",
      ],
    },
  },
};

/** The guide with an example's answers filled in. */
export function guideLink(slug: string): string {
  const g = guideAnswers[slug];
  if (!g) throw new Error(`example: no guide answers for "${slug}"`);
  const q = new URLSearchParams(
    Object.entries(g.answers).map(([k, [v]]) => [k, v]),
  );
  q.set("from", slug);
  return `/guide/?${q}`;
}
