import { prisma } from "@/lib/database/prisma";

export function findSubscriptionByUserId(userId: string) {
  return prisma.subscription.findUnique({ where: { userId } });
}

export function countApplications(userId: string) {
  return prisma.application.count({ where: { userId } });
}

export function countSavedJobs(userId: string) {
  return prisma.savedJob.count({ where: { userId } });
}

export function countResumeAnalysesSince(userId: string, since: Date) {
  return prisma.resumeAnalysis.count({
    where: { resume: { userId }, createdAt: { gte: since } },
  });
}
