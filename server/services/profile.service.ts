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

export function calculateProfileCompletion(
  profile: Pick<
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
  >,
  hasEducation: boolean,
  hasSkills: boolean,
): number {
  const checks = [
    Boolean(profile.fullName),
    Boolean(profile.location),
    Boolean(profile.careerLevel),
    Boolean(profile.currentJobTitle),
    Boolean(profile.desiredJobTitle),
    Boolean(profile.desiredIndustry),
    profile.yearsExperience !== null,
    Boolean(profile.preferredWorkArrangement),
    Boolean(profile.preferredLocation),
    profile.salaryExpectationMin !== null,
    profile.professionalInterests.length > 0,
    hasEducation,
    hasSkills,
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
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
