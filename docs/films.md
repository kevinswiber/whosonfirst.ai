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

- The order is: the question, the problem shown, the title, who takes part and what to watch, the steps, the question answered, what is not protected, the whole of it in one line, where to read more.
- About a minute and a half. The DPoP film says 236 words in 98 seconds.
- The title card is the flow's short name and the rest of its title. It does not repeat the sentence being said.

**The stage**

- It keeps the page's diagram: the parties in boxes across the top in their own colors, a line down from each, a numbered row for each step, a solid arrow for a request and a dashed one for a response.
- Only what has happened is drawn. The row being told is in focus, the one before it is muted above it, and older rows are gone.
- What a message carries travels along its row, from the sender to the receiver: a token, a proof, an answer, each a small labelled thing. It moves once. What the receiver keeps goes up to where the receiver holds things. Where something that should be sent is not, its place travels empty: the copied token goes beside “no proof”.
- Said aloud, a heading over the scene says what this part is: the question, then each part of the flow by the page's own name for it. Written under the scene, the words leave no room for one.
- What a party holds is under it, clear of its box and on its line: one thing in the middle of the line, two to either side of it. A token bound to a key carries the key's mark.
- A listing is three lines at most, cut at 46 characters, with one line marked at a time. Between two parties it hangs between their lines. For what one party does by itself, its edge is in line with that party's box.
- Whoever is not a party to the flow is “Someone else”, in a grey box with a dashed edge, standing on no line. The film does not say “attacker”.
- What the API says of a request is a small box under the request, on the API's line: green for accepted, red for refused.
- The light theme, the site's own type and colors, read from the built stylesheet.

**Motion**

- One thing moves at a time. An arrow draws itself from sender to receiver, and then what it carries travels along it. What travels leaves slowly, is quickest half way and slows to a stop, so the eye can pick it up and see where it lands. A thing that arrives is a little larger for a moment.
- Nothing flashes, and nothing moves on a loop.
- The picture does not zoom or pan.
- Nothing runs on a clock: a frame is a function of its second, so a film comes out the same every time.

**Words**

- Written for the ear: one idea to a beat, short enough to say in a breath. A step that carries two ideas is told in two beats.
- Spoken to the person watching.
- A sentence is not said and written at once.

**Voice**

