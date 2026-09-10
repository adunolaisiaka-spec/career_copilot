import { describe, expect, it } from "vitest";
import { jobSearchSchema } from "@/lib/validation/job";

describe("jobSearchSchema", () => {
  it("applies sensible defaults for an empty query", () => {
    const result = jobSearchSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe("newest");
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(12);
      expect(result.data.savedOnly).toBe(false);
    }
  });

  it("coerces numeric query params from strings (URLSearchParams are always strings)", () => {
    const result = jobSearchSchema.safeParse({
      salaryMin: "50000",
      postedWithinDays: "7",
      page: "2",
      pageSize: "20",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.salaryMin).toBe(50000);
      expect(result.data.postedWithinDays).toBe(7);
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("coerces the savedOnly checkbox value to a real boolean", () => {
    expect(jobSearchSchema.safeParse({ savedOnly: "true" }).success && true).toBe(true);
    const parsedTrue = jobSearchSchema.parse({ savedOnly: "true" });
    expect(parsedTrue.savedOnly).toBe(true);
    const parsedFalse = jobSearchSchema.parse({});
    expect(parsedFalse.savedOnly).toBe(false);
  });

  it("rejects an invalid remoteType", () => {
    expect(jobSearchSchema.safeParse({ remoteType: "SPACE" }).success).toBe(false);
  });

  it("treats a blank select/input value (what an unselected form field submits) as no filter", () => {
    const result = jobSearchSchema.safeParse({
      remoteType: "",
      salaryMin: "",
      postedWithinDays: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.remoteType).toBeUndefined();
      expect(result.data.salaryMin).toBeUndefined();
      expect(result.data.postedWithinDays).toBeUndefined();
    }
  });

  it("still applies a real remoteType filter alongside a blank postedWithinDays (the exact form payload that used to 400)", () => {
    const result = jobSearchSchema.safeParse({
      q: "engineer",
      location: "",
      remoteType: "ONSITE",
      experienceLevel: "",
      industry: "",
      salaryMin: "",
      postedWithinDays: "",
      sort: "newest",
      page: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.remoteType).toBe("ONSITE");
      expect(result.data.q).toBe("engineer");
    }
  });

  it("rejects an invalid sort option", () => {
    expect(jobSearchSchema.safeParse({ sort: "random" }).success).toBe(false);
  });

  it("caps pageSize at 50", () => {
    expect(jobSearchSchema.safeParse({ pageSize: "51" }).success).toBe(false);
    expect(jobSearchSchema.safeParse({ pageSize: "50" }).success).toBe(true);
  });
});
