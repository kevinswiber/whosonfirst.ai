# Film design guide

How a film looks, in measurements, and how to check one. It is written for whoever makes the next film, person or model, and assumes nothing from the conversations in which the first was made.

[Films](films.md) says what a film is for, what it holds to and why each decision was made. Read that first. This guide is the how: where things go, how big they are, how they move, and what to look at before saying a cut is done.

## Where things stand

- There are two layouts. **Rows** is the page's sequence diagram, a step to a row. **Fixed** keeps the parties where they are, with a line from the agent to each, and only what is sent moves.
- There are two looks. **Flat** is the page's white. **Depth** is a tinted page with shadows.
- The site's owner prefers **fixed with depth** (said on 16 November 2026) and wants flat kept, in case that changes. So a change to how a film looks is made in both looks, and both are checked.
- Rows is only tuned for flat.

## Start here

```bash
npm run build
```

```bash
node scripts/flow-film.mjs --flow dpop --layout fixed --look depth --beats
```

```bash
node scripts/flow-film.mjs --flow dpop --layout fixed --look depth --stills 26,44,57
```

```bash
node scripts/flow-film.mjs --flow dpop --layout fixed --look depth
```

| Option                 | What it does                                                                   |
| ---------------------- | ------------------------------------------------------------------------------ |
| `--flow <slug>`        | Which film: `scripts/films/<slug>.mjs`                                         |
| `--layout rows\|fixed` | The stage. Rows if left out                                                    |
| `--look flat\|depth`   | The look. Flat if left out                                                     |
| `--voice kokoro`       | Said aloud. Needs the Python that the top of `scripts/film-voice.py` describes |
| `--captions on\|off`   | Whether each sentence is written under the scene. On when there is no voice    |
| `--beats`              | Prints when each beat starts and how long it lasts, and makes nothing          |
| `--stills 26,44.5`     | Pictures at those seconds, and no video. The fastest way to look at a change   |

Everything is written to `social/`, which is not committed. Beside each video are its captions as `.vtt` and `.srt`, a cue to a sentence and timed to the voice, and a `.txt` to paste under it where it is posted. Upload the captions with the narrated video: they are how it is followed with the sound off. The build has to be newer than every file under `src/` and `public/`, or the script stops and says which file is newer.

A beat's times differ between the silent cut and the narrated one, so run `--beats` with the same options as the stills.

## What can be filmed today

Be plain with the owner about these. Do not work around one quietly.

- **The fixed layout draws one agent and two other parties, where every message goes to or from the agent.** On 16 November 2026 that was three of the 25 flows: `client-credentials`, `dpop` and `oauth-mtls`. The script refuses any other flow and says why. Three more flows have every message through the agent but four parties (`agent-payments`, `cross-app-access`, `identity-chaining`): the stage spaces three parties down the right, but where a listing goes between three lines has not been worked out or looked at.
- **The rows layout draws any number of parties** across the top, as the page does.
- **The steps of a flow need no code.** They are drawn from the flow's data and the film's script.
- **The scenes before and after the steps are DPoP's story, written as code** in both stage files: a token spent, a copy left in a log, someone else trying it, the copy refused, the key put away. They are timed to words in DPoP's sentences. Another flow needs its own opening and ending written into the stage, and that is design work: propose the scenes to the owner in words before drawing them.
- **The two stage files share a copied engine** (the part that places things in time). A fix to it goes in both.

Stop and ask when a flow does not fit, when a film needs a kind of scene or part this guide does not have, or when a line would say something the flow's page does not.

## The stage

1920 by 1080, 30 frames a second. A frame is a function of its second: nothing runs on a clock.

- **Silent cut.** The scene has the top 812 pixels. Under a rule at 822 is the sentence being told, 46px, centred, in a band 200 high. There is no heading.
- **Narrated cut.** There is no sentence. The whole scene is moved down 118 pixels, and a heading sits at the top left (130, 46). All measurements below are before that move.
- The page's address is at the bottom left of both (60, 1034), 21px.

### Fixed layout

