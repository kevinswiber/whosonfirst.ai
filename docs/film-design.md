# Film design guide

How a film looks, in measurements, and how to check one. It is written for whoever makes the next film, person or model, and assumes nothing from the conversations in which the first was made.

[Films](films.md) says what a film is for, what it holds to and why each decision was made. Read that first. This guide is the how: where things go, how big they are, how they move, and what to look at before saying a cut is done.

## Where things stand

- There are two layouts. **Fixed** keeps the parties where they are, with a line between each two that speak, and only what is sent moves. **Rows** is the page's sequence diagram, a step to a row.
- There are three looks. **Paper** is a warm page with a faint grid of dots, and shadows. **Depth** is the same shadows on a cooler grey page with no dots. **Flat** is the page's white.
- **Fixed on paper is what the script makes when nothing else is asked for.** The site's owner chose depth over flat on 16 November 2026, and later that day paper over depth, which was cold to watch. Depth and flat are kept, in case that changes. So a change to how a film looks is made in every look, and each is checked.
- Rows has only been looked at flat, and flat is its usual look.

## Start here

```bash
npm run build
```

```bash
node scripts/flow-film.mjs --flow dpop --beats
```

```bash
node scripts/flow-film.mjs --flow dpop --stills 26,44,57
```

```bash
node scripts/flow-film.mjs --flow dpop
```

