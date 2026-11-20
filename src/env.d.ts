// Font packages imported for their CSS only.
declare module "@fontsource-variable/big-shoulders-display";

// Written when the site is built, by src/integrations/page-dates.mjs: each
// source file's first and last commit, and the last change to each entry of the
// files that are lists of entries, or nothing where the history is not there.
// `events` is when each event of the log reached the line of commits being
// built, and when its correction did, by the event's name.
declare module "virtual:page-dates" {
  const history: Record<string, { first?: string; last: string }>;
  export default history;
  export const events: Record<
    string,
    { recorded?: string; corrected?: string }
  >;
}
