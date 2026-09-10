import { describe, expect, it } from "vitest";
import { reconcileProgressAndStatus } from "@/server/services/goal.service";

describe("reconcileProgressAndStatus", () => {
  it("leaves progress/status untouched when neither triggers completion", () => {
    expect(reconcileProgressAndStatus(40, "IN_PROGRESS")).toEqual({
      progress: 40,
      status: "IN_PROGRESS",
    });
  });

  it("auto-completes when progress reaches 100", () => {
    expect(reconcileProgressAndStatus(100, "IN_PROGRESS")).toEqual({
      progress: 100,
      status: "COMPLETED",
    });
  });

  it("auto-completes when progress exceeds 100 (defensive)", () => {
    expect(reconcileProgressAndStatus(150, "IN_PROGRESS")).toEqual({
      progress: 100,
      status: "COMPLETED",
    });
  });

  it("forces progress to 100 when status is explicitly set to COMPLETED", () => {
    expect(reconcileProgressAndStatus(20, "COMPLETED")).toEqual({
      progress: 100,
      status: "COMPLETED",
    });
  });

  it("does not auto-complete a goal marked ABANDONED even at 0 progress", () => {
    expect(reconcileProgressAndStatus(0, "ABANDONED")).toEqual({
      progress: 0,
      status: "ABANDONED",
    });
  });
});