| Option                            | What it does                                                                                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--flow <slug>`                   | Which flow. Its film is `scripts/films/<slug>.mjs`                                                                                                                                                                             |
| `--layout fixed\|rows`            | The stage. Fixed if left out                                                                                                                                                                                                   |
| `--shape 16:9\|4:5`               | The frame. 16:9 if left out. 4:5 is for a feed: see [A tall frame for a feed](#a-tall-frame-for-a-feed)                                                                                                                        |
| `--look paper\|depth\|flat`       | The look. Paper if left out, and flat for rows                                                                                                                                                                                 |
| `--voice kokoro`                  | Said aloud. Needs the Python that the top of `scripts/film-voice.py` describes                                                                                                                                                 |
| `--voice <name> --reading <file>` | Said by a recording of the whole film, by a person or a voice made elsewhere. The recording is cut into the film’s lines once, and kept under that name. Needs `faster-whisper`: see the top of `scripts/film-voice-import.py` |
| `--voice-note "<line>"`           | With a recorded voice: a line for the description under the film, such as that the voice is synthetic and whose it is                                                                                                          |
| `--room <file>`                   | The sound of a quiet room under the voice for the whole film. `--room-level` is how loud, in LUFS: −56 if left out, against the voice’s −16                                                                                    |
| `--captions on\|off`              | Whether each sentence is written under the scene. On when there is no voice                                                                                                                                                    |
| `--beats`                         | Prints when each beat starts and how long it lasts, opens the stage, and draws nothing                                                                                                                                         |
| `--stills 26,44.5`                | Pictures at those seconds, and no video. The fastest way to look at a change                                                                                                                                                   |
| `--series`                        | The film as a series of pictures, and no video: see [A series of pictures](#a-series-of-pictures)                                                                                                                              |
| `--draft`                         | The flow told in its steps' own titles, with no script. What a flow with no film yet gets                                                                                                                                      |

Everything is written to `social/`, which is not committed. A cut that is to be kept is copied from there to `film-assets/`, which is sent to an R2 bucket: see [Changing the design](#changing-the-design). A file's name says what is not the usual: `-rows`, `-flat`, `-draft`, `-voiced`. Beside each video are its captions as `.vtt` and `.srt`, a cue to a sentence and timed to the voice, and a `.txt` to paste under it where it is posted. Upload the captions with the narrated video: they are how it is followed with the sound off. The build has to be newer than every file under `src/` and `public/`, or the script stops and says which file is newer.

A beat's times differ between the silent cut and the narrated one, so run `--beats` with the same options as the stills.

## What can be filmed today

Be plain with the owner about these. Do not work around one quietly.

- **The fixed layout draws a flow of up to four parties.** That is 24 of the 25 flows; `aauth` has five and is refused. Any two parties may speak. It would also refuse a flow in which the three parties at the right all speak to each other, and no flow does.
- **Only DPoP has a film.** Eight other flows were looked at as drafts on 16 November 2026, a step to a picture and in small pictures only: `access-revocation`, `authorization-code-pkce`, `client-credentials`, `credential-broker`, `gnap`, `identity-chaining`, `token-exchange` and `transaction-tokens`. Nothing was cut off or left behind in them. That is a check of where things go, not of how a film of them would read. The other fifteen have not been looked at.
- **The weak place is a message between two parties at the right.** Its line is the gap between them, so what is sent travels a short way, sometimes a few tens of pixels. Look at each such step before trusting it.
- **The rows layout draws any number of parties** across the top, as the page does, and is what a flow of five parties falls back to. It has been looked at closely only for DPoP. In another flow it draws the steps, their arrows and their listings, and does not draw what a party comes to hold.
- **The steps of a flow need no code.** They are drawn from the flow's data and the film's script.
- **The scenes before and after the steps are DPoP's story, written as code** in both stage files: a token spent, a copy left in a log, someone else trying it, the copy refused, the key put away. They are timed to words in DPoP's sentences, and the stage refuses them in a film that does not open with the scene `ask`. Another flow needs its own opening and ending written into the stage, and that is design work: propose the scenes to the owner in words before drawing them.
- **The two stage files share a copied engine** (the part that places things in time). A fix to it goes in both.

Stop and ask when a flow does not fit, when a film needs a kind of scene or part this guide does not have, or when a line would say something the flow's page does not.

## The stage

1920 by 1080, 30 frames a second. A frame is a function of its second: nothing runs on a clock.

- **Silent cut.** The scene has the top 812 pixels. Under a rule at 822 is the sentence being told, 46px, centred, in a band 200 high. There is no heading.
- **Narrated cut.** There is no sentence. The whole scene is moved down 96 pixels, and a heading sits at the top left (130, 58). All measurements below are before that move.
- The page's address is at the bottom left of both (96, 996), 21px.

### Safe areas

A film is watched in a player, which lays things over it: a bar of controls along the bottom when it is paused or pointed at, and captions above that when they are on. Screens also crop the edges a little.

- **Everything is inside the middle nine tenths of the frame:** x 96 to 1824, y 54 to 1026. That is the title-safe area for 16:9. The address, the heading and the widest answer were each outside it once.
- **In a narrated cut, nothing that has to be seen is under y 890.** A player’s captions sit there, two lines of them from about y 890 to 1026, and a narrated film is the one posted with captions. “Someone else”, the lowest thing on the stage, ends at y 886.
- **In a silent cut the sentence is in that place itself,** from y 822, so no captions are wanted over it.
- **What is being looked at is in the middle of the frame.** What is sent travels between x 490 and 1390, and listings are centred on x 940. A narrated flow sits between y 286 and 766, about the middle of the height.
- The film is 16:9 and laid out for it. A tall cut for a feed, where the bottom fifth to a quarter is covered by buttons and captions, would be another layout and not a crop.

### Fixed layout

**Who stands where** is worked out from the flow, at the top of `scripts/film-stage-fixed.js`:

- **The tall party, at the left,** is whoever speaks to the most other parties. Where two speak to as many, an agent is taken before another party and a person last. In DPoP it is the agent. In `token-exchange` it is the tool server, and in `credential-broker` the proxy.
- **The others stand at the right, one above another,** in the page's order. Two of them that speak to each other are put next to each other, because their line is the gap between them.

| Part                          | Where                                                                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tall party                    | A box 360 wide: x 130 to 490. With one or two others, y 190 to 670. With three, y 190 to 780                                                                                                                                       |
| What the tall party holds     | Inside it, centred: the first thing 140 under its top, each next one 70 lower                                                                                                                                                      |
| The other parties             | Boxes 380 by 104, centred on x 1580. Two stand at y 250 and y 620. One stands level with the middle of the tall party                                                                                                              |
| When a party stops holding    | The thing fades, as the flow’s data says with `lose`. In the tall party what is under it moves up                                                                                                                                  |
| What another party holds      | One thing, hanging from the middle of the bottom edge of its box                                                                                                                                                                   |
| Line to the tall party        | Level, from its edge (x 490) to the other party's edge (x 1390), at the other party's y                                                                                                                                            |
| Line between two at the right | Upright, at x 1580, in the gap between their boxes. That gap is given three times the room of a gap with no line                                                                                                                   |
| A listing                     | 820 wide, centred between the edges (x 940), which leaves 40 at each side. Under an upper level line, over a lower one, and level with the middle of an upright one. It may cover a line that is dimmed, and never one that is lit |
| What a party does by itself   | A pill beside the party: right of the tall party and level with its middle, or left of another party on the side of its line with more room                                                                                        |
| Strip of step numbers         | Left edge at x 130, y 104                                                                                                                                                                                                          |
| Keystore (DPoP)               | Inside the agent at the bottom, 328 by 136, around the key                                                                                                                                                                         |
| Someone else (DPoP)           | A dashed box 400 wide, centred on (720, 742), with its own line along and up to the API                                                                                                                                            |

In DPoP's film, while only the agent and the API take part, before the flow and after it, the API and its line stand at y 430, level with the middle of the agent. The API goes to y 620 while the title card covers the stage, and glides back in 0.7 seconds when the authorization server leaves.

The room under the scene is left for a reason. In a silent cut the sentence is written there, from y 822. In DPoP’s film “Someone else” stands there. A flow with four parties uses the height down to 780, which leaves 40 pixels over that sentence’s rule, and nothing starts closer than 64 pixels under the strip of numbers.

A part made for a scene that a film does not have is not on the stage: anything the film never shows is hidden.

### A tall frame for a feed

`--shape 4:5` draws the fixed layout at 1080 by 1350, for LinkedIn and X, where a video plays in a feed, mostly on a phone and with its sound off. [The review of 17 November 2026](reviews/films-in-a-feed-2026-11-17.md) says why. It was drawn on 17 November 2026, and the owner said yes to it the same day. Cut 18-4x5 of DPoP is the first film in it.

It is the same stage turned on its side, and not the 16:9 frame cropped or shrunk:

- **The tall party stands across the top,** with what it holds side by side in it, right of its name. The others stand in a row under it, and each line runs straight down. What is sent travels down or up.
- **Every listing has one place,** under the row of parties, the width of the stage. There is no room for it beside a line.
- **Each sentence is written under the stage, with the voice.** It is the exception to “a sentence is not said and written at once”: in a feed most people do not hear the voice. There is no heading over the scene, as in a silent cut.
- **The question the film opens with is written in large letters over the stage from the first frame,** and stays until the title. A viewer whose feed does not play videos sees only that frame.
- **No letter is under 28 pixels.** A frame 1080 wide is seen about 390 points wide on a phone.
- **The address is in the middle at the bottom,** clear of the corners, where a feed puts its buttons.

| Part                        | Where, in 4:5                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| Opening question            | 58px semibold, left edge at x 90, top at y 62                                                          |
| Strip of step numbers       | Left edge at x 90, y 74. Circles 52 across, numbers 28px                                               |
| Tall party                  | A box 900 by 180: x 90 to 990, y 170 to 350. Its name 34px at the left                                 |
| What the tall party holds   | Two places, centred on x 440 and x 810, level with the middle of the box. Pills 64 high, 28px mono     |
| The other parties           | Boxes 420 by 104, centred on y 702. Two are centred on x 290 and x 790, one on x 540                   |
| Line to the tall party      | Upright, from the bottom of the tall party (y 350) to the top of the other (y 650)                     |
| Thing sent                  | Pills 58 high, 28px mono, behind a number 52 across                                                    |
| What a party does by itself | Under the tall party, in the middle of the frame. Under a party in the row, 54 in from its edge        |
| Listing                     | 900 wide, centred on x 540, from y 794. 30px mono, cut at 46 characters                                |
| Gloss                       | In the middle of the frame, half way down the lines                                                    |
| Sentence                    | 40px, centred, in a band 900 wide from a rule at y 1010, 180 high                                      |
| Address                     | 28px mono, centred, from y 1206, with the owl 60 across                                                |
| Someone else (DPoP)         | A dashed box 340 wide, centred on (224, 900). Its line goes along under the row and up into the API    |
| Answers (DPoP)              | To someone else, under the API and left of their line up to it. To the agent, left of the agent's line |
| Places (DPoP)               | Right of the line to the API, from y 410, 90 apart                                                     |
| Keystore (DPoP)             | Drawn around the private key, where it is. The key and the token are already apart                     |

In DPoP's film the API stays where it is: its line runs straight down from the agent whoever else is there. In the scene of the copy, what the agent spent and its answer go first, so that the places have the length of the line.

It draws a flow of up to three parties, and refuses two in the row that speak to each other: their line would be the short gap between them.

**The cover** in 4:5 has what the 16:9 cover has: the flow's short name at 200px, the question at 76px, and the two rows. Each row's party is written over what it sends, and the two answers stand one over the other at the right. The bottom right corner is empty.

**The file** is H.264 High Profile, asked for at 6,000 kbps on average, where a 16:9 film is encoded at a constant quality and comes out near 500 kbps. X asks for 5,000 kbps or more and encodes what it is given again ([X developer documentation](https://docs.x.com/x-api/media/quickstart/best-practices)). Cut 18-4x5 came out at about 1,500 kbps all the same: most of its frames are the frame before, and the encoder has nothing to spend the rest on. That is three times the 16:9 film's bits for a smaller frame. Whether X's own encoding of it is soft is to be seen on the first post. One file is posted to both LinkedIn and X.

### A series of pictures

`--series` makes the film as pictures and no video, for a post that holds several pictures or a document of pages. The film's script chooses them, under `series`: the cover first, then a few of the film's moments, each with the sentences of one or more of its beats written under the stage. [Films](films.md#for-a-feed) says why DPoP's is nine. A script that chooses none gets a picture for each scene and one for each step, however many beats tell it: sixteen for DPoP, and too many to post.

| In `series` | What it is                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `cover`     | `true`: the cover, as `--cover` draws it                                                                                             |
| `at`        | The moment: the end of a scene, by its name, or of a step, as `"step 3"`. `"step 4.1"` is the end of its first beat                  |
| `say`       | The beats whose sentences are written under it, named the same way. `at` if left out                                                 |
| `shows`     | What the picture shows, in words, for its alt text, where its step and its sentences do not say it. Write it for a scene, not a step |

A picture is taken just before what was sent goes, and the title in the middle of its beat. Under the stage is what its beats say, in the band, from 40px down to 34px where it would not otherwise fit. Nothing is drawn for the series that the film does not draw, and no word is written that the film does not say.

Beside the pictures, in `social/film-<slug>…-series/`, are `alt.txt`, a description of each picture to give as its alt text (what the script says it shows, or what step it is and from whom to whom, the lines of the listing with long runs of base64 left out, and what is said), and the series as one PDF, a picture to a page. It is made in either shape, and was first made in 4:5 on 17 November 2026.

### Rows layout

Parties are boxes 400 by 104 across the top, with a line down from each. A step is a row: it comes in at y 500, the one before it is muted at y 372, and older rows are gone. What a party holds hangs on its line under its box. The numbers are at the top of `scripts/film-stage.js`.

## Parts

Each part means one thing. Do not use a part for anything else, and do not invent a part without asking.

| Part          | Means                                          | Looks like                                                                                                                                                                                       |
| ------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Party         | Someone who takes part in the flow             | A box in its role's colour and soft fill, name in 32px semibold                                                                                                                                  |
| Someone else  | Whoever has a copy and is not part of the flow | A dashed grey box. Never a role's colour                                                                                                                                                         |
| Thing held    | What a party has, in the page’s own words      | A pill 54 high, 24px mono, at least 280 wide. With “key” in its words it is amber. Otherwise it is white, and a token bound to a key has a key badge. Long words are set at 20px, then cut short |
| Thing sent    | What a message carries                         | Pills 46 high, 21px mono, in a row behind the step's number                                                                                                                                      |
| Line          | That two parties can speak to each other       | A grey line, 5 wide. Lit when the parties at both its ends are, and dimmed otherwise                                                                                                             |
| Direction cue | Which way the next thing will go               | The line drawn over in the sender's colour, 6 wide, to an arrowhead at the receiver                                                                                                              |
| Listing       | Lines from the step's own listing on the page  | A card, 30px mono, with the line being spoken about marked in blue                                                                                                                               |
| Act           | What one party does by itself                  | A pill in the party's colour with the step's number and label, 32px                                                                                                                              |
| Tick          | That a check passed                            | A green tick at the end of an act                                                                                                                                                                |
| Verdict       | The answer to a request                        | A small box, 28px mono: green for allowed, red for refused, a question mark for not yet known                                                                                                    |
| Gloss         | How a word is said, or what it is short for    | A dashed note under the listing: the term in mono, the note beside it                                                                                                                            |
| Place         | Somewhere a token passes through               | A small dashed label above the line                                                                                                                                                              |
| Strip         | How far the flow has got (fixed layout only)   | Numbered circles: outlined to come, in the sender's colour now, grey when told                                                                                                                   |
| Heading       | What this part of the film is (narrated only)  | 42px semibold, with “Part 2 of 3” above it in 20px mono for a part of the flow                                                                                                                   |
| Title card    | The flow's name                                | The short name at 170px, what it stands for at 34px mono, the flow's title at 46px                                                                                                               |
| End card      | Where to read more                             | The site's name at 110px, the page's address at 44px mono in blue                                                                                                                                |

Kinds of thing sent, as a film's script names them in `carries`:

| In the script | Drawn as                                                       |
| ------------- | -------------------------------------------------------------- |
| `"token"`     | A white pill, “token”                                          |
| `"bound"`     | A white pill, “token”, with a key badge                        |
| `"proof"`     | A blue pill, “proof”                                           |
| `"missing"`   | A dashed grey pill, “no proof”: the place of what was not sent |
| `"200 OK"`    | A green pill. Any words that start with a 2xx status are green |
| anything else | A white pill with those words                                  |

## Colour

Every colour is one of the site's own, read from the built stylesheet by name. Never write a hex value, and never add a colour.

- **A role's colour** (`--role`, `--role-soft`, from the classes `role-agent`, `role-authz`, `role-resource` and the rest) is for that party: its box, its step numbers, its acts and the direction cue of what it sends.
- **Amber** is the key, and only the key: the private key, the key badge on a bound token, the keystore.
- **Blue** (`--accent`) is the proof and the marked line of a listing.
- **Green and red** are verdicts and the tick.
- **Grey** (`--border-strong`, `--fg-subtle`) is what is not part of the flow or not there: someone else, a missing proof, a place, a line at rest.
- **A party that is not taking part in this step** is at 0.3 opacity, with its line.

## Motion

One thing moves at a time, and nothing moves without the eye knowing where it is going. A step that sends something goes in this order, in seconds from the start of its first beat:

| When      | What happens                                                                                                                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0         | The sender and receiver are lit, and the others dim, over 0.4                                                                                                                                            |
| 0.3       | The direction cue draws from the sender to the receiver over 0.55, slowing as it arrives                                                                                                                 |
| 0.35      | What will be sent appears at the sender and waits                                                                                                                                                        |
| 0.5       | The listing rises 14 pixels into place over 0.4                                                                                                                                                          |
| 0.95      | What is sent leaves. It takes 1.4 seconds: slow away, quickest half way, slow to a stop                                                                                                                  |
| at a word | A line of the listing is marked, or a party comes to hold something, at the word that says so                                                                                                            |
| the end   | What was sent and the cue fade over 0.25. If the receiver keeps it, it goes to where it is held. If the next step is the receiver checking it (that step has `check`), both stay until the check is done |

- Three easings, all in the stage files: `inOut` for most changes, `out` for things arriving, `travel` for things sent.
- A thing appears with a small pop: from 0.8 of its size to full, over 0.3.
- A beat lasts as long as its sentence takes to say, and never less than the times in `LEAST` in `scripts/flow-film.mjs`. If a scene needs longer for what happens on the stage, raise its number there. If one beat is the moment the film is for, give that beat `hold` in the script: seconds it stays up after its words.
- Nothing flashes, nothing loops, and the picture does not zoom or pan. Parties do not move, with the one exception of the API coming level in DPoP’s film.

## The looks

A change to a part is made for both. The styles are in the `<style>` block in `scripts/flow-film.mjs`; the depth look is the rules that start `.lit`, and paper is depth with the rules that start `.paper` over it.

Paper differs from depth in the page alone: a warm grey (`#ecebe6`) in place of the cooler tint, shadows tinted to match, and a dot every 36 pixels at 16 parts in a hundred of the shadow's colour. The dots never move. They are at full strength behind the stage and fade to nothing above and below it, and to less at the sides, so a heading and the address are on clear paper: a grid as strong at the edge as in the middle leads the eye out of the picture. A curtain has the same dots in the same places, so nothing jumps when a title or end card comes down. A dimmed party is partly clear, and a few dots show inside it.

