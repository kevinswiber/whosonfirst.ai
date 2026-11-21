// The part of the Workers runtime that index.ts uses. The site has no
// dependency on the runtime's types.
declare module "cloudflare:workers" {
  export abstract class DurableObject<Env = unknown> {
    constructor(ctx: { storage: unknown }, env: Env);
    protected ctx: { storage: unknown };
    protected env: Env;
  }
}

// prepare.mjs writes this module from the rendered site before Vite bundles the Worker.
declare module "*/.astro/site.mjs" {
  type Site = import("./search.ts").SearchSiteData;
  export const records: Site["records"];
  export const shell: Site["shell"];
  export const headers: Site["headers"];
}
