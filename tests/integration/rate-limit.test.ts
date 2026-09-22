import { afterEach, describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/utilities/rate-limit";
import { prisma } from "./helpers/db";

describe("checkRateLimit (real DB)", () => {
  const keysUsedThisTest: string[] = [];

  function testKey(label: string) {
    const key = `test-${label}-${Math.random()}`;
    keysUsedThisTest.push(key);
    return key;
  }

  afterEach(async () => {
    await prisma.rateLimitBucket.deleteMany({ where: { key: { in: keysUsedThisTest } } });
    keysUsedThisTest.length = 0;
  });

  it("allows requests up to the limit", async () => {
    const key = testKey("allow");
    for (let i = 0; i < 3; i++) {
      expect((await checkRateLimit(key, { limit: 3, windowMs: 60_000 })).allowed).toBe(true);
    }
  });

  it("blocks once the limit is exceeded within the window", async () => {
    const key = testKey("block");
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(key, { limit: 3, windowMs: 60_000 });
    }
    const result = await checkRateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets once the window has elapsed", async () => {
    const key = testKey("reset");
    // Wide enough that 5 sequential Neon round trips (~300-700ms each, observed
    // elsewhere in this suite) can't themselves eat past the window before the
    // "still blocked" assertion runs.
    const windowMs = 3000;
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(key, { limit: 3, windowMs });
    }
    expect((await checkRateLimit(key, { limit: 3, windowMs })).allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, windowMs + 200));
    expect((await checkRateLimit(key, { limit: 3, windowMs })).allowed).toBe(true);
  });

  it("tracks independent buckets per key", async () => {
    const keyA = testKey("independent-a");
    const keyB = testKey("independent-b");
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(keyA, { limit: 3, windowMs: 60_000 });
    }
    expect((await checkRateLimit(keyA, { limit: 3, windowMs: 60_000 })).allowed).toBe(false);
    expect((await checkRateLimit(keyB, { limit: 3, windowMs: 60_000 })).allowed).toBe(true);
  });

  it("does not let concurrent requests for the same key race past the limit", async () => {
    const key = testKey("concurrent");
    const results = await Promise.all(
      Array.from({ length: 5 }, () => checkRateLimit(key, { limit: 3, windowMs: 60_000 })),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(3);
    expect(results.filter((r) => !r.allowed)).toHaveLength(2);
  });
});