| Property                 | Flat                   | Depth                                                                         |
| ------------------------ | ---------------------- | ----------------------------------------------------------------------------- |
| Page                     | White (`--bg`)         | A grey tint (`--stage`), a little darker toward the corners                   |
| Party                    | Border and soft fill   | The same, with a band of its colour 16 thick along the top, and a soft shadow |
| Thing held, verdict, act | No shadow              | A small shadow                                                                |
| Thing sent               | No shadow              | A small shadow at rest. On its way it rises 5 pixels over a longer one        |
| Listing                  | Grey fill, grey border | White, no border, the deepest shadow on the stage                             |
| Someone else             | Dashed, grey fill      | Dashed, nearly clear, no shadow                                               |
| Missing proof            | Dashed, white fill     | Dashed, filled with the page's tint, no shadow                                |
| Line at rest             | Light grey             | A little darker, to show on the tint                                          |

What depth means, so that a new part gets the right treatment:

- **A shadow means it is part of the system and it is there.** Someone else and a missing proof cast none.
- **A longer shadow means it is on its way.** Only what is sent has one.
- **A listing is nearest the viewer**, because it is laid over the stage to be read.
- **Nothing is added that is not a party, a thing held or a thing sent.** No glow, no moving background. Paper's dots are the page the diagram is drawn on, as its tint is: they are still, faint, and the same in every frame. The research in [Films](films.md#what-else-is-known) is against decoration, and silent on shadows.

