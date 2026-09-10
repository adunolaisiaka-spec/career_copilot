import { describe, expect, it } from "vitest";
import {
  resumeContentSchema,
  analyzeResumeSchema,
  ACCEPTED_RESUME_MIME_TYPES,
  MAX_RESUME_FILE_BYTES,
} from "@/lib/validation/resume";

describe("resumeContentSchema", () => {
  it("accepts a minimal valid resume with defaults applied", () => {
    const result = resumeContentSchema.safeParse({
      title: "Frontend Developer Resume",
      personalInfo: { fullName: "Demo Candidate" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPrimary).toBe(false);
      expect(result.data.awards).toEqual([]);
      expect(result.data.references).toEqual([]);
    }
  });

  it("rejects a missing title", () => {
    const result = resumeContentSchema.safeParse({
      title: "",
      personalInfo: { fullName: "Demo Candidate" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects personalInfo missing a full name", () => {
    const result = resumeContentSchema.safeParse({
      title: "My Resume",
      personalInfo: { fullName: "" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts awards and references arrays", () => {
    const result = resumeContentSchema.safeParse({
      title: "My Resume",
      personalInfo: { fullName: "Demo Candidate" },
      awards: [{ title: "Hackathon Winner" }],
      references: [{ name: "Jane Doe" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.awards).toHaveLength(1);
      expect(result.data.references).toHaveLength(1);
    }
  });
});

describe("analyzeResumeSchema", () => {
  it("allows an empty body (no resumeId — upload mode)", () => {
    expect(analyzeResumeSchema.safeParse({}).success).toBe(true);
  });

  it("accepts an optional targetRole", () => {
    const result = analyzeResumeSchema.safeParse({
      resumeId: "abc123",
      targetRole: "Senior Engineer",
    });
    expect(result.success).toBe(true);
  });
});

describe("file upload constants", () => {
  it("only accepts PDF and DOCX mime types", () => {
    expect(ACCEPTED_RESUME_MIME_TYPES).toContain("application/pdf");
    expect(ACCEPTED_RESUME_MIME_TYPES).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(ACCEPTED_RESUME_MIME_TYPES).not.toContain("image/png");
  });

  it("caps file size at 5MB", () => {
    expect(MAX_RESUME_FILE_BYTES).toBe(5 * 1024 * 1024);
  });
});
