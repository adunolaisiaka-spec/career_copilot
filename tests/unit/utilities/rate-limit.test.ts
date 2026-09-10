import { describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "@/lib/utilities/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests up to the limit", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, { limit: 3, windowMs: 60_000 }).allowed).toBe(true);
    }
  });

  it("blocks once the limit is exceeded within the window", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, { limit: 3, windowMs: 60_000 });
    }
    const result = checkRateLimit(key, { limit: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets once the window has elapsed", () => {
    vi.useFakeTimers();
    try {
      const key = `test-${Math.random()}`;
      for (let i = 0; i < 3; i++) {
        checkRateLimit(key, { limit: 3, windowMs: 60_000 });
      }
      expect(checkRateLimit(key, { limit: 3, windowMs: 60_000 }).allowed).toBe(false);

      vi.advanceTimersByTime(60_001);
      expect(checkRateLimit(key, { limit: 3, windowMs: 60_000 }).allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tracks independent buckets per key", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(keyA, { limit: 3, windowMs: 60_000 });
    }
    expect(checkRateLimit(keyA, { limit: 3, windowMs: 60_000 }).allowed).toBe(false);
    expect(checkRateLimit(keyB, { limit: 3, windowMs: 60_000 }).allowed).toBe(true);
  });
});