## Rules of spacing

Each of these was got wrong once and noticed by the owner. Check them on every cut.

**Everything has room to breathe.** As a rule of thumb, two things that are not part of each other are at least 30 pixels apart, and 40 where one of them is a party’s box, a listing or the edge of the scene. The numbers in the stage files were set to keep that: a listing 40 from the parties at each side and from its line, an answer 40 from the API, what a party does by itself 30 from what waits beside it. A new part, or a flow with longer words, is checked against it.

1. **Things side by side are the same width, and the gap between them is centred** on whatever line or axis they sit about.
2. **A thing on a line is centred on the line.**
3. **A box that holds something leaves at least 20 pixels around it** on every side.
4. **Nothing sits closer than 40 pixels to a party's box** unless it is inside the box.
5. **Words never sit over a line.** Anything with words that a line passes behind has a solid fill, in both looks. In the depth look a “clear” fill is the page's tint, not transparent.
6. **A scene with two parties is level**: both on one line across the stage.
7. **A message never seems to come from a party that did not send it.** If a sender stands under another party, move the sender or take the other party off the stage.
8. **A thing that will move is seen at rest first**, with its direction cue.
9. **Nothing is cut off** by the edge of the stage, the sentence band or another part. In the silent cut the scene ends at 812.
10. **The moment the film is for stays up long enough to read.** A listing is on the stage for at least three seconds after its last line is marked. Give the beat `hold` if it is not.
11. **Nothing is outside the safe areas,** and in a narrated cut nothing that has to be seen is under y 890.

