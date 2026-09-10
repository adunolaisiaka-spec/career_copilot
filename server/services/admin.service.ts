import type { AdminJobInput, UserListInput } from "@/lib/validation/admin";
import * as repo from "@/server/repositories/admin.repository";

export const getPlatformStats = repo.getPlatformStats;
export const listUsers = (input: UserListInput) => repo.listUsers(input);
export const listAllJobs = repo.listAllJobs;

const DAYS = 30;

function bucketByDay(timestamps: Date[], days: number): { date: string; value: number }[] {
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const ts of timestamps) {
    const key = ts.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, value]) => ({ date, value }));
}

export async function getAnalyticsSeries() {
  const since = new Date();
  since.setDate(since.getDate() - (DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const [users, applications, resumeAnalyses, interviewSessions] = await Promise.all([
    repo.getTimestampsSince("user", since),
    repo.getTimestampsSince("application", since),
    repo.getTimestampsSince("resumeAnalysis", since),
    repo.getTimestampsSince("interviewSession", since),
  ]);

  return {
    userGrowth: bucketByDay(users, DAYS),
    applications: bucketByDay(applications, DAYS),
    resumeAnalyses: bucketByDay(resumeAnalyses, DAYS),
    interviewSessions: bucketByDay(interviewSessions, DAYS),
  };
}

export async function setUserStatus(
  actorUserId: string,
  targetUserId: string,
  status: "ACTIVE" | "SUSPENDED",
  ipAddress?: string,
) {
  if (actorUserId === targetUserId) {
    throw new Error("You cannot change your own account status");
  }

  const user = await repo.updateUserStatus(targetUserId, status);
  await repo.createAuditLog({
    actorUserId,
    action: status === "SUSPENDED" ? "user.suspend" : "user.activate",
    targetType: "User",
    targetId: targetUserId,
    ipAddress,
  });
  return user;
}

export async function removeUser(actorUserId: string, targetUserId: string, ipAddress?: string) {
  if (actorUserId === targetUserId) {
    throw new Error("You cannot delete your own account");
  }

  await repo.deleteUser(targetUserId);
  await repo.createAuditLog({
    actorUserId,
    action: "user.delete",
    targetType: "User",
    targetId: targetUserId,
    ipAddress,
  });
}

export async function createAdminJob(actorUserId: string, input: AdminJobInput) {
  const job = await repo.createJob({ source: "MANUAL", ...input });
  await repo.createAuditLog({
    actorUserId,
    action: "job.create",
    targetType: "Job",
    targetId: job.id,
  });
  return job;
}

export async function removeJob(actorUserId: string, jobId: string) {
  await repo.deleteJob(jobId);
  await repo.createAuditLog({
    actorUserId,
    action: "job.delete",
    targetType: "Job",
    targetId: jobId,
  });
}
