# Films

For whoever makes the next film of a flow. One exists, for DPoP, and it is a pilot. [Working on the site](development.md#a-flow-as-a-film) says how the script makes one. This says how one is told: what it holds to, what has been decided about how it looks and sounds, what has not, and what the next one needs.

## What a film is for

A film is one flow, told in about a minute and a half, for someone who has not read the page. It is posted where video is watched and links to the flow's page. It is not on the site's pages: the content security policy allows no embed, and a clip on a page that is mostly text earns nothing in search ([the review of 15 November 2026](reviews/search-and-answers-2026-11-15.md#video)).

**A film says only what its flow's page says.** Each line of what is said has its source on the page in a comment beside it, in `scripts/films/<slug>.mjs`. What is drawn is the flow's own data. A fact the page does not have goes on the page first, with its source. The one exception so far is how a word is said: “JWT” is said “jot”, from [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519#section-1), and the film's script names that source.

## What it holds to

The film was read against Richard Mayer's principles for learning from words and pictures together. The wording of each below is from [a summary on Dartmouth's site](https://services.dartmouth.edu/TDClient/1806/Portal/KB/PrintArticle?ID=171655) of Mayer's _Multimedia Learning_ (2nd edition, 2009). The book itself was not opened, and nothing here has been measured on a film of ours.

| Principle           | What it asks                                                                  | What the film does                                                                                                                                        | Kept          |
| ------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Coherence           | Leave out what is not needed                                                  | No music, no decoration, nothing of the page's furniture. The stage, and the flow's address in one corner                                                 | Yes           |
| Signaling           | Point at what matters                                                         | The parties that take no part in a step are dimmed. The step before is muted. A line of a listing is marked when it is spoken of                          | Yes           |
| Redundancy          | Pictures with a voice, not pictures with a voice and the same words on screen | Said aloud, the sentence is left off the picture and is in the caption files. Silent, it is written under the scene, as the only words there are          | With a voice  |
| Modality            | Say the words, do not write them beside the picture                           | The same                                                                                                                                                  | With a voice  |
| Spatial contiguity  | Put words beside what they are about                                          | An arrow's label is on the arrow, a listing hangs under its row, what a party holds is under the party. Silent, the sentence is far from what it is about | Partly        |
| Temporal contiguity | Show a thing when it is spoken of                                             | Each thing happens at the word that names it: a line is marked, a token arrives, a check passes. Silent, the word's moment is reckoned from the sentence  | With a voice  |
| Segmenting          | Tell it in pieces the learner can pace                                        | One idea to a beat, and chapters in the description. The pace is the player's own controls and nothing more                                               | Partly        |
| Pre-training        | Name the main things first                                                    | Before the flow is told, each party is named and lit, and the two things to watch are shown. A word not said as it is spelled is written when it is said  | Yes           |
| Multimedia          | Words and pictures, not words alone                                           | Every sentence has a picture of what it says                                                                                                              | Yes           |
| Personalization     | Speak as to a person                                                          | “Your agent”, not “the agent”                                                                                                                             | Yes           |
| Voice               | A human voice, not a machine's                                                | The voice is a machine's                                                                                                                                  | No: see below |
| Image               | A speaker on screen does not necessarily help                                 | There is no speaker on screen                                                                                                                             | Yes           |

Three more, which are not Mayer's:

- **A question first.** The film opens by asking what it will answer: someone copies your agent's access token, can they use it? A question asked before the answer helps when the learner commits to an answer of their own ([Pan and Carpenter, 2023](https://doi.org/10.1007/s10648-023-09814-5), read from a summary and not from the paper).
- **The question is answered on the same stage it was asked on.** The copied token is tried twice, with the same picture both times, and only the API's answer differs.
- **It ends on what the flow does not protect.** The page's “watch out for” is part of what the page says.

## What has been decided

These are the film's manner so far. Change one for a reason, and change it here.

**The telling**

- The order is: the question, the problem shown, the title, who takes part and what to watch, the steps, the question answered, what is not protected, where to read more.
- About a minute and a half. The DPoP film says 236 words in 98 seconds.
- The title card is the flow's short name and the rest of its title. It does not repeat the sentence being said.

**The stage**

- It keeps the page's diagram: the parties in boxes across the top in their own colors, a line down from each, a numbered row for each step, a solid arrow for a request and a dashed one for a response.
- Only what has happened is drawn. The row being told is in focus, the one before it is muted above it, and older rows are gone.
- What a party holds is under it, clear of its box and on its line: one thing in the middle of the line, two to either side of it. A token bound to a key carries the key's mark.
- A listing is three lines at most, cut at 46 characters, with one line marked at a time. Between two parties it hangs between their lines. For what one party does by itself, its edge is in line with that party's box.
- Whoever is not a party to the flow is “Someone else”, in a grey box with a dashed edge, standing on no line. The film does not say “attacker”.
- What the API says of a request is a small box under the request, on the API's line: green for accepted, red for refused.
- The light theme, the site's own type and colors, read from the built stylesheet.

**Motion**

- One thing moves at a time. An arrow draws itself from sender to receiver. A thing that arrives is a little larger for a moment.
- The picture does not zoom or pan.
- Nothing runs on a clock: a frame is a function of its second, so a film comes out the same every time.

**Words**

- Written for the ear: one idea to a beat, short enough to say in a breath. A step that carries two ideas is told in two beats.
- Spoken to the person watching.
- A sentence is not said and written at once.

**Voice**

- Kokoro, voice `af_heart`, at its own pace: a little under three words a second, with a third of a second between lines.
- A word the voice would say wrong is written for it as it sounds (`speak`), and what it says is checked by ear.
- The track is brought to −16 LUFS.
- The description says the voice is synthetic.

**Captions and description**

- Captions are always written, as `.vtt` and `.srt`.
- The description has the flow's title and tagline, its address, chapters, and what the page says it is based on.

**Format**

- 1920 × 1080, 30 frames a second, H.264, with AAC at 48 kHz where there is a voice.

## What has not been decided

- **Whose voice.** The voice principle asks for a person's. Kokoro was chosen to hear the film with a voice at all, with no account and no cost. A recording by a person fits the same script: a beat lasts as long as its clip. A hosted voice is the third choice, and needs an account. The studies behind the principle used older machine voices, and whether it holds for today's was not checked.
- **A shape for a feed.** The stage is laid out for 16:9. A square or 4:5 cut is another layout, not a crop.
- **A cover.** The first frame is the agent, the API and a token. Nothing chooses a frame for a thumbnail.
- **A dark version.**
- **Where it is posted, and under what title.**
- **Whether every film asks about a copied credential.** DPoP's question came from its page. Another flow's question is its own.

## Making the next one

1. **Find the flow's question.** One the page answers, that someone could guess at before watching. It is usually in the flow's summary or tagline.
2. **Write what is said**, in `scripts/films/<slug>.mjs`. A line to a beat, with its source on the page in a comment. Read it aloud before anything is drawn.
3. **Choose what each step shows**: which lines of its listing, the word at which each is marked, the word at which a party comes to hold what the step gives it.
4. **Write its opening and its ending.** The scenes before and after the steps are DPoP's, and are in `scripts/film-stage.js`: a request with a token, a copy in a log, someone else trying the copy, the copy refused, the key put away. The steps themselves need nothing written.
5. **List the words a voice will get wrong.** Each goes under `speak`, as it sounds. One that is not said as it is spelled also goes on the stage with `gloss`, with the source for how it is said. PKCE is “pixy” ([RFC 7636](https://www.rfc-editor.org/rfc/rfc7636)), and JWT is “jot”.
6. **Make it silent first**, and look at it: `npm run film -- --flow <slug>`. Then with a voice.
7. **Listen to it.** Nothing checks how it sounds. Listen for each name, for a line that is rushed, and for anything on the stage that the words do not say.
8. **Keep each cut where it will last.** `social/` is not committed. The cuts of the DPoP film are kept on a page of their own, outside the repository.

### What would make the next one easier

- **Scenes from data.** A flow's opening and ending are written as code for the stage. If a scene were a list of who is there, what each holds and who sends what to whom, a new flow would need a script and no code.
- **One list of how words are said**, for every film, with the source for each.
- **A check of a film's script without drawing it**: that each step exists, each line of a listing is found, and each word a cue names is in its sentence. The script stops on these today, but only when a film is made.
- **Watching where people stop.** A video site shows where viewers leave. Nothing here has been measured, and the first cut posted is the first evidence.
