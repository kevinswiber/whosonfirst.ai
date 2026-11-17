# Film assets

What the films of [whosonfirst.ai](https://whosonfirst.ai) are made from, and every cut made of them. The files are in the R2 bucket `whosonfirst-ai-films`, which is private. This directory is the repository's copy of that bucket, with the same names.

Only two files here are committed: this one and `index.json`. The rest are not in the repository. They are fetched from the bucket when they are wanted and sent to it when they are made.

## Why they are kept

- **A reading by a voice costs credits.** One reading of the DPoP film by an ElevenLabs voice was 1,434 credits. Cutting a reading into the film's lines again costs nothing, so the reading is what is kept.
- **A cut takes minutes to make,** and an old cut cannot be made again once the film's code has moved on. Earlier cuts are what a new one is set beside.
- **A cloud session's files do not last.** What is only in `social/` is gone when the session is.

## What is where

```text
index.json                 what every file is, and which cut of each film is the latest
README.md                  this file
shared/                    what more than one film uses
  room/                    the sound of a quiet room, to lay under a voice
channel/                   what the films are posted under
  youtube/                 the YouTube channel's banner and picture
flows/<slug>/              one film
  readings/                one recording of the whole film by a voice, each as it was made
    tests/                 short readings made to hear a voice, in no cut
  cuts/<number>/           one cut: the film, and what goes with it
    film.mp4               narrated, in the look that is usual
    film-flat.mp4          narrated, in the flat look
    film-silent.mp4        with each sentence written under the scene
    captions.vtt, .srt     what is said, while it is said
    description.txt        what to paste under it where it is posted
    cover.png              what shows before it is played, where a site takes one
    series/                the film as pictures, where it was made as a series
      01.png, 02.png …     a scene or a step to a picture
      alt.txt              what each picture shows, to give as its alt text
      series.pdf           the pictures as the pages of one document
```

A cut's number goes up by one each time the film changes. The same cut said by another voice, or tried another way, takes the number with a name after it: `09-matilda`. The same cut in another shape does too: `18-4x5` is cut 18 laid out at 4:5 for a feed.

## The index

`index.json` is the one place that says what the latest is. For each film it has:

- `latest`: the number of the cut that is the latest.
- `state`: in a sentence or two, what has been done with the film and what is still to decide.
- `readings`: each recording, with whose voice it is, the service and its settings, what it cost, and which cuts use it.
- `cuts`: each cut, with the day it was made, the commit it was made from, its layout, look and voice, what changed in it, and its files. The latest cut also has `made_with`, the commands that make it again.

A cut's `status` is one of four: `current`, `kept to compare`, `superseded`, or `before the film`.

Every file has its size and a hash, so a file that is fetched can be known to be the one that was sent.

## Working with it

```bash
node scripts/film-assets.mjs
```

Says which listed files are here, and whether anything here is changed or not listed.

```bash
node scripts/film-assets.mjs pull flows/dpop/cuts/10
```

Fetches what is under that, or everything if nothing is named.

```bash
node scripts/film-assets.mjs record
```

Writes each file's size and hash into the index.

```bash
node scripts/film-assets.mjs push
```

Sends what is new or changed, and then the index. The index is sent only when the bucket has every file it lists: a push of part of the store, or with a listed file missing here, sends the files and says which ones the bucket still lacks.

The bucket is reached in one of two ways.

- **With keys for this bucket alone,** where `CLOUDFLARE_AWS_ACCESS_KEY` and `CLOUDFLARE_AWS_ACCESS_SECRET` are set in the environment, with `CLOUDFLARE_S3_ENDPOINT` or `CLOUDFLARE_ACCOUNT_ID` to say where the bucket is. This is the way for a cloud session, where nobody can log in. The keys are made on the R2 page of the Cloudflare dashboard, under **Manage API tokens**, with **Object Read & Write** for this bucket and no other. They go through R2's S3 interface.
- **With Wrangler,** after `npx wrangler login`, on a person's own machine.

A key is never written in the repository, in a commit or in a message.

## When a cut is made

1. Make it, and look at it as [the film design guide](../docs/film-design.md#checking-a-cut) says.
2. Copy its files from `social/` into `flows/<slug>/cuts/<number>/`, under the names above.
3. Add the cut to `index.json`: what changed, the commit, the commands. Set the cut before it to `kept to compare` or `superseded`, and move `latest`.
4. Run `record`, then `push`, and commit `index.json`.

## Rules

- **Nothing is taken out of the bucket because it is old.** A cut that has been passed is marked so in the index.
- **A file is not changed in place.** A cut that is made again is a new cut, with a new number.
- **A reading is kept as it came,** not as the film cuts it. The cut lines can always be made from it.
- **What can be made again for nothing is not kept:** the voice's lines after cutting, Kokoro's lines, and stills.
- **Nothing here is on the site.** The site's content security policy allows only its own origin, and the bucket is private.
