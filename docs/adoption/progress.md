# In the field progress

**12 November 2026 · First implementation complete; not deployed.** [Issue #84](https://github.com/kevinswiber/whosonfirst.ai/issues/84) tracks the directory and flow evidence sections. The [design](review-and-design.md) and [evidence review](evidence-review.md) describe the intended reader tasks, primary sources and decisions.

## First release

- Show every published flow in the directory in the existing group order. Give reviewed flows a summary and source-linked evidence on the flow page. Use **Not reviewed** for coverage still pending.
- Keep the standards rating and show role-specific implementation support, named operator reports, observations and dated changes independently. The first release has no adoption score or public survey results. Keep the pilot data available for research.
- The initial data covers five of 20 published flows, with 13 implementation entries and four operator accounts. No observation records are selected. The research inventory lists five planned flows and records the bounded AuthZEN review.

## Validation and next steps

The initial data validation review found four gaps. An event could pass with a date or claim category its source did not support. Advancing a review date invalidated earlier evidence additions. A hostname-free URL and inherited JavaScript object keys passed some checks. A profile slug outside the published catalog could silently disappear. All four were fixed and confirmed in a second review. That review found two integration issues: shared structured metadata would attribute the limited field review to the site author, and the source-review runbook did not include field records in its routine. Both were corrected; a built-site check now guards the metadata boundary.

The directory, flow integration, navigation, alternate Markdown and source tracking are complete. Focused type/data and browser checks passed. Visual inspection covered desktop and phone layouts in both themes. A phone filter row was tightened after that inspection. The source command retrieved 16 new URLs and preserved all 123 prior validators without requesting them again. The required gates passed in order: `npm run check`, `npm test` (99 tests), `npm run build` and `npm run check:rendered` (853 passed, six skipped). The first rendered run found four instances of summary text just below 16 px. The font size was corrected; all 40 focused text-size checks passed before the final complete gate run. No check was removed or weakened. Build-time metadata checks also confirm that the new records carry no unsupported whole-page reviewer attribution.

Reader evaluation remains pending. Ask readers to find an implementation for a given role, identify what a production report establishes and distinguish a dated release from an older report newly added to the directory.

## Local review

The implementation is on `feat/in-the-field`. Run `npm run dev` in that worktree, then open `/field/` and `/flows/dpop/#in-the-field`. Search for a product plus role, such as “spring resource-server verifier”, and follow the flow link for the sources and limits. There is no new service, dependency, collection schedule or network request from a reader’s browser.
