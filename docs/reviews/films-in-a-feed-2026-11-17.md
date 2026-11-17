# A film in a feed: 17 November 2026

A review of how a flow's film should be made for LinkedIn and X, where video plays in a feed, mostly on a phone and mostly with the sound off. It says what is proposed, what was found when the usual advice was checked, and what to do next. Nothing here has been built, and nothing has been posted.

[Films](../films.md) says how a film is told, and [the film design guide](../film-design.md) has its measurements. The film as it stands is cut 18 of DPoP: 1920 × 1080, 90 seconds, on paper, said in a clone of the owner's own voice.

## Proposal

One cut for both places, made from the film as it is. The owner has read this and has not yet said yes to it.

| Decision      | Proposed                                               | Why                                                                                                    |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Shape         | 4:5, 1080 × 1350, one file for LinkedIn and X          | LinkedIn's own specification recommends 4:5 for a tall video. X accepts it                             |
| Look          | Paper, as now. No dark cut                             | Nothing found tests matching a feed's theme, and dark letters on a light ground read better when small |
| Sound, words  | The voice, and each sentence written under the stage   | A feed starts a video muted, so the film has to make sense silent                                      |
| Length        | The 90 seconds it has                                  | Under X's 140 seconds for an account that does not pay. Nothing from either place asks for under 60    |
| Opening       | The question in large letters in the first frame       | A viewer can turn autoplay off, and the first frame is then all there is                               |
| Link          | In the post's own words, on both                       | X's people have said a link no longer needs to go in a reply                                           |
| Caption file  | None uploaded. LinkedIn's “Add auto captions” left off | A sentence written in the picture and a caption over it are the same words twice                       |
| Where to post | LinkedIn from a desktop browser                        | Only there can a picture be given for the video's cover                                                |

**The shape is the work.** The stage is laid out for 16:9, and shrunk into a tall frame its words are too small for a phone. A 4:5 cut is another layout: the parties arranged for a tall frame, larger letters, and the sentence in a band under the stage. Films already says so, under “What has not been decided”.

**The written sentence already exists.** A silent cut writes each sentence under the scene, and `--captions on` does the same with a voice. They are the film's own sentences, each short enough to say in a breath, and not headlines made for the feed: a film says only what its flow's page says.

**It is an exception to a rule the film holds to.** Said aloud, a film leaves the sentence off the picture. In a feed most people do not hear it, and for them the sentence is the only words there are. The reviews of video cited in Films already find the case against words said and written at once weaker for video than the principle says.

## What is not known

- **How X shows a 4:5 video in its feed.** Its documents do not say, and other accounts disagree. One post to try it settles it. If X crops it, a square cut is the next thing to make.
- **How many people on X use its dark theme.** No figure from X was found, and no survey worth citing. A dark look is a whole look to design and check, so the light cut is posted first and a dark one is a later experiment.
- **How LinkedIn shows each shape in its feed.** Nothing official says.
- **Whether a muted viewer reads the sentences or leaves.** The first posts are the first evidence, as Films says of every film.

## What was checked

The usual advice was gathered from an AI summary that cited marketing sites, and each claim was checked against the platform's own pages and against published research, on 17 November 2026. X's help pages refused to be fetched, so what is said of them here is from a search engine's extract of the official page and is marked so.

### LinkedIn

