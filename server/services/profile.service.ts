import { prisma } from "@/lib/database/prisma";
import type { Profile } from "@prisma/client";
import type { OnboardingInput, ProfileUpdateInput } from "@/lib/validation/profile";
import {
  addEducation,
  findOrCreateSkills,
  findProfileByUserId,
  findUserSkillsByUserId,
  syncUserSkills,
  upsertProfileCore,
} from "@/server/repositories/profile.repository";

export { listSkillCatalog } from "@/server/repositories/profile.repository";

type CompletionProfile = Pick<
  Profile,
  | "fullName"
  | "location"
  | "careerLevel"
  | "currentJobTitle"
  | "desiredJobTitle"
  | "desiredIndustry"
  | "yearsExperience"
  | "preferredWorkArrangement"
  | "preferredLocation"
  | "salaryExpectationMin"
  | "professionalInterests"
>;

// Single source of truth for both the completion percentage and the
// "what's missing" list shown on the profile page — keeping them as one
// list of {label, met} checks means the two can never drift apart.
function profileCompletionChecks(
  profile: CompletionProfile,
  hasEducation: boolean,
  hasSkills: boolean,
): { label: string; met: boolean }[] {
  return [
    { label: "your full name", met: Boolean(profile.fullName) },
    { label: "your location", met: Boolean(profile.location) },
    { label: "your career level", met: Boolean(profile.careerLevel) },
    { label: "your current job title", met: Boolean(profile.currentJobTitle) },
    { label: "your desired job title", met: Boolean(profile.desiredJobTitle) },
    { label: "your desired industry", met: Boolean(profile.desiredIndustry) },
    { label: "your years of experience", met: profile.yearsExperience !== null },
    { label: "a preferred work arrangement", met: Boolean(profile.preferredWorkArrangement) },
    { label: "a preferred location", met: Boolean(profile.preferredLocation) },
    { label: "a salary expectation", met: profile.salaryExpectationMin !== null },
    { label: "your professional interests", met: profile.professionalInterests.length > 0 },
    { label: "your education", met: hasEducation },
    { label: "your skills", met: hasSkills },
  ];
}

export function calculateProfileCompletion(
  profile: CompletionProfile,
  hasEducation: boolean,
  hasSkills: boolean,
): number {
  const checks = profileCompletionChecks(profile, hasEducation, hasSkills);
  const filled = checks.filter((c) => c.met).length;
  return Math.round((filled / checks.length) * 100);
}

/** Human-readable labels for whatever's still missing, for the profile page's completion card. */
export function getMissingProfileFields(
  profile: CompletionProfile,
  hasEducation: boolean,
  hasSkills: boolean,
): string[] {
  return profileCompletionChecks(profile, hasEducation, hasSkills)
    .filter((c) => !c.met)
    .map((c) => c.label);
}

export async function getProfileForUser(userId: string) {
  const [profile, userSkills] = await Promise.all([
    findProfileByUserId(userId),
    findUserSkillsByUserId(userId),
  ]);
  return { profile, skills: userSkills.map((us) => us.skill) };
}

async function applyProfileFields(userId: string, input: ProfileUpdateInput) {
  const skills = await findOrCreateSkills(input.skillNames, "TECHNICAL");

  const profile = await upsertProfileCore(userId, {
    fullName: input.fullName,
    location: input.location,
    careerLevel: input.careerLevel,
    yearsExperience: input.yearsExperience,
    currentJobTitle: input.currentJobTitle,
    desiredJobTitle: input.desiredJobTitle,
    desiredIndustry: input.desiredIndustry,
    preferredWorkArrangement: input.preferredWorkArrangement,
    preferredLocation: input.preferredLocation,
    salaryExpectationMin: input.salaryExpectationMin,
    salaryExpectationMax: input.salaryExpectationMax,
    professionalInterests: input.professionalInterests,
  });

  await syncUserSkills(
    userId,
    skills.map((s) => s.id),
  );

  return { profile, skills };
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  const { profile: savedProfile, skills } = await applyProfileFields(userId, input);
  const existing = await findProfileByUserId(userId);

  const completion = calculateProfileCompletion(
    savedProfile,
    (existing?.educations.length ?? 0) > 0,
    skills.length > 0,
  );

  const profile = await prisma.profile.update({
    where: { userId },
    data: { profileCompletion: completion },
  });

  return { profile, skills };
}

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  const { profile: savedProfile, skills } = await applyProfileFields(userId, input);

  if (input.education) {
    await addEducation(savedProfile.id, {
      institution: input.education.institution,
      degree: input.education.degree,
      fieldOfStudy: input.education.fieldOfStudy,
      startDate: input.education.startDate ? new Date(input.education.startDate) : undefined,
      endDate: input.education.endDate ? new Date(input.education.endDate) : undefined,
    });
  }

  const withEducation = await findProfileByUserId(userId);
  const completion = calculateProfileCompletion(
    savedProfile,
    (withEducation?.educations.length ?? 0) > 0,
    skills.length > 0,
  );

  const profile = await prisma.profile.update({
    where: { userId },
    data: { profileCompletion: completion, onboardingCompletedAt: new Date() },
  });

  return { profile, skills };
}
