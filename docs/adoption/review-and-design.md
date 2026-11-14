# Original proposal for the Implementations directory

Design recommendation and bounded review, 12 November 2026 (America/Los_Angeles). “In the field” was the proposed name. For the published design, see [Implementation evidence](../development.md#implementation-evidence).

Reviewed the pilot at `cd049c6` on `feat/adoption-evidence`, its stored data dated 13 November 2026 UTC, and the supplied walkthrough. This is a proposal for discussion, not a new rating or a review of every ledger entry. The original pilot remains intact. New site sections still start with an issue.

## Recommendation

Keep **In the field**. Make it a maintained implementation directory and a record of deployment evidence, with a dated account of what changed. Put a compact summary on each flow and a comparison view across flows. Preserve the existing standards rating.

Do not publish the pilot’s Supply and Use scores or its Common/Established labels. The evidence is useful, but the transformations do not establish the adoption those labels imply. Changing the thresholds would not fix that.

The reader should leave able to answer:

1. What can I use for the role I need to implement?
2. Who describes running this, and in what setting?
3. What can we observe directly, and what population does that describe?
4. What changed since I last looked?

The general pattern is an evidence-backed technology landscape: a compatibility directory, deployment casebook and change log. It can help people assess technology without turning popularity into a recommendation. Borrow the distinction between attention and operating evidence from [Crunchbase’s Heat Score](https://support.crunchbase.com/hc/en-us/articles/39902159873043-What-is-a-Heat-Score) and [Growth Score](https://support.crunchbase.com/hc/en-us/articles/39902124712211-What-is-a-Growth-Score); retain observable facts in their original units.

## What to keep from the pilot

- The separation between standards maturity and evidence in the field.
- The 201-entry ledger as a research inbox. Its notes often explain limitations more accurately than the aggregate table does.
- Public metadata collection as a measure of advertised capability.
- Versioned observations, linked sources and repeatable extraction.
- The explicit separation of downloads and discussion from adoption.
- The record of rejected ideas. It is valuable to preserve why a plausible shortcut was declined.

The walkthrough is clear as a research presentation. As a reader-facing product it puts the methodology and a league table ahead of the practical question: which implementation can help with my system? Move that answer to the front, and let the methodology support it.

## Findings that change the design

### 1. Advertised support becomes production use

[`snapshot.mjs`](https://github.com/kevinswiber/whosonfirst.ai/blob/cd049c6/scripts/adoption/snapshot.mjs) adds the panel’s organization names to the adopter names before calling `use()`. The panel collector reads metadata; it does not observe feature usage.

For DPoP, the stored record combines seven panel members advertising support with two candidate adopters and reports nine named users. The walkthrough then says one more would make DPoP Established. That conclusion is not established by these inputs. [RFC 9449 §5.1](https://www.rfc-editor.org/rfc/rfc9449.html#section-5.1) defines the field as an advertisement of supported algorithms. It is not a transaction or deployment counter.

The two candidate DPoP adopter entries themselves need review: the ledger’s notes describe protocol/security-profile requirements and explicitly qualify runtime deployment. A mandate, supported feature and reported production deployment need different record types.

**Design consequence:** keep advertised capability and production reports separate. Also distinguish a product implementation, an operator and an organization. The “82 servers” panel is actually 82 organization entries, several of which combine multiple issuer addresses.

### 2. Units change during aggregation

The workload identity federation list entry counts PyPI **projects**. `use()` accepts its count as though it counted organizations; the snapshot consequently reports `named: 13000`. The [OpenSSF source](https://repos.openssf.org/trusted-publishers-for-all-package-repositories) says projects and gives a historical lower bound, not a current number of companies.

Likewise, certification lists are useful evidence of conformance for a particular implementation/profile. They do not automatically establish general availability, a purchasable offering, or independent product families. DPoP’s supply calculation converts a certification list into 16 generally available organizations through `listGa: true`. The [OpenID listing](https://openid.net/certification/certified-fapi-2-0-op-security-profile-final-message-signing-final/) identifies certifications, versions and profiles; release evidence belongs in its own field.

**Design consequence:** every count retains its unit and population. Never convert projects, certificates, endpoints or organizations into one another. Summaries use explicit deduplication and list membership; an aggregate count with unknown overlap stays a separate statement.

### 3. The MCP observation is narrower than the headline

[`census-mcp.mjs`](https://github.com/kevinswiber/whosonfirst.ai/blob/cd049c6/scripts/adoption/census-mcp.mjs) sends an unauthenticated `initialize` request. The shared HTTP helper cancels that response body without interpreting it. The summary calls every 2xx response `letIn`.

The stored rows contain 1,392 HTTP 200 and two HTTP 202 responses: 1,394 of 2,463 responses, or 56.6%. This establishes an HTTP status distribution. It does not establish a valid MCP initialization, successful tool access, or absence of authorization on protected operations. Those distinctions cannot be recovered from the saved rows. A public service may also intentionally expose public operations; the [MCP authorization specification](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) makes authorization optional.

The 835/931 result is conditional on endpoints returning 401. The collector accepts a resource metadata document when it contains either `resource` or `authorization_servers`; it does not establish full schema validity or a functioning end-to-end OAuth exchange. Calling the whole flow Common on that basis overstates the finding.

**Design consequence:** call this a sample survey of discovery behavior. State the request, response classification and denominator beside every result. It is neither an industry census nor a conformance assessment. Improve parsing before another collection; do not probe protected tools merely to rescue a headline.

### 4. A common scale does not create comparable evidence

[`rubric.mjs`](https://github.com/kevinswiber/whosonfirst.ai/blob/cd049c6/scripts/adoption/rubric.mjs) takes the strongest of named counts and observed shares. A local reproduction gives the highest Use grade to one positive observation out of one queried endpoint; one named organization receives grade 1. This is a counterexample to the rule, not a claim that the current panel has one member.

Even a minimum sample size would not make a convenience panel, a registry sample and a curated list of deployment stories exchangeable. Thirty named users do not establish that something is common across an unknown population. More research can increase a score without anything changing in the world. A more favorable denominator can do the same.

**Design consequence:** normalize the questions, evidence vocabulary and counting rules. Compare numerical series only within a defined population, instrument and version. Do not select whichever instrument gives the most favorable answer. Separate sampling uncertainty from coverage, nonresponse and classification error.

### 5. Quote matching is useful maintenance, not claim verification

[`ledger-check.mjs`](https://github.com/kevinswiber/whosonfirst.ai/blob/cd049c6/scripts/adoption/ledger-check.mjs) checks whether quoted words remain on a page. It does not validate that they entail the organization, role, stage, count or production claim. It does not check `stageEvidence` separately. Some entries explain inferred GA in their notes without setting `stageInferred`, so the 38 flagged entries are not a complete count of inference.

The snapshot builder counts all ledger entries toward supply/use regardless of review or freshness. `verified` affects its basis label, not eligibility. The proposed yearly decay is not implemented. A failed future quote check also does not clear the existing verification fields. Snapshots read each collector’s latest file, rather than a pinned set of inputs, and a second run on a day overwrites that day’s snapshot.

**Design consequence:** distinguish claim review, source retrieval and historical validity. A still-visible old deployment story proves that the story remains visible, not that the deployment still operates. A broken link does not prove a deployment stopped.

## What a reader sees

### On each flow

Keep the standards rating in its existing wording. Under it, show a short **In the field** summary with three labeled lines:

- **Implementation support:** named products, relevant roles and release conditions. For example, the [Keycloak release notes](https://www.keycloak.org/docs/latest/release_notes/index.html) document supported DPoP. That is a defensible product-support claim, scoped to those notes.
- **Production reports:** named operators and the use case they describe, with attribution and the report date. For example, [Pulumi describes using GitHub Actions OIDC and ESC in its own CI](https://www.pulumi.com/blog/eliminating-ci-secrets-with-pulumi-esc/). Count the operator once and keep repository counts as a separate measure of that deployment’s scope.
- **Recent changes:** a concise dated release, deployment report or retirement. If there is only one observation, say so.

Where a survey adds useful information, put a separate **Observed support** line beneath these. A DPoP example can say “7 of 82 panel members advertised DPoP in the pilot snapshot.” Keep “pilot” until the collection and its evidence are reviewed. Do not rewrite that as seven production adopters.

The full section below contains a product table and deployment accounts. Table columns: product, role, feature/profile, release or edition, evidence, checked date. A client library, an authorization server and a resource-server verifier answer different needs. Keep them visible rather than collapsing them into “five vendors.”

Release stages should preserve the publisher’s language. Explicit GA, supported stable releases, previews and unspecified stages can all be recorded. A project need not use the commercial phrase “generally available” to have a released implementation. Silence about preview is not release evidence.

All essential content remains available without JavaScript. Filters are conveniences over rendered records. Sources and limitations sit beside the facts they qualify.

### Across all flows

Add an **In the field** directory with a row per flow: standards status, documented implementation options, production reports, last material change and review date. Use the site’s existing group order; allow filtering by use case, role or named product when the records support it.

The most valuable later interaction is “What supports my stack?” A reader can find documented roles in products they use, then open the flow to understand what remains to build. Two products supporting the same standard is not proof that they work together; a documented integration or tested pairing gets its own evidence.

Use plain states such as “Released implementations documented,” “Preview implementations documented,” “Production reports found,” “No production report found in reviewed sources,” and “Not reviewed.” These are independent statements, not rungs on a universal adoption ladder. Show names and counts where reviewed; do not collapse unknown into zero or call sparse evidence “On paper.”

Represent the five planned flows in the research inventory, linked to their issues. Their publication follows the existing issue and content-review process. They need no invented standards rating to participate in the research.

### Over time

Make **what changed** the recurring editorial product. A concise monthly field report can link to maintained flow profiles and explain a new release, a first production account, a newly documented integration or a retirement.

Keep three distinct event kinds:

| Event                  | Example                                       | What it means                          |
| ---------------------- | --------------------------------------------- | -------------------------------------- |
| Change in the world    | A feature became supported on a dated release | Eligible for a release timeline        |
| Change in our evidence | An older deployment story was found today     | Added coverage; not new adoption today |
| Change in method       | Panel membership or a parser changed          | A break or revision in the series      |

Store event date, source publication date, first observation and review date separately. Unknown dates stay unknown. A report’s publication date is not automatically its deployment date.

Plot actual counts and shares only once there are comparable observations. Show both numerator and denominator; retain unreachable members as unknown. For a panel change, identify the version and, where useful, a same-members comparison. For a changing registry, distinguish repeated cross-sectional samples from a fixed cohort. Neither requires an arbitrary six-month wait to show two honest dated observations, but two observations do not establish a durable trend.

Retire the automatic rising/steady/falling arrow that blends downloads and mentions. If attention earns space, show each named series with its own units and interval. Prefer the activity a practitioner can act on: maintained releases, independent implementations and published deployment accounts. Keep community participation and package downloads available as secondary context, with duplicate posts, bots and build traffic acknowledged.

## A small evidence model

Start with files and the existing static build, not a new service. Split observations from reviewed claims; do not build a general research platform.

| Record       | Required distinctions                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Flow profile | Exact mechanism/version, roles, inclusion and exclusion rules                                           |
| Entity       | Organization, product/project, operator; explicit aliases and ownership where established               |
| Claim        | Entity, mechanism, role, claim type, scope, source, supporting excerpt/locator, reviewer and decision   |
| Observation  | Instrument/version, population/version, target, time, raw field/status, outcome including unknown/error |
| Count        | Unit, numerator, denominator where meaningful, included members or an attributed external aggregate     |
| Snapshot     | Explicit input identities, observation dates, extraction version, methodology version and review status |

Claim types include implementation support, release stage, certification, deployment report and retirement. Metadata is an observation of advertised support. A parser must not manufacture a deployment claim from it.

A claim is accepted only when a reviewer confirms its exact subject, mechanism, role and context. Automated extraction can propose claims and flag changes. The quote checker is a retrieval check. A reviewed claim retains that review identity independently of the checker’s latest result.

For all 25 flows, write a short scope contract before counting. Examples: RFC 9470 step-up versus generic MFA; OAuth certificate-bound access tokens versus TLS client authentication; URL elicitation versus generic elicitation; AuthZEN policy interfaces versus any authorization engine; workload identity federation versus only one cloud’s product. Related evidence can be linked without being counted as an implementation of the whole illustrated flow.

Use per-claim review states: pending, accepted, disputed and superseded. Retrieval separately records fetched, changed or unreachable. Current summaries can say that a review is overdue; historical deployment reports remain historical records. Remove a present-tense claim on evidence or editorial review, not merely because a timer fired or a website had an outage.

## Collection and maintenance

Reuse the collectors after correcting their claim boundaries. Before another broad run:

- Preserve an exact sample frame, selected targets and collector version privately, with a minimized public aggregate. A seed alone cannot reproduce a sample from a registry that changes. Keep enough issuer identity to deduplicate shared providers and enough source context to audit extraction. Define retention and publication separately.
- Classify HTTP results, valid protocol results, declared metadata and tested behavior separately. Validate the relevant resource/issuer identity. Preserve failures and missing fields as unknown where appropriate.
- Label the current MCP authorization-server statistics as resource-weighted observations unless issuers have actually been deduplicated. The code counts one attached authorization-server observation per sampled resource, not distinct authorization servers.
- Report scoped counts without implying an industry estimate. The convenience panel has no industry sampling margin. A registry sample’s sampling interval does not account for omitted private systems, the approximate operator heuristic or classification error.
- Bound requests and redirects explicitly, identify the collector and contact page, respect rate limits, and review each source’s collection/publication terms. Redirect and DNS handling need to enforce public destinations; the prototype’s hostname check alone is insufficient. Do not add registration, credentials or protected-operation tests to the survey.
- Fix pinning of snapshot inputs and retain separate runs. A fresh snapshot must not silently inherit stale collection dates as fresh observations.

Do not call maintenance free. The pilot incurred no stated data subscription charge; review, collection and corrections take work. Budget the first review on a representative subset and measure the actual time before committing to a monthly promise.

My initial spending priority would be expert review and small, permissioned practitioner interviews. Interviews can yield useful, attributable deployment accounts before the site has an audience large enough for a prevalence survey. A later survey should publish recruitment and sampling limits. A public contribution form can request an operator, exact mechanism, role, environment and a link; submissions remain review candidates.

Do not purchase a dataset until a sample demonstrates that it answers a missing question and its contract permits the intended public output. The pilot’s broad dismissal of all paid sources goes beyond the terms it actually reviewed. Metadata access, source attribution and permission to redistribute a dataset are separate questions. This proposal makes no new licensing determination and authorizes no purchase.

## Delivery sequence and acceptance

1. **Review six contrasting flow profiles:** PKCE, DPoP, MCP authorization, workload identity federation, SPIFFE and one of the planned flows with sparse evidence. Use the existing pilot as the inbox; record explicit scope and review decisions. Do not spend more on collection until the claims are sound.
2. **Prototype the flow section and implementation directory.** Show real, reviewed examples, including incomplete evidence. Ask a small number of target readers to find a usable implementation, distinguish advertised support from use, and explain what changed. The test is task success and accurate interpretation, not whether they like a score.
3. **Cover every published flow with the same questions.** An honest “not reviewed” or “no qualifying report found” is acceptable. Record planned flows internally. Remove the research cap; use a declared search scope and stop rule rather than claiming exhaustive coverage.
4. **Publish through the normal issue and PR process.** Start with reviewed profiles and one scoped field report. Preserve no-JavaScript access, source links, names, review dates and explicit unknowns.
5. **Run a second comparable observation.** Reconcile it manually before scheduling. Measure review effort and correction volume. Only then promise an update cadence.

Acceptance examples for the eventual implementation: advertised DPoP cannot increase a production-user count; 13,000 projects cannot become organizations; an HTTP 200 cannot become authenticated tool access; a missing document cannot become retirement; a newly found old report cannot appear as new adoption; one source used for several claims cannot become several independent sources; changing the sample frame cannot masquerade as feature growth.

## Decisions and reasons

| Decision                      | Reason                                                                            | What could change it                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| No universal adoption score   | Heterogeneous populations and evidence types lack a validated conversion          | A narrowly defined population, validated instrument and a demonstrated reader decision it improves    |
| No combined adoption level    | Availability and reported use can disagree in useful ways                         | User research shows a particular factual shorthand is accurate and useful; keep the underlying fields |
| Keep implementation roles     | A reader needs to know which part of the system is provided                       | Nothing foreseeable; simplify the presentation, not the distinction                                   |
| Keep certification separate   | Profile conformance is valuable but does not establish release or operational use | Separate release or deployment evidence supports those additional claims                              |
| No automatic adoption decay   | Stale knowledge is not evidence that usage declined                               | Explicit retirement or reviewed contradictory evidence                                                |
| No public league table        | These flows are often complementary and serve different needs                     | Rankings within a genuinely comparable, explicitly defined measurement                                |
| No blended attention arrow    | Mixed windows and instruments obscure what changed                                | A named, sufficiently observed series can support a scoped trend statement                            |
| Interview practitioners early | Specific deployment evidence does not require a representative prevalence survey  | Stop if attribution or specificity is too weak to publish useful accounts                             |
| Put the directory on the site | Readers need usable implementations and precedents alongside the flow             | The pilot reader tasks show little value or maintenance costs cannot be sustained                     |

## Review limits

This pass inspected the scoring and collection paths, recomputed selected results from stored data, and spot-checked primary sources supporting the findings and examples above. It did not rerun the collectors, review every claim, certify any implementation, or establish current adoption prevalence. Passing the rubric’s existing tests demonstrates that the code follows its chosen rules; it does not validate those rules as a measure of adoption.
