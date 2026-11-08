/** Simple in-memory sliding-window limiter. For multi-instance deployments swap for Redis. */
const hits = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs = 60_000): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) { hits.set(key, arr); return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - arr[0])) / 1000) }; }
  arr.push(now); hits.set(key, arr);
  return { ok: true, retryAfterSec: 0 };
}
export const aiLimit = () => Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 6);
