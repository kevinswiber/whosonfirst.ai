# Decided against, for now

Ideas considered for [the adoption record](README.md) and not taken, each with the reason and with what would change the decision. Some were tried in the prototype first. Nothing here is closed for good.

## One number for adoption

**The idea.** A single score from 0 to 100 for each flow, as Crunchbase gives a company.

**What happened.** It was built first: half the score from supply and half from use. On the first run it put URL elicitation (Available, with no recorded use) below the credential broker (Early), and DPoP above the device grant, because a certification listing lifted DPoP’s supply to the top of its scale. The number and the word disagreed, and a reader would have had to be told to ignore one of them.

**Why not.** Adding the two hides the one thing worth seeing, which is the gap between them: a flow many vendors offer and nobody is recorded running is a different thing from a flow few offer and many run, and both would score 50.

**Instead.** Two scores on one scale, and a word from both.

**What would change it.** A year of snapshots showing the two move together for nearly every flow. Then the second number adds nothing and one will do.

## Calling it heat

**Why not.** Heat is attention, and attention is the reading the record trusts least. A “heat score” on a flow page would be read as “this is the one to use”. The site says the opposite about ratings already: an emerging flow can be the right choice.

**Instead.** Adoption is the headline, under the heading “In the field”. Attention is a direction beside it.

**What would change it.** Nothing foreseeable. If a page about what is being talked about is ever wanted, “heat” is a fine name for that page.

## A score from a model

**The idea.** Give a language model the evidence and ask for a score, as Crunchbase’s scores come from a model.

**Why not.** A reader could not check it and a run could not reproduce it. Two runs would differ, and the difference would look like news.

**Where a model is used.** Finding and reading sources for the ledger. The pilot’s 201 entries were gathered that way, and the quote is what keeps it honest: a program that is not a model fetches the page and looks for the words.

**What would change it.** Nothing. The rule is a page long, and that is its value.

## Ranking flows against each other

**The idea.** Score each flow by where it falls among the site’s flows: top quarter, bottom quarter.

**Why not.** Adding a flow would move every other flow’s score, with no change in the world. Five flows are about to be added.

**Instead.** Fixed thresholds, in organizations and in shares.

**What would change it.** Nothing, for the grade. For attention, a ranking is harmless, and was still not used.

## Weighting an organization by its size

**The idea.** One cloud provider should count for more than one startup.

**Why not.** It needs a measure of size, which means paid data or a judgment, and either would be argued with. It also answers a different question. The record asks whether you can get the thing and whether anyone runs it.

**Instead.** An organization is an organization, counted once.

**What would change it.** A count with a real denominator makes this moot wherever it exists: a share of servers is already weighted by servers.

## Partner pages and launch lists

**The idea.** A2A’s partners page names 180 organizations. AP2 launched with “more than 60”.

**Why not.** A name on a list is an announcement. The pilot recorded both, marked them as not counted, and the two flows grade the way their documentation reads: A2A Available with one named adopter, AP2 Early with one reference implementation.

**What would change it.** A list that links each name to what it shipped. oauth.net’s directories do, and are counted.

## Stars, trends and social volume

**GitHub stars.** A specification’s repository is starred by people who read about it. Not collected.

**Google Trends.** It has no official API, gives relative values that are re-sampled between requests, and cannot tell “DPoP” the header from anything else spelled that way. Not collected.

**Social platforms.** Paid, changeable, and a measure of talk.

**What would change it.** Nothing for adoption. For attention, a second source beside Hacker News would help, since one community is not the industry. A source that is free, exact about phrases and stable would be taken.

## Downloads of a whole protocol’s library

**The idea.** The MCP SDK for TypeScript was downloaded 295 million times in October 2026. Use that for MCP authorization.

**Why not.** It measures MCP. Most of those installs never open an OAuth flow.

**Instead.** A library is graded only when its registry description names the mechanism: `dpop`, `web-bot-auth`, `biscuit-auth`. A whole-protocol library is shown beside the flow and marked.

**What would change it.** A registry that reports which of a package’s entry points are imported.

## Paid data

