import { describe, expect, it } from "vitest";
import {
  adminJobInputSchema,
  userListSchema,
  userStatusUpdateSchema,
} from "@/lib/validation/admin";

describe("userListSchema", () => {
  it("defaults page and pageSize when omitted", () => {
    const result = userListSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("caps pageSize at 100", () => {
    expect(userListSchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });
});

describe("userStatusUpdateSchema", () => {
  it("only allows ACTIVE or SUSPENDED", () => {
    expect(userStatusUpdateSchema.safeParse({ status: "ACTIVE" }).success).toBe(true);
    expect(userStatusUpdateSchema.safeParse({ status: "SUSPENDED" }).success).toBe(true);
    expect(userStatusUpdateSchema.safeParse({ status: "ADMIN" }).success).toBe(false);
  });
});

describe("adminJobInputSchema", () => {
  it("requires title, company, and description", () => {
    expect(
      adminJobInputSchema.safeParse({ title: "", company: "Acme", description: "x" }).success,
    ).toBe(false);
    expect(
      adminJobInputSchema.safeParse({ title: "Engineer", company: "", description: "x" }).success,
    ).toBe(false);
    expect(
      adminJobInputSchema.safeParse({ title: "Engineer", company: "Acme", description: "" })
        .success,
    ).toBe(false);
  });

  it("accepts a minimal valid job", () => {
    const result = adminJobInputSchema.safeParse({
      title: "Engineer",
      company: "Acme",
      description: "Build things.",
    });
    expect(result.success).toBe(true);
  });

  it("coerces salary fields from strings", () => {
    const result = adminJobInputSchema.safeParse({
      title: "Engineer",
      company: "Acme",
      description: "Build things.",
      salaryMin: "50000",
      salaryMax: "80000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.salaryMin).toBe(50000);
      expect(result.data.salaryMax).toBe(80000);
    }
  });
});
