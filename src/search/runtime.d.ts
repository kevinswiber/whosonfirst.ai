// The part of the Workers runtime that entrypoints.ts uses. The site has no
// dependency on the runtime's types.
declare module "cloudflare:workers" {
  type Budget = import("./search.ts").SearchBindings["SEARCH_BUDGET"];
  export abstract class WorkerEntrypoint<Env = unknown> {
    protected ctx: { exports: { SearchBudget: Budget } };
    protected env: Env;
  }
  export abstract class DurableObject<Env = unknown> {
    constructor(ctx: { storage: unknown }, env: Env);
    protected ctx: { storage: unknown };
    protected env: Env;
  }
}
