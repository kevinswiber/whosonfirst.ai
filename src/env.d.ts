// Font packages imported for their CSS only.
declare module "@fontsource-variable/big-shoulders-display";

// Written when the site is built, by src/integrations/page-dates.mjs: each
// source file's first and last commit, or nothing where the history is not there.
declare module "virtual:page-dates" {
  const history: Record<string, { first: string; last: string }>;
  export default history;
}
