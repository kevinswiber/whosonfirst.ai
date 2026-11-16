/**
 * The film of the DPoP flow: what is said, in order, and what is on the
 * stage while it is said.
 *
 * It rests on src/data/flows/dpop.ts and says nothing that page does not. A
 * line is written for the ear: one idea, short enough to say in a breath,
 * and spoken to the person watching.
 *
 * A beat with `step` is one step of the flow, counted from 1 as the page
 * counts them. Its arrow, its label and what a party gains are the flow's
 * own. A second beat for the same step goes on telling it. `show` picks
 * lines out of that step's listing by a piece of each, and `on` is the word
 * of what is said at which a line is marked. `gain` and `check` are words
 * too: when the party comes to hold what the step gives it, and when the
 * check is seen to pass. `gloss` writes a word under the listing at the
 * moment it is said, with a note: for a word that is not said as it is
 * spelled. `carries` is what a step's message carries, which travels along
 * its row from sender to receiver. `head` is a line over a scene that says
 * what this part of the film is; a step has the name of its part of the flow.
 * `expands`, on the title, is what the flow's short name stands for, written
 * under it. `hold` is seconds a beat is left up after its words are said. The other beats are scenes the stage knows by name: see
 * scripts/film-stage.js.
 *
 * `speak` is how a word is written for a voice that would say it wrong.
 */
export default {
  flow: "dpop",
  speak: {
    DPoP: "dee-pop",
    JWT: "jot",
    "whosonfirst.ai": "who’s on first dot A I",
  },
  beats: [
    // The question the film answers at its end. Asked first, so that whoever
    // is watching has an answer of their own to check.
    {
      scene: "ask",
      say: "Someone copies your agent’s access token. Can they use it?",
      head: "Can a copied token be used?",
    },
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
    { scene: "steal", say: "So yes. A copy works as well as the original." },
    // the tagline: "Bind a token to a key so that stealing the token is not enough to use it."
    {
      scene: "title",
      // the summary: "Demonstrating Proof of Possession (DPoP) fixes the cash problem…"
      expands: "Demonstrating Proof of Possession",
      say: "DPoP changes the answer. It binds the token to a key, so stealing the token is not enough.",
    },
    // who takes part, and what to watch, before any of it moves
    {
      scene: "cast",
      say: "Three parties take part: your agent, the authorization server, and the API. Watch two things: a key, and a token.",
    },
    {
      step: 1,
      say: "First, your agent creates a key pair. The private key stays with the agent.",
      gain: "private",
    },
    {
      step: 2,
      say: "When it asks for a token, it adds a proof.",
      carries: ["token request", "proof"],
      show: [{ line: "POST /token" }, { line: "DPoP: ", on: "proof" }],
    },
    // How it is said: "The suggested pronunciation of JWT is the same as the
    // English word 'jot'." https://www.rfc-editor.org/rfc/rfc7519#section-1
    {
      step: 2,
      say: "The proof is a small JWT. It carries the public key, and it is signed with the private one.",
      gloss: { term: "JWT", note: "said “jot”", on: "JWT" },
    },
    {
      step: 3,
      say: "The authorization server puts the key’s thumbprint inside the token.",
      carries: ["bound"],
      show: [{ line: '"cnf"' }, { line: '"jkt"', on: "thumbprint" }],
    },
    { step: 3, say: "The token is now bound to that key.", gain: "bound" },
    { step: 4, say: "Before each API call, your agent signs a new proof." },
    {
      step: 4,
      say: "It names the method and the URL, and carries a hash of the token.",
      show: [
        { line: '"htm"', on: "method" },
        { line: '"htu"', on: "URL" },
        { line: '"ath"', on: "hash" },
      ],
    },
    {
      step: 5,
      say: "It sends the token and the proof together.",
      // the request the whole flow is for: it is left up a moment longer
      hold: 1.2,
      carries: ["bound", "proof"],
      show: [
        { line: "GET /api/events" },
        { line: "Authorization: DPoP", on: "token" },
        { line: "DPoP: ", on: "proof" },
      ],
    },
    {
      step: 6,
      say: "The API checks the proof’s signature, and that its key matches the thumbprint in the token.",
      check: "matches",
    },
    {
      step: 7,
      say: "They match, so the request succeeds.",
      carries: ["200 OK"],
    },
    // step 7: "An attacker who copied only the access token cannot use it at an
    // API that enforces the binding: they cannot make a proof without the private key."
    {
      scene: "refuse",
      say: "Now copy the token alone. Without the private key there is no proof to send, and the API refuses it.",
      head: "A copied token, tried again",
    },
    // "DPoP protects the token, not the key. If the private key sits in the
    // same file as the token, the thief takes both. Use a platform keystore…"
    {
      scene: "caveat",
      say: "DPoP protects the token, not the key. So keep the key where the token is not.",
      head: "What DPoP does not protect",
    },
    // the summary: "A stolen token without the key is rejected."
    {
      scene: "recap",
      say: "That is DPoP. The token is bound to a key, and a stolen token without the key is refused.",
      head: "DPoP, in one line",
    },
    // The API's part on the page: "If the API is yours, so is this check."
    {
      scene: "end",
      say: "Every step, and what your API has to check, is at whosonfirst.ai.",
    },
  ],
};
