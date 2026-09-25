import { prisma } from "@/lib/database/prisma";
import type { Prisma } from "@prisma/client";

export function findSubscriptionByUserId(userId: string) {
  return prisma.subscription.findUnique({ where: { userId } });
}

export function findSubscriptionByProviderCustomerId(providerCustomerId: string) {
  return prisma.subscription.findFirst({ where: { providerCustomerId } });
}

export function updateSubscriptionByUserId(
  userId: string,
  data: Prisma.SubscriptionUncheckedUpdateInput,
) {
  return prisma.subscription.update({ where: { userId }, data });
}

export function updateSubscriptionByProviderCustomerId(
  providerCustomerId: string,
  data: Prisma.SubscriptionUncheckedUpdateInput,
) {
  return prisma.subscription.updateMany({ where: { providerCustomerId }, data });
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