- Kokoro, voice `af_heart`, at its own pace: a little under three words a second, with a third of a second between two lines of one step and about twice that between steps.
- A word the voice would say wrong is written for it as it sounds (`speak`), and what it says is checked by ear.
- The track is brought to −16 LUFS.
- No music under the voice. See [what else is known](#what-else-is-known).
- The description says the voice is synthetic.

**Captions and description**

- Captions are always written, as `.vtt` and `.srt`.
- The description has the flow's title and tagline, its address, chapters, and what the page says it is based on.

**Format**

- 1920 × 1080, 30 frames a second, H.264, with AAC at 48 kHz where there is a voice.

## What has not been decided

- **Whose voice.** The voice principle asks for a person's. Kokoro was chosen to hear the film with a voice at all, with no account and no cost. A recording by a person fits the same script: a beat lasts as long as its clip. A hosted voice is the third choice, and needs an account. Studies with newer machine voices mostly find no difference in what is learned: see below.
- **How much of what has happened stays on the stage.** One earlier row stays, muted. The research on animation says what has gone is its main cost, which argues for keeping more.
- **Rows, or parties that stay where they are.** The film draws the page's sequence diagram, a row to a step. The other way is to fix the parties in place with a line between each pair, and let only what is sent move. It keeps everything where it was, and has to show the order of the steps some other way. There is a prototype of it: `node scripts/flow-film.mjs --flow dpop --layout fixed`, drawn by `scripts/film-stage-fixed.js`. The agent stands at the left with what it holds inside it, the other parties at the right, and what is sent carries its step’s number, with a strip of numbers saying how far the flow has got. It is there to be set beside the rows and has not been chosen. If it is, the two stages should share the part that places things in time, which the prototype copies.
- **A shape for a feed.** The stage is laid out for 16:9. A square or 4:5 cut is another layout, not a crop.
- **A cover.** The first frame is the agent, the API and a token. Nothing chooses a frame for a thumbnail.
- **A dark version.**
- **Where it is posted, and under what title.**
- **Whether every film asks about a copied credential.** DPoP's question came from its page. Another flow's question is its own.

## What else is known

Read on 15 November 2026, for this guide. Most of the papers were read from their abstracts and not in full, and each finding is marked with how strong it is. None of it was measured on a film of ours.

**From research**

- **Music under a voice tends to cost learning.** A bland instrumental loop under narrated animation lowered retention and transfer in two experiments ([Moreno and Mayer, 2000](https://tecfa.unige.ch/tecfa/teaching/methodo/Moreno_Mayer00.pdf), read in full). A field experiment found music hurt on the easier of two videos and made no difference on the harder ([Meyerhoff and others, 2022](https://eric.ed.gov/?id=EJ1354848)). One meta-analysis finds music helps learning, but it is of learning in general and not of narrated video ([de la Mora Velasco and others, 2023](https://doi.org/10.1177/03057356231153070)). Where there is music under a voice, one study of broadcast sound recommends the voice at least 10 loudness units above it ([Torcoli and others, 2019](https://cris.fau.de/publications/234640600)).
- **A sound that marks one event, once, did no harm** in the same 2000 paper, and repeated arbitrary sounds did. The authors call that suggestive.
- **Animation helps where the change is the lesson.** Its advantage over still pictures is small overall ([Höffler and Leutner, 2007](https://eric.ed.gov/?id=EJ780451); [Berney and Bétrancourt, 2016](https://archive-ouverte.unige.ch/unige:92234)), larger with spoken commentary, and best for motion as against arrangement ([Ploetzner and others, 2020](https://eric.ed.gov/?id=EJ1274566)). What has gone from the screen is its cost ([Wong and others, 2012](https://eric.ed.gov/?id=EJ978021)).
- **Cueing helps, modestly**, and flashing hurt where colour helped ([Alpizar and others, 2020](https://eric.ed.gov/?id=EJ1269127); Schneider and others, 2018, read from a summary).
- **A question before the answer helps what it asks about**, and in a short video helped the rest too ([Carpenter and Toftness, 2017](https://doi.org/10.1016/j.jarmac.2016.07.014)). Saying a common misreading and then refuting it beat a clear explanation in one study of 364 students ([Muller and others, 2008](https://eric.ed.gov/?id=EJ788046)).
- **A newer machine voice mostly matches a person's for learning** ([Craig and Schroeder, 2019](https://eric.ed.gov/?id=EJ1225297), and two later studies), though one small study of 2026 found a person's voice better for transfer. They are single studies.
- **The case against words said and written at once is weaker for video than the principle says.** A review of 113 papers on video found coherence, segmenting and learner control held, and redundancy and modality did not ([Fyfield and others, 2022](https://eric.ed.gov/?id=EJ1363010)). Captions help most those watching in a second language ([Noetel and others, 2022](https://eric.ed.gov/?id=EJ1338120)).
- **Views and likes do not follow how good an explanation is** ([Kulgemeyer and Peters, 2016](https://iopscience.iop.org/article/10.1088/0143-0807/37/6/065705), read in full).

**From people who make them**

- The script is where the work goes: many drafts, cut for clarity and for length ([Kurzgesagt](https://kurzgesagt.org/youtube/); [CGP Grey](https://cgpgrey.substack.com/p/iteration)).
- The voice comes first, and the picture is timed to it.
- Write to what is on the screen ([Estelle Caswell of Vox](https://www.schoolofmotion.com/blog/estelle-caswell-vox-podcast)): the word and the picture make the same point.
- Open with something concrete or a question, and not with a definition ([3Blue1Brown](https://www.3blue1brown.com/faq/)).
- Every movement has a purpose, and a transition between scenes carries no information.
- Have someone who does not know the subject say where they were lost ([Joss Fong of Vox](https://www.theopennotebook.com/2020/01/07/videogram-how-a-vox-video-explains-the-science-behind-the-first-photo-of-a-black-hole/)).
- For animated transitions: slow in and slow out, keep landmarks on the screen, and stage simply, but staging everything one thing at a time tested worse than a little at once ([Heer and Robertson, 2007](https://homes.cs.washington.edu/~jheer/files/2007-AnimatedTrans-InfoVis.pdf)).

**Films to watch.** None of these was watched for this guide, and their view counts were not all read: [Session vs Token Authentication in 100 Seconds](https://www.youtube.com/watch?v=UBUNrFtufWo) (Fireship), [OAuth 2 Explained In Simple Terms](https://www.youtube.com/watch?v=ZV5yTm4pT8g) (ByteByteGo), [An Illustrated Guide to OAuth and OpenID Connect](https://www.youtube.com/watch?v=t18YB3xDfXI) (OktaDev), [Diffie-Hellman Key Exchange](https://www.youtube.com/watch?v=YEBfamv-_do) (Art of the Problem), and [But how does bitcoin actually work?](https://www.youtube.com/watch?v=bBC-nXj3Ng4) (3Blue1Brown). A single protocol is usually told in four to nine minutes, at 163 to 187 words a minute where a transcript could be counted. This film is at the short end and the slow end.

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
