import { prisma } from "@/lib/database/prisma";
import * as repo from "@/server/repositories/job.repository";
import { assertWithinLimit } from "@/server/services/subscription.service";

export const searchJobs = repo.searchJobs;
export const findJobById = repo.findJobById;
export const distinctIndustries = repo.distinctIndustries;
export const distinctExperienceLevels = repo.distinctExperienceLevels;

export async function toggleSaveJob(userId: string, jobId: string, save: boolean, notes?: string) {
  if (!save) return repo.unsaveJob(userId, jobId);

  const alreadySaved = await repo.findSavedJob(userId, jobId);
  if (!alreadySaved) await assertWithinLimit(userId, "maxSavedJobs");
  return repo.saveJob(userId, jobId, notes);
}

export async function isJobSaved(userId: string, jobId: string) {
  const saved = await repo.findSavedJob(userId, jobId);
  return Boolean(saved);
}

/** Creates an Application for this job if the user doesn't already have one, idempotently. */
export async function trackJobApplication(userId: string, jobId: string) {
  const job = await repo.findJobById(jobId);
  if (!job) throw new Error("Job not found");

  const existing = await prisma.application.findFirst({ where: { userId, jobId } });
  if (existing) return existing;

  await assertWithinLimit(userId, "maxApplications");

  return prisma.application.create({
    data: {
      userId,
      jobId,
      companyName: job.company,
      jobTitle: job.title,
      status: "SAVED",
      jobLink: job.url,
    },
  });
}
