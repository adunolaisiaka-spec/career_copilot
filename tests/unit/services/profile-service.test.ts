import { describe, expect, it } from "vitest";
import { calculateProfileCompletion } from "@/server/services/profile.service";

const emptyProfile = {
  fullName: null,
  location: null,
  careerLevel: null,
  currentJobTitle: null,
  desiredJobTitle: null,
  desiredIndustry: null,
  yearsExperience: null,
  preferredWorkArrangement: null,
  preferredLocation: null,
  salaryExpectationMin: null,
  professionalInterests: [] as string[],
};

const fullProfile = {
  fullName: "Demo Candidate",
  location: "Lagos, Nigeria",
  careerLevel: "MID" as const,
  currentJobTitle: "Frontend Developer",
  desiredJobTitle: "Senior Frontend Developer",
  desiredIndustry: "Technology",
  yearsExperience: 3,
  preferredWorkArrangement: "REMOTE" as const,
  preferredLocation: "Remote",
  salaryExpectationMin: 60000,
  professionalInterests: ["Web Development"],
};

describe("calculateProfileCompletion", () => {
  it("returns 0 for a fully empty profile with no education/skills", () => {
    expect(calculateProfileCompletion(emptyProfile, false, false)).toBe(0);
  });

  it("returns 100 for a fully filled profile with education and skills", () => {
    expect(calculateProfileCompletion(fullProfile, true, true)).toBe(100);
  });

  it("counts hasEducation and hasSkills as independent checks", () => {
    const withoutExtras = calculateProfileCompletion(fullProfile, false, false);
    const withEducationOnly = calculateProfileCompletion(fullProfile, true, false);
    const withBoth = calculateProfileCompletion(fullProfile, true, true);

    expect(withEducationOnly).toBeGreaterThan(withoutExtras);
    expect(withBoth).toBeGreaterThan(withEducationOnly);
  });

  it("never returns more than 100", () => {
    expect(calculateProfileCompletion(fullProfile, true, true)).toBeLessThanOrEqual(100);
  });

  it("treats yearsExperience: 0 as filled in (not falsy-empty)", () => {
    const profileWithZeroYears = { ...fullProfile, yearsExperience: 0 };
    expect(calculateProfileCompletion(profileWithZeroYears, true, true)).toBe(100);
  });
});
