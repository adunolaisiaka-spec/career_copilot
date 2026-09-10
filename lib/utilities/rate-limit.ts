interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory fixed-window rate limiter, keyed per caller (e.g. userId).
 * Good enough for a single dev/small-prod instance; swap the Map for Redis
 * (INCR + EXPIRE) if the app ever runs on multiple instances.
 */
export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: windowMs - (now - bucket.windowStart) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}
