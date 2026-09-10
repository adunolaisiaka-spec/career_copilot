import { prisma } from "@/lib/database/prisma";
import { Prisma, UserStatus } from "@prisma/client";
import type { UserListInput } from "@/lib/validation/admin";

export async function getPlatformStats() {
  const [totalUsers, activeUsers, totalApplications, totalResumeAnalyses, totalInterviewSessions] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.application.count(),
      prisma.resumeAnalysis.count(),
      prisma.interviewSession.count(),
    ]);

  return {
    totalUsers,
    activeUsers,
    totalApplications,
    totalResumeAnalyses,
    totalInterviewSessions,
  };
}

export function listUsers({ q, page, pageSize }: UserListInput) {
  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { profile: { fullName: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  return Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { profile: { select: { fullName: true } } },
    }),
    prisma.user.count({ where }),
  ]);
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function updateUserStatus(id: string, status: UserStatus) {
  return prisma.user.update({ where: { id }, data: { status } });
}

export function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}

export function createAuditLog(data: Prisma.AuditLogUncheckedCreateInput) {
  return prisma.auditLog.create({ data });
}

/** Returns createdAt timestamps within the last N days for JS-side bucketing. */
export async function getTimestampsSince(
  model: "user" | "application" | "resumeAnalysis" | "interviewSession",
  since: Date,
) {
  switch (model) {
    case "user":
      return prisma.user
        .findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } })
        .then((rows) => rows.map((r) => r.createdAt));
    case "application":
      return prisma.application
        .findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } })
        .then((rows) => rows.map((r) => r.createdAt));
    case "resumeAnalysis":
      return prisma.resumeAnalysis
        .findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } })
        .then((rows) => rows.map((r) => r.createdAt));
    case "interviewSession":
      return prisma.interviewSession
        .findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } })
        .then((rows) => rows.map((r) => r.createdAt));
  }
}

// ---------- Jobs (admin management) ----------
export function listAllJobs() {
  return prisma.job.findMany({ orderBy: { createdAt: "desc" } });
}

export function createJob(data: Prisma.JobUncheckedCreateInput) {
  return prisma.job.create({ data });
}

export function deleteJob(id: string) {
  return prisma.job.delete({ where: { id } });
}
