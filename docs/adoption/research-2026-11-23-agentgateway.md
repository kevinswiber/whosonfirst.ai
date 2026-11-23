# agentgateway, 23 November 2026

A run of [implementation research](../implementation-research.md) on one flow, the credential broker, for one product: agentgateway. The flow’s page listed it among its optional references, as one implementation of the egress proxy, and the records did not have it. A reference of that kind belongs in the records, with its source, so the run added it there and took it out of the page’s references. Its tracker entry stays, since other pages link to it.

`npm run implementations:coverage -- credential-broker` was run first. It showed no party without an entry: the egress proxy had eight, the credential vault three, and the flow three deployment reports. The procedure stops at three entries for a party, and past that adds one only when it tells a reader something the others do not. This one is a kind the eight are not: open-source software that the operator runs, documented by its own project.

The run added one implementation entry and no deployment report, and corrected nothing. It left the egress proxy with nine entries and the credential vault with three. One agent read the pages and wrote the worksheet. A separate agent with no part in that read the entry against its sources, as step 7 of the procedure asks, and its changes are below. No product was run, no account was created and no protocol endpoint was called. These remain reviewed examples, not a census, a ranking or a measure of use.

**Retrieval.** agentgateway’s documentation was read as Markdown, which the site serves when asked for it.

### Credential injection at the egress proxy

- **Accept · agentgateway 1.7, standalone, self-hosted egress proxy and gateway.** An open-source gateway. As an egress proxy it can limit the hostnames clients reach to a list the operator configures. A backend policy attaches a key the operator configures, inline or from a file, to the requests it forwards to that backend. The documentation describes the two features separately, not as one setup for a sandbox. To change an HTTPS request on its way out, the proxy has to terminate TLS with a certificate authority the operator supplies and the client trusts. The documentation describes no placeholder: the key goes to a set place, the Authorization header by default, or a named header, a query parameter or a cookie. Neither page says where the gateway runs, or how its configuration and key file are kept from the agent. [agentgateway documentation index](https://agentgateway.dev/llms.txt) · [Egress proxy](https://agentgateway.dev/docs/standalone/latest/documentation/configuration/egress-proxy/) · [Static keys and passthrough](https://agentgateway.dev/docs/standalone/latest/documentation/configuration/security/backend-authn/key/)

**Looked.**

- Started from agentgateway, an optional reference of the flow’s page. The run looked only for what agentgateway would add: an open-source proxy that an operator runs.
- 3.1 The project’s documentation index, `agentgateway.dev/llms.txt`, calls the project open source and lists the standalone and Kubernetes documentation for version 1.7.x as latest. The standalone documentation has an egress proxy page and a backend authentication section. Both were read.
- 3.3 No release note was found that introduces the egress proxy or static backend keys with a stage. Neither documentation page names one.
- 3.5 The project’s sitemap and blog index were searched for “egress”, “credential injection”, “sandbox” and “secret”. The blog’s series “Credential Injection Patterns for AI Agents”, from 27 July 2026, says the pattern is implemented in Solo Enterprise for agentgateway, with a token store keyed by user and resource. It was not recorded: it is Solo’s commercial product, the source is a blog post, and the product’s own documentation at `docs.solo.io` was not read. It is a lead for the next run, for the proxy and the vault.

**Not found.**

- No agentgateway documentation page that configures the egress proxy and a backend key together, or that describes a sandbox.
- No release stage for either feature in the documentation read.

**Second reading.**

- `credential-broker-agentgateway`: accepted with changes. “Open source” and version 1.7 are now cited from the documentation index. The hostname list became something the proxy can enforce and not always does, since the page’s setup for inspecting all traffic permits every destination. The TLS sentence was limited to HTTPS and to an authority the operator supplies. The sentences on placeholders and on the operator were reworded to what the pages say. The first reader then confirmed the key’s locations, a query parameter among them, on the page.
