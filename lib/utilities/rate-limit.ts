import { prisma } from "@/lib/database/prisma";

interface BucketRow {
  count: number;
  windowStart: Date;
}

/**
 * Postgres-backed fixed-window rate limiter, keyed per caller (e.g. userId
 * or email). Was previously an in-memory Map, which worked for one long-lived
 * dev server but reset on every cold serverless invocation on Vercel — every
 * "rate limited" endpoint was effectively unprotected in production. The
 * upsert below is a single atomic statement so concurrent requests for the
 * same key can't race each other into under-counting.
 */
export async function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const cutoff = new Date(Date.now() - windowMs);

  const [row] = await prisma.$queryRaw<BucketRow[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "windowStart")
    VALUES (${key}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."windowStart" <= ${cutoff} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimitBucket"."windowStart" <= ${cutoff} THEN now()
        ELSE "RateLimitBucket"."windowStart"
      END
    RETURNING "count", "windowStart"
  `;

  if (row.count > limit) {
    const retryAfterMs = windowMs - (Date.now() - row.windowStart.getTime());
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  return { allowed: true, retryAfterMs: 0 };
}
