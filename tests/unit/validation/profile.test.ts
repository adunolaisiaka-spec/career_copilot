import { describe, expect, it } from "vitest";
import {
  educationInputSchema,
  onboardingSchema,
  profileUpdateSchema,
} from "@/lib/validation/profile";

const validCore = {
  fullName: "Demo Candidate",
  location: "Lagos, Nigeria",
  careerLevel: "MID",
  yearsExperience: 3,
  desiredJobTitle: "Senior Frontend Developer",
  desiredIndustry: "Technology",
  preferredWorkArrangement: "REMOTE",
  preferredLocation: "Remote",
};

describe("profileUpdateSchema", () => {
  it("accepts a minimal valid profile", () => {
    const result = profileUpdateSchema.safeParse(validCore);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.professionalInterests).toEqual([]);
      expect(result.data.skillNames).toEqual([]);
    }
  });

  it("coerces yearsExperience from a string", () => {
    const result = profileUpdateSchema.safeParse({ ...validCore, yearsExperience: "5" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.yearsExperience).toBe(5);
  });

  it("rejects an invalid careerLevel enum value", () => {
    const result = profileUpdateSchema.safeParse({ ...validCore, careerLevel: "WIZARD" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid preferredWorkArrangement enum value", () => {
    const result = profileUpdateSchema.safeParse({
      ...validCore,
      preferredWorkArrangement: "FROM_THE_MOON",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative years of experience", () => {
    const result = profileUpdateSchema.safeParse({ ...validCore, yearsExperience: -1 });
    expect(result.success).toBe(false);
  });

  it("treats an empty optional string as undefined, not a validation error", () => {
    const result = profileUpdateSchema.safeParse({ ...validCore, currentJobTitle: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currentJobTitle).toBeUndefined();
  });
});

describe("onboardingSchema", () => {
  it("accepts the core fields with an optional education entry omitted", () => {
    const result = onboardingSchema.safeParse(validCore);
    expect(result.success).toBe(true);
  });

  it("accepts a valid nested education entry", () => {
    const result = onboardingSchema.safeParse({
      ...validCore,
      education: { institution: "University of Lagos", degree: "B.Sc." },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a nested education entry with too short an institution name", () => {
    const result = onboardingSchema.safeParse({
      ...validCore,
      education: { institution: "U" },
    });
    expect(result.success).toBe(false);
  });
});

describe("educationInputSchema", () => {
  it("requires an institution", () => {
    expect(educationInputSchema.safeParse({ institution: "" }).success).toBe(false);
  });
});
