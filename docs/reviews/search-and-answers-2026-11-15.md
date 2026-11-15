# Being found, being cited, being read: 15 November 2026

A review of how the site is found by search engines, used by answer engines and assistants, and read once someone arrives. It says what was changed with it, what is left for the owner to do outside the repository, what is worth building next, and what was looked at and turned down.

## Decision

The site already had most of what a page can do for a machine: one address per page, a description and a card for each, structured data, a Markdown copy of every page, `llms.txt`, and a `robots.txt` that allows everything. The gaps were elsewhere, and in this order:

1. **Nobody can see how the site is doing.** It has no analytics by design, and it was not yet verified with Google or Bing. Their consoles are the only measurement there is. This is the owner's to do, and it comes first.
2. **Pages did not say when they changed.** One month, shared by every page, is not a date. Fixed here.
3. **Titles left out the names people type.** Fixed here.
4. **The questions people ask in pairs had no page.** “DPoP or mTLS?” and “CIBA or the device flow?” are among what Google suggests for these subjects, and are answered today by vendors. A first set of twelve is built, on a branch of its own.
5. **A thousand pages of the decision guide's combinations should not be built.** See [Turned down](#turned-down).

## What changed

On `feat/search-and-answer-engines`:

- **Each page says when it last changed**, in the sitemap (`lastmod`), in its structured data (`datePublished`, `dateModified`) and in its footer, with a link to its history. The date is read from the repository when the site is built and is never typed. Google uses a sitemap's dates only if they are “consistently and verifiably” accurate, and asks that structured data match the date a reader sees ([sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [dates](https://developers.google.com/search/docs/appearance/publication-dates)). Bing calls `lastmod` “especially important” ([Bing, February 2023](https://blogs.bing.com/webmaster/february-2023/The-Importance-of-Setting-the-lastmod-Tag-in-Your-Sitemap)).
- **Ten flows, three lessons, the six deployment guides and the implementations directory have a title for where they are found.** The heading on the page is unchanged. A flow's description now names the specification it follows and its count of steps, from its own data. A lesson's says which lesson it is and what a reader can do after it.
- **The footer offers the page as Markdown**, with a button that copies it. Amplitude reports that of 303 selections from its documentation's AI menu, 234 were “copy as Markdown” ([Amplitude, May 2026](https://amplitude.com/blog/docs-redesign.md)).
- **The next page is loaded while the pointer rests on its link**, by speculation rules. Chromium only; other browsers ignore them.
- **`npm run indexnow`** tells Bing and the other engines that take part in IndexNow which pages changed. Google does not take part ([IndexNow](https://www.indexnow.org/faq)).
- **A card's description ends at a sentence**, not at an ellipsis.

On `feat/flow-comparisons`, which builds on the first:

- **Twelve pairs of flows, side by side, under `/compare/`.** A pair's page is made from the two flows' data and from every passage on either flow's page that links to the other, quoted whole. It cannot say what a flow page does not. [Working on the site](../development.md#editing-content) says how to add one.

Left out after trying: a fade between pages (`@view-transition`). Chromium threw a script error on the page arrived at.

## For the owner, outside the repository

In order. None of these can be done from the repository.

1. **Verify the site in Google Search Console and Bing Webmaster Tools, and submit the sitemap.** Google's console reports impressions in AI Overviews and AI Mode ([June 2026](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports)). Bing's reports Copilot citations and the queries that led to them ([February 2026](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/)). Neither reports clicks from an answer.
2. **Deploy from a full clone.** A shallow clone cannot date a page, so the build gives no dates and says so. Look for `[page-dates] … files dated from the history` in the build's output. A hosted build that clones shallowly can run `git fetch --unshallow` first. Cloudflare Pages is reported to clone shallowly ([Hugo forum](https://discourse.gohugo.io/t/lastmod-from-gitinfo-shows-correctly-with-hugo-serve-locally-but-is-overwritten-on-cloudflare-pages-deploy/46009)); nothing official was found for Workers Builds.
3. **Check that Cloudflare is not turning AI crawlers away.** In the dashboard, under Security, Settings, Bot traffic: the policies for search, training and agents should allow, and Bot Fight Mode can still challenge a crawler ([Cloudflare](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/), [Perplexity](https://docs.perplexity.ai/guides/bots)). A request with a crawler's user agent got a 200 on 15 November, which does not prove a real crawler does.
4. **Turn on the rewrite that answers `Accept: text/markdown`.** The rule is in [Working on the site](../development.md#markdown-at-the-pages-own-address). On 15 November the live site answered such a request with HTML. Claude Code, Cursor and OpenCode send that header ([Checkly, February 2026](https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/)).
5. **After the first deploy that has the key, run `npm run indexnow -- --all`.** After later deploys, `--since` the day of the last one.
6. **Submit the main pages to Brave** at search.brave.com/submit-url. Claude's web search is reported to use Brave's index; that rests on secondary sources.
7. **Run `site:whosonfirst.ai` in Google, Bing and Brave.** No such search was made for this review, to keep the site's name out of searches made on the owner's behalf.
8. **Give the repository on GitHub a description, the site's address and topics.** Cheap. No study supports it.
9. **Post a video for each flow.** `npm run social:assets -- --flow <slug>` makes one from the built site. See [Video](#video).

Two things seen on the live site that the repository does not control: an address without its closing slash is redirected with a 307, which says “temporarily”; and the host's own “not found” response carries none of the site's headers. Both are small.

## Worth building next

Each is a new page or a new section, so each starts as an issue. In order of what the evidence supports.

1. **“What changed” pages, with a feed.** One for each revision of the MCP specification and each draft the flows depend on: what changed, who has to do what, links to the proposals. The official changelogs are lists of one-line items, and the posts that explain them are vendors' and go stale. A changing answer is also the best reason a reader has to come back. Read the changelog itself before writing a line: the search for this review found secondary posts that disagree with it.
2. **More pairs.** “Token exchange or on-behalf-of?”, “API key or client credentials?”, “transaction tokens or token exchange?”, “A2A or MCP?”. Each needs the comparison written on a flow's page first, which is where it belongs anyway.
3. **Pages titled as the question.** “No person is there: how does the agent authenticate?”, “how does a user's identity reach the API behind the agent?” (token exchange, ID-JAG, transaction tokens and passing the token through, in one place), “a coding agent calling GitHub”, “a remote MCP server with many users”. Today's answers are gateway vendors' documentation.
4. **Failure pages.** Confused deputy, token passthrough, mix-up, device-code phishing, an injected agent that holds credentials. “mcp confused deputy problem”, “mcp token passthrough” and “device code flow phishing” are all among Google's suggestions.
5. **A few questions and answers on each flow page**, in the words people type. As text on the page. Not as `FAQPage` markup, which Google stopped showing in May 2026.
6. **A token and proof reader that runs in the page**: paste a JWT or a DPoP proof, see each claim and what an API would check. On Hacker News, tools are taken up more than explanations, and it needs nothing from another origin.
7. **A changes page made from the repository's history.** Commit subjects here already say what the site now does. It needs a full clone, as the dates do, and an empty page where there is none would be worse than no page.
8. **A term's own page**, only for terms with demand and no flow of their own: ID-JAG, CIMD, the `act` claim, sender-constrained. A page for each of the 85 terms would be 85 thin pages.
9. **In a lesson, one question before the text**, and in a flow's diagram, “what is sent next?” before a step is shown. Questions asked first help when the reader commits to an answer ([Pan and Carpenter, 2023](https://doi.org/10.1007/s10648-023-09814-5)). The lessons' questions already say why an answer is wrong, which most sites do not.
10. **A sheet to print for each flow.** Little search demand; shared a lot.
11. **Search across the site.** Pagefind stays on this origin but needs `'wasm-unsafe-eval'` in the content security policy and is a new dependency ([Pagefind](https://pagefind.app/docs/hosting/)). A decision for the owner.
12. **A page about who makes the site**, apart from About, marked up as a `ProfilePage`.

## Video

**Not on the pages.** Google lists a video only on a page whose “main purpose is to show users a single video” ([Google](https://developers.google.com/search/docs/appearance/video)), so a clip on a flow page earns nothing in search, and `VideoObject` markup there is wasted. For learning, animation helps most for physical procedures and least for ideas (Höffler and Leutner 2007; Berney and Bétrancourt 2016), and what helps is splitting an explanation into steps the reader moves through, which the diagram already does.

**On a video site, linked from here.** YouTube is reported as the domain most often cited in AI Overviews, and mentions there go with a brand's visibility in AI answers; both are vendors' figures and correlations ([Ahrefs, December 2025](https://ahrefs.com/blog/ai-brand-visibility-correlations/)). The content security policy forbids an embed, so the site links out.

The site can already make its own videos: `scripts/social-assets.mjs` steps through any flow's diagram from the built page and writes an MP4, with no hand work. What a video site also wants can come from the same steps: captions, and a description with chapters. A video's chapters need a first one at 00:00, at least three, and ten seconds each ([YouTube](https://support.google.com/youtube/answer/9884579)), so a flow's phases suit them better than its steps. Each step should be held for as long as it takes to read, not for a fixed two seconds. A spoken version would need a text-to-speech program, which is a new dependency and a decision: Kokoro is reported to run on a laptop, with weights under Apache-2.0; say in the description that the voice is synthetic.

## Turned down

- **A page for every combination of the guide's answers.** Six questions give 2 × 3 × 4 × 3 × 5 × 3 = 1,080 combinations, made from 25 flows. Google's spam policies name it: “many pages are generated for the primary purpose of manipulating search rankings and not helping users”, and, of doorways, “substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy” ([spam policies](https://developers.google.com/search/docs/essentials/spam-policies)). Its guide for AI features says the same of pages made for every variation of a query ([May 2026](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)). Bing says near-duplicates blur what each page is for, and an answer engine picks one address from a cluster ([December 2025](https://blogs.bing.com/webmaster/December-2025/Does-Duplicate-Content-Hurt-SEO-and-AI-Search-Visibility)). The guide already keeps every answer in its address, so a result can be shared, and the four cases have pages.
- **More structured data.** FAQ results ended in May 2026, how-to results in 2023, practice problems in January 2026, and course and learning-video results are being phased out ([Google's changes](https://developers.google.com/search/updates)). `DefinedTerm` and `LearningResource` have no consumer that could be found. Adding schema to 1,885 pages did not move their citations by AI ([Search Engine Journal, May 2026](https://www.searchenginejournal.com/schema-markup-didnt-move-ai-citations-in-ahrefs-test/574568/)). What the site has is enough.
- **More work on `llms.txt`.** 97% of such files had no request in May 2026 ([Ahrefs](https://ahrefs.com/blog/llmstxt-study/)). Keep it: coding agents are among the few that read it. What is read is the Markdown copy of a page, asked for by its address ([Mintlify, July 2026](https://mintlify.com/blog/state-of-docs-traffic)).
- **An MCP server, NLWeb, files under `.well-known` for agents.** No evidence that anything reads them, and a server is what the site deliberately does not have.
- **Naming every crawler in `robots.txt`**, `priority` and `changefreq` in the sitemap, a target length for titles: none is read.
- **Changing a date without changing the page.**

## Evidence and limits

- The built site was read page by page: 78 pages before, 91 with the comparisons. Titles, descriptions, headings, word counts, links in and structured data were tabulated for each.
- Four coding agents searched in parallel on 15 November 2026: search practice, answer engines, what people ask and who answers, and video and learning. They were told to prefer primary sources and to label the rest. Where this review cites a study it did not open itself, the study is named and the claim is the searcher's reading of it. The learning-science figures were read from summaries, not from the papers.
- “Asked more than” rests on Google's suggestions and on titles in Hacker News, Stack Overflow and GitHub discussions. No search volumes were bought or measured. Reddit and “People also ask” could not be read.
- The site was six days old, with no console data. Nothing here is measured on the site itself. The first numbers will come from the two consoles, and this list should be read again against them.
- The live site was asked for a handful of addresses on 15 November to see what it answers. Nothing was changed there.
- `test/browser/implementations.test.mjs` has a race that this work did not cause and did not fix: two tests assert on a page straight after pressing a link to it. Run 24 times, eight at once, one failed without the speculation rules and two with them.
