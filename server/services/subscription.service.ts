import { PLAN_LIMITS, type LimitedResource, type Plan } from "@/lib/subscriptions/plans";
import * as repo from "@/server/repositories/subscription.repository";

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const subscription = await repo.findSubscriptionByUserId(userId);
  return subscription?.plan ?? "FREE";
}

async function getCurrentUsage(userId: string) {
  const [applications, savedJobs, resumeAnalysesThisMonth] = await Promise.all([
    repo.countApplications(userId),
    repo.countSavedJobs(userId),
    repo.countResumeAnalysesSince(userId, startOfMonth()),
  ]);
  return {
    maxApplications: applications,
    maxSavedJobs: savedJobs,
    maxResumeAnalysesPerMonth: resumeAnalysesThisMonth,
  };
}

export async function getUsageSummary(userId: string) {
  const subscription = await repo.findSubscriptionByUserId(userId);
  const plan: Plan = subscription?.plan ?? "FREE";
  const limits = PLAN_LIMITS[plan];
  const usage = await getCurrentUsage(userId);

  return {
    plan,
    status: subscription?.status ?? "ACTIVE",
    applications: { used: usage.maxApplications, limit: limits.maxApplications },
    savedJobs: { used: usage.maxSavedJobs, limit: limits.maxSavedJobs },
    resumeAnalysesThisMonth: {
      used: usage.maxResumeAnalysesPerMonth,
      limit: limits.maxResumeAnalysesPerMonth,
    },
  };
}

/**
 * Central place every feature service calls before creating a limited resource —
 * never hard-code plan checks in application/job/resume services directly.
 * Throws a user-facing error when the caller's plan limit would be exceeded.
 */
export async function assertWithinLimit(userId: string, resource: LimitedResource) {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan][resource];
  if (limit === Infinity) return;

  const usage = await getCurrentUsage(userId);
  const used = usage[resource];

  if (used >= limit) {
    const labels: Record<LimitedResource, string> = {
      maxApplications: "tracked applications",
      maxSavedJobs: "saved jobs",
      maxResumeAnalysesPerMonth: "resume analyses this month",
    };
    throw new Error(
      `You've reached your Free plan limit of ${limit} ${labels[resource]}. Upgrade to Pro for unlimited access.`,
    );
  }
}