| Part                        | Where                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Agent                       | A box 360 wide and 480 tall: x 130 to 490, y 190 to 670. Its name is at the top          |
| What the agent holds        | Inside it, centred: the first thing at y 330, the second at y 400                        |
| Keystore                    | Inside the agent at the bottom, 328 by 136, around the key at y 572                      |
| The other two parties       | Boxes 380 by 104, centred on x 1580, at y 250 and y 620                                  |
| Lines                       | Level, from the agent's edge (x 490) to each party's edge (x 1390), at the party's y     |
| A listing                   | 860 wide, centred between the edges (x 940). Under the upper line, or over the lower one |
| What a party does by itself | A pill beside the party: right of the agent, or left of the API above its line           |
| Strip of step numbers       | Left edge at x 130, y 104                                                                |
| Someone else                | A dashed box 400 wide, centred on (720, 760), with its own line along and up to the API  |

While only the agent and the API take part, before the flow and after it, the API and its line stand at y 430, level with the middle of the agent. The API goes to y 620 while the title card covers the stage, and glides back in 0.7 seconds when the authorization server leaves.

The numbers are constants at the top of `scripts/film-stage-fixed.js`.

### Rows layout

Parties are boxes 400 by 104 across the top, with a line down from each. A step is a row: it comes in at y 500, the one before it is muted at y 372, and older rows are gone. What a party holds hangs on its line under its box. The numbers are at the top of `scripts/film-stage.js`.

## Parts

Each part means one thing. Do not use a part for anything else, and do not invent a part without asking.

| Part          | Means                                          | Looks like                                                                                    |
| ------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Party         | Someone who takes part in the flow             | A box in its role's colour and soft fill, name in 32px semibold                               |
| Someone else  | Whoever has a copy and is not part of the flow | A dashed grey box. Never a role's colour                                                      |
| Thing held    | What a party has: a key or a token             | A pill 280 by 54, 24px mono. A key is amber. A token is white. A bound token has a key badge  |
| Thing sent    | What a message carries                         | Pills 46 high, 21px mono, in a row behind the step's number                                   |
| Line          | That two parties can speak to each other       | A grey line, 5 wide. Dimmed with the party at its far end                                     |
| Direction cue | Which way the next thing will go               | The line drawn over in the sender's colour, 6 wide, to an arrowhead at the receiver           |
| Listing       | Lines from the step's own listing on the page  | A card, 30px mono, with the line being spoken about marked in blue                            |
| Act           | What one party does by itself                  | A pill in the party's colour with the step's number and label, 32px                           |
| Tick          | That a check passed                            | A green tick at the end of an act                                                             |
| Verdict       | The answer to a request                        | A small box, 28px mono: green for allowed, red for refused, a question mark for not yet known |
| Gloss         | How a word is said, or what it is short for    | A dashed note under the listing: the term in mono, the note beside it                         |
| Place         | Somewhere a token passes through               | A small dashed label above the line                                                           |
| Strip         | How far the flow has got (fixed layout only)   | Numbered circles: outlined to come, in the sender's colour now, grey when told                |
| Heading       | What this part of the film is (narrated only)  | 42px semibold, with “Part 2 of 3” above it in 20px mono for a part of the flow                |
| Title card    | The flow's name                                | The short name at 170px, what it stands for at 34px mono, the flow's title at 46px            |
| End card      | Where to read more                             | The site's name at 110px, the page's address at 44px mono in blue                             |

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

| When      | What happens                                                                                   |
| --------- | ---------------------------------------------------------------------------------------------- |
| 0         | The sender and receiver are lit, and the others dim, over 0.4                                  |
| 0.3       | The direction cue draws from the sender to the receiver over 0.55, slowing as it arrives       |
| 0.35      | What will be sent appears at the sender and waits                                              |
| 0.5       | The listing rises 14 pixels into place over 0.4                                                |
| 0.95      | What is sent leaves. It takes 1.4 seconds: slow away, quickest half way, slow to a stop        |
| at a word | A line of the listing is marked, or a party comes to hold something, at the word that says so  |
| the end   | What was sent and the cue fade over 0.25, unless the receiver keeps it or is about to check it |

- Three easings, all in the stage files: `inOut` for most changes, `out` for things arriving, `travel` for things sent.
- A thing appears with a small pop: from 0.8 of its size to full, over 0.3.
- A beat lasts as long as its sentence takes to say, and never less than the times in `LEAST` in `scripts/flow-film.mjs`. If a scene needs longer for what happens on the stage, raise its number there.
- Nothing flashes, nothing loops, and the picture does not zoom or pan. Parties do not move, with the one exception of the API coming level.

## The two looks

