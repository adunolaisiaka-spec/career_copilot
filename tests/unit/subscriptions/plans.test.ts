import { describe, expect, it } from "vitest";
import { PLAN_LIMITS, PLAN_FEATURES } from "@/lib/subscriptions/plans";

describe("PLAN_LIMITS", () => {
  it("gives the Free plan finite limits on every resource", () => {
    expect(PLAN_LIMITS.FREE.maxApplications).toBeGreaterThan(0);
    expect(PLAN_LIMITS.FREE.maxSavedJobs).toBeGreaterThan(0);
    expect(PLAN_LIMITS.FREE.maxResumeAnalysesPerMonth).toBeGreaterThan(0);
    expect(Number.isFinite(PLAN_LIMITS.FREE.maxApplications)).toBe(true);
  });

  it("gives the Pro plan unlimited access to every resource", () => {
    expect(PLAN_LIMITS.PRO.maxApplications).toBe(Infinity);
    expect(PLAN_LIMITS.PRO.maxSavedJobs).toBe(Infinity);
    expect(PLAN_LIMITS.PRO.maxResumeAnalysesPerMonth).toBe(Infinity);
  });
});

describe("PLAN_FEATURES", () => {
  it("lists at least one feature for both plans", () => {
    expect(PLAN_FEATURES.FREE.length).toBeGreaterThan(0);
    expect(PLAN_FEATURES.PRO.length).toBeGreaterThan(0);
  });

  it("mentions the Free plan's actual configured limits in its own feature list (stays in sync)", () => {
    const applicationsFeature = PLAN_FEATURES.FREE.find((f) => f.includes("tracked applications"));
    expect(applicationsFeature).toContain(String(PLAN_LIMITS.FREE.maxApplications));
  });
});
