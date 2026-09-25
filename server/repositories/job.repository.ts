import { prisma } from "@/lib/database/prisma";
import { Prisma } from "@prisma/client";
import type { JobSearchInput } from "@/lib/validation/job";

function buildWhere(filters: JobSearchInput): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = {};

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { company: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { requirements: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.location) {
    where.location = { contains: filters.location, mode: "insensitive" };
  }
  if (filters.remoteType) {
    where.remoteType = filters.remoteType;
  }
  if (filters.experienceLevel) {
    where.experienceLevel = { equals: filters.experienceLevel, mode: "insensitive" };
  }
  if (filters.industry) {
    where.industry = { equals: filters.industry, mode: "insensitive" };
  }
  if (filters.salaryMin) {
    where.salaryMax = { gte: filters.salaryMin };
  }
  if (filters.postedWithinDays) {
    where.datePosted = {
      gte: new Date(Date.now() - filters.postedWithinDays * 24 * 60 * 60 * 1000),
    };
  }

  return where;
}

function buildOrderBy(sort: JobSearchInput["sort"]): Prisma.JobOrderByWithRelationInput {
  switch (sort) {
    case "salary_high":
      return { salaryMax: "desc" };
    case "salary_low":
      return { salaryMin: "asc" };
    case "title_az":
      return { title: "asc" };
    case "newest":
    default:
      return { datePosted: "desc" };
  }
}

export async function searchJobs(userId: string, filters: JobSearchInput) {
  const where = buildWhere(filters);

  if (filters.savedOnly) {
    where.savedJobs = { some: { userId } };
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: buildOrderBy(filters.sort),
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: { savedJobs: { where: { userId }, select: { id: true } } },
    }),
    prisma.job.count({ where }),
  ]);

  return { jobs, total };
}

export function findJobById(id: string) {
  return prisma.job.findUnique({ where: { id } });
}

export function findSavedJob(userId: string, jobId: string) {
  return prisma.savedJob.findUnique({ where: { userId_jobId: { userId, jobId } } });
}

export function saveJob(userId: string, jobId: string, notes?: string) {
  return prisma.savedJob.upsert({
    where: { userId_jobId: { userId, jobId } },
    update: { notes },
    create: { userId, jobId, notes },
  });
}

export function unsaveJob(userId: string, jobId: string) {
  return prisma.savedJob.deleteMany({ where: { userId, jobId } });
}

export function upsertExternalJob(
  externalId: string,
  data: Omit<Prisma.JobUncheckedCreateInput, "source" | "externalId">,
) {
  return prisma.job.upsert({
    where: { source_externalId: { source: "EXTERNAL", externalId } },
    create: { source: "EXTERNAL", externalId, ...data },
    update: data,
  });
}

export function distinctIndustries() {
  return prisma.job
    .findMany({ distinct: ["industry"], select: { industry: true } })
    .then((rows) => rows.map((r) => r.industry).filter((v): v is string => Boolean(v)));
}

export function distinctExperienceLevels() {
  return prisma.job
    .findMany({ distinct: ["experienceLevel"], select: { experienceLevel: true } })
    .then((rows) => rows.map((r) => r.experienceLevel).filter((v): v is string => Boolean(v)));
}
