# In the field progress

**13 November 2026 · Integrated the 25-flow catalog from main and verified locally; field directory not deployed.** [Issue #84](https://github.com/kevinswiber/whosonfirst.ai/issues/84) tracks the directory and flow evidence sections. The [design](review-and-design.md) and [evidence review](evidence-review.md) describe the intended reader tasks, primary sources and decisions.

## Current implementation

- Show all 25 published flows in the overview in the existing group order. Keep its examples bounded and link to full evidence pages at `/field/<slug>/`. Flow guides retain a compact summary and the existing `#in-the-field` anchor. Use **Not reviewed** for coverage still pending.
- Keep the standards rating and show role-specific implementation support, named operator reports, observations and dated changes independently. The first release has no adoption score or public survey results. Keep the pilot data available for research.
- The data covers ten of 25 published flows, with 35 implementation entries and ten operator accounts. The extension adds Device authorization, Client credentials, Token exchange, CIBA and A2A, and brings DPoP to five implementation options. No observation records are selected. The five newly published flows remain unreviewed for field evidence. The research inventory records the bounded AuthZEN review as a candidate.

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

## Local review

The implementation is on `feat/in-the-field`. Run `npm run dev` in that worktree, then open `/field/` and `/field/dpop/`. Search for a product plus role, such as “spring resource-server verifier”, and follow its exact evidence link for the sources and limits. The full record links back to `/flows/dpop/` for the mechanism. There is no new service, dependency, collection schedule or network request from a reader’s browser.
