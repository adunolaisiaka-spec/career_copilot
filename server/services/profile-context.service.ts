import { prisma } from "@/lib/database/prisma";
import type { Profile } from "@prisma/client";

export async function getProfileWithSkills(userId: string) {
  const [profile, userSkills] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.userSkill.findMany({ where: { userId }, include: { skill: true }, take: 15 }),
  ]);
  return { profile, skills: userSkills.map((s) => s.skill.name) };
}

/** A short, factual paragraph summarizing the user's real profile data — never invented. */
export function formatProfileContext(profile: Profile | null, skills: string[]): string | undefined {
  if (!profile) return undefined;

  const lines: string[] = [];
  if (profile.fullName) lines.push(`Name: ${profile.fullName}`);
  if (profile.currentJobTitle) lines.push(`Current role: ${profile.currentJobTitle}`);
  if (profile.desiredJobTitle) lines.push(`Target role: ${profile.desiredJobTitle}`);
  if (profile.careerLevel) lines.push(`Career level: ${profile.careerLevel}`);
  if (profile.yearsExperience != null) lines.push(`Years of experience: ${profile.yearsExperience}`);
  if (profile.desiredIndustry) lines.push(`Target industry: ${profile.desiredIndustry}`);
  if (skills.length) lines.push(`Skills: ${skills.join(", ")}`);

  return lines.length ? lines.join("\n") : undefined;
}
