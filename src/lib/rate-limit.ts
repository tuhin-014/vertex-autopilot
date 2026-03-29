// Simple in-memory rate limiter for serverless (resets on cold start, but good enough)
const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number = 30,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}
