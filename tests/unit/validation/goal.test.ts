import { describe, expect, it } from "vitest";
import { goalInputSchema, goalProgressUpdateSchema } from "@/lib/validation/goal";

describe("goalInputSchema", () => {
  it("defaults progress to 0 and status to NOT_STARTED", () => {
    const result = goalInputSchema.safeParse({ title: "Land a new role", term: "SHORT" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.progress).toBe(0);
      expect(result.data.status).toBe("NOT_STARTED");
    }
  });

  it("rejects progress above 100", () => {
    const result = goalInputSchema.safeParse({
      title: "Land a new role",
      term: "SHORT",
      progress: 150,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing term", () => {
    const result = goalInputSchema.safeParse({ title: "Land a new role" });
    expect(result.success).toBe(false);
  });

  it("requires a title of at least 2 characters", () => {
    expect(goalInputSchema.safeParse({ title: "A", term: "SHORT" }).success).toBe(false);
  });
});

describe("goalProgressUpdateSchema", () => {
  it("coerces a string progress value and enforces the 0-100 range", () => {
    const result = goalProgressUpdateSchema.safeParse({ progress: "75" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.progress).toBe(75);

    expect(goalProgressUpdateSchema.safeParse({ progress: "101" }).success).toBe(false);
    expect(goalProgressUpdateSchema.safeParse({ progress: "-1" }).success).toBe(false);
  });
});