- **A member's video can be 15 minutes and 5 GB,** from 256 × 144 to 4096 × 2304, between 1:2.4 and 2.4:1, at 10 to 60 frames a second ([LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a7486279)). The summary's “10 minutes on mobile, 15 on desktop” is not on that page.
- **4:5 is the shape LinkedIn recommends for a tall video,** in its specification for video ads ([LinkedIn Help](https://www.linkedin.com/help/lms/answer/85306)). Nothing official says how each shape is shown in the feed.
- **The full-screen video tab is on phones only,** cannot be posted to, and names no shape or length a video must have to appear there ([LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a6290168)).
- **A caption file can be uploaded from a desktop browser only.** LinkedIn can also write captions itself, and they can be edited or taken off after posting ([LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a1327025)).
- **A picture for the cover can be uploaded from a desktop browser only.** There is no title: the post's words are all there is.
- **Light is the theme LinkedIn starts with** ([LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/126285)). How many people keep it is not published.
- **“Almost 80%” watch with the sound off** is LinkedIn's own figure, for video ads, with no method given ([LinkedIn](https://business.linkedin.com/advertise/resources/marketing-terms/video-ads)).
- **Safe areas:** LinkedIn says only to keep the edges free of what matters. The summary's “bottom 15 to 20%” has no official source.
- **Links:** no figure worth citing. Studies disagree on whether a post with a link is shown to fewer people, and by how much. The summary's “5 times the reach of a YouTube link” has no source that was found.

### X

- **An account that does not pay can post 140 seconds** (from an extract of [X Help](https://help.x.com/en/using-x/premium-longer-videos)).
- **X asks for H.264 High Profile, 30 or 60 frames a second, AAC-LC, and at least 5,000 kbps,** and re-encodes what it is given. It accepts shapes from 1:3 to 3:1 and recommends 16:9 and 1:1. It does not name 4:5 ([X developer documentation](https://docs.x.com/x-api/media/quickstart/best-practices), read in full). The film's own files are about 500 kbps, so a file for X is encoded again at a higher rate.
- **A caption file can be attached, and shows only to a viewer who has captions on** (from an extract of [X Help](https://help.x.com/en/using-x/upload-caption-srt-file)).
- **A link does not need to go in a reply.** Nikita Bier of X and Elon Musk both said so in July 2026, as the press reported it; their own posts could not be opened. The ranking code X publishes has no penalty for a link ([xai-org/x-algorithm](https://github.com/xai-org/x-algorithm), read at commit 30647a8).
- **“Under 60 seconds” has no source from X.** In that code a video counts toward a quality view only if it is longer than 10 seconds by default, and nothing in the scorer measures how much of it was watched. What X runs may differ from what it publishes.
- **The summary's “10 times the engagement”** is an old figure from Twitter's marketing, for a post with a video against one with none.
- **Safe areas and the cover:** X publishes neither.

### Research

Most of this was read from abstracts and summaries, and is marked where it was read in full.

- **Sound off.** The figures everyone repeats are old and self-reported: “85%” is a trade article of 2016 quoting publishers ([Digiday](https://digiday.com/media/silent-world-facebook-video/)). Nothing later and credible was found. Assume a feed viewer starts muted, and quote no number.
- **Words written in the picture, against captions a viewer turns on.** No study comparing the two was found. W3C accepts either, and says what the first costs: a viewer cannot turn them off, restyle or translate them, and they are not text a machine can read ([W3C](https://www.w3.org/WAI/media/av/captions/)).
- **Words said and written at once.** A review of video found the principle against it failed to hold in 8 of 13 papers ([Fyfield and others, 2022](https://ajet.org.au/index.php/AJET/article/view/7296), read in full). Captions help most those watching in a second language ([Noetel and others, 2022](https://doi.org/10.3102/00346543211052329)).
- **A word at a time.** One small study found it understood less well than ordinary subtitles ([the study](https://mdpi.com/2414-4088/8/6/51), read from a summary). Phrases, as the film writes them, are what the research on subtitles favours.
- **Dark or light.** Nothing was found on matching a feed's theme. Dark letters on a light ground are more legible, and more so as the letters shrink ([Piepenbrock, Mayr and Buchner, 2014](https://doi.org/10.1177/0018720813515509)).
- **Shape.** Small tests by vendors found a square or tall video seen more than a wide one in a feed ([Buffer](https://buffer.com/resources/square-video-vs-landscape-video/)). The direction is the same in each and the reason is plain, more of the screen. The size of it is not to be trusted.
- **Length.** Students stop watching a course video after about six minutes whatever its length ([Guo, Kim and Rubin, 2014](https://up.csail.mit.edu/other-pubs/las2014-pguo-engagement.pdf), read in full). That is of enrolled students and not of a feed. 90 seconds is short by any of these.
- **The first three seconds.** The claim comes from how Facebook counts a view and from research on ads it paid for. Nothing was found on whether to open with a question or an answer.

## What to do next

1. **Draw the 4:5 layout, and look at stills before any film is made:** the opening question, a step with its sentence, a step with a listing, the copy refused, and the end card. `--stills` makes them in about a minute each and costs nothing.
2. **Check the stills at the size of a phone.** A frame 1080 wide is shown about 390 points wide. A letter under about 28 pixels in the frame is too small.
3. **Make the cut** with the reading there is, `flows/dpop/readings/2026-11-16-kevin.mp3`. A new layout needs no new reading: a beat lasts as long as its clip.
4. **Make a cover for it,** in the same shape.
5. **Keep it** as the film's other cuts are kept, in the bucket and in `film-assets/index.json`, and record what was decided in [Films](../films.md) and [the film design guide](../film-design.md).
6. **The owner posts it.** One post on X first, to see how the feed shows 4:5.

## Turned down

- **A dark cut for X, for now.** It is convention and not evidence, and it is a look of its own to design.
- **A shorter cut for X.** Nothing from X asks for one, and the film's 19 lines are already its shortest telling.
- **Headlines in place of the film's sentences,** and words that appear one at a time.
- **A caption file as well as the written sentence.**
- **Cropping or shrinking the 16:9 film into a tall frame.**
