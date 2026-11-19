import { events as november2026 } from "./2026-11.ts";
import type { HistoryEvent } from "./model.ts";

/**
 * The whole log, oldest file first. A new month gets a file of its own, named
 * for the month its events were recorded in, and is added at the end here.
 */
export const history: HistoryEvent[] = [...november2026];
