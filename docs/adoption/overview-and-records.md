# Overview and full field records

Design update, 12 November 2026. This follows reader feedback on the first local implementation and extends [issue #84](https://github.com/kevinswiber/whosonfirst.ai/issues/84).

## The three reading tasks

| Place                                            | Reader’s question                                                                                 | What belongs here                                                                                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Implementations overview** `/implementations/` | What supports the products or roles I work with, across flows? What has been reviewed?            | Existing standards wording, a count of reviewed options/operators, a few explicitly labeled names, review date and links to complete records. Search across every accepted entry. |
| **Field record** `/implementations/<slug>/`      | Which implementation fits this role, under what conditions, and what evidence supports the claim? | All implementation roles, release conditions, deployment accounts, sources, qualifications, review scope and dated events.                                                        |
| **Flow guide** `/flows/<slug>/`                  | How does this mechanism work and what must each party do?                                         | The explanation and diagram, with a short field summary and a direct link to the evidence record.                                                                                 |

The overview has a cross-flow purpose. It can expose the different roles a product supports across protocols, show where the reviewed evidence is thin, or help someone find a client library before choosing a guide to read. A reader who already knows the mechanism can go straight from its guide to the full record. Both paths use the same reviewed data.

The overview’s columns support scanning the same questions across rows. They do not imply that unlike flows are interchangeable, that a flow with more records is better, or that the records measure market share. Preserve the existing grouping. Do not rank by the number of entries. On a phone each row becomes a compact block with the same labels.

## Growth rules

- Show at most two product examples and one operator name per overview row or flow-guide summary. Call them examples when the list is longer. A count and an explicit link say where the full list lives.
- Keep role descriptions, release conditions and deployment settings in the full record. A selected overview example is a navigation aid, not a recommendation. Maintain editorial order; do not select examples by popularity.
- Search the full record’s product/operator names and roles. If a match lies beyond the displayed examples, show the matching name and a direct link to that evidence entry. Never make a reader guess why a row matched.
- Match a product and role within the same evidence entry. Finding an authorization server and a client library on the same flow does not mean that server supplies the library.
- Keep every full record statically readable, including sources and limitations. Section navigation helps on long pages. Ordinary links connect the overview, evidence and mechanism; no accordion conceals essential facts.
- Preserve `/flows/<slug>/#in-the-field` at the compact summary. Existing local links still lead to useful context.
- Print the complete overview rather than the current search subset; print a field record when its full evidence is wanted. Markdown exposes the same division and links.

Separate pages are useful before lists become large because the two kinds of reading already differ. Full records can grow without lengthening the diagram guide or turning the overview into an endless table. If individual records later become difficult to scan, measure that with readers before adding role filters or another level of pages.

## Expanded evidence as a design check

Review Device authorization, Client credentials, Token exchange, CIBA and A2A, and deepen the DPoP list. These add distinct roles, stages, historical reports and mechanism-specific qualifications. They also give search real matches outside an overview sample. Source coverage remains selective. The checks validate rendering and evidence boundaries; they do not establish reader comprehension or prevalence.

## Initial explicit destinations, 13 November 2026

The initial explicit-link design used plain flow headings in the overview, with **View field evidence** and **View flow diagram** actions. Diagram links led directly to the flow’s **Step by step** section. The section below records the later naming and reciprocal-navigation decision. Search results remain links to the exact matching evidence entry.

## Agreed information architecture split, 13 November 2026

The reader-facing section is **Implementations**, at `/implementations/` and `/implementations/<slug>/`. Navigation, overview and record headings, breadcrumbs, About and generated Markdown use that name. Each record’s title identifies implementations and deployment reports; its breadcrumb is Implementations / flow name. Flow explanations retain their own pages and link to the evidence through a real section in their section menu. The old `#in-the-field` flow fragment remains usable.

The overview retains its bounded examples and explicit full-record and flow-guide links. Search displays every matching accepted entry, including when a query also names the flow; it keeps products and roles within the same record. Home, decision-guide results, flow cards and deployment next steps introduce the evidence at relevant points. Product mention remains separate from recommendation.

[Issue #87](https://github.com/kevinswiber/whosonfirst.ai/issues/87) owns static **By product** / **By flow** browsing and editorial product grouping. The current overview’s product search still needs JavaScript. Complete records remain readable without it, but finding a product across all flows is a known discovery limitation until that follow-up. The follow-up must preserve edition/runtime/version boundaries and test finding every documented role for a product beyond the overview examples, including with scripts disabled. Reader evaluation is still pending.

## Review coverage and disclosure grouping, 13 November 2026

The implementation summary moves after **Standards in play** and before **Related flows**, using the normal section heading **Implementations and deployment reports**. Its heading uses `#implementation-evidence`; the section retains the `#in-the-field` alias. The workload guide’s separate `#implementations` destination remains unchanged. The summary names up to two reviewed entries with their documented roles and one deployment account, without prominent counts. It says the selection does not measure adoption. The onward link names implementations, reports and sources; the evidence-review date follows the summary.

The overview labels its counts as entries or operators covered **in this review**. An empty category means no entry or report is included. It makes no claim that a comprehensive search found none, that reports were never sought, or that the flow is unused. The record headings use **Implementation evidence** and **Deployment reports** consistently; underlying sources, roles, release conditions and production qualifications are unchanged.

Flow review disclosures use independent **About this guide** and **Specification basis** columns. Each reads top to bottom and the columns stack in that order on a phone. All basis references stay together, labeled by their references rather than numbered as steps. Diagram-specific basis and rating qualifications, no-basis patterns and unsettled references retain their original meanings. The short based-on/review line stays outside the disclosure.

Full-record pages label the directory link **Browse implementations across all flows**, distinguishing it from the current flow’s record.

## Linked examples and consistent targets, 13 November 2026

Flow summaries present the bounded examples as cards using the surrounding standards and related-flow grid. Each card identifies **Implementation** or **Deployment report**, links the product or organization name directly to its evidence entry, and keeps the role or deployment setting visible. The coverage note, complete-record link and review date follow the cards. Empty categories remain explicit in prose.

The directory retains compact lists inside its comparison rows. It shows the same bounded entries, with direct links and visible roles or settings. Examples retain entry IDs rather than reducing records to names, so links identify the reviewed role or report. This does not change counts or introduce product grouping. Full evidence entries and directory rows use the standards page’s thin accent border and soft offset shadow when targeted, with horizontal padding inside the boundary.

## Complete flow cards, 13 November 2026

The flow-page section now shows every reviewed implementation and deployment entry in one card grid. No fixed limit is imposed. Names and roles or settings lead each card; **Implementation** and **Deployment report** labels sit at the bottom, following the related-flow pattern. The link **See the full record** appears directly beneath the section heading, followed by “for sources and details.”

The flow-page section omits its sample introduction, review date, prevalence disclaimer and empty-category messages. Review context stays in the directory and complete evidence record. The directory retains its bounded compact examples and coverage wording. Sources, dates, evidence entries and direct entry destinations are unchanged.

## Directory navigation, 13 November 2026

Each comparison row keeps its onward links beneath the flow name and review metadata, in the first column. The links read **See the full record** and **See the flow**, without repeated explanatory prose. The full-record link is bold; the flow link and individual product or report links use regular weight. Flow-page cards keep bold names as headings, and the flow-page full-record link keeps “for sources and details.” **See the flow** opens the guide from the top. There is no separate action column; the remaining width belongs to implementation evidence and deployment reports. On a phone, the identity and links precede the evidence. Both links retain the flow name in their accessible text.
