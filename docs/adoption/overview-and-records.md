# Overview and full field records

Design update, 12 November 2026. This follows reader feedback on the first local implementation and extends [issue #84](https://github.com/kevinswiber/whosonfirst.ai/issues/84).

## The three reading tasks

| Place                               | Reader’s question                                                                                 | What belongs here                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **In the field overview** `/field/` | What supports the products or roles I work with, across flows? What has been reviewed?            | Existing standards wording, a count of reviewed options/operators, a few explicitly labeled names, review date and links to complete records. Search across every accepted entry. |
| **Field record** `/field/<slug>/`   | Which implementation fits this role, under what conditions, and what evidence supports the claim? | All implementation roles, release conditions, deployment accounts, sources, qualifications, review scope and dated events.                                                        |
| **Flow guide** `/flows/<slug>/`     | How does this mechanism work and what must each party do?                                         | The explanation and diagram, with a short field summary and a direct link to the evidence record.                                                                                 |

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

## Explicit destinations, 13 November 2026

Flow names are plain headings in the overview. Each reviewed row offers one **View field evidence** link and one **View flow diagram** link. An unreviewed row offers only the flow diagram. The name never changes destination with review status, and the row does not repeat the field-page link. Diagram links lead directly to the flow’s **Step by step** section. Full evidence pages use the same **View flow diagram** destination. Search results remain links to the exact matching evidence entry.
