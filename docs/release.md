# Releasing the guide

One Worker serves the pages and answers a search. The **Release the guide** workflow, in GitHub Actions, deploys it on every push to `main`. Cloudflare Workers Builds builds a preview of every other branch from the same configuration, and does not deploy the site.

The Worker has three parts, which `src/site.ts` joins and `cloudflare.config.ts` declares:

- **The page handler**, `src/worker.ts`. It sends a page or its Markdown copy, and hands `/search` unchanged to the next part.
- **`Search`**, a second entrypoint of the same Worker. [Workers Cache](https://developers.cloudflare.com/workers/cache/) is on for this entrypoint and off for the page handler ([per-entrypoint caching](https://developers.cloudflare.com/workers/cache/configuration/#per-entrypoint-caching)).
- **`SearchBudget`**, a Durable Object that counts the searches of a day.

A search is `GET /search?q=…`, with the question in the query string. The Worker sets `observability.redactQueryString`, so logs and traces record the address without it, and search emits no application logs. Review account-level logging and retention separately.

## Nothing of an account is in the repository

`cloudflare.config.ts` reads the search limiter from the environment of the build: `SEARCH_RATE_NAMESPACE`, a numeric identifier, and `SEARCH_RATE_LIMIT`, the searches one address may make in a minute. With neither, the site builds without search: the pages, the Markdown copies and quick matches work, and a search answers that it is unavailable. That is what `npm run build` makes on a contributor’s machine, and what someone deploying a copy of the site gets from `npx cf deploy` until they set search up. With one and not the other, the build stops and names the one that is missing.

`SEARCH_NAMESPACE` and `SEARCH_INSTANCE` name the AI Search namespace and instance. They default to `whosonfirst` and `whosonfirst-guide`, which are names in whichever account the site is deployed to, not identifiers of one. The cap for the day is a secret of the Worker and is never in a file.

## Set up once

1. Create the Worker and attach the site’s domain to it. The Worker’s name is in `cloudflare.config.ts`. The first deployment is made by hand, with `npx cf deploy`, by someone who may create a Worker: a role on one Worker cannot be given before the Worker exists ([Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/)).
2. Create the AI Search namespace and instance, with both keyword and vector indexing enabled.
3. Set the Worker’s secret `SEARCH_DAILY_BUDGET` to the number of searches that may reach AI Search in a UTC day: `npx cf workers secrets update SEARCH_DAILY_BUDGET --worker whosonfirst-ai`. `SearchBudget` counts them for every location. Once the day’s count reaches the budget, search answers that it has answered all it can for today, until midnight UTC. Quick matches still work, because they are a file. Without the secret, or with one that is not a whole number above zero, search is unavailable rather than unlimited. To change the budget, update the secret. A release keeps it.
4. In the repository, create the **search-production** GitHub environment and select `main` as its only deployment branch. The workflow’s triggers are pushes to `main` and manual runs from `main` in the upstream repository.
5. Set the environment variable `SEARCH_RATE_NAMESPACE` to a number of your choosing for this Worker’s rate limiter. Use a different number from other limiters in the same account. Set it once and reuse it across releases. `SEARCH_NAMESPACE` and `SEARCH_INSTANCE` are optional. Use the same values for indexing and retrieval.
6. Set the environment secret `SEARCH_RATE_LIMIT` to the number of searches one address may make in a minute. The limiter counts each Cloudflare location on its own, and its count is approximate. It is a secret, not a variable, so that the public run log masks it.
7. Set the environment secrets `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_SEARCH_UPLOAD_TOKEN` and `CLOUDFLARE_WORKER_DEPLOY_TOKEN`. Both tokens are account-owned and scoped to the one account. The upload token needs AI Search Edit and Run: it lists and uploads items and purges the instance’s cache. The deploy token has the **Editor** role on this one Worker and nothing else. That is enough to deploy an existing Worker with its bindings, and a deployment that does not change the domain needs no permission on the zone ([Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/)). Each token is available only to its own step.
8. In the Worker’s Workers Builds settings, keep the repository connected and preview builds on, with the preview command `npx cf previews deploy`. Set the production deploy command to one that deploys nothing: the workflow deploys `main`, after indexing, and a second deployment from Workers Builds would go out before the passages are indexed. Leave the separate build command empty.
9. For previews, set the build variables `SEARCH_RATE_NAMESPACE` and `SEARCH_RATE_LIMIT` in Workers Builds, and the secret `SEARCH_DAILY_BUDGET` in the Worker’s Previews Base. [Pull request previews](#pull-request-previews) says what each does.

To release the current commit again after changing settings or credentials, choose **Actions → Release the guide → Run workflow** and select `main`. The run’s one input, **index**, is on. Turn it off only to release the pages while AI Search cannot be reached: the run then deploys without uploading or retiring passages, and search finds less for the passages that changed until the next run with it on.

## Pull request previews

Open the site preview linked by **Workers Builds** on the pull request. It is the same Worker, built from the same configuration as the site, so what a preview does with a search is what the site will do.

Quick matches come from the branch’s catalog. Full search uses the published index and accepts hits whose content keys match the branch’s rendered passages. Added or edited passages become eligible once a release indexes them: only the release workflow uploads passages. A preview of a branch that is behind `main` finds fewer results for pages `main` has changed since.

A preview is built with the limiter that Workers Builds’ variables give it. Without them it is built without search. Each preview has its own count of the day’s searches, because Cloudflare gives each Preview its own Durable Object namespace and storage for a class defined in the same Worker ([Previews: Durable Objects](https://developers.cloudflare.com/workers/previews/resources/#durable-objects)). So a preview cannot use up the site’s day. Its cap is the secret `SEARCH_DAILY_BUDGET` in the Worker’s Previews Base. A Preview copies the Base secrets when it is created, and later changes to them reach only new Previews, so set the secret before a branch’s first push. A preview without it answers that search is unavailable until the secret is set on that Preview itself. Previews spend the same AI Search queries as the site, so the most a day can cost is the site’s cap and each preview’s cap together. Keep the preview cap low, and delete previews that are done with.

## What a release does

The workflow builds the checked-out commit once. `node scripts/release.ts check` stops the run unless the build was made from that commit, has search, and the commit is still the head of `main`.

Then the passages are indexed, before anything is deployed. `search:sync` uploads the passages this build has that the index does not, reuses the ones it has, and waits for Cloudflare to report completion and at least one indexed chunk for every current passage. Then it purges the instance’s similarity cache, because new passages do not clear an answer cached from the earlier index. This is safe to do under the site that is still serving: a search shows only the passages in its own build, each named by its place and a digest of its text, so the site being replaced does not see the new ones. Item inventory, upload and purge errors stop the run before the deployment.

`node scripts/release.ts deploy` checks `main` again and deploys the build with `cf deploy --prebuilt`. The pages and search change together, in one deployment, so there is no moment when one is from a different commit than the other. The version’s message is **Guide at** and the commit.

A search that passes the limit for its address is counted against the daily budget before it reaches AI Search, and one that does not pass is not counted. Each search asks AI Search to reuse a cached answer only for a near-identical question (`super_strict_match`), whatever the instance’s own cache setting. With the looser default, a search for RFC 9396 listed a page that does not mention it (seen 21 November 2026). The response’s `Server-Timing` header gives how long the address limit, the budget and AI Search took, and nothing about the question. The service returns opaque keys.

Each question has one address. The Worker searches the question in a plain form: compatibility characters such as full-width digits become their plain form, and runs of spaces become one. The reader’s capitals are kept. Any other spelling of the address, including extra parameters, is redirected to it, and a search with no question goes to `/search/`. The search box asks for `&format=json` and the page without scripts for the HTML. [Workers Cache](https://developers.cloudflare.com/workers/cache/) keeps a found answer in front of `Search` for 48 hours (`s-maxage`), for each deployed version, so a release starts with an empty cache and nothing has to be purged. A cached answer does not run `Search`: it costs no AI Search query and is not counted against the limit for the address or the budget. On a cached answer, `Cf-Cache-Status` is `HIT`, and `Server-Timing` is the one the answer was found with. Every other response is `no-store`. A browser revalidates each answer (`max-age=0`). A link to a search can be followed from any site, but a request another site makes in the background is refused, and so is a browser opening a search ahead of time (`Sec-Purpose: prefetch`). The site’s speculation rules leave `/search` out, and `robots.txt` disallows it. Only keys in the build’s own catalog, `/search/catalog.json`, can become results.

After the deployment, a synthetic `GET /search?q=…&format=json` to the site checks that it serves this commit and its passages and can return one. It sends a fixed example question and prints only the outcome. The site’s address is read from the build’s sitemap. After that, the last step retires the passages the site no longer has, as [Retiring old passages](#retiring-old-passages) describes. To go through a release without credentials or a deployment, run `SEARCH_RATE_NAMESPACE=1 SEARCH_RATE_LIMIT=5 npm run build`, `npm run search:sync -- --dry-run`, then `npx cf deploy --prebuilt --dry-run`. The limiter number and limit in this example belong only in test builds.

## Review retrieval quality

Before promoting a change to passage extraction or ranking, run the editorial evaluation against the populated instance with the same build and manifest. `node scripts/evaluate-search.mjs --json > /tmp/guide-search-evaluation.json` submits the fixture questions three ways, with AI Search’s cache off, and saves the displayed results: keyword and hybrid search in AI Search’s own order, and the hybrid search the Worker makes, put in order again by the reranking model. `node scripts/evaluate-search.mjs --replay /tmp/guide-search-evaluation.json --review` prints their destinations and excerpts, followed by the scores. A replay scores the modes the saved report has, so a report saved before reranking was added is scored for keyword and hybrid. Omit `--review` for just the scores. Use the account, instance and evaluation credentials named by that script. No reader queries are needed.

The fixed set contains 15 situations, five lookups, one ambiguous question and two off-topic controls. Where possible, repeat the comparison with unfamiliar readers’ questions that were reserved from ranking development. Compare situations with an intended destination in the first three, exact lookups with the intended destination first, ambiguous queries covering both interpretations in the first three, and off-topic questions returning no passages. Check whether the excerpt lets a reader distinguish the correct destination from a plausible neighboring flow. Record the fixture revision, scores and significant misses. On 21 November 2026 reranking put a target page in the first three for 12 of the 15 situations, against 8 without it. It kept the ambiguous question and both off-topic controls right, and moved the glossary entry for “What does audience mean?” from first to second. It is slower. Called through the REST API, a search that was not cached took a quarter to three quarters of a second longer at the median, in four runs. Through the branch preview’s Worker, eight new questions took 1.8 to 3.8 seconds to search, against 0.7 to 2.3 seconds for the same questions on the live site, which did not rerank then. The Worker now waits 10 seconds for AI Search, not 5, and the page waits 12 for the Worker. Choose the hybrid rollout only when it improves situation retrieval while retaining dependable exact lookup and usable excerpts; report ambiguity and false positives explicitly. The release’s synthetic search measures availability and version agreement. Retrieval quality is decided by this review.

## Retries and rollback

Runs are serialized. If a new push supersedes a run, the older run fails its next check of `main`. Retry the run for current `main`. A run that fails before the deployment has changed nothing a reader sees: it may leave new passages in the index, which no deployed site shows, and rerunning reuses them. A run that fails **after** the deployment, at the synthetic search, means the new version is serving. Check the Worker’s deployment history and its `SEARCH_DAILY_BUDGET` secret before retrying.

For an incident, disable **Release the guide** in GitHub Actions and cancel any queued or in-progress run. In the Worker’s deployment history, identify the last healthy version by its **Guide at** commit message, and redeploy that version to 100%. The pages and search go back together, because they are one version. A version from before the move to one Worker cannot be chosen: [Going back from the first deployment](#going-back-from-the-first-deployment) says why, and what to do. That version’s passages have been retired unless it is the current release, so index them again from its commit, as [Retiring old passages](#retiring-old-passages) describes. Confirm the release marker at `/search/release.json`, a search’s response headers and a real result, then re-enable the workflow and run it on `main` when the fix is in place.

## Going back from the first deployment

This section is for the move from two Workers to one. It goes when the second Worker, `whosonfirst-ai-search`, is deleted.

The first deployment of one Worker cannot be undone in the Worker’s deployment history. It creates the `SearchBudget` class, and Cloudflare refuses a rollback when a Durable Object class was created, deleted or changed between the version that is serving and the version chosen ([Rollbacks: bindings](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/#bindings)). The version before the move is on the far side of that, even while the second Worker still runs.

Going back is a new deployment that hands a search to the second Worker again and keeps the class:

1. Disable **Release the guide** in GitHub Actions and cancel a run in progress, so that nothing is deployed over it.
2. From a checkout of `main`, as someone who may deploy the Worker, run the command below. It builds the site and deploys it, in about two minutes.
3. Check a page, the same page asked for as Markdown, and a search.

```bash
SEARCH_WORKER=whosonfirst-ai-search npm run deploy
```

A build given `SEARCH_WORKER` has no search of its own. Its page handler hands `/search` to that Worker over a service binding, as the site did before the move. Nothing is kept by Workers Cache, and `SearchBudget` stays declared and is not used. `test/build/deploy.test.mjs` holds such a build to that, and `npm run deploy -- --dry-run` with the variable set shows what it would deploy.

The second Worker searches with the passages of the commit it was released from. If the release got as far as retiring passages, it finds fewer results for what has changed since, and none that are wrong.

When the fault is fixed on `main`, enable the workflow again and run it. Every later deployment has `SearchBudget` on both sides, so it can be undone in the deployment history as [Retries and rollback](#retries-and-rollback) describes. Do not delete the second Worker until a release has passed its search and the site has been watched for a while: after that, this way back is gone.

## Retiring old passages

The last step of a release, `npm run search:sync -- --retire`, deletes the passages the site no longer has. It runs once the new site is answering and its synthetic search has passed, because until then the version it replaces still searches them. It deletes an item only if two things hold: the item is named as this project names a passage (`<32 hex digits>-<32 hex digits>.md`), and the current manifest does not have it. It deletes nothing unless every passage of this release is indexed. An item named any other way is left alone and counted in the log. The log gives counts only, never a passage.

Nothing is kept for a rollback. Passages are cheap to index again: the whole guide is about 1,200 passages and about 200,000 tokens, within the 5 million ingestion tokens AI Search includes each month ([limits and pricing](https://developers.cloudflare.com/ai-search/platform/limits-pricing/)). A version rolled back to finds fewer results for the passages changed since its release. Its results are never wrong, because it shows only passages in its own catalog. To index its passages again, check out its commit, run `npm run build`, then `npm run search:sync` with `CLOUDFLARE_ACCOUNT_ID` and the upload token as `CLOUDFLARE_AI_SEARCH_UPLOAD_TOKEN`. The release workflow cannot do this: it releases only the head of `main`.

[Workers versions and deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/) · [AI Search items API](https://developers.cloudflare.com/ai-search/api/items/rest-api/)