## Checking a cut

A model cannot watch a film or hear one. It can look at stills, and it must say that is all it did.

1. Run `--beats`, and pick a second in the middle of every beat, plus one about 1.2 seconds into each step that sends something (the thing is then half way).
2. Render those with `--stills`, for the paper look and again for the depth and flat looks, and for the silent cut as well as the narrated one. Look at every picture at full size, not only at a sheet of small ones.
3. On each picture, go down the eleven rules of spacing. Then ask: is what the sentence says on the stage, and is anything on the stage that the sentence does not say?
4. Look for these, each of which has happened: a thing fading when it should be solid; a thing left behind after its step; a direction cue still lit in the next step; a part from another film’s scenes sitting on the stage; a step number in the strip in the wrong state; a listing covering a line that is lit; a long line of a listing running out of its card.
5. Render the videos. Take a few frames back out of the finished file and look at them, since a still and the video are made by the same code but not in the same run.
6. Run `npm run check` and `npm test`.
7. Tell the owner what was looked at, and what was not: how the motion feels, how the voice sounds, whether a name is said right. Only they can check those.

In the stage files, an order matters that is easy to get wrong: a thing's `travel` is called before its `hide`. The other way round, it fades for the whole of its journey.

## Making a film for another flow

[Films](films.md#making-the-next-one) has the steps. What a script can say, in `scripts/films/<slug>.mjs`:

| Field     | On                  | What it is                                                                                                                                                                                 |
| --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `flow`    | the script          | The flow's slug                                                                                                                                                                            |
| `speak`   | the script          | Words written as they sound, for the voice: `{ DPoP: "dee-pop" }`. The picture keeps the real spelling                                                                                     |
| `say`     | every beat          | The sentence. One idea, short enough to say in a breath, with its source on the page in a comment. On the `end` beat it is the film’s last line: where to find the rest, and what is there |
| `scene`   | a beat              | A scene the stage knows by name. DPoP's are `ask`, `spend`, `copy`, `steal`, `title`, `cast`, `refuse`, `caveat`, `recap`, `end`                                                           |
| `step`    | a beat              | A step of the flow, counted from 1. A second beat with the same number goes on telling it                                                                                                  |
| `head`    | a beat              | The heading for this part. A step takes its heading from the flow's own phases                                                                                                             |
| `expands` | the `title` beat    | What the flow's short name stands for, as the flow's page words it                                                                                                                         |
| `carries` | a step's first beat | What the message carries, as the kinds in the table above. The step's label if left out                                                                                                    |
| `show`    | a step's beat       | Lines of the step's listing, each found by a piece of it, and `on`: the word at which it is marked                                                                                         |
| `gain`    | a step's beat       | The word at which the party comes to hold what the step gives it                                                                                                                           |
| `lose`    | a step's beat       | The word at which a party stops holding what the step takes from it. Left out, it goes as the step begins. Put it before `gain` in a beat that has both                                    |
| `check`   | a step's beat       | The word at which a check is seen to pass. What the party was sent in the step before waits beside it until then                                                                           |
| `gloss`   | a step's beat       | `{ term, note, on }`: a word written under the listing at the moment it is said                                                                                                            |
| `hold`    | a beat              | Seconds the beat stays up after its words: for the one moment the film is for                                                                                                              |
| `series`  | the script          | The film as a few pictures, for `--series`: see [A series of pictures](#a-series-of-pictures)                                                                                              |

A word named in `on`, `gain`, `check` or `gloss` has to be in that beat's sentence, or the script stops and says so.

### Before writing a script: the draft

A flow with no script is filmed as a draft: its title, then each step told in the title the page gives it, with the first two lines of its listing and whatever a party gains. It is for looking at where things go, and is not for posting.

```bash
node scripts/flow-film.mjs --flow <slug> --beats
```

```bash
node scripts/flow-film.mjs --flow <slug> --stills 12,16,20
```

Take a still about 2.5 seconds into every step. Look hardest at any step between two parties at the right, at a party that holds more than one thing, and at a listing beside a line that is lit. If the layout refuses the flow, it says why: use `--layout rows`, or ask.

### The last line

The film ends by saying where the rest is, and what is there that the film did not show. DPoP’s is “Every step, and what your API has to check, is at whosonfirst.ai.” Name something on the page that the person watching would want next. Do not ask them to like, follow or subscribe. The address is written for the voice under `speak`, as “who’s on first dot AI”. Letters that are said as letters are written together: “A I”, with a space, is said as the word “a” and then “I”. A model cannot hear a line, but it can have the voice’s line written back by a speech recogniser and read what comes out, which is how this one was found.

### A recorded voice

A film can be said by one recording of the whole of it, in place of Kokoro: a person reading it, or a voice made by a service.

1. Get the film’s lines as the voice should be given them, with the words under `speak` written as they sound, one line to a paragraph. One paragraph to a line matters: the quiet between paragraphs is where the recording is cut.
2. Record or generate the whole of it once, as one file.
3. Run the film with `--voice <name> --reading <file>`. A speech recogniser hears the recording and says when each word starts, and its words are matched to the film’s own. That finds each line. Where a line ends is measured on the recording itself: it is cut in the middle of the longest quiet before the next line, so the last sound of a word and the breath after it stay with their line. The lines are kept in `social/voice/`. The script prints each line with where it was found and how much quiet follows it, and how many words were heard as written. A line followed by less than a fifth of a second of quiet is one to listen to.
4. After that, `--voice <name>` alone makes the film again. A line that has changed has not been said, and the script says which.

The DPoP film was tried this way on 16 November 2026 with an ElevenLabs voice, at the service’s `stability` of 0.7: a steadier read, since the film’s manner is plain. One read of the whole film is 1,434 characters. A film said by a synthetic voice says so in its description, with `--voice-note`.

### A room under the voice

Between its lines a film’s sound track is dead silence, which no recording of a person has: a room is never silent. `--room <file>` lays a steady recording of a quiet room under the whole film, so that a line does not start out of nothing and end in nothing. It is a recording with nothing happening in it, of any length: it is repeated, each copy faded into the next.

- **It is not meant to be noticed.** It is 40 LU under the voice. If it can be heard as a sound, it is too loud.
- **It goes under after the voice has been brought to its loudness,** at a level of its own. Brought to one loudness together with the voice, it would be turned up in every pause.
- **It is not music and it marks nothing.** What was read about music under a voice does not bear on it, and nothing was found that tests it. It is a sound editor’s practice, tried here on 16 November 2026 and not decided.
- It changes the quiet between lines. It does not change how the voice itself sounds.

The first try cut each line where the recogniser said its last word ended. That time is early, and the owner heard it at once: breaths cut off, and the end of “original” left at the start of the next line. A recogniser is trusted for when a word starts and not for when it ends.

## Changing the design

- **A measurement** is a constant at the top of a stage file. **A style** is in the `<style>` block in `scripts/flow-film.mjs`. **A time** is in `LEAST` there, or beside the motion in a stage file.
- Change it for both looks, look at both, and change this guide in the same commit.
- A decision about manner, as against a measurement, is recorded in [Films](films.md), with its reason.
- Keep each cut, and what it was made from, as [film-assets/README.md](../film-assets/README.md) says: in the bucket, and in `film-assets/index.json` with a line on what changed, so that one cut can be set beside another and none has to be made twice.