**The idea.** Buy what is hard to collect.

**Why not.** What is for sale is about companies or web pages, not protocols, and the terms that were read forbid showing it. Crunchbase’s terms limit use to what a subscriber’s order form sets out, and ask for written consent to republish. [sources.md](sources.md#paid-and-not-recommended) has the rest.

**What would change it.** A vendor of protocol-level data with terms that allow a count to be shown. None was found.

## A survey

**The idea.** Ask practitioners what they run. It is the only way to see inside a company, where transaction tokens, SPIFFE and credential brokers live.

**Why not yet.** It needs enough readers to answer that the answer means something, and a survey of a site’s own readers describes the site’s readers. It is also the one thing here worth paying for: the site would own the answers.

**What would change it.** A readership large enough to give a few hundred answers, or a partner with one. One question on each flow page would be a start: “Do you run this in production?”, with the answers counted and shown as what they are.

## Asking more of a server than its discovery documents

**The idea.** Do not take a server’s word. Register a client, start a flow, and see whether DPoP is enforced.

**Why not.** Reading a document a server publishes for clients is what any client does. Registering clients on thousands of servers is not, and neither is scanning for servers that never listed themselves.

**Instead.** The census reports what servers say, and says that is what it reports.

**What would change it.** An operator asking to be tested. A conformance suite run by its owner is a different thing, and is evidence the ledger takes.

## Naming servers in the census

**The idea.** Publish which server said what.

**Why not.** The finding is the share. A list of 2,500 hosts and their settings invites a use the site does not intend, and most of them are individuals’ experiments.

**Instead.** Rows without names, and a seed that lets anyone draw the same sample from the registry.

**The panel is different.** Its 82 organizations are named, because a reader has to be able to see who was asked.

**What would change it.** Nothing.

## Evidence without a public page

**The idea.** Let a vendor write in and say it supports a flow.

**Why not.** A reader could not check it. The site describes vendors from their own documentation.

**Instead.** A vendor can open an issue with the address of the page that says so. That page is the evidence.

**What would change it.** Nothing.

## Grading a flow by its least adopted reference

**The idea.** The rating takes the level of a flow’s least mature required reference. Do the same for adoption, with the ledger kept by tracker entry.

**Why not.** Maturity works that way because a flow cannot be more settled than what it depends on. Adoption does not: a server supports the flow or it does not, and a count of servers that support each part says little about how many support them together.

**What would change it.** The tracker wanting an “implemented by” line on each entry. The ledger’s shape would serve, keyed by a standard’s `id` and not by a flow. Several of the census’s statements are already about a standard and not a flow: pushed authorization requests, rich authorization requests, client ID metadata documents.

## One label for paper and practice

**The idea.** Fold adoption into the rating: a stable flow that nobody runs becomes emerging.

**Why not.** They are different facts with different sources, and a reader needs both. “Stable, Early” is the most useful thing the first run produced, and one label could not say it.

**What would change it.** Nothing.

## Baseball

**The idea.** On deck, first base, second base, home.

**Why not.** The About page says the name and the mark are as far as the joke goes, and that everything else uses the terms the specifications use.

**What would change it.** The About page.

## A chart before there is a trend

**The idea.** Draw each flow’s adoption over time, as the Crunchbase chart does.

**Why not yet.** There is one snapshot. Attention has a past, because downloads and talk are dated, and that is all the prototype draws. A line through one point would be decoration.

**What would change it.** Six monthly snapshots. Or recording, on each ledger entry, the date its source gives for the release: the supply line could then be drawn back to that date, which is honest history and not a guess.

## Shortcuts the pilot took, to be dropped

These are in the prototype and should not survive it.

- **A release stage with no label is counted as released** where an established vendor’s standing documentation describes the feature. 38 of 145 implementer entries. A page should be counted for what it says.
- **Seven implementers at most a flow.** Enough to try the rubric. It flattens the top of the supply scale.
- **“Operator” is a host’s last two labels.** The Public Suffix List is the right tool, and is a dependency to ask about.
- **The census uses a generic name.** A run on a schedule should say who is asking.
