# An adoption record for flows

A proposal, with a working prototype. Nothing here is on the site yet, and nothing under `src/` has changed.

The site says how settled each flow is on paper. It does not say who has built it or who runs it, and that is hard to find out. This is a way to find out, for every flow, from evidence a reader can check and a script can check again next month.

- [What was tried and decided against](decisions.md), with what would change each decision.
- [Every source considered](sources.md), with its terms and what it costs.
- The prototype is in `scripts/adoption/`, its rule is tested in `test/unit/adoption.test.mjs`, and what it collected on 13 November 2026 is in `docs/adoption/data/`.

## The short version

1. **Two questions, asked of every flow.** _Can you get it?_ (supply: who offers an implementation) and _Is anyone running it?_ (use: who runs it, by name or as a share of something counted).
2. **One scale for both.** Each answer is graded 0 to 4 against thresholds that are the same for every flow, and shown as a score out of 100. The two grades give one word: On paper, Early, Available, Established or Common.
3. **Different instruments, named.** One flow can be counted in metadata that servers publish. Another can only be read from what its implementers document. The grade says which: _measured_, _documented_ or _thin_.
4. **Every point is a source.** A count is of something a reader could count. A claim is an address, words quoted from that address, and the day they were seen, and a script fetches the page and looks for the words.
5. **Attention is kept apart.** Talk and downloads say which way interest is going. They are shown as a direction and never enter the grade.

