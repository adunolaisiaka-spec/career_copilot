import type { Prisma } from "@prisma/client";
import { getAIService } from "@/lib/ai";
import * as repo from "@/server/repositories/career-roadmap.repository";
import { getProfileWithSkills } from "@/server/services/profile-context.service";

export const listRoadmaps = (userId: string) => repo.listRoadmapsByUser(userId);
export const getRoadmap = (userId: string, id: string) => repo.findRoadmapById(id, userId);
export const deleteRoadmap = (userId: string, id: string) => repo.deleteRoadmap(id, userId);

export async function generateRoadmap(userId: string, goalTitle: string) {
  const { profile, skills } = await getProfileWithSkills(userId);

  const { phases } = await getAIService().generateRoadmap({
    goalTitle,
    currentRole: profile?.currentJobTitle ?? undefined,
    targetRole: profile?.desiredJobTitle ?? undefined,
    careerLevel: profile?.careerLevel ?? undefined,
    yearsExperience: profile?.yearsExperience ?? undefined,
    skills,
  });

  return repo.createRoadmap(userId, {
    goalTitle,
    phases: phases as unknown as Prisma.InputJsonValue,
    generatedByAI: true,
  });
}
