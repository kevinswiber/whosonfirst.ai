// A cap on how many searches reach AI Search in a UTC day, across every
// Cloudflare location. One Durable Object holds the count, so every request
// sees the same number. The cap is a Worker secret and is not in this repository.

export interface BudgetStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
}

interface Spent {
  day: string;
  used: number;
}

const KEY = "spent";

/** The cap from the secret, or undefined when it is missing or not a whole number above zero. */
export function dailyBudget(value: string | undefined): number | undefined {
  if (!value || !/^[1-9]\d*$/.test(value.trim())) return undefined;
  const cap = Number(value.trim());
  return Number.isSafeInteger(cap) ? cap : undefined;
}

/**
 * Count one search against today's cap. Returns false, and counts nothing, once
 * the cap is reached. A Durable Object delivers no other request while its
 * storage is read or written, so two searches cannot both take the last one.
 */
export async function spend(
  storage: BudgetStorage,
  cap: number,
  now = new Date(),
): Promise<boolean> {
  const day = now.toISOString().slice(0, 10);
  const spent = await storage.get<Spent>(KEY);
  const used = spent?.day === day ? spent.used : 0;
  if (used >= cap) return false;
  await storage.put<Spent>(KEY, { day, used: used + 1 });
  return true;
}

/** Seconds until the count starts again, at the next midnight UTC. */
export function secondsUntilTomorrow(now = new Date()): number {
  const tomorrow = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((tomorrow - now.getTime()) / 1000));
}