The rating the site has now stays as it is. It answers “how settled is the paper?” This answers “what is in the field?” The two disagree more often than expected, and where they disagree is the useful part: see [what the first run found](#what-the-first-run-found).

## What this takes from Crunchbase, and what it leaves

Crunchbase gives a company two scores from 0 to 100. Its Heat Score measures attention: profile activity and recent news, weighted toward the recent, falling when nothing new happens. Its Growth Score measures substance: funding, headcount, customers. The chart that makes them useful draws both over time, with events along the bottom, and the reader looks at the gap. (Read from the Crunchbase knowledge base on 13 November 2026; the two support articles themselves refuse a request from a script.)

Kept:

- **Two readings, not one.** Attention and substance are different things and are drawn apart.
- **A fixed scale.** A number a reader can compare across flows and across months.
- **Decay.** Evidence that is not seen again lapses, so a score can fall.
- **Events on the time line.** A draft’s revisions and a specification’s releases have dates, and belong under the chart.

Left:

- **The model.** Both Crunchbase scores come from a model over its own data, and cannot be traced to a source or reproduced. The site’s whole claim is that a reader can check it. Here the rule is a page long, is in the repository, and has tests.
- **The single number.** Supply and use are not added together. When they were, the sum put flows in an order the levels contradicted, and it hid the gap between what is offered and what is run. See [decisions.md](decisions.md#one-number-for-adoption).
- **The word “heat”.** It names the reading that matters least. The record leads with adoption and calls the other thing attention.

## The rubric

The rule is `scripts/adoption/rubric.mjs`. If this page and that file disagree, the file is what the numbers were made with.

### Supply: can you get it?

Counted in organizations. An organization is counted once, however many products it has.

| Grade | Score | Evidence                                                             |
| ----- | ----- | -------------------------------------------------------------------- |
| 0     | 0     | No implementation recorded                                           |
| 1     | 25    | One organization, or only organizations that wrote the specification |
| 2     | 50    | Two or more organizations, at any release stage                      |
| 3     | 75    | Three or more organizations with a generally available release       |
| 4     | 100   | Ten or more organizations with a generally available release         |

- A preview, a beta, an experiment or a demonstration is an implementation and is not a release.
- An announcement is neither. A name on a partners page is not counted.
- A specification that only its own authors have built stays at grade 1. That shows it can be built, not that anyone else chose to.
- A public list that counts released implementations, such as a certification listing, can stand in for names.

### Use: is anyone running it?

Counted two ways, and the one that shows more is graded.

| Grade | Score | By name                  | Or as a share of a counted population |
| ----- | ----- | ------------------------ | ------------------------------------- |
| 0     | 0     | None recorded            | Counted, and none found               |
| 1     | 25    | One organization runs it | Seen at least once                    |
| 2     | 50    | Three or more            | 5%                                    |
| 3     | 75    | Ten or more              | 20%                                   |
| 4     | 100   | Thirty or more           | Half                                  |

- “Runs it” means in its own production service: its own writing says so, its own server says so in a document it publishes, or a vendor’s case study names it.
- A count that looked and found none is a finding, and is recorded as zero. A flow that cannot be counted has no share, which is different.

Between two grades the score moves with each organization or each point of share, so one new piece of evidence is visible. It never reaches the next grade early.

### The word

| Level       | Rule                                 | In plain words                                                           |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------ |
| On paper    | Supply 0 and use 0                   | A specification, and nothing else recorded                               |
| Early       | Anything above that                  | Someone has built it or runs it, and there are not yet three releases    |
| Available   | Supply at grade 3, or use at grade 2 | Three releases to choose from, or several organizations running it       |
| Established | Supply at grade 3 and use at grade 3 | Three releases, and run by ten organizations or a fifth of those counted |
| Common      | Supply at grade 3 and use at grade 4 | Three releases, and run by half of those counted                         |

### The basis

| Basis      | Meaning                                                            |
| ---------- | ------------------------------------------------------------------ |
| Measured   | At least one grade rests on a count with a denominator             |
| Documented | No count applies, and at least three checked sources are behind it |
| Thin       | Fewer than three checked sources. The grade stands, and is marked  |

This is the site’s “provisional”, for adoption: a grade from four web pages should not read like a grade from a census.

### Attention

Not part of either grade. From what is said (Hacker News stories and comments containing an exact phrase) and what is downloaded (libraries whose registry description names the mechanism), it gives:

- a size from 0 to 4, on fixed steps, taken from whichever source is loudest; and
- a direction, _rising_, _steady_ or _falling_: each series against itself, the last twelve months of talk against the twelve before, the last three months of downloads against the three before.

A direction is given only when there is enough to compare. Most flows on the first run have none.

## Normalizing across flows that have nothing in common

The site covers a grant every authorization server has had for a decade, a pattern no standard defines, and a draft with one demonstration. No one metric exists for all of them, and there will not be one. Five more flows are planned ([#72](https://github.com/kevinswiber/whosonfirst.ai/issues/72) to [#76](https://github.com/kevinswiber/whosonfirst.ai/issues/76)), and they are less alike still: a policy interface, an event framework, a token format from an open-source project.

So the record does not normalize the data. It normalizes the question.

- **The same two questions** are asked of every flow, in the same units: organizations, and shares.
- **The same thresholds** turn the answer into a grade.
- **The instrument differs,** and is chosen flow by flow in `scripts/adoption/flows.mjs`. Where a server’s own metadata states the flow, it is counted. Where it does not, the ledger is all there is.
- **The basis says which,** on the page, beside the grade.

What can be measured for each kind of flow:

| Kind of flow                                   | Supply from                                   | Use from                                    | Flows today                                                                                                   |
| ---------------------------------------------- | --------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| An OAuth feature a server states in metadata   | Ledger, and certification listings            | Issuer panel, and names                     | PKCE, device, client credentials, token exchange, CIBA, DPoP, cross-app access, identity chaining, mTLS (#74) |
| An MCP mechanism                               | Ledger, and public directories                | MCP census                                  | MCP authorization. URL elicitation has no public signal yet                                                   |
| A protocol with its own discovery document     | Ledger                                        | Not built yet: agent cards, key directories | A2A, Web Bot Auth, AuthZEN (#72), Shared Signals (#73)                                                        |
| Something that runs inside a company           | Ledger, and an adopters file where one exists | Names only. It cannot be seen from outside  | SPIFFE, workload identity federation, transaction tokens, WIMSE, the credential broker                        |
| A project’s token format                       | Ledger                                        | Names, and what depends on its libraries    | Biscuit (#75)                                                                                                 |
| A specification with almost no implementations | Ledger                                        | Names                                       | AAuth, agent payments, GNAP (#76)                                                                             |

The third row is the next thing to build. Each of those protocols publishes a document at a known address, as an authorization server does, and each could have a census of its own.

## The four instruments

### 1. The issuer panel

`scripts/adoption/census-issuers.mjs`, over the panel in `panels.mjs`.

82 well-known organizations whose authorization server publishes a metadata document. Each is asked for that document and nothing else. `metadata.mjs` reads nineteen statements from it, each tied to the field and the document that defines it: PKCE with S256, the device grant, CIBA, token exchange, DPoP, certificate-bound tokens, the ID-JAG grant profile and so on.

All 82 answered on 13 November 2026.

Its limits, which a page that shows these numbers has to state:

- **It is a floor.** Most of these fields are optional. A server can support a thing and leave it out.
- **It is who answers, not the industry.** A service that publishes nothing is not on it. Consumer and developer services are over-represented, and banks and governments barely appear.
- **A hosted issuer speaks for its vendor.** An organization whose sign-in runs on another company’s platform advertises what that platform supports, whether or not the organization uses it. The prototype cannot tell, and counts the organization. Grouping issuers that publish the same document would catch most of it, and is not built.
- **It is fixed on purpose.** Like the fixed set of browsers behind a “Baseline” label, the value is the same panel asked every month. Adding a member changes every share, so the panel has a version, and a change to it is a commit.

### 2. The MCP census

`scripts/adoption/census-mcp.mjs`.

The official MCP registry lists servers anyone can reach. The census draws a sample, one address per operator, in an order fixed by a seed so the same sample can be drawn again. To each it sends what any client sends first, a request with no token, and follows the answer to the server’s protected resource metadata and its authorization server’s metadata. At most eight requests a server. It registers nothing, starts no authorization and holds no credential. If a server lets the request in and opens a session, the census closes it.

On 13 November 2026 the registry listed 63,030 servers, 41,787 of them active with a remote address, run by 26,671 operators. 2,500 were asked and 2,463 answered.

Its limits:

- **A registry is not the world.** Anyone can list a server. Many entries are experiments, and a company’s internal servers are not there at all.
- **“Operator” is rough.** It is the host’s last two labels, or three under a suffix many people share. The Public Suffix List would do it properly, and is a dependency the site does not have.
- **A sample has a margin.** Each share is recorded with it: about two points either way at this size.
- **It names nobody.** The rows are kept without host names. Which server said what is not the finding.

### 3. The ledger

`docs/adoption/data/ledger.json`, checked by `scripts/adoption/ledger-check.mjs`.

Where nothing can be counted, a person has to read. A ledger entry is one claim:

- who, and which product
- whether they implement it, run it, or it is a list that counts those who do
- its release stage, in the page’s own words where it gives them
- whether the organization wrote the specification
- **the address, and words quoted from the page at that address**
- the day they were seen, and the day a script last confirmed them

The quote is what makes it maintainable. `ledger-check.mjs` fetches every address and looks for the words. An entry whose words are gone is not wrong, but it is no longer evidence, and it is listed for a person to read. That is the same idea as `npm run sources:changed`, one step further: not “has this page changed?” but “does it still say this?”

The pilot ledger has 201 entries across all 25 flows, gathered on 13 November 2026 by five research passes working from one brief, each limited to seven implementers, four adopters and three lists a flow. All 201 quotes were confirmed against their pages twice, by two different programs. **It has not been reviewed by a person, and it is not at the site’s standard.** Three things in it are shortcuts:

- **38 release stages are inferred.** Where an established vendor’s standing documentation describes a feature with no preview label, the pilot counts it as released and marks the entry `stageInferred`. The real ledger should count only a stage the page states, or grade “no label” on its own.
- **The cap flattens the top.** With seven implementers at most, supply can pass grade 3 only through a list. A flow every vendor ships and a flow seven vendors ship look alike.
- **“Who wrote it” was checked for some specifications and not others.** Where it was not, the entry says `null`, and the rule does not assume.

### 4. Attention

`scripts/adoption/attention.mjs`.

- **Talk:** Hacker News stories and comments containing an exact phrase, by quarter for three years. A phrase that also means something else is left out: “token exchange” is a cryptocurrency term, so that flow is searched as “OAuth token exchange” and “RFC 8693”.
- **Downloads:** npm, PyPI and crates.io, by month. Only a library whose registry description names the mechanism is graded. A library for a whole protocol, such as an MCP SDK, is shown and not graded: its downloads say nothing about authorization.
- **Paper:** the revisions of each IETF draft a flow requires, with dates, from the datatracker. These are the events for the bottom of a chart.

These are weak, and the record treats them as weak. Build machines download libraries. People use a phrase to argue against the thing. One community is not the industry.

## What the first run found

25 flows, 13 November 2026. Scores are out of 100. The full record is `docs/adoption/data/snapshots/2026-11-13.json`.

| Flow                          | On paper     | In the field | Supply | Use | Basis      | Attention |
| ----------------------------- | ------------ | ------------ | ------ | --- | ---------- | --------- |
| Workload identity federation  | Stable       | Common       | 89     | 100 | Documented | Rising    |
| Authorization code + PKCE     | Stable       | Common       | 86     | 100 | Measured   | Rising    |
| MCP authorization             | Emerging     | Common       | 82     | 100 | Measured   | Rising    |
| Client credentials            | Stable       | Established  | 82     | 91  | Measured   |           |
| Device authorization          | Stable       | Established  | 86     | 81  | Measured   | Steady    |
| Token exchange                | Stable       | Established  | 86     | 80  | Measured   | Rising    |
| SPIFFE workload identity      | Stable       | Established  | 79     | 79  | Documented | Rising    |
| Cross-app access              | Emerging     | Available    | 58     | 82  | Measured   | Rising    |
| DPoP                          | Stable       | Available    | 100    | 71  | Measured   | Steady    |
| CIBA                          | Stable       | Available    | 100    | 68  | Measured   |           |
| OAuth mTLS (#74)              | Not reviewed | Available    | 100    | 61  | Measured   |           |
| Web Bot Auth                  | Emerging     | Available    | 82     | 54  | Documented | Steady    |
| Agent to agent (A2A)          | Stable       | Available    | 75     | 25  | Documented | Steady    |
| URL elicitation               | Emerging     | Available    | 86     | 0   | Documented |           |
| Access revocation (#73)       | Not reviewed | Available    | 82     | 0   | Documented |           |
| Identity chaining             | Emerging     | Early        | 58     | 37  | Measured   |           |
| Biscuit delegation (#75)      | Not reviewed | Early        | 58     | 37  | Documented | Rising    |
| Credential broker             | Not rated    | Early        | 67     | 25  | Documented | Rising    |
| Step-up authorization         | Stable       | Early        | 67     | 25  | Documented |           |
| Tool-call authorization (#72) | Not reviewed | Early        | 67     | 0   | Documented |           |
| GNAP (#76)                    | Not reviewed | Early        | 58     | 0   | Documented | Falling   |
| AAuth                         | Experimental | Early        | 50     | 0   | Documented |           |
| Agent payments (AP2)          | Experimental | Early        | 50     | 0   | Documented | Falling   |
| Transaction tokens            | Emerging     | Early        | 50     | 0   | Documented |           |
| WIMSE workload tokens         | Emerging     | Early        | 50     | 0   | Documented |           |

“Measured” here means measured and documented: every flow with a count also has ledger entries. “Not reviewed” is a planned flow, whose references have not been classified. Read this as a first draft of the picture, not as findings to publish. What it shows that the rating cannot:

- **Paper and practice disagree in both directions.** MCP authorization rests on working-group drafts and is Common. Step-up authorization rests on RFCs and is Early when held to RFC 9470 by name: two vendors, two libraries, a how-to and one named adopter. GNAP is an RFC, and the live evidence is one payments project in beta, one other deployment and prototypes.
- **The specification moved and the field has not.** MCP says a client identifies itself with a client ID metadata document, and that dynamic registration is deprecated. Among the authorization servers of public MCP servers, 91.7% offer dynamic registration and 37.5% say they support metadata documents. 57 of 1,082 offer metadata documents alone.
- **MCP servers that ask for authorization mostly do it as specified.** Of the servers that refused a request with no token, 89.7% publish protected resource metadata, and 87.9% name it in the challenge. But more than half of all public servers that answered, 56.6%, let the request in with no token at all.
- **A working-group draft is already in production metadata.** 14 of the panel’s 82 organizations say they support the ID-JAG grant, the basis of cross-app access. Only one implementer’s page was found that calls its support generally available. Use is ahead of supply, which is unusual and worth a sentence on that flow’s page.
- **DPoP is offered far more than it is run.** Sixteen organizations hold a certification that includes it. 7 of 82 panel organizations state it, and 7.2% of MCP authorization servers. No protected resource in the census says it requires it.
- **Three flows have supply and no recorded use.** URL elicitation, Shared Signals and AuthZEN are each documented by five or more vendors, and no organization was found saying it runs one. That may be the truth or a gap in the looking, and the record cannot yet tell which.
- **Logo lists were set aside.** A2A’s partners page names 180 organizations, and AP2 launched with “more than 60”. Neither is counted: a name on a list is an announcement.

And what it gets wrong, or cannot yet say:

- Workload identity federation is Common on one sentence: a guide that says more than 13,000 PyPI projects had adopted trusted publishing when it was written. It is a real count of real use, it is not dated, and it is one receiver.
- A2A’s use is one named adopter. A census of agent cards would measure it and has not been built.
- The top of the supply scale is the pilot’s cap, as said above.

## How it would read on the site

A sketch. The wording follows the About page.

**On a flow page,** one line under the rating, and a short section after the references:

> **In the field:** Available · measured. Sixteen organizations offer it in a certified release. 7 of 82 well-known authorization servers say they support it. Recorded November 2026.

The section lists what the line rests on: the counts with their denominators, and the ledger entries by organization, each linked to its source. Nothing waits behind a click, and there is no chart that is not also a table.

**On the flows index,** a second column beside the rating, so the two can be read across.

**On the About page,** “How adoption is recorded”: the two questions, the thresholds, the basis, what each instrument cannot see, and the sentence the rating already has, turned around: _it does not say the flow is right for you. An Early flow can be the right choice, and a Common one can be deployed badly._

**One new page,** if the record earns it: the table above, with the panel and the census described and dated. It is the only place a reader would see every flow’s adoption at once, and the only content here that nobody else publishes.

Three rules of the site apply directly, and the design already keeps them:

- _A fact has a source._ A count is reproducible from the script, and a claim is a quote with its address.
- _Vendors are described from their own documentation, and mention is not recommendation._ An organization is named as evidence. The page has to say so where the names appear.
- _Do not raise one to make a flow look more settled._ The grade is computed, as the rating is, and the build would refuse a declared level the evidence does not give.

## Keeping it over time

- **Monthly,** with the source review: run the two censuses and the attention collector, run `ledger-check.mjs`, read what it lists, and write the snapshot. A snapshot is one dated file and is never edited.
- **The report** is the difference between two snapshots: which flow changed level, which grade moved and on what evidence, which quotes were lost.
- **Evidence lapses.** An entry not confirmed for twelve months stops counting. The checker records the day of each confirmation, and the rule does not read it yet. A share is the share on the day of the latest census, so it already can fall.
- **The past, partly.** Downloads go back eighteen months and talk three years, so attention has a history now. Supply and use start on the day of the first run. A ledger entry could carry the date its source gives for a release, which would let the supply line be drawn back in time. The pilot does not record it.
- **In continuous integration,** a scheduled job could run the collectors and open a pull request with the new snapshot. Nothing here needs a secret.

## What it costs

Nothing, as built. Every source is public and free, none needs an account, and none forbids republishing a count made from it. [sources.md](sources.md) has each one’s terms.

No paid service is recommended. The ones considered either do not have this data, or have it under terms that forbid showing it. The one paid thing worth considering is not data: a small survey of practitioners once a year, where the site owns the answers. See [decisions.md](decisions.md#paid-data).

The real cost is review time: about 200 ledger entries to read once to the site’s standard, and then only what `ledger-check.mjs` lists each month.

## Decisions to make

1. **Is this worth a place on the site?** The honest alternative is to keep it as research behind the site and publish only the census findings, as articles.
2. **Two scores and a word, or the word alone?** The word and the counts are enough for a flow page. The scores earn their place on a chart over time.
3. **Which names for the levels?** On paper, Early, Available, Established, Common. “Available” says the least. “In the field” is the proposed heading because the site is a field guide.
4. **Does the census identify itself?** A run on a schedule should say who it is and where it is explained, in its `User-Agent`. The prototype sent a generic name. Signing the requests with Web Bot Auth would be fitting, and is a way to learn that flow from the inside.
5. **Are organizations named?** The panel names 82. The ledger names 110. Both are evidence from public pages, and a reader cannot check a count without them. The census names nobody.
6. **Who reviews the ledger,** and is a stage with no label counted?
7. **Do planned flows get a record before they have a page?** The prototype says yes: the evidence gathered for an issue is the same evidence the page will need.

## Running it

Node 22 or later, and network access. Each writes a dated file under `docs/adoption/data/`.

```bash
node scripts/adoption/census-issuers.mjs
```

```bash
node scripts/adoption/census-mcp.mjs --sample 2500
```

```bash
node scripts/adoption/attention.mjs
```

```bash
node scripts/adoption/ledger-check.mjs --record
```

```bash
node scripts/adoption/snapshot.mjs
```

The rule and the reading of metadata are tested with the site’s other rules:

```bash
node --test test/unit/adoption.test.mjs
```

| File                 | What                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------- |
| `rubric.mjs`         | The rule: supply, use, the level, the scores, the basis, attention. No data           |
| `metadata.mjs`       | What an authorization server’s metadata says, statement by statement, with its source |
| `flows.mjs`          | Which instruments apply to which flow, including the five planned ones                |
| `panels.mjs`         | The issuer panel                                                                      |
| `census-issuers.mjs` | Asks the panel                                                                        |
| `census-mcp.mjs`     | Samples the MCP registry and follows each server’s discovery documents                |
| `attention.mjs`      | Talk, downloads and draft revisions                                                   |
| `ledger-check.mjs`   | Confirms every quote in the ledger against its page                                   |
| `snapshot.mjs`       | Puts the collected files through the rule and writes the day’s record                 |
| `lib.mjs`            | One way to ask, to wait and to write                                                  |

`biome.json` leaves `docs/adoption/data/` alone: the files are written by the scripts, and are not formatted by hand.
