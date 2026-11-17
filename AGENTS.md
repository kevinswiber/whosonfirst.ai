# AGENTS.md

For a coding agent working in this repository. A person should start with [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## What this is

The source of [whosonfirst.ai](https://whosonfirst.ai), a field guide to agent authentication and authorization. It is a static site built with Astro. Most changes are to data files in `src/data/` and pages in `src/pages/`, and a change that makes the site say something untrue is worse than one that breaks the build.

[docs/development.md](docs/development.md) says where everything is, how each kind of content is edited, and what each check covers. Read the part for what you are changing before you change it.

## Commands

Node 22 or later. Install with `npm ci`.

| Command                  | What it does                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `npm run dev`            | The site, locally, rebuilt as files change                                                |
| `npm run fmt`            | Biome, writing its fixes: formatting, lint and import order                               |
| `npm run check`          | Biome, changing nothing                                                                   |
| `npm test`               | Types (`astro check`), the rating rule, the guide’s names, the contrast audit and sources |
| `npm run build`          | The static site in `dist/client/`. Refuses a broken cross-reference by name               |
| `npm run check:rendered` | Reads the built site, opens it in a browser and runs its Worker. Refuses an old build     |

`npm run check:rendered` needs Chromium (`npx playwright install chromium`) and takes under a minute. It does not build the site. Run the build first, and again after any change under `src/` or `public/`: on a build older than one of those files it stops and names the file. `npm run readme:figure` and `npm run social:assets` do the same.

The checks are tests for Node's own test runner, in `test/`. While working on one thing, run its file after a build, such as `node --test test/browser/print.test.mjs`. [docs/development.md](docs/development.md#checks) says what each directory holds.

## Before you say a change is done

Run all four, in this order, and fix what they report. Continuous integration runs the same four on every pull request.

```bash
npm run check
```

```bash
npm test
```

```bash
npm run build
```

```bash
npm run check:rendered
```

Do not weaken, skip or delete a check to get it to pass. When a check fails, its message says what is wrong with the content; the fix is nearly always there.

## Content

- **A fact has a source.** Do not write a revision number, a date, a status or a description of a product from memory: specifications in this area change monthly. Read the source, and add or update its link with the fact. If you cannot reach the source, say so and leave the fact as it is.
- **Status is worded as the About page defines it** (`src/pages/about.mdx`, “How status is worded” and “How flows are rated”). A flow’s `maturity` has to be what its required references give it: the rule is in `src/data/rating.ts`, and the build refuses a flow with `roles` that declares anything else. Do not raise one to make a flow look more settled.
- **A lesson simplifies and does not contradict.** The flow page or data file it rests on is named in a comment at the top of the lesson.
- **A comparison does the same.** It says only what its two flows’ pages already support. A fact neither page has goes on the flow’s page first, with its source.
- **Nothing essential waits behind a click, a hover or a script.** What a figure or a diagram shows is also on the page in words.
- **Vendors are described from their own documentation.** Mention is not recommendation.
- **An implementation or a deployment report is added by the procedure in [docs/implementation-research.md](docs/implementation-research.md):** start from `npm run implementations:coverage`, copy the passage that carries the claim from the source, and run `npm run implementations:check` on the worksheet before anything goes into `src/data/implementations/records.ts`.
- **A film says only what its flow’s page says.** [docs/films.md](docs/films.md) says how one is told and what has been decided about its manner. Read it before making one or changing how one looks or sounds, and change it when a decision changes. [docs/film-design.md](docs/film-design.md) has the measurements, the parts, the two looks and what to check on every cut.
- **Write as the site does:** plain words, short sentences, no selling. The site’s prose uses typographic quotes and apostrophes (“ ” ’), and its code does not.
- New flows, lessons and pages start as an issue, not a pull request. What the site leaves out is deliberate.

## Things that are easy to get wrong

- **Register what you add.** A flow goes in `src/data/flows/index.ts`, in the comparison table in `src/pages/flows/index.astro` and in the README’s list. A lesson goes in `src/data/learn/lessons.ts` and the README. A comparison of two flows goes in a file of its own in `src/data/comparisons/` and in `index.ts` there. A deployment guide goes in `src/pages/deployments/index.astro` and the README. A new section of the site goes in `SECTIONS` in `src/integrations/markdown-pages.mjs`. The build or the rendered check names most of these when one is missing, but not all: a flow file that `index.ts` does not import is not built and nothing says so, and nothing checks the list of deployment guides on their index page.
- **Imports in `.astro` files are not sorted,** and must not be: their order is the order of the styles. Biome leaves them alone.
- **A line break before an inline element loses its space.** In an `.astro` template, end the line before a `<strong>`, `<a>`, `<em>` or `<code>` with `{' '}`.
- **Nothing loads from another origin.** The content security policy in `public/_headers` allows this origin only. Do not add analytics, an embed, a hosted font or a CDN script.
- **No client-side framework, and no new dependency without asking.** Interactive pieces are small custom elements over HTML rendered at build time, and every page reads correctly with JavaScript off.
- **One thing runs when a page is asked for, and it stays one.** `src/worker.ts` chooses between a page and its Markdown copy by the request’s `Accept` header, and sends a file the build wrote. Do not give it anything else to do. How it reads the header is tested in `test/unit/markdown-negotiation.test.mjs`, and the site as it is deployed, in the Workers runtime, in `test/worker/`: a new rule for the header gets a case in the first, and anything the host decides gets one in the second. [docs/development.md](docs/development.md#markdown-at-the-pages-own-address) says what each level covers.
- **A sequence diagram’s Mermaid is written by the build,** from the drawing, into the page’s Markdown copy. Do not write one by hand. A new kind of message needs an arrow in `ARROWS` in `src/integrations/markdown-pages.mjs`, and the build stops until it has one.
- **Biome does not format `.mdx`.** Keep those files tidy by hand.
- **A new check is a test.** It goes in the file under `test/` for what it reads. A browser test opens a page with `open()` from `test/support/browser.mjs`, not with a fixed wait. Tests in a suite may share a page, but each sets up the state it needs and does not count on the test before it, so any one passes when run by its name alone. The content security policy sweep waits for network idle, longer than `open()`, and has to. Run suites side by side only where each has a page of its own and nothing waits on a clock.
- **A page’s address has no dot in it.** The speculation rules on every page take an address with a dot for a file and leave it alone. The one `.txt` file in `public/` with a name made of hexadecimal digits is the IndexNow key, not a stray: `npm run indexnow` needs it.
- **Generated files are not edited.** `dist/` is not committed. The films, and the readings and sounds they are made from, are in an R2 bucket and not in the repository: `film-assets/index.json` lists them and says which cut is the latest, and `npm run film:assets` fetches and sends them. The two pictures in `docs/images/` come from `npm run readme:figure`. The pictures for a post come from `npm run social:assets`, into `social/`, which is not committed either. `public/favicon.svg` and the files in `design/logo/owl/` are written by `node design/logo/generate.mjs`. `docs/source-validators.json` is written by `npm run sources:changed`: with `-- --record` at the end of a source review, and with `-- --add` after a link is added to the data.

## Branches, commits and pull requests

- **Branches** follow [Conventional Branch](https://conventional-branch.github.io/): a type, a slash and a short description in lowercase with hyphens, such as `feat/aauth-flow`, `fix/dpop-step-labels` or `chore/update-actions`. The types are `feat`, `fix`, `hotfix`, `release` and `chore`. There is no `docs` or `ci` branch type as there is for commits: that work goes on a `chore` branch. Name a branch for what it is for, not for the tool that made it.
- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/), with no scope: `fix: say which key the proof is signed with`, never `fix(dpop): …`. The types in use are `feat` for something a reader gains, `fix` for something that was wrong or unclear, `docs` for the repository’s own documents, `test` for the checks, `ci` for the workflows, and `chore` for the rest.
- **The subject says what the site now does,** in the imperative and in plain words, not which file changed: `feat: add a flow for AAuth, drawn with a person server`.
- **One change to a pull request,** titled as a commit would be. Pull requests are merged, not squashed, so every commit in one lands on `main` under its own subject and has to follow the rule. Say in the pull request which source the change follows.
- Do not commit to `main`, and do not rewrite history that has been pushed.
