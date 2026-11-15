/**
 * The film of the DPoP flow: what is said, in order, and what is on the
 * stage while it is said.
 *
 * It rests on src/data/flows/dpop.ts and says nothing that page does not. A
 * line is written for the ear: one idea, short enough to say in a breath.
 *
 * A beat with `step` is one step of the flow, counted from 1 as the page
 * counts them. Its arrow, its label and what a party gains are the flow's
 * own. `show` picks lines out of that step's listing by a piece of each, and
 * `mark` is the line the words are about. The other beats are scenes the
 * stage knows by name: see scripts/film-stage.js.
 */
export default {
  flow: "dpop",
  beats: [
    // the summary: "A bearer token works like cash: whoever holds it can spend it."
    {
      scene: "spend",
      say: "A bearer token works like cash. Whoever holds it can spend it.",
    },
    // "Agents put tokens in riskier places. They pass through tool calls, logs, traces…"
    {
      scene: "copy",
      say: "And agents put tokens in risky places. They pass through tool calls, logs and traces.",
    },
    {
      scene: "steal",
      say: "A copy of the token works as well as the original.",
    },
    // the tagline
    {
      scene: "title",
      say: "DPoP binds a token to a key, so that stealing the token is not enough to use it.",
    },
    {
      step: 1,
      say: "First, the agent creates a key pair. The private key stays with the agent.",
    },
    {
      step: 2,
      say: "When it asks for a token, it adds a proof: a small JWT that carries the public key, signed with the private one.",
      show: [{ line: "POST /token" }, { line: "DPoP: ", mark: true }],
    },
    {
      step: 3,
      say: "The authorization server puts the key’s thumbprint inside the token. The token is now bound to that key.",
      show: [{ line: '"cnf"' }, { line: '"jkt"', mark: true }],
    },
    {
      step: 4,
      say: "Before each API call, the agent signs a new proof. It names the method and the URL, and carries a hash of the token.",
      show: [
        { line: '"htm"', mark: true },
        { line: '"htu"', mark: true },
        { line: '"ath"', mark: true },
      ],
    },
    {
      step: 5,
      say: "It sends the token and the proof together.",
      show: [
        { line: "GET /api/events" },
        { line: "Authorization: DPoP", mark: true },
        { line: "DPoP: ", mark: true },
      ],
    },
    {
      step: 6,
      say: "The API checks the proof’s signature, and that its key matches the thumbprint in the token.",
      check: true,
    },
    { step: 7, say: "They match, so the request succeeds." },
    // step 7: "An attacker who copied only the access token cannot use it at an
    // API that enforces the binding: they cannot make a proof without the private key."
    {
      scene: "refuse",
      say: "Now copy the token alone. Without the private key there is no proof to send, and the API refuses it.",
    },
    // "DPoP protects the token, not the key. If the private key sits in the
    // same file as the token, the thief takes both."
    {
      scene: "caveat",
      say: "DPoP protects the token, not the key. Keep the key where the token is not.",
    },
    { scene: "end" },
  ],
};
