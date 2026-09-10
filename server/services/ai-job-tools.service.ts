import { getAIService } from "@/lib/ai";
import { findJobById } from "@/server/repositories/job.repository";
import { buildResumeText } from "@/server/services/resume.service";

export async function matchResumeToJob(userId: string, jobId: string, resumeId: string) {
  const job = await findJobById(jobId);
  if (!job) throw new Error("Job not found");

  const resumeText = await buildResumeText(userId, resumeId);
  if (resumeText.trim().length < 50) {
    throw new Error("This resume doesn't have enough content to compare yet. Add more details first.");
  }

  return getAIService().matchResumeToJob({
    resumeText,
    jobTitle: job.title,
    company: job.company,
    jobDescription: job.description,
    jobRequirements: job.requirements ?? undefined,
  });
}

export async function generateCoverLetter(userId: string, jobId: string, resumeId: string) {
  const job = await findJobById(jobId);
  if (!job) throw new Error("Job not found");

  const resumeText = await buildResumeText(userId, resumeId);
  if (resumeText.trim().length < 50) {
    throw new Error("This resume doesn't have enough content to write from yet. Add more details first.");
  }

  return getAIService().generateCoverLetter({
    resumeText,
    jobTitle: job.title,
    company: job.company,
    jobDescription: job.description,
  });
}
