import type { Flow } from "../types";

export const agentPayments: Flow = {
  slug: "agent-payments",
  title: "Agent payments with signed mandates",
  short: "Agent payments (AP2)",
  group: "agent-to-agent",
  human: "reachable",
  maturity: "experimental",
  tagline:
    "The user signs what the agent may buy. The agent proves, to the merchant and to the payment network, that a purchase falls inside it.",
  summary: `Payments are where “the agent says the user wanted this” stops being good enough. If an agent buys the wrong thing, someone bears the cost, and the merchant, the card issuer and the user will each want evidence of what was authorized.

The Agent Payments Protocol answers with **mandates**: digitally signed statements of what a user has approved. In the current version there are two kinds. A **checkout mandate** shows a merchant that the agent may complete a particular purchase. A **payment mandate** shows the payment side that the agent may pay for it. Each comes in two forms. A *closed* mandate authorizes one specific checkout. An *open* mandate sets out constraints in advance, for when the user will not be there, and names the agent’s key so the agent can later sign closed mandates that stay within those limits.

The diagram shows the second case: the human approves the boundaries, leaves, and the agent shops inside them.`,
  fits: [
    "Agents that complete purchases, with or without the user present at checkout.",
    "Situations where a merchant or issuer needs verifiable evidence of user intent for disputes.",
    "Commerce protocols that need a payment-authorization layer.",
  ],
  watchOut: [
    "This is pre-1.0 and changing. The mandate model was redesigned between the first and second versions, and stewardship has moved to a standards body where work is only starting.",
    "There are several competing and overlapping efforts from card networks, payment processors and AI vendors. None has settled as the standard.",
    "An open mandate is a signed blank check with limits. The limits are the security: amount, merchant, items, expiry.",
    "The user’s consent must be captured on a surface the agent does not control. If the agent draws the approval screen, the signature proves nothing.",
  ],
  lesson: "limits",
  phases: [
    {
      title: "The user signs the limits, and the agent later finds an offer",
      from: 1,
    },
    {
      title: "The merchant signs the terms, and the agent signs the purchase",
      from: 3,
    },
    {
      title:
        "The credential provider checks the limits, then issues a credential",
      from: 6,
    },
    { title: "The agent completes the purchase and gets a receipt", from: 9 },
  ],
  parts: {
    user: "Reviews and signs the limits the agent must stay within, such as amount, merchant, items and expiry. Signs on a trusted surface that the agent does not control, then leaves.",
    agent:
      "Finds an offer inside the user’s limits while the user is away, and builds a checkout with the merchant. Using the key that the open mandates name, signs closed mandates bound to the merchant’s signed checkout. Presents the payment mandate to the credential provider, then the checkout mandate and the payment credential to the merchant.",
    cp: "Holds the user’s payment methods. Verifies that the open mandate is signed by the user, that it names this agent’s key, and that the closed mandate is inside the limits, then issues a credential for this payment. The protocol requires that check to be done by deterministic code, not by a model.",
    merchant:
      "Signs the checkout, which fixes the items, price and totals. Receives the checkout mandate together with the payment credential, and returns a receipt. The mandates and receipts form the evidence trail if the purchase is disputed.",
  },
  participants: [
    { id: "user", label: "User", sub: "On a trusted surface", role: "human" },
    {
      id: "agent",
      label: "Shopping agent",
      sub: "Holds its own key",
      role: "agent",
    },
    {
      id: "cp",
      label: "Credential provider",
      sub: "Payment side",
      role: "authz",
    },
    { id: "merchant", label: "Merchant", role: "resource" },
  ],
  steps: [
    {
      from: "user",
      to: "agent",
      kind: "front",
      label: "Sign open mandates",
      title: "The user approves constraints, not a purchase",
      body: `“Buy these running shoes in size 43 if the price drops below €120, this month.” The user reviews and signs on a **trusted surface**, a piece of interface that the protocol requires to be non-agentic. The result is a pair of open mandates, checkout and payment, that carry the constraints and the public key of the agent allowed to act on them.

Here the signature is the user’s own. The user holds a credential in a wallet, the agent sends an OpenID4VP request that carries the mandate content, and the wallet returns it signed with the key that credential is bound to.`,
      gain: [
        ["agent", "agent key"],
        ["agent", "open mandates (user-signed)"],
      ],
    },
    {
      from: "agent",
      kind: "self",
      label: "Later: finds a matching offer",
      title: "The agent works alone",
      body: `Days later, with the user absent, the agent finds an offer that satisfies the constraints.`,
    },
    {
      from: "agent",
      to: "merchant",
      kind: "back",
      label: "Start checkout",
      title: "The agent builds a checkout with the merchant",
      body: `Through whatever commerce protocol the merchant supports. The payment protocol sits beneath it as the authorization layer.`,
    },
    {
      from: "merchant",
      to: "agent",
      kind: "resp",
      label: "Merchant-signed checkout",
      title: "The merchant commits to the terms",
      body: `The merchant signs the checkout: items, price, totals. This fixes what is being bought, so the agent’s authorization can refer to it by hash.`,
      gain: [["agent", "signed checkout"]],
    },
    {
      from: "agent",
      kind: "self",
      label: "Sign closed mandates",
      title: "The agent authorizes this specific purchase",
      body: `Using the key named in the open mandates, the agent signs closed checkout and payment mandates bound to the merchant’s signed checkout. Anyone verifying them can follow the chain: the user authorized this key within these limits, and this key authorized this purchase.

The mandates are SD-JWTs, and the chain is built as Delegate SD-JWT describes: the agent’s closed mandate stands where the proof of key possession on the user’s open mandate would be, and carries a hash of it.`,
      gain: [["agent", "closed mandates (agent-signed)"]],
    },
    {
      from: "agent",
      to: "cp",
      kind: "back",
      label: "Present payment mandate",
      title: "The agent asks the credential provider for a payment credential",
      body: `The credential provider holds the user’s payment methods. It receives the payment mandates, open and closed, and only the details it needs: an SD-JWT lets the agent leave out the parts of the user’s constraints that this check does not use.`,
    },
    {
      from: "cp",
      kind: "self",
      label: "Verify chain and limits",
      title: "The credential provider checks the delegation",
      body: `Is the open mandate genuinely signed by the user? Does it name this agent’s key? Is the closed mandate inside the constraints? The protocol requires this to be done by deterministic code, not by a model.`,
    },
    {
      from: "cp",
      to: "agent",
      kind: "resp",
      label: "Payment credential",
      title: "A credential usable for this payment",
      body: `Typically a network token or similar single-purpose credential, not the underlying card number.`,
      gain: [["agent", "payment credential (this purchase)"]],
    },
    {
      from: "agent",
      to: "merchant",
      kind: "back",
      label: "Checkout mandate + payment",
      title: "The agent completes the purchase",
      body: `The merchant receives the payment credential and the checkout mandate. The mandate shows that this agent is authorized to complete this checkout.`,
    },
    {
      from: "merchant",
      to: "agent",
      kind: "resp",
      label: "Signed receipt",
      title: "Receipts close the loop",
      body: `The merchant returns a signed checkout receipt. The merchant’s payment processor, which is not drawn here, returns a signed payment receipt. With the mandates, they form the evidence trail if the purchase is ever disputed.`,
      lose: [["agent", "payment credential (this purchase)"]],
    },
  ],
  standards: [
    "ap2",
    "rfc9901",
    "delegate-sd-jwt",
    "openid4vp",
    "verifiable-intent",
    "acp-commerce",
    "visa-tap",
    "x402",
  ],
  roles: {
    ap2: "required", // the stated basis: version 0.2. Mandates, roles, receipts and the verification rules, steps 1 to 10
    rfc9901: "required", // the mandates are SD-JWTs: key binding in step 5, selective disclosure in step 6
    "delegate-sd-jwt": "required", // the open-to-closed chain signed in step 5 and checked in step 7; AP2 cites it normatively
    openid4vp: "required", // how the user’s signature in step 1 is obtained when the user holds a credential; AP2 cites it normatively
    "verifiable-intent": "background", // another effort the cautions allude to; no step uses its credential format
    "acp-commerce": "background", // a checkout protocol with its own payment delegation; step 3 names no commerce protocol
    "visa-tap": "background", // a card network’s agent-recognition scheme; not used on this page
    x402: "background", // a payment method AP2 has a sample for; the drawn flow pays by card credential
  },
  illustrated: {
    steps: `AP2 has two modes. In one the user is present and signs the closed mandates for a checkout they can see. **The diagram draws the other, which AP2 calls autonomous or human not present.** It also draws one of AP2’s two ways to trust the first signature: the user’s own credential signs the open mandates. In the other, the verifier trusts the agent’s provider, and the provider’s key signs.`,
    references: `These are required by the arrangement the diagram draws: the protocol, the format of its mandates, the chaining of an open mandate to a closed one, and the request that gets the user’s signature. Where the agent’s provider signs, OpenID4VP is not needed. Every arrangement depends on AP2 itself, so none of them would be rated differently.`,
  },
  related: ["web-bot-auth", "ciba", "step-up-authorization", "agent-to-agent"],
  notes: [
    {
      title: "The same idea in OAuth terms",
      body: `A mandate is a transaction-specific authorization that can be verified offline by several parties. [Rich Authorization Requests](/flows/step-up-authorization/) express the same intent inside OAuth, with the authorization server as the single verifier. The payments world chose signed credentials because merchants, processors, networks and issuers each need to check the evidence independently, sometimes long after the fact.`,
    },
  ],
};
