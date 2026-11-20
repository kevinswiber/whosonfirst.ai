# Working on the site

How the site is built, where things are and how its content is edited. The [README](../README.md) is for readers; this is for whoever changes the site. [CONTRIBUTING.md](../CONTRIBUTING.md) says what a change has to meet.

## Develop

Use the latest patch release of Node 22, 24 or 26. The minimum on Node 22 is 22.23.4.

```bash
npm ci
```

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run check
```

```bash
npm run fmt
```

```bash
npm test
```

```bash
npm run check:rendered
```

`npm run check` runs [Biome](https://biomejs.dev/) over the repository: formatting, lint rules and import order. `npm run fmt` does the same and writes the fixes. `npm test` runs the site's own checks: types (`astro check`), the rating rule, the decision guide’s names, the color contrast audit and the list of sources. `npm run check:rendered` reads the built site, then opens it in a browser. It does not build the site: run `npm run build` first, and again after a change, or it stops and names a file that is newer than the build.

`npm run build` runs `cf build`, which invokes Astro and validates the deployable output in `.cloudflare/output/v1/`. The pages and other static files are under `workers/default/assets/` in that output. There is no client-side framework, and one small piece of code that runs when a page is asked for: a Worker that sends a page's Markdown copy to a request that asks for it, described under [Markdown at the page's own address](#markdown-at-the-pages-own-address). Interactive pieces are small custom elements that enhance HTML rendered at build time, so every page reads correctly with JavaScript off.

Once the pages are written, the build makes two more forms of each one from the page itself: a card for where its link is shared, and a copy in Markdown. See [Other forms of a page](#other-forms-of-a-page).

### Workers Builds

In the Cloudflare dashboard, set the production deploy command to `npm run deploy` and the preview command to `npx cf previews deploy`. Both commands build the site, so leave the separate build command empty. Set the build environment to a supported Node version. Coordinate the dashboard switch with landing the migration so production builds use the command available at their commit. [Cloudflare’s Workers Builds settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) describes these fields.

Run `npm run deploy -- --dry-run` to validate the production build locally. Run `npm run generate-types` to refresh the Worker declarations in `.cloudflare/types/`. The build output, generated types and local state under `.cloudflare/` are ignored by Git.

### Formatting and linting

Biome's settings are in `biome.json`. Two things about this repository shape them:

- **`.astro` files.** Biome reads only the frontmatter script. The template and `<style>` blocks are left as written, and `astro check` covers their types. Biome can format whole `.astro` files behind an experimental flag (`html.experimentalFullSupportEnabled`); it is off because the templates are whitespace-sensitive.
- **Import order in `.astro` files is not sorted.** Astro emits component styles in the order components are imported, so sorting the imports changes the cascade.

Biome does not handle `.mdx`, so the deployment guides and the About page are not formatted.

### Checks

The checks are tests for Node's own test runner, `node:test`, in `test/`. Each file runs in a process of its own, and several run at once.

| Directory       | What its tests read                                                      | Run by                   |
| --------------- | ------------------------------------------------------------------------ | ------------------------ |
| `test/unit/`    | The data, the color tokens and how a request is read. No build is needed | `npm test`               |
| `test/build/`   | The built site, as files                                                 | `npm run check:rendered` |
| `test/browser/` | The built site, opened in Chromium                                       | `npm run check:rendered` |
| `test/worker/`  | The built site, served by the Workers runtime as it is deployed          | `npm run check:rendered` |

What the tests share is in `test/support/`. `site.mjs` reads the built pages, and stops a test file when the build is older than its sources. `browser.mjs` serves the built assets with the site’s own headers and starts a browser, one for each test file. `worker.mjs` starts `astro preview` on the Cloudflare Build Output. It uses a free local port, runs without a Cloudflare account, and stops when the tests finish. The browser helper waits for the load event, the fonts and one drawn frame in `open()`. The content security policy sweep, `test/browser/csp.test.mjs`, waits longer, until a page has sent nothing for half a second. A script can ask for something from another origin a moment after the load event, and a request the policy refuses is never sent, so only the console shows it, and only once the script has asked. A browser test file fails at its end if any page it opened threw a script error or broke its content security policy, and names the page. `measure.mjs` holds the measurements made inside a page, and the thresholds they are held to. `mermaid.mjs` says whether a piece of text parses as Mermaid. It asks [mmdflux](https://github.com/kevinswiber/mmdflux), from the `@mmds/wasm` package, which reads Mermaid without a browser.

While working on one thing, run the test file for it. It still needs a current build:

```bash
node --test test/browser/print.test.mjs
```

Or run the tests whose names match a pattern. The pattern goes before the files:

```bash
node --test --test-name-pattern="sideways" "test/browser/*.test.mjs"
```

Before a pull request, run the four commands [CONTRIBUTING.md](../CONTRIBUTING.md) names. Continuous integration runs every check on every change, because a change to any file under `src/` can move what some page draws.

A new check is a test in the file for what it reads. Tests in a suite run in order and may share a page, but each sets up the state it needs: it opens the page, or does the clicks and key presses itself, and does not count on a test before it. So any test passes when it runs by its name alone, as the pattern above runs it. A file can run suites side by side with `{ concurrency: true }`, as the files that measure every page do. It does that only where each suite has a page of its own and nothing waits on a clock, and each suite inside then sets `{ concurrency: 1 }`, since a suite's tests take its setting.

### Continuous integration

`.github/workflows/ci.yml` runs the same commands on every pull request and on every change to `main`, as two jobs side by side: Biome, then `npm test`; and the build, then `npm run check:rendered`. It needs no secret and deploys nothing, so it runs the same on a pull request from a fork.

`.github/workflows/indexnow.yml` is not a check. It runs after a push to `main` and tells search engines which pages changed: see [Telling a search engine that a page changed](#other-forms-of-a-page).

The workflow names each action by commit, not by tag. `.github/dependabot.yml` opens one pull request a month when those have moved.

## Where things are

| Path                                   | What                                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/data/learn/lessons.ts`            | The lessons, in order: the question each answers, the terms it teaches, where to go deeper         |
| `src/pages/learn/*.astro`              | One file per lesson: its text, its figure and its questions                                        |
| `src/layouts/Lesson.astro`             | The shape every lesson shares                                                                      |
| `src/components/Scenario.astro`        | A lesson's figure: a small cast, one thing that varies, the same questions asked of each variation |
| `src/components/Check.astro`           | Questions with feedback that says why                                                              |
| `src/components/Here.astro`            | The line under the site header that says which page this is, on the long pages                     |
| `src/data/learn/api-sees.ts`           | Lesson 1's figure                                                                                  |
| `src/data/flows/*.ts`                  | One file per flow: participants, steps, example messages, cautions, and its overview               |
| `src/components/FlowOverview.astro`    | “In short” and “Who does what”, before a flow's diagram                                            |
| `src/data/comparisons/*.ts`            | One file per comparison of two flows: the answer, what decides it, a figure and the points         |
| `src/pages/compare/[pair].astro`       | The shape every comparison shares                                                                  |
| `src/lib/gloss.ts`                     | Marks the first use of each glossary term and named standard, so what it is can be shown in place  |
| `src/data/standards.ts`                | The standards tracker                                                                              |
| `src/data/history/`                    | What happened to each standard, and when the site reported it                                      |
| `src/data/tokens.ts`                   | Annotated example tokens for the token inspector                                                   |
| `src/data/guide.ts`                    | Questions and rules for the decision guide, and the four cases it names                            |
| `src/lib/guide-rules.ts`               | How answers become recommendations and a name: the guide’s script and each case’s page use it      |
| `src/data/glossary.ts`                 | Glossary terms                                                                                     |
| `src/data/site.ts`                     | The "last reviewed" date shown across the site, who makes it, and where the source is              |
| `src/integrations/page-dates.mjs`      | Reads the repository's history when the site is built, so each page can say when it last changed   |
| `src/lib/page-sources.ts`              | What each page is made from, file by file and entry by entry, and so which dates are its own       |
| `src/integrations/social-cards.mjs`    | Draws each page's card for where its link is shared, and the home-screen icon                      |
| `src/integrations/markdown-pages.mjs`  | Writes each page again as Markdown, and `llms.txt` and `llms-full.txt` from those                  |
| `src/worker.ts`                        | The Worker in front of the pages: sends a page's Markdown copy to a request that asks for it       |
| `src/lib/markdown-negotiation.ts`      | Reads an `Accept` header as RFC 9110 defines it, and chooses between a page and its copy           |
| `cloudflare.config.ts` (Worker config) | Names the Worker, its asset binding and the routes it handles                                      |
| `src/components/FlowDiagram.astro`     | Sequence diagram and step-through panel; a step narrative on a phone                               |
| `src/data/verify.ts`                   | “What can the API verify?”: two credentials, four checks, and the wording of each verdict          |
| `src/components/VerifyDetail.astro`    | The full comparison, on the Concepts page                                                          |
| `src/components/LastHop.astro`         | The same question across a longer chain, on the Concepts page                                      |
| `src/components/DocMeta.astro`         | Page facts: one line for the specification followed and the review date, the rest in a disclosure  |
| `src/components/K8sIdentityMap.astro`  | Kubernetes identity layers diagram                                                                 |
| `src/pages/deployments/*.mdx`          | Long-form deployment guides                                                                        |
| `docs/source-review.md`                | What goes out of date, where to check it, and where each fact has to be changed                    |
| `docs/implementation-research.md`      | How an implementation or a deployment report is found, checked and added                           |
| `README.md`                            | What a visitor to the repository reads first: what the site is and where to start in it            |
| `scripts/readme-figure.mjs`            | Draws the picture at the top of the README from the built site, in each theme                      |
| `scripts/implementation-coverage.mjs`  | Says which parties of each flow have no implementation recorded, and what else is thin             |
| `scripts/implementation-check.mjs`     | Checks a research worksheet, and asks each source whether it still has the passage an entry quotes |
| `scripts/built-site.mjs`               | Stops a script that reads the built site when the build is older than its sources                  |
| `test/`                                | The checks, as tests: see [Checks](#checks)                                                        |
| `AGENTS.md`                            | What a coding agent working in this repository needs to know                                       |

## Implementation evidence

`src/data/implementations/records.ts` holds reviewed implementation support, named deployment reports and scoped observations separately. `model.ts` validates their sources, units, dates and event references; `index.ts` admits accepted evidence for published flows. The overview at `/implementations/` includes every published flow in the existing group order. Each flow is one bordered record: title and review metadata, evidence sections, then navigation links. It follows the standards tracker’s heading sizes, quiet metadata, dashed dividers and footer spacing. Its summaries link to complete records at `/implementations/<slug>/`; only reviewed profiles generate those pages. Mechanism guides place a short summary at `#implementation-evidence`, after standards and before related flows. A missing profile means “Not reviewed”.

The directory and flow guides show every reviewed implementation and deployment summary, without a fixed limit or entry counts. Links to complete records are labeled “Sources and review details”. On flow guides, that link sits directly below the section heading; review dates, coverage explanations and empty-category messages stay on the directory and full records. Flow guides use cards and the directory uses compact lists, both with visible roles or deployment settings and links to exact evidence entries. Card footers identify each entry as an implementation or deployment report. Keep the published `#field-…` record fragments and the flow summary’s `#in-the-field` alias so existing links still work. Preserve entry IDs across views; a product name alone does not identify a role or report. An empty deployment list means no report is included in the record, without claiming that none exists or was sought. Overview search must index all accepted entries and show a direct evidence link for an entry match. A query that combines a product and role must match them in the same entry. Full record pages render all sources, limits and dated changes without scripts, pagination or disclosure controls. A specification named in an entry's text previews its tracker entry, as [Design](#design) describes for every page; an entry's text is plain, and is escaped, not formatted. Their Markdown copies carry the same evidence.

Compact entries carry the existing release label whenever the implementation is preview or experimental. An optional `qualification` summarizes a material compatibility or availability condition already supported by the entry’s sources and full text. Keep it brief and preserve uncertainty: an unverified revision is not an incompatible revision. The same component supplies flow cards, directory examples and search results. Every entry shows its `summary` in all three views as well as the full record. Keep the summary short and source-backed; when it already states a qualification, keep that fact once in the summary. Remaining qualifications add material limits without repeating the description. Update a qualification with the source fact it summarizes.

During an entry search, matching entries replace the ordinary directory summaries and show their roles, qualifications and evidence kinds. Flow identity and onward links remain. A flow-description-only match keeps its overview; clearing the search restores the selected groups’ overviews. The six flow-group filters follow Standards: a sticky desktop sidebar and a labeled disclosure on narrow screens. Multiple selected groups are combined, then intersected with search; none selected means all flows. Each group’s count is the number of flows matching the text search before group selections are applied, counting a flow once even when several entries match. All six filter choices remain visible and selectable at zero; clearing the text restores their totals. Query and group selections are restored from the URL. A flow fragment reveals its record even when filters would hide it. Print always uses the complete unfiltered overview. Parameterized implementation records also join the sitemap from the published profile list; the built-site checks compare sitemap coverage with every indexable page.

[Implementation research](implementation-research.md) is the procedure for adding to the records: where to look, in what order, what a source establishes, and how a candidate is checked and read a second time before it is accepted. It starts from `npm run implementations:coverage`, which lists each flow’s parties and the entries that fill them. An implementation entry’s `parties` names the participants of the flow’s diagram that the product fills, by `id`, and the build refuses one the flow does not have. They are what the coverage report counts, and they are not shown on the site. A source can carry a `quote`, a short passage copied from it that carries the claim, with the `section` it is under. `npm run implementations:check` fetches each quoted source and says whether the passage is still there. Sources added before 14 November 2026 were read again on 19 November and given quotes. Four of them refuse the check’s request and can be read only in a browser; [that run’s log](adoption/research-2026-11-19.md) names them.

Before adding a claim, read its primary source and record the exact product or operator, role, release wording, limitations and review decision. Keep source publication and evidence-added dates separate; preserve earlier evidence-added dates on re-review. A release or report event must cite evidence of the right kind with a matching source date. New event types or different date semantics need an explicit source model first. Nothing derives production use from advertised support, projects or certification.

See [the initial evidence review](adoption/evidence-review.md) for scope and exclusions. Implementation evidence sources join the existing source inventory; run `npm run sources:changed -- --add` after reading new sources. A quote or retrieval check cannot replace review of what a source actually establishes. `test/unit/implementations.test.mjs` checks publication boundaries and `test/browser/implementations.test.mjs` checks scriptless reading, search and print.

## Editing content

Most changes are data changes.

**Add or change a flow.** Edit or create a file in `src/data/flows/` and register it in `src/data/flows/index.ts`. Arrow labels wrap onto two lines automatically; the build warns if one is still too long. Add the flow to the comparison table in `src/pages/flows/index.astro`, or the build will tell you to.

A flow's `title` is the heading on its page. Where that heading does not carry the name people type for the flow, as “OAuth access tokens bound to a TLS certificate” does not carry “OAuth mTLS”, give a `searchTitle`: the title with that name added. It is what a search result, a browser tab and a shared link show, and the card is drawn from it. Add no claim to it that the page does not make. A short name that is also something else, such as “DPoP” or “CIBA”, finds little without the words beside it, so the name alone is not a title. A lesson and a deployment guide take a `searchTitle` the same way. A flow's description for a search result is put together from its `tagline`, the specification it follows and its count of steps, in `src/pages/flows/[slug].astro`; nothing is written for it.

A flow that is a pattern more than a protocol can keep its steps general and add two optional sections: `comparison`, how the pattern appears in different settings, and `example`, one setting worked through with its own listings. A comparison is drawn as a table on wide screens and as one block of labeled fields per row on narrow ones, both from the same data, so its text must not refer to rows or columns. The parts of an example are not numbered, because "a numbered step" means a step of the diagram when references are classified.

Further sections of the same form go in `sections`, after the example: for instance what a receiving system still has to decide, or documented implementations. A part can carry `tags` (whose product it is, its release stage, what kind of example it is) and `sources` (the documents it is drawn from, linked by title). A section with `afterNotes: true` appears after the cautions and notes, so dated source reviews can close the explanation. A product's release stage is a tag on the part. It is not the flow's maturity rating, which comes from the standards the diagram's flow requires.

If such a flow's diagram draws one arrangement among several, say so in `illustrated`: `steps` is shown above the diagram, and `references` beside the required references. The page then labels its basis, its required references and its rating as those of the flow the diagram draws. Optional `preconditions` render as a list before step 1, and `examples` explains how to read the listings.

A flow can also supply `credentials`: a short introduction and a list of tokens with their type, issuer, recipient, meaning and key binding. `FlowCredentials.astro` renders these before the overview, as a two-column reference on wide screens and one column on narrow screens. Keep the same facts in the steps; this is a reading aid, not a second source of protocol rules.

**Compare two flows.** Some flows are asked about in pairs, because either could do the job: “DPoP or mTLS?”. A comparison answers that at `/compare/<a>-vs-<b>/`. It is written, as a lesson is, in a file of its own in `src/data/comparisons/`, registered in `index.ts` there. `types.ts` says what one holds, and every comparison has the same shape, which `src/pages/compare/[pair].astro` supplies:

- `answer`: the answer, in two or three sentences. The page opens with it.
- `gist`: what the choice is between, in a line, for the card on `/compare/`.
- `shared`: what the two have in common, before what sets them apart.
- `choose`: for each flow, the conditions that make it the one to choose. Each has to decide between the two. A condition that is true of both belongs in `shared`.
- `figure`: the same situation met both ways, with the same questions asked of each. It is the lessons' figure, `Scenario.astro`, with the two flows as its two choices, so it works with no script and is also a table. Ask each question so that “yes” is the answer a reader would want, and keep it short: it heads a column of the figure's table. A comparison's answers run to a sentence or two where a lesson's are a line, so the page asks for the figure's `roomy` form, which puts the listings side by side and the answers beneath them at the figure's full width. What each side shows is the flow's own listings, named by step: a comparison does not write a message a second time.
- `points`: the same aspect of each flow, one row to an aspect, with the steps of each flow that show it. The page adds what each flow follows and how settled that is, from the flows' own data.
- `mixup`: a mistaken belief the question is often tangled up with, and the correction.

A comparison is in the site's own voice. It states what the two flows' pages establish and links to them; it does not quote them or say what a page says. It simplifies and does not contradict: **every statement in a comparison has to be one its two flows' pages already support, or carry its own source.** When a comparison needs a fact that neither page has, add it to the flow's page first, with its source, and then say it here. Write it with both flows' data open, and check each sentence against them before it goes in. `npm test` holds a comparison to its shape, to steps its flows have, and to fairness: either each flow comes out ahead on some question of the figure, or the two are level on every one. A figure in which one flow is never the better answer is an argument, not a comparison. `npm run check:rendered` checks that the figure's listings are the flows' own.

A comparison is linked from where its question comes up, and most of that needs nothing done. Each of its two flows links to it in its opening, among the “ways in”, and with a card beside its related flows. The decision guide names it under “Which of the two?” whenever its answer brings up both flows, and a case's page does the same for the flows it starts with. The footer of every page links to `/compare/`. Two places are written by hand: where a flow's own text already raises the question, as the device grant's note “Device flow or CIBA?” does, add a link there; and a lesson whose “Go deeper” leads to both flows should lead to the comparison too, in `deeper` in `src/data/learn/lessons.ts`. `npm run check:rendered` fails on a lesson that leads to both and not to it.

Compare two flows only where a reader really has to choose between them. Two flows that do different jobs are not a pair, however often their names appear together. Keep the list short: a page for every pair of flows, or for every combination of the decision guide's answers, would be pages made for a search engine, which Google's [spam policies](https://developers.google.com/search/docs/essentials/spam-policies) call scaled content abuse. A comparison is a new page, so it starts as an issue.

**Every flow has an overview.** Four fields say what a reader needs before the diagram, and the build refuses a flow without the first three:

- `phases`: the steps in three to five plain parts, each with the number of the step it starts at. They are listed as "In short", drawn as headed bands in the diagram, and named above each step.
- `parts`: what each party has to do, by participant id, in a sentence or two. A protocol page mostly describes other people's work; this is where a reader finds their own.
- `lesson`: the lesson that teaches the flow's idea in plain words first.
- `like`: for a flow that is another flow with a difference, which flow and what differs.

They restate the flow's own page. Do not put a fact in an overview that the page does not already support.

**Add or change a lesson.** A lesson is a page in `src/pages/learn/` using `layouts/Lesson.astro`, registered in `src/data/learn/lessons.ts`. The order there is the reading order. Every lesson has the same shape, and the layout supplies most of it: the question, where the lesson sits among the others, the text and its figure, questions to answer from memory, what to keep, the names for what was taught, and where to go deeper.

- A lesson may teach only terms that are in the glossary. `teaches` lists them, and the build checks each one.
- Its figure must make its point in the state it first shows, and `glance` adds a table of every variation beneath it. Most readers never click.
- A lesson simplifies; it must not contradict. Each lesson names, in a comment, the flow or data file that holds the full account.
- A figure compares approaches, and a reader can take a comparison for a menu. Give an option that must not be built an `avoid` sentence: the figure then puts a warning sign on its button, says "do not build this" with the reason in its panel, and marks its row in the table. Keep it for what is dangerous, not for what is merely weaker: a comparison where every option is something people really build teaches more than one with a hazard sign on it.
- A lesson's one hard rule, a "never", goes in `keep` as `{ rule: "…" }`. It is shown beneath the ideas under its own label, "One rule", with a red edge. At most one a lesson: the build refuses a second.
- A question's right answer must not stand out by where it sits or how long it is. Write each wrong answer as a belief a reader could really hold, at about the length of the right one, and vary which comes first. `npm run check:rendered` counts both across all the lessons.

**A line break before an inline element loses its space.** In an `.astro` template, text that ends a line followed by `<strong>`, `<a>`, `<em>` or `<code>` on the next runs into it on the page. Write `{' '}` at the end of the first line. `npm run check:rendered` finds any that slip through.

**Add or update a standard.** Edit `src/data/standards.ts`. Flows refer to standards by `id`. The first standard a flow lists is shown at the top of its page as the primary specification, with its status and revision, so list the one the flow follows most closely first. A pattern that no specification defines sets `noBasis` to a few words saying so, and its page names no primary specification.

The lookup on the tracker searches an entry's name, reference, summary, notes and `otherNames`. Give an entry `otherNames`, a list of strings, for a name people type that its text does not contain: an abbreviation such as “mTLS”, or a common short form such as “device flow”. Case, spaces and hyphens do not matter, so give each name once. The names are searched and not shown, and are data on the entry for any later search to read. Add only a name that is really used for that thing, and not one the text already has. `npm run check:rendered` types a list of names into the lookup (`TYPED_NAMES` in `test/browser/standards.test.mjs`), each of which must find an entry: add a name there when you add one here.

A fact about another document goes in the entry's `related`, not in its `detail`, and so does a second page one of the entry's facts is read from. Each item has a `kind`, which the tracker shows as a label: `updated-by`, `version` (a later one), `companion`, `replaces`, `builds-on` or `source`. A `note` of one short sentence is for what the kind does not say, such as the document's stage and date. A document with its own entry is named by `entry`, that entry's `id`, and the tracker links to it; the build fails on an unknown `id`. Any other is given a `name` and the `url` of the document itself, which is the source for the note. The tracker shows the list under “Related”, and the lookup searches it. `docs/source-review.md` reads the same list, so a link is written once.

Every link in the data has an entry in `docs/source-validators.json`, and `npm test` fails on one that has none. After adding a link, to an entry, to its `related` or to a flow's `sources`, read the source and run `npm run sources:changed -- --add`. If its host is new, add it under “Domains a run needs” in `docs/source-review.md`: the same check asks for that.

**Record what happened to a standard.** `src/data/history/` is a log of events: a revision published, a document adopted, a last call opened or closed, a step in its body’s process, an approval, a publication. Each has the date it happened and the day the site recorded it, a summary and its source. The log is written in the order the site learns things, one file for each month of recording, so a file’s diff is the changelog of the site’s reporting. `src/lib/history.ts` says what an event holds, checks the log, and reads from it a document’s history, its versions and where it stands now. A clarification or an edit to the site’s wording is not an event. An event recorded wrongly is corrected in place, with `corrected` saying when and what.

The tracker reads an entry’s status and its status line from the log. An entry in `standards.ts` states neither: the status is the one the latest event sets, and the line is the current version, the latest `standing`, and the entry’s own `detail`, which holds only a note that lasts. The tracker words a draft’s name and an RFC’s month itself (“draft-ietf-oauth-v2-1-17, October 2026.”): a version is written as its body writes it, and the IETF names a draft in full. Any other version is named by `standing`, so an event that publishes one has to state it.

Every tracker entry has a baseline in the log: where it stood when its record began. `npm test` runs `test/unit/history.test.mjs`, which fails on an entry without one. A page that shows a standard is dated by what the log records for it; “When a page last changed”, under [Other forms of a page](#other-forms-of-a-page), says how. The commits that set the log up are in `.git-blame-ignore-revs`, because none changed what a page says. The design is on [issue 147](https://github.com/kevinswiber/whosonfirst.ai/issues/147).

The log is shown on two pages, both drawn by `src/components/HistoryList.astro`: `/standards/timeline/` lists the events by the month they happened, and `/standards/changes/` by the day the site recorded them. A baseline is on neither. They need no upkeep: an event added to the log appears on both. The changelog is also an Atom feed at `/standards/changes.xml`, written at build time by `feedOf` in `src/lib/history.ts` and given its type in `public/_headers`. An entry’s id is made from its event’s entry, date and kind, so changing any of those on a recorded event gives a feed reader a new entry. An entry is dated as the changelog dates it: `published` is the day the site recorded the event, and `updated` is that day or the day of a correction. An event is often recorded long after it happened, and an entry dated by that would go among what a reader read long ago, so when it happened is in the entry’s content instead. An entry’s content is the event as the timeline shows it, in HTML: the same text through the same `inline()`, and the same links, from `eventLinks`. Its summary is what happened, as plain text, for a service that posts one line and a link. Two categories give the kind of event and the tracker entry, under the schemes `tag:whosonfirst.ai,2026:standards/kind` and `tag:whosonfirst.ai,2026:standards/entry`, so a reader or a script can keep to some of them. `test/build/forms.test.mjs` checks every entry against the timeline.

**Record what one specification cites of another.** `src/data/history/citations.ts` lists each citation from a version of one document to a version of another, as `<entry>@<label>`, with the citing document as its source. A label is the one the log gives the version, so a citation of a revision the log does not have is refused, and the fix is the event that published it. Whether a cited revision is still current is not written down: `readCitations` in `src/lib/history.ts` works it out from the log, the tracker shows it on both entries under “Related”, and `npm run standards:citations` lists it for a review.

**Classify a flow's references.** A flow can give each standard it lists a role in `roles`: `required`, `optional`, `background` or `unresolved`. Its rating is then that of its least mature required reference; the rule is on the About page under "How flows are rated" and in `src/data/rating.ts`. If the flow implements more than one specification, name them in `basis`. The build fails if a flow with `roles` leaves a listed standard unclassified, has a basis that is not required, or declares a `maturity` other than the one its required references give it.

A flow that requires none of its references is not rated: its `maturity` is `unrated`, shown as “Not rated”. It names no basis and says what stands in its place in `noBasis`, as the credential broker does, and the build refuses one without the other. Do not add a reference as required only to give such a page a rating.

A reference marked `unresolved` is not counted and is not assumed to be optional. If it is less mature than the rating, or has no recorded level, the flow is shown as provisional (for example "Stable standards (provisional)") until it is classified. A project, platform or guidance entry has no level from its status alone: state one in `level` on its tracker entry, with the evidence, or the build refuses to rate a flow that requires it. An entry of any other status can state a `level` too, where its maintainers say the part it covers may still change: MCP's URL-mode elicitation is in a published revision that says its design may change, so its entry is `final` with `level: "emerging"`. Use it only to lower what the status shows, and only from the maintainers' own words. `npm run check:rating` exercises these cases.

**Cross-references are checked at build time.** A flow that names an unknown standard or related flow, or a decision-guide rule that names an unknown flow or answer, fails the build. Every catalog flow needs at least one rule in `src/data/guide.ts`. Use the target question for the interface being called and the boundary question for who runs it and which identity system it trusts.

**The guide names four cases.** A name comes from the first two questions alone, whose authority and whether a person is available, so every combination of answers has exactly one: `test/unit/guide.test.mjs` walks all of them. The names are in `cases` in `src/data/guide.ts`. They are the site’s own, and the guide says so wherever it introduces them. A name must not be a term the glossary defines, which the same test checks. A name describes one piece of access, not the agent, and is plain words, not a figure of speech. Each has a page at `/guide/<slug>/`, built by `src/pages/guide/[case].astro` from the rules, with no script. The guide’s script answers for the answers it has. A case’s page is read ahead of the others, so it lists every “start” rule and every caution that could still apply, each with the answers it applies to: `possibleStarts` in `src/lib/guide-rules.ts`, which the script’s `recommend` sits beside. `test/unit/guide.test.mjs` answers the other questions every way there is and fails if the guide would start with a flow, or give a reason, that the page does not have. Changing a rule changes both. A new name is a new page, so it starts as an issue.

**The README lists what the site has.** It is written for a reader of the site, not of the code: it links to every lesson, flow and deployment guide and says how many lessons and flows there are. Add a new one there too. `npm run check:rendered` fails if the README leaves one out, miscounts, or gives an address the site does not have.

The picture at its top is the DPoP flow's diagram as built. After a change to how diagrams are drawn, make it again and commit the two files in `docs/images/`:

```bash
npm run build
```

```bash
npm run readme:figure
```

The script reads the build and does not make it. If anything under `src/` or `public/` has changed since the site was built, it stops, names a file and draws nothing: the two pictures are committed, and one taken from an old build would put the diagram as it was at the top of the README.

**When you re-verify the standards**, follow `docs/source-review.md`. It lists what to check and how often, and every place the review date and a changed fact have to be updated, starting with `REVIEWED` in `src/data/site.ts`.

## Design

The site takes the structure of an Internet-Draft, not its typewriter: fine rules, link blue, compact metadata and numbered sections. Titles, metadata and anything literal are in IBM Plex Mono; reading text is in IBM Plex Sans at 17px.

| File                            | What                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `src/styles/tokens.css`         | The values: every color as a light and dark pair, the type stacks, sizes and radii |
| `src/styles/global.css`         | The rules that are not specific to one component                                   |
| `<style>` in each `.astro` file | That component's own rules                                                         |

`/styleguide/` shows the tokens, type, components and diagrams as rendered, with live contrast ratios.

**Light and dark.** The page follows the system setting, and changes with it while open; that is CSS alone (`color-scheme` and `light-dark()`). The button in the header picks the other theme. That choice is remembered only until the system setting next changes, so the site never stays stuck opposite to the system.

**The mark.** An owl with its head on one side, looking up and across. It is drawn by `design/logo/generate.mjs`, which writes `public/favicon.svg` with its light and dark colors, the files for Adobe Illustrator in `design/logo/owl/`, and a page that shows the mark at its sizes, to look over: run `node design/logo/generate.mjs` and do not edit the icon by hand. The header, the cards and icons the build makes, and the pictures for a post, read `public/favicon.svg`. The header colors it from the `--mark-` values in `src/styles/tokens.css`, so that it follows the theme a reader picks; the icon carries the same values for the tab, and `npm test` fails if the two differ or if a part of the owl falls below 3:1 against what is behind it. Its body is dark on every ground, and a grey on a dark one: turned pale, it is a ghost. Every shape has to sit inside the drawing's box: one that runs past the edge is cut off flat wherever the mark is shown, and `npm run check:rendered` fails if any does. It is mostly seen small, 16 pixels in a tab and not much more in a picture on a phone. Before changing the drawing, look at it at 16 pixels.

**Fonts.** The four font files every first screen needs (Plex Sans 400 and 600, Plex Mono 500 and 600) are preloaded from `src/layouts/Base.astro`, so they download alongside the stylesheet and the text does not paint in a fallback font and then change. If one is still late, `IBM Plex Sans Fallback` in `src/styles/global.css` stands in: Arial scaled to Plex Sans's measurements, so the swap does not move the text. If you change which weights the first screen uses, change the preload list to match; a preloaded file that is not used is a wasted download.

**A long page says where the reader is.** Lessons, flows, deployment guides, the guide’s cases, Concepts and About carry a line under the site header: the trail to the page, the page's short name and, with the script, the section scrolled to. That section is a button: pressing it lists the page's sections, which is how a reader gets to another one on a phone, on a lesson or on a flow, where no contents list fits at the side. It stays in view with the header, and takes the place of the small label above the title. A layout passes `here` to the base layout to get one. Its height is `--here` in `global.css`, which anything that sticks below the header, and the allowance for a jump to an anchor, add on. A jump within a page glides; arriving from another page at a section far down does not.

**The next page is loaded ahead of the press.** Every page carries speculation rules, an inline script of the type `speculationrules`, in `src/layouts/Base.astro`. A browser that reads them starts loading a page of the site when the pointer rests on a link to it, so the page is there when the link is pressed. Only Chromium reads them so far; any other browser does nothing. The rules name pages and not files, by leaving out any address with a dot in it, so no page's address may have one: `npm run check:rendered` says so. The content security policy allows the rules because it allows inline scripts, and `test/browser/reach.test.mjs` asks the browser whether it took them.

A fade from one page to the next (`@view-transition`) was tried and left out: Chromium threw a script error on the page arrived at.

Nothing essential waits behind a click. A figure shows a complete answer in its first state, a lesson's comparison is also a table, and a definition that opens in place is a link to the glossary first.

**One preview for one word.** A glossary term and a document in the standards tracker are marked the same way, with a dotted underline, the first time they appear in a reading, and both preview in place. A concept is the glossary's, even when one specification defines it: “DPoP” and “token exchange” are glossary terms, and a term with a `standard` in `src/data/glossary.ts` also shows that document's status and identifier, on the glossary page and in its preview. What is marked as a document is a name that is not a glossary term: an RFC number, and the names in `NAMED` in `src/lib/gloss.ts`, matched only as the tracker writes them. A name that is also used for a mechanism in general, such as “token introspection”, is not listed; authors link the uses they mean. A document's number right after a term that names it is not marked again. A flow's implementation record (`/implementations/<slug>/`) is read entry by entry, since a reader often arrives at one from a link to it: each entry marks every specification it names, once, whether or not the flow lists it. The general terms all its entries share are marked once on the page. The directory and a flow's evidence cards mark nothing; they are summaries that link to the record, and a card is itself a link. A name with capitals inside a word, such as “DPoP”, is matched only as written, so `dpop()` is not the term. A term that is part of a longer name meaning something else is not marked there: a “client certificate” is a TLS client's, not the OAuth client the glossary defines. `NOT_BEFORE` in `src/lib/gloss.ts` lists what may follow a term to make it so, and `npm run check:rendered` fails on a page that marks one.

Pages put the task first. A page opens with what it is for, then the thing the reader came to do; supporting facts (sources, method, classification) sit behind a labeled disclosure, and history follows the lookup it belongs to.

Three rules hold throughout:

- **Color in a diagram means role.** User, agent, authorization server, resource server and infrastructure each keep one color. The kind of message (direct call, response, through the browser, out of band) is carried by the line style.
- **Nothing is dimmed with opacity.** Steps before and after the current one use the muted text color, which the audit holds to 4.5:1.
- **Buttons are boxes, links are underlined, metadata is neither.**

Two checks cover this:

- `npm test` includes a token audit (`test/unit/contrast.test.mjs`) that fails if any declared text pairing falls below 4.5:1 in either theme.
- `npm run check:rendered` (after `npm run build`, the tests in `test/build/` and `test/browser/`) first reads every built page: each internal link leads to a page and each anchor to something on it, no word runs into the inline element after it, every lesson is listed, every page has its card, its Markdown copy and structured data that parses, a sequence diagram is in its page's copy as Mermaid that parses and agrees with the list of steps, `llms.txt` lists every copy, the README names every lesson, flow and deployment guide and every address it gives is on the site, the right answer to a lesson's questions cannot be guessed from its place or its length, a figure choice that must not be built is marked on its button, in its panel and in its table, and the response headers are in place. Then it loads every page under those headers and fails if one breaks its own content security policy. Then it opens the site in a browser and measures what is drawn: contrast and size of every diagram label in each step state, size and line length of running text, sideways overflow (also at 320px, on every flow and every lesson), accessibility violations (axe-core, WCAG 2.1 A and AA), and whether the things a reader depends on are present and work:
  - halfway down a long page the header still says which page it is and, on a wide screen, which section; a short page has no such line
  - the home page's figure makes its point before a click, fits about one screen and switches; there are three ways in; every lesson is listed in order; both answers to "whose authority" appear before either list of flows
  - a lesson's figure shows one complete variation, the table beneath covers them all, a choice changes what is shown, no explanation appears before an answer is chosen, each question has one right answer, and the page runs in the order every lesson shares
  - a flow's overview comes before its diagram and agrees with it, a part's link brings the diagram into view at its first step, and a glossary term shows its definition inside the window and puts it away again
  - each page's review date and specification are on its first line of facts with the rest behind a disclosure, the standards lookup precedes its history, the phone menu opens from the keyboard and shows every destination, the phone flow page reads as a narrative with the diagram on demand and easy to leave, opening the diagram adds one entry to the history and Back closes it at the step reached, stepping at a desk adds none, and the stepper keeps keyboard focus usable (Left and Right step, Down scrolls, focus moves off a disabled button)
  - every flow printed, from a desktop part way through its steps and from a phone, in the dark theme: every step is there in order with its heading, no button is, the ink is the light theme's, and the diagram is drawn whole, with no step singled out, inside the width of a sheet and no taller than one

  It needs Chromium: `npx playwright install chromium`.

  It checks the build, not the sources, and it does not build. If anything under `src/` or `public/` has changed since the site was built, it stops before its first check and names a file: an old build can pass where the site as it is now would fail, and the report would not say which was read.

## Reading modes

Keep the complete narrative in the live DOM when a reader selects a diagram step
or comparison example. A native Reader may discard anything marked `hidden`,
including a step that print CSS would restore. The rendered checks enforce this
content-availability rule; they do not simulate browser-specific extraction.
See the [reading-mode investigation](reviews/reader-mode.md) for evidence, page
expectations, and the remaining native-browser checks.

## Other forms of a page

A page is read in three places besides a browser: where a link to it is shared, by a search engine, and by a program working for someone, such as a coding agent or an assistant answering a question. Each gets a form of the page made for it. All of them are made from the page as built, so none can say what the page does not.

**Where a link is shared.** `src/integrations/social-cards.mjs` draws a 1200 × 630 PNG for every page at `/og/<address>.png`, from the page's title and description, in the site's type and its light colors. `src/layouts/Base.astro` names it in `og:image` and `twitter:image` and asks for the large card. A page's card changes when its title or description does; nothing is edited by hand. The same step writes `/apple-touch-icon.png` and `/favicon.ico` from the site's mark. A page names the SVG icon first; the `.ico` is for a browser that does not read one, and for anything that asks for that address without reading the page.

**For a search engine.** Every page carries schema.org data in its head: the site, who makes it, the page with the month it was last reviewed, and the trail to it. Lessons, flows and deployment guides also say they are articles. A layout passes `article` to the base layout for that, and `schema` to add nodes of its own. The “not found” page passes `noindex`.

**When a page last changed.** A page gives the date it was first published and the date it last changed in its structured data (`datePublished`, `dateModified`), the sitemap gives the second as `lastmod`, and the footer shows it with a link to the history of the file the change was made in. All three are one date, read from the repository when the site is built by `src/integrations/page-dates.mjs`. A commit named in `.git-blame-ignore-revs` only reformats, or only moves text from one file to another, and is not counted: an entry is read on from its text before such a commit. Nothing is typed by hand, so nothing goes stale, and a date moves only when something the page shows does: Google uses a sitemap's dates only while they hold up against what it finds.

`src/lib/page-sources.ts` says what each page is made from, and a page's date is the last change to any of it. A flow is made from its data file, the tracker's entries for the standards it lists, and its implementation record. A lesson is made from its page, its entry in the list of lessons, and the glossary's entries for the terms it teaches. An index is made from its page and the whole of the data it lists. A flow shows a few of the tracker's entries and not the tracker, so it is dated by those entries: for `standards.ts`, `glossary.ts`, `lessons.ts` and the implementation `records.ts`, the build reads the file as it stood at each of its commits and dates each entry by the last one that changed its text. A standard’s status comes from the log in `src/data/history/`, so a page that shows a standard is also made from the events recorded for it, in whichever month’s file. A change to another flow's standard, or an event for one, does not move this flow's date. A lesson whose figure is drawn from a data file of its own, as the first lesson's is, is made from that file too.

What is followed is what a page states: a figure, a definition, a status, a rating. What is not followed is what a page borrows to point somewhere else: the name of a page it links to, that page's one-line description, a count. The list of flows states each flow's rating, so it moves with the standards the flows list; the home page names the lessons and links to them, so it does not move when a lesson's title does. **When a page starts to draw on a data file, put the file on one of two lists in `src/lib/page-sources.ts`:** `MADE_FROM`, if the page states something from it, or `NOT_FOLLOWED`, with the reason, if it only points with it. `npm test` reads every page's imports and fails on a data file that is on neither, so a page cannot quietly go on giving an old date.

An entry is compared without its layout: spacing between its parts, comments, a comma before a closing bracket and the kind of quote mark are not changes. What is inside a string is what a page says and is compared exactly, so a space put into a quoted word is a change.

An implementation record's page is made from its entry in `records.ts`, and is as old as the commit that added the entry. It shows two dates, and they are two facts: “Evidence reviewed”, from the record, is the day its sources were last checked, and the footer's date is the day the page last changed. A correction made after a review moves the second and not the first.

The dates need the whole history. In a shallow clone every file appears to have been written in the oldest commit the clone has, so the build gives no dates there, and says so in its output: `[page-dates] the clone is shallow …`. Continuous integration builds from a shallow clone and so checks the site without dates.

The site is deployed by Cloudflare's Workers Builds, which also clones shallowly. There, and only there, the build fetches the rest of the history before it reads it: Workers Builds sets `WORKERS_CI=1`, and `src/integrations/page-dates.mjs` runs `git fetch --unshallow` when it sees that. Look for `[page-dates] … files dated from the history, after fetching the rest of it` in the build's output. If the fetch fails the build goes on without dates and says so. A build made any other way has to start from a full clone to have dates, or run `git fetch --unshallow` itself first. A new section whose pages are made from data needs a line in `MADE_FROM` in `src/lib/page-sources.ts`; any other page is dated by its own file.

**Telling a search engine that a page changed.** Google reads the sitemap. Bing, and the other engines that take part in [IndexNow](https://www.indexnow.org/), can be told directly, and read a page again without waiting to find out.

Nobody has to do it by hand. `.github/workflows/indexnow.yml` runs on every push to `main`: it builds that commit from the whole history, waits for Cloudflare to deploy it, and sends the pages the push changed. It runs `scripts/indexnow.mjs`, which can also be run from a full clone, after a build:

```bash
npm run indexnow -- --since 4c1c6a6 --dry-run
```

`--since` takes a commit or a day, and `--all` sends every page.

- **A commit** gives the pages changed by the commits after it, up to the one checked out. They are chosen by what each page is made from, which the build writes beside the sitemap, in `sitemap-sources.json`: the files and the entries (`<file>#<name>`) that `madeFrom` in `src/lib/page-sources.ts` names for it. The script reads from the history the files those commits touched, and for a file that is a list of entries, the entries whose text without its layout differs between the two commits. A commit in `.git-blame-ignore-revs` is passed over. A page is sent when anything it is made from is among them. It is not chosen by the page's date: a commit made on the 12th and merged after one made on the 14th that touched the same page leaves the page dated the 14th, and is still sent. The workflow gives the commit of its own last run that succeeded on a push to `main`, which it asks GitHub for. Where no run has succeeded yet it sends every page, and where GitHub does not answer it fails with nothing sent. Where history was rewritten, the commits are those that are here and were not there. All zeros, which is what GitHub calls the commit before a branch's first push, means every page. A commit the clone does not have is refused, and so is any commit in a shallow clone.
- **A day**, as `2026-11-14`, gives the pages dated on or after it, the day starting in UTC.

`--dry-run` prints the list and sends nothing. `--wait` waits for the deploy first: an engine that is told about a page goes and reads it, and should find the new one. It reads the deployed sitemap every fifteen seconds until each page to be sent is listed there with a date no older than the build's, and after ten minutes it stops with nothing sent. A page whose date did not move is there as soon as it is listed, so for such a page the wait holds only while other pages in the list have a date that did. Without `--wait`, run the script after the deploy and not before.

The script reads the build and does not make it, and stops on a build older than its sources, as the other scripts that read the build do. It proves the list comes from whoever runs the site with a key: the file in `public/` named for a string of hexadecimal digits, which holds that string. The key is not a secret. Replace it by replacing the file. How the pages are chosen and how the wait ends are tested in `test/unit/indexnow.test.mjs`, without a build or the network.

The workflow can be run by hand from the Actions tab, for every page, or for the pages since a day or a commit, and as a dry run. A run that succeeded sent its pages or had none to send, so the next run starts from its commit. If a run fails because the deploy never showed up, look at the deploy: the next push sends that run's pages with its own, and running the failed run again sends them sooner. One run goes at a time, and GitHub drops all but one of those waiting, which loses nothing for the same reason. A run by hand does not move where the next push starts from. If the deployed build ever fails to fetch the history, its sitemap has no dates, and the wait ends with nothing sent.

**For a program that reads.** `src/integrations/markdown-pages.mjs` writes each page again as Markdown beside it: `/flows/dpop/` has `/flows/dpop/index.md`. The page names it in a `<link rel="alternate" type="text/markdown">`. The copy leaves out the header, the footer, controls and drawings, and keeps what the page says in words: a flow's steps, a figure's every variation and its table, the decision guide's rules. One drawing is kept, in a form a program reads: a sequence diagram is written again as a `mermaid` code block, above its steps. It is read from the drawing in the built page, so there is nothing to keep in step by hand: the parties from the boxes, each arrow and note with its number and label, and a note across the diagram where a part begins. The style of a line says the kind of message, as it does on the page, and a sentence under the block names each kind the diagram uses. A kind of message with no arrow in `ARROWS` in the integration stops the build, which says so. Other drawings have no such form, and their tables and lists stand for them. It ends with the page's address and the footer's line on when the site was last reviewed, which on a lesson is the only place the month appears. Two files are made from the copies:

- `/llms.txt` says what the site is and links to every page's Markdown, in reading order.
- `/llms-full.txt` is all of the pages in one file.

A reader is offered the copy too. The footer of every page that has one links to it, and with the script a button copies it, for pasting into an assistant. On the documentation sites that have published what their readers press, copying the page as Markdown is pressed far more than anything else offered beside it. The button is not printed.

A page with nothing to read as text, as the style guide is, passes `markdown={false}` to the base layout. A new section of the site has to be added to `SECTIONS` in the integration, or the build stops and says so.

The conversion knows the site's components by class name: which are controls (`CHROME`), which are facts set side by side (`ROW`), and a few that need rearranging to read well. A new interactive component should be checked in its page's `index.md` after a build. The test is the one the pages already meet: what a drawing or a control shows must also be on the page in words.

`public/robots.txt` allows every crawler and states, in the terms of [contentsignals.org](https://contentsignals.org/), that the site may be indexed, used to answer questions, and used for training.

### Markdown at the page's own address

Some agents ask for Markdown with `Accept: text/markdown`. A request that does gets the page's Markdown copy at the page's own address, and a request that does not gets the page.

That choice is the one thing the site does when a page is asked for. `src/worker.ts` is a Worker that stands in front of the pages, and `src/lib/markdown-negotiation.ts` is how it chooses. It makes nothing: either answer is a file the build wrote. If it fails, the request gets what is at its address.

The header is read as [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1) defines it. It is a list of media ranges, each with a weight from 0 to 1. A range with no weight has 1, a weight of 0 means “not acceptable”, and where more than one range fits a type the most specific counts: a type with parameters, before the type, before its family (`text/*`), before anything. So a header that only has `text/markdown` somewhere in it may be refusing Markdown (`text/html, text/markdown;q=0`) or ranking it below the page (`text/html, text/markdown;q=0.5`), and both get the page.

A range with a parameter fits only a form sent with that parameter. The copy and the page are both sent as UTF-8, so `text/markdown;charset=utf-8` names the copy and `text/markdown;charset=iso-8859-1` names nothing the site has. The weight is the parameter named `q` wherever it is written among the others, as the RFC asks of a recipient. A range that is not written as the grammar has it, such as one with a weight of 2, is left out. The unit tests hold the reading to the examples the RFC itself works through, and to the ones in RFC 7231 before it.

**A request gets Markdown when it names `text/markdown` itself, gives it a weight above 0, and prefers it to the page.** Naming it is asked for because a browser's header ends with a range that allows anything, Markdown included, and a browser wants the page.

Which of the two a request prefers is settled by weight. The RFC calls two types of the same weight “equally preferred” and leaves the choice to the server. The site follows the custom of the libraries that read this header, such as [the one Express uses](https://github.com/jshttp/negotiator/blob/master/lib/mediaType.js): the type named more specifically, and then the one the request lists first. So `text/markdown, text/html` gets Markdown and `text/html, text/markdown` gets the page. Claude Code sends `text/markdown, text/html, */*`, with the two at the same weight and Markdown first ([Checkly, February 2026](https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/)).

The copy is sent with `Content-Location`, which gives the address where that form lives on its own, and with `Vary: Accept`. It is sent without the `X-Robots-Tag: noindex` it has at its own address: there the header keeps a search engine from listing the copy, and here the address is the page's. A page with no copy, such as the style guide, answers with the page.

**Which addresses the Worker stands in front of.** Pages, and nothing else: a request for a file is served as a file, without the Worker, and does not count as a Worker request. `cloudflare.config.ts` says which is which by the rule the site already keeps, that a page's address has no dot in it and a file's has one (`runWorkerFirst: ["/*", "!/*.*"]`). So the Markdown copies at their own addresses, `llms.txt`, the styles and the pictures never reach it.

**How the build keeps it.** The Cloudflare adapter emits only assets when Astro uses static output. The config selects server output to retain the Worker bundle, and the route setup hook prerenders every Astro route. `cloudflare.config.ts` selects `src/worker.ts` for the build and Astro’s own entrypoint for `cf dev`, so pages render as they are edited.

It is tested at three levels:

- **How the header is read**, in `test/unit/markdown-negotiation.test.mjs`, which `npm test` runs. The weights are held to the examples RFC 9110 and RFC 7231 work through. Each rule above has its cases. Then a few thousand headers are made from the grammar, the same ones on every run, and held to what must be true of any header: how one is spelled does not change what it says, the order of its ranges does not change any type's weight, and the answer follows from the weights. The same file covers what the Worker sends for each case, with a table standing in for the files.
- **The deployed configuration**, in `test/build/deploy.test.mjs`: it names the Worker, the files, and the addresses the Worker stands in front of.
- **The site as it is deployed**, in `test/worker/`, which `npm run check:rendered` runs. `astro preview` serves the build in the Workers runtime, and the tests ask it: every page's copy is the one the build wrote, a browser gets every page, both answers keep the headers every response has, a file answers as itself, and a reader that has the copy is told so.

The browser tests do not go through the Worker: they serve the built files themselves, with the site's headers.

To ask the running site by hand, `npm run preview` builds it and serves it in the Workers runtime on port 8787:

```bash
curl -sI -H "Accept: text/markdown" http://localhost:8787/flows/dpop/ | grep -i -E "content-(type|location)"
```

```bash
curl -sI -H "Accept: text/html, text/markdown;q=0" http://localhost:8787/flows/dpop/ | grep -i content-type
```

The first says `text/markdown` and where the copy lives; the second says `text/html`. The same two requests work against the site and against a branch's preview.

Before the Worker, a URL rewrite rule in the Cloudflare dashboard did this, by looking for `text/markdown` in the header. The host's rules cannot read a weight, so it could not tell a request that refused Markdown from one that asked for it. With the Worker deployed, that rule should be deleted: it runs before the Worker and would go on answering in its place.

## Films and pictures for posts

The site's films, and the pictures that go in a post announcing it, are made in a private repository, from this one's built site and data. Nothing here is needed for them, and nothing in them is needed to build or check the site. The films are on the site's [YouTube channel](https://www.youtube.com/@whosonfirstai).

## Response headers

`public/_headers` is sent with every page and file the site serves: a content security policy that allows this origin and nothing else, headers that forbid framing, content sniffing and the device features the site never uses, and one that tells a browser to come back over HTTPS only. A `Link` header points a program at `llms.txt` and the sitemap. The Markdown copies and the two files that list them carry `X-Robots-Tag: noindex`, so a search engine sends people to the page. So does `sitemap-sources.json`, which says what each page is made from for the IndexNow script. The `.md` and `.txt` files are declared as UTF-8, because the host names no encoding for a `.txt` file and a browser then reads its quotes and dashes as Windows-1252. The build adds its cache rule for `/_astro/` to the same file. Cloudflare does not add these headers to its own “not found” response.

The policy allows inline scripts and styles, because the theme switch runs before the first paint and code samples and diagrams carry style attributes. It does not allow anything from another origin. Analytics, an embed or a hosted font would be refused until it is added there, and `npm run check:rendered` fails on any page that breaks the policy.
