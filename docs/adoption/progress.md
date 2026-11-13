# Implementations progress

**13 November 2026 · Completed and locally verified scoped field records for all 25 published flows.** [Issue #84](https://github.com/kevinswiber/whosonfirst.ai/issues/84) tracks the directory and flow evidence sections. The [design](review-and-design.md) and [evidence review](evidence-review.md) describe the intended reader tasks, primary sources and decisions.

## Current implementation

- Show all 25 published flows in the overview in the existing group order. Keep its examples bounded and link to full evidence pages at `/implementations/<slug>/`. Flow guides place a summary at `#implementation-evidence`, after standards and before related flows. Use **Not reviewed** for coverage still pending.
- Keep the standards rating and show role-specific implementation support, named operator reports, observations and dated changes independently. The first release has no adoption score or public survey results. Keep the pilot data available for research.
- The data covers all 25 published flows, with 80 implementation entries, 19 attributed deployment accounts and one scoped interoperability observation. Entries state their actual roles and any prototype status, revision mismatch or missing production evidence. Coverage is a source-review result, not a prevalence estimate or a claim that the illustrated flow is implemented end to end.

## Initial validation

The initial data validation review found four gaps. An event could pass with a date or claim category its source did not support. Advancing a review date invalidated earlier evidence additions. A hostname-free URL and inherited JavaScript object keys passed some checks. A profile slug outside the published catalog could silently disappear. All four were fixed and confirmed in a second review. That review found two integration issues: shared structured metadata would attribute the limited field review to the site author, and the source-review runbook did not include field records in its routine. Both were corrected; a built-site check now guards the metadata boundary.

The directory, flow integration, navigation, alternate Markdown and source tracking are complete. Focused type/data and browser checks passed. Visual inspection covered desktop and phone layouts in both themes. A phone filter row was tightened after that inspection. The source command retrieved 16 new URLs and preserved all 123 prior validators without requesting them again. The required gates passed in order: `npm run check`, `npm test` (99 tests), `npm run build` and `npm run check:rendered` (853 passed, six skipped). The first rendered run found four instances of summary text just below 16 px. The font size was corrected; all 40 focused text-size checks passed before the final complete gate run. No check was removed or weakened. Build-time metadata checks also confirm that the new records carry no unsupported whole-page reviewer attribution.

## Overview and full-record extension

The [design update](overview-and-records.md) separates three reading tasks: compare coverage and find products across flows, read a complete evidence record, and learn how a mechanism works. Overview rows and flow summaries show at most two product examples and one operator example. The counts refer to reviewed entries; the full record retains every source, role, release condition, limit and dated event. Search indexes entries beyond the examples and links directly to them. All ten full records have Markdown copies and are readable with JavaScript off.

An independent review found a product-role search error: a role named in a flow’s description could be borrowed by a product entry. Evidence searches now use the flow’s name and slug plus one entry’s own name, owner and role. The regression checks both the rejected “ciba openid-client authorization server” query and the valid client-library query. The review also added Keycloak’s confidential-client prerequisites and qualified the AgentCore A2A example as 0.3.0, with 1.0 compatibility unestablished. The record’s 45 search links were checked against their static evidence anchors.

The source-validator command considered 34 new URLs: 31 answered and three returned HTTP 403 (two eBay pages and ICA Banken). Their primary-source pages were read through the web reader during review; the separate retrieval failures remain recorded with empty validators. All 139 earlier entries were preserved without another request. The source inventory now has 173 entries. Retrieval status is separate from claim review.

Focused type, evidence, source, navigation, search, scriptless and print checks passed. Visual inspection covered the overview, full DPoP record, exact search target and mechanism summary at desktop and phone widths in both themes. One complete rendered run found that the newly registered field page also needed to be classified as a long read in the shared browser suite. It now receives the stronger persistent-header and section-navigation checks; all 30 focused checks passed before the final run. The required gates then passed in order: `npm run check`, `npm test` (99 passed), `npm run build`, and `npm run check:rendered` (895 passed, six skipped). No check was removed or weakened. A README table formatting failure and the initial rendered failure were retained with the recovery logs.

The extension used one host, four builds, two complete rendered runs and one independent review with bounded corrections. Source and browser checks use the installed toolchain. No collection campaign or interoperability test was added. Reader evaluation remains pending: ask readers to find a product for a given role, explain the difference between an implementation and an operator account, and distinguish a dated release from an older report newly added to the directory.

## Main integration, 13 November 2026

Merged `origin/main` at `77bdbff` into the field branch, preserving the existing signed implementation commits. This brings in Tool-call authorization, Access revocation, OAuth mTLS, Biscuit delegation and GNAP, plus the related-flow and sender-constraint corrections. The directory now includes all 25 flows; its ten accepted profiles and their evidence-review dates are unchanged. The five new entries say **Not reviewed**, link to their mechanism guides, and have compact field summaries. The AuthZEN research remains a candidate for a full field profile.

Resolved conflicts in the README and generated source inventory. The repository’s source command regenerated the combined inventory from main’s saved values: 189 sources, with 139 previous entries preserved and 50 field sources requested. The same two eBay URLs and ICA Banken URL returned HTTP 403; these retrieval failures do not change the existing claim review.

All four gates passed in order on the merged site: `npm run check`, `npm test` (99 passed), `npm run build`, and `npm run check:rendered` (945 passed, six skipped). A focused inspection confirmed the new directory rows, guide links and field summaries. One host, one build and one complete rendered run; no recovery cycle or additional source research. Nothing from this feature branch was pushed or deployed.

## Complete coverage and clear destinations, 13 November 2026

The overview now uses plain flow headings and two explicit actions: **View field evidence** and **View flow diagram**. Diagram links go directly to the guide’s **Step by step** section. This removes the duplicate full-record destination and makes the choice visible without guessing what a flow name opens. Search continues to link to exact entries, including those outside each row’s examples.

Three source-review lanes completed the remaining 15 profiles. The [evidence review](evidence-review.md) retains sources, inclusion decisions and exclusions for each. An independent check corrected the GNAP classification: the play-money test wallet is not a production report, while GateHub’s production account remains attributed and its deployed GNAP revision unspecified. The records also state CAEP pairing limits, Claude Code runtime prerequisites and authgent’s reported missing-scope behavior. All 25 profiles passed model validation.

The source inventory added 75 canonical URLs and preserved the 189 existing entries without requesting them again. Seventy-four new sources answered the retrieval command; the OpenAI operator page returned HTTP 403. It was read through the web reader during the source review. Its empty validator remains a retrieval limitation, separate from the reviewed report. The inventory has 264 sources.

The first ordered gate attempt found missing source-host registrations in the source-review runbook. The source review’s domain list was extended to the actual cited hosts; the failing evidence is retained. No check was weakened.

The final required gates passed in order: `npm run check`, `npm test` (99 passed), `npm run build`, and `npm run check:rendered` (960 passed, six skipped). The navigation regression follows both destinations with JavaScript off. Final built-site inspection covered the overview and a complete record at desktop and phone widths, including dark mode. The progress receipt was updated after those gates and checked separately.

This completion pass used one host, one build, one complete rendered run and one source-list recovery after the early unit failure. Three bounded research lanes and one continuing independent reviewer covered the new records. No product interoperability or production system was tested. Failed and successful logs and screenshots were retained. Human reader evaluation remains pending.

## Implementations navigation, 13 November 2026

The reader-facing section is now **Implementations**, with `/implementations/` and `/implementations/<slug>/` routes. Headings, navigation, breadcrumbs, About, metadata and generated Markdown agree. Flow guides expose a named evidence section through their section menu and retain `#in-the-field`; its new `#implementation-evidence` heading avoids the workload guide’s existing `#implementations` fragment. Home, flow cards, decision-guide results and relevant deployment next steps link to the records. Records link back to the mechanism and directory.

Search now displays every matching accepted entry, including queries that name the flow. Product and role still have to match within one record. Coverage, attribution and “Mention is not recommendation” remain explicit. [Issue #87](https://github.com/kevinswiber/whosonfirst.ai/issues/87) tracks the separate static **By product** / **By flow** browsing and reviewed product grouping. Finding a product across flows still requires the search enhancement or visiting individual records. Human reader evaluation remains pending.

The required gates passed in order: `npm run check`, `npm test` (99 passed), `npm run build`, and `npm run check:rendered` (964 passed, six skipped). The focused navigation and Markdown checks passed, including a three-entry role query, scriptless contextual links, the existing workload fragment and exact evidence destinations. Built-site visual inspection confirmed the directory search, renamed record and flow section menu. No evidence data changed.

The pass used one host, three short builds, two full rendered runs and one continuing reviewer with two bounded review rounds. The first full run found a 15 px evidence-date paragraph and incorrect section tracking for side-by-side headings. The date is now 1 rem; section tracking follows visual position and honors a selected fragment at the header. All 64 focused typography/menu checks passed before the final full run. Earlier formatting and test-selector failures, the failing full run and recovery logs were retained. The progress receipt was checked separately after the gates. The branch is prepared for review; merge and deployment remain outside this pass.

## Evidence presentation and review details, 13 November 2026

Flow summaries now follow **Standards in play** and precede **Related flows**, with the normal responsive section gap. They name reviewed implementation examples and their roles, describe the included deployment report, and state that the selection does not measure use. Overview counts say **in this review**; empty categories describe the record’s coverage. Record pages use **Deployment reports** consistently and link to **Browse implementations across all flows**. The existing `#in-the-field` alias and `#implementation-evidence` heading remain usable.

The source disclosure keeps **About this guide** and **Specification basis** in independent columns, stacking in that order on a phone. All basis references stay together. Existing diagram qualifications, dates, ratings and source evidence are preserved. An independent review checked all flow fragments and representative Markdown, then identified wording inconsistencies and the removed alias; both were corrected.

The final required gates passed in order: `npm run check`, `npm test` (99 passed), `npm run build`, and `npm run check:rendered` (967 passed, six existing skips). Focused checks cover scriptless summaries, review scope, old fragments, directory navigation and one- and two-reference disclosures at desktop and phone widths. Visual inspection confirmed the section gap, stacked disclosure and directory link. The receipt was checked separately after the gates.

This pass used one host, three builds, two complete rendered runs and one continuing reviewer. The final rebuild and rendered run include the two reader-requested presentation corrections made during visual review. Logs and screenshots are retained. No source research or evidence-data change was needed. Push and CI verification are authorized; merge remains outside this pass.

## Linked examples and card presentation, 13 November 2026

Flow summaries now use small labeled cards, matching the surrounding standards and related-flow sections. The directory uses compact lists. Both retain visible roles or deployment settings and link each product or organization name to its exact evidence entry. A shared component renders both forms; bounded selection keeps the entry ID. Coverage counts, accepted evidence, sources and review dates are unchanged. Targeted evidence entries and directory rows use a thin accent border and soft shadow, with padding, matching the standards pattern.

All four required gates passed on the final layout: `npm run check`, `npm test` (99 passed), `npm run build`, and `npm run check:rendered` (968 passed, six existing skips). Scriptless navigation follows product and deployment examples from both surfaces at desktop and phone widths; the full rendered suite checks internal fragments, overflow, accessibility, print and reading formats. The generated Markdown preserves the card classifications, names, roles and links. Desktop previews confirm the cards, compact directory and target border; a narrow-viewport inspection confirms the cards stack. The progress receipt was checked separately after the gates.

The pass used one host, four short builds and three full rendered runs as the reader requested target styling and then cards during preview. All full rendered runs passed. Formatting failures and their successful corrections, earlier passing logs and screenshots are retained. No new source research, evidence-data change, dependency or review lane was needed. Push and CI verification are authorized; merge remains outside this pass.

## Local review

The implementation is on `feat/in-the-field`. Run `npm run dev` in that worktree, then open `/implementations/` and `/implementations/dpop/`. Search for a product plus role, such as “spring resource-server verifier”, and follow its exact evidence link for the sources and limits. The full record links back to `/flows/dpop/` for the mechanism. There is no new service, dependency, collection schedule or network request from a reader’s browser.
