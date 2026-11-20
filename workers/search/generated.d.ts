// prepare.mjs writes this module from the rendered site before Vite bundles the Worker.
declare module "*/.astro/site.mjs" {
  type Site = import("./search.ts").SearchSiteData;
  export const records: Site["records"];
  export const shell: Site["shell"];
  export const headers: Site["headers"];
}