A change to a part is made for both. The styles are in the `<style>` block in `scripts/flow-film.mjs`; the depth look is the rules that start `.lit`.

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
- **Nothing is added that is not a party, a thing held or a thing sent.** No texture, no glow, no moving background. The research in [Films](films.md#what-else-is-known) is against decoration, and silent on shadows.

## Rules of spacing

Each of these was got wrong once and noticed by the owner. Check them on every cut.

1. **Things side by side are the same width, and the gap between them is centred** on whatever line or axis they sit about.
2. **A thing on a line is centred on the line.**
3. **A box that holds something leaves at least 20 pixels around it** on every side.
4. **Nothing sits closer than 40 pixels to a party's box** unless it is inside the box.
5. **Words never sit over a line.** Anything with words that a line passes behind has a solid fill, in both looks. In the depth look a “clear” fill is the page's tint, not transparent.
6. **A scene with two parties is level**: both on one line across the stage.
7. **A message never seems to come from a party that did not send it.** If a sender stands under another party, move the sender or take the other party off the stage.
8. **A thing that will move is seen at rest first**, with its direction cue.
9. **Nothing is cut off** by the edge of the stage, the sentence band or another part. In the silent cut the scene ends at 812.

## Checking a cut

A model cannot watch a film or hear one. It can look at stills, and it must say that is all it did.

1. Run `--beats`, and pick a second in the middle of every beat, plus one about 1.2 seconds into each step that sends something (the thing is then half way).
2. Render those with `--stills`, for the depth look and again for the flat look, and for the silent cut as well as the narrated one. Look at every picture at full size, not only at a sheet of small ones.
3. On each picture, go down the nine rules of spacing. Then ask: is what the sentence says on the stage, and is anything on the stage that the sentence does not say?
4. Look for these, each of which has happened: a thing fading when it should be solid; a thing left behind after its step; a step number in the strip in the wrong state; a listing covering a line that is lit; a long line of a listing running out of its card.
5. Render the videos. Take a few frames back out of the finished file and look at them, since a still and the video are made by the same code but not in the same run.
6. Run `npm run check` and `npm test`.
7. Tell the owner what was looked at, and what was not: how the motion feels, how the voice sounds, whether a name is said right. Only they can check those.

In the stage files, an order matters that is easy to get wrong: a thing's `travel` is called before its `hide`. The other way round, it fades for the whole of its journey.

## Making a film for another flow

[Films](films.md#making-the-next-one) has the steps. What a script can say, in `scripts/films/<slug>.mjs`:

| Field     | On                  | What it is                                                                                                                       |
| --------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `flow`    | the script          | The flow's slug                                                                                                                  |
| `speak`   | the script          | Words written as they sound, for the voice: `{ DPoP: "dee-pop" }`. The picture keeps the real spelling                           |
| `say`     | every beat          | The sentence. One idea, short enough to say in a breath, with its source on the page in a comment                                |
| `scene`   | a beat              | A scene the stage knows by name. DPoP's are `ask`, `spend`, `copy`, `steal`, `title`, `cast`, `refuse`, `caveat`, `recap`, `end` |
| `step`    | a beat              | A step of the flow, counted from 1. A second beat with the same number goes on telling it                                        |
| `head`    | a beat              | The heading for this part. A step takes its heading from the flow's own phases                                                   |
| `expands` | the `title` beat    | What the flow's short name stands for, as the flow's page words it                                                               |
| `carries` | a step's first beat | What the message carries, as the kinds in the table above. The step's label if left out                                          |
| `show`    | a step's beat       | Lines of the step's listing, each found by a piece of it, and `on`: the word at which it is marked                               |
| `gain`    | a step's beat       | The word at which the party comes to hold what the step gives it                                                                 |
| `check`   | a step's beat       | The word at which a check is seen to pass                                                                                        |
| `gloss`   | a step's beat       | `{ term, note, on }`: a word written under the listing at the moment it is said                                                  |

A word named in `on`, `gain`, `check` or `gloss` has to be in that beat's sentence, or the script stops and says so.

Once the script file exists, even with no beats in it, find out whether the flow fits the layout:

```bash
node scripts/flow-film.mjs --flow <slug> --layout fixed --beats
```

## Changing the design

- **A measurement** is a constant at the top of a stage file. **A style** is in the `<style>` block in `scripts/flow-film.mjs`. **A time** is in `LEAST` there, or beside the motion in a stage file.
- Change it for both looks, look at both, and change this guide in the same commit.
- A decision about manner, as against a measurement, is recorded in [Films](films.md), with its reason.
- Keep each cut on the page where the others are kept, with a line on what changed, so the owner can set one beside another.
