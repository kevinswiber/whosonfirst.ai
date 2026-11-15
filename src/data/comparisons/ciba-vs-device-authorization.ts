/**
 * CIBA or device authorization?
 *
 * Rests on data/flows/ciba.ts and data/flows/device-authorization.ts, which
 * hold the full account of each. Nothing here may contradict them, and nothing
 * here is said that one of them does not say.
 */
import type { Comparison } from "./types";

export const cibaVsDeviceAuthorization: Comparison = {
  flows: ["ciba", "device-authorization"],
  question: "CIBA or device authorization?",
  answer:
    "Both separate the device that needs a token from the device where the person approves. In CIBA the authorization server reaches out to a user it already knows. In the device authorization grant the user carries a code from the agent to the server. Use CIBA to ask a known user for approval when they are somewhere else, and the device grant to sign in someone who is sitting there.",
  description:
    "Two ways for a person to approve on one device what an agent needs on another, compared: who brings the request to the user, what has to be in place first, how each is misused, and when to choose which.",
  shared: `Sometimes there is no browser to redirect: the agent runs in a remote container, or the user is not looking at it. Both of these separate the device that needs a token from the device where the person approves. The agent sends its request to the authorization server and is told how often it may ask for the result. The person authenticates and approves on another device. In the flows shown here, the agent polls the token endpoint for the answer.

In both, the person approves at the authorization server, and the server issues nothing until they do. They can also say no. So both depend on what the person is shown at that moment, and each is misused there. With CIBA, an agent that prompts whenever it likes trains its user to tap “approve”. With the device grant, an attacker starts the flow and sends the victim the code.`,
  choose: [
    [
      "The user is somewhere else and not looking at the agent, as with a long-running or background agent that needs approval now and then.",
      "The agent knows which user to ask, and the authorization server knows that user in advance, with an enrolled device.",
      "The action is high-stakes, and the approval should be bound to the details of one transaction.",
    ],
    [
      "A person is available right now, on some other device, to read a code and type it in.",
      "The agent cannot name the user when it starts. The flow begins with no user involved, and the person signs in on the second device.",
      "You need something widely deployed. CIBA support is uneven: common in financial-grade identity providers, less so elsewhere.",
    ],
  ],
  figure: {
    intro:
      "Here is the same need met both ways: an agent with no browser to redirect needs a person to approve on another device. The listings are each flow’s own, so the examples differ: a payment for CIBA, a sign-in for the device grant. Before you look, make a guess. One of the two cannot start until the agent says which user to ask. Which?",
    legend: "The agent gets approval with",
    cast: [
      { label: "Agent", sub: "needs a token", role: "agent" },
      {
        label: "Authorization server",
        sub: "issues the token",
        role: "authz",
      },
      { label: "User", sub: "approves on another device", role: "human" },
    ],
    asks: "How it holds up",
    questions: [
      "Does the server go and find the user?",
      "Can it start without naming a user?",
      "Does the request reach the user over a channel the agent cannot forge?",
      "Is it widely deployed?",
    ],
    sides: [
      {
        hops: [
          "which user to ask, and what for",
          "a message on a device it already knows",
        ],
        shows: [
          { step: 2, caption: "What the agent sends" },
          { step: 3, caption: "What the server answers" },
        ],
        findings: [
          {
            verdict: "yes",
            note: "The server contacts the user on a device it already knows, typically a phone. The user can be anywhere.",
          },
          {
            verdict: "no",
            note: "`login_hint` identifies the user. The server has to know that user in advance, with an enrolled device.",
          },
          {
            verdict: "yes",
            note: "The channel was set up beforehand between the user and the server. The agent still chooses whom to ask, so `login_hint` has to come from the authenticated session.",
          },
          {
            verdict: "partly",
            note: "Support is uneven. It is common in financial-grade identity providers and less so elsewhere.",
          },
        ],
        so: "The server does the reaching, over a channel it set up with the user beforehand, and the agent waits for the answer. **The user has to be known to the authorization server in advance, with an enrolled device, and the agent has to say which user to ask.** An agent that can trigger a push whenever it likes will train its user to tap “approve”, so rate-limit requests and make each one specific.",
      },
      {
        hops: [
          "a request for a code to show the user",
          "what is being asked for, once they type the code",
        ],
        shows: [
          { step: 1, caption: "What the agent sends" },
          { step: 3, caption: "What the agent shows the user" },
        ],
        findings: [
          {
            verdict: "no",
            note: "The agent shows a code and a URL, and the user carries the code to the server. It fits when a person is available right now on some other device.",
          },
          {
            verdict: "yes",
            note: "The request carries `client_id` and `scope`, and no user is involved yet. The user signs in later, on the second device.",
          },
          {
            verdict: "no",
            note: "The agent shows the code itself, in a terminal, a chat message or a QR code. Nothing technical ties that code to the agent the user means to authorize, and an attacker will imitate whatever channel carries it.",
          },
          {
            verdict: "yes",
            note: "It is simple and widely deployed, which is why it is the first thing people reach for with headless agents.",
          },
        ],
        so: "No user is involved when the flow starts. The agent shows a code, and the user opens the URL on a phone or laptop, signs in and types it. **Nothing technical ties the code the user sees to the agent they mean to authorize.** An attacker can start the flow themselves and send the victim the code, and the approval screen is the user’s only chance to notice a request they did not start.",
      },
    ],
  },
  points: [
    {
      on: "Who brings the request to the user",
      values: [
        "The authorization server. How is up to the server: a push to an authenticator app, a passkey prompt, a message in a workplace chat tool.",
        "The agent, then the user. The agent shows a short code and a URL, in a terminal, a chat message or a QR code, and the user carries the code to the server.",
      ],
      steps: [[4], [3, 4]],
    },
    {
      on: "What has to be in place first",
      values: [
        "A user the authorization server knows in advance, with an enrolled device, and a channel set up beforehand between the two.",
        "A person available right now, with a phone or laptop to open the URL on. The agent starts the flow before any user is involved.",
      ],
    },
    {
      on: "What the agent’s first request says",
      values: [
        "Which user to ask, in `login_hint`, and what for: a `binding_message` for the user to match and, with Rich Authorization Requests, the transaction in `authorization_details`.",
        "Who the agent is and what it wants: `client_id` and `scope`. It names no user.",
      ],
      steps: [[2], [1]],
    },
    {
      on: "How the server knows the agent",
      values: [
        "The agent authenticates. Both of its requests carry a client assertion.",
        "The agent identifies itself. Both of the requests shown carry its `client_id`.",
      ],
      steps: [
        [2, 6],
        [1, 5],
      ],
    },
    {
      on: "What the user does",
      values: [
        "Reads the message on their own device, authenticates with a biometric or a PIN, and approves or denies. Nothing is typed.",
        "Opens the URL on a phone or laptop, signs in there, types the code, and approves.",
      ],
      steps: [[5], [4, 7]],
    },
    {
      on: "What the user is shown",
      values: [
        "The server should build the prompt from `authorization_details`, the same data that goes into the token: “Pay invoice 1042, $1,250.00, to Acme Ltd”. `binding_message` is a short reference the user can match.",
        "The server looks up the pending request from the code and shows what is being asked for. A good approval screen names the client, says where the request came from and lists the scopes in plain language.",
      ],
      steps: [
        [2, 4],
        [4, 7],
      ],
    },
    {
      on: "How the agent gets the answer",
      values: [
        "In poll mode, it asks the token endpoint with the `auth_req_id`. CIBA also defines ping mode, where the server calls the agent back and the agent then fetches the token, and push mode, where the server delivers the token to the agent’s endpoint.",
        "It polls the token endpoint with the `device_code`, no more often than `interval` seconds. The answer is `authorization_pending` until the user finishes, and polling too fast earns `slow_down`.",
      ],
      steps: [[6], [5, 6, 8]],
    },
    {
      on: "What the agent ends with",
      values: [
        "In the flow shown, a short-lived access token that carries the approved `authorization_details`. It authorizes one payment to one payee for one amount, and the API refuses a different amount or a second payment.",
        "A short-lived access token and usually a refresh token, as after an authorization code flow. The API sees an ordinary access token.",
      ],
      steps: [
        [7, 8],
        [9, 10],
      ],
    },
    {
      on: "How it is misused, and the guard",
      values: [
        "Approval fatigue: an agent that can trigger a push whenever it likes will train its user to tap “approve”. Rate-limit requests and make each one specific. And an attacker who can influence `login_hint` chooses who gets prompted, so derive it from the authenticated session, never from model output.",
        "Device-code phishing: an attacker starts the flow themselves and sends the victim the code. The victim approves, and the attacker’s agent gets the token. Show the client name, location and requested scopes prominently, and keep codes short-lived.",
      ],
    },
  ],
  mixup: {
    belief:
      "CIBA is the device flow with a push notification in place of the code.",
    body: "The two do share a shape: the device that needs a token is not the one where the person approves. What differs is who brings the request to the user. In the device grant the agent shows a code and the user carries it to the server. The request names no user, and nothing technical ties the code to the agent the user means to authorize. In CIBA the agent names the user, and the server contacts them over a channel the two set up beforehand, which the agent cannot forge. So CIBA starts from something the device grant’s request does not have: a named user, known to the server in advance, with an enrolled device.",
  },
};
