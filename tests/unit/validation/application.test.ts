import { describe, expect, it } from "vitest";
import {
  APPLICATION_STATUSES,
  applicationInputSchema,
  applicationStatusUpdateSchema,
  interviewDateInputSchema,
} from "@/lib/validation/application";

describe("applicationInputSchema", () => {
  it("defaults status to SAVED when omitted", () => {
    const result = applicationInputSchema.safeParse({
      companyName: "Nimbus Cloud",
      jobTitle: "Senior Frontend Developer",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("SAVED");
  });

  it("requires a company name and job title", () => {
    expect(applicationInputSchema.safeParse({ companyName: "", jobTitle: "X" }).success).toBe(
      false,
    );
    expect(applicationInputSchema.safeParse({ companyName: "X", jobTitle: "" }).success).toBe(
      false,
    );
  });

  it("accepts every status in the master spec's Kanban list", () => {
    for (const status of APPLICATION_STATUSES) {
      const result = applicationInputSchema.safeParse({
        companyName: "Nimbus Cloud",
        jobTitle: "Engineer",
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects a status outside the enum", () => {
    const result = applicationInputSchema.safeParse({
      companyName: "Nimbus Cloud",
      jobTitle: "Engineer",
      status: "GHOSTED",
    });
    expect(result.success).toBe(false);
  });
});

describe("applicationStatusUpdateSchema", () => {
  it("requires a valid status (used by the Kanban drag PATCH)", () => {
    expect(applicationStatusUpdateSchema.safeParse({ status: "OFFER" }).success).toBe(true);
    expect(applicationStatusUpdateSchema.safeParse({ status: "MADE_UP" }).success).toBe(false);
    expect(applicationStatusUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe("interviewDateInputSchema", () => {
  it("defaults type to GENERAL", () => {
    const result = interviewDateInputSchema.safeParse({ scheduledDate: "2026-11-01T14:00" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe("GENERAL");
  });

  it("requires a non-empty scheduledDate", () => {
    expect(interviewDateInputSchema.safeParse({ scheduledDate: "" }).success).toBe(false);
  });
});
