import type { ApplicationInput, InterviewDateInput } from "@/lib/validation/application";
import * as repo from "@/server/repositories/application.repository";
import { notify } from "@/server/services/notification.service";
import { assertWithinLimit } from "@/server/services/subscription.service";

export const listApplications = (userId: string) => repo.listApplicationsByUser(userId);
export const getApplication = (userId: string, id: string) => repo.findApplicationById(id, userId);

export async function createApplication(userId: string, input: ApplicationInput) {
  await assertWithinLimit(userId, "maxApplications");
  return repo.createApplication(userId, {
    companyName: input.companyName,
    jobTitle: input.jobTitle,
    status: input.status,
    appliedDate: input.appliedDate ? new Date(input.appliedDate) : undefined,
    notes: input.notes,
    jobLink: input.jobLink,
  });
}

export async function updateApplication(userId: string, id: string, input: ApplicationInput) {
  return repo.updateApplication(id, userId, {
    companyName: input.companyName,
    jobTitle: input.jobTitle,
    status: input.status,
    appliedDate: input.appliedDate ? new Date(input.appliedDate) : undefined,
    notes: input.notes,
    jobLink: input.jobLink,
  });
}

const NOTIFY_STATUSES: ApplicationInput["status"][] = [
  "INTERVIEW",
  "TECHNICAL_INTERVIEW",
  "FINAL_INTERVIEW",
  "OFFER",
  "REJECTED",
];

const STATUS_MESSAGES: Partial<Record<ApplicationInput["status"], string>> = {
  INTERVIEW: "moved to Interview",
  TECHNICAL_INTERVIEW: "moved to Technical Interview",
  FINAL_INTERVIEW: "moved to Final Interview",
  OFFER: "received an Offer",
  REJECTED: "was marked Rejected",
};

export async function updateApplicationStatus(
  userId: string,
  id: string,
  status: ApplicationInput["status"],
) {
  const existing = await repo.findApplicationById(id, userId);
  const result = await repo.updateApplication(id, userId, { status });

  if (existing && existing.status !== status && NOTIFY_STATUSES.includes(status)) {
    await notify(
      userId,
      "application_status_changed",
      "Application status updated",
      `Your application to ${existing.companyName} for ${existing.jobTitle} ${STATUS_MESSAGES[status]}.`,
      { entityType: "Application", entityId: id },
    );
  }

  return result;
}

export async function deleteApplication(userId: string, id: string) {
  return repo.deleteApplication(id, userId);
}

export async function getApplicationStats(userId: string) {
  const byStatus = await repo.countApplicationsByStatus(userId);
  const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  const interviews = byStatus.INTERVIEW + byStatus.TECHNICAL_INTERVIEW + byStatus.FINAL_INTERVIEW;
  const pending = total - byStatus.OFFER - byStatus.REJECTED - byStatus.WITHDRAWN;

  return {
    total,
    applied: byStatus.APPLIED,
    interviews,
    offers: byStatus.OFFER,
    rejected: byStatus.REJECTED,
    pending,
    byStatus,
  };
}

export async function addInterviewDate(
  userId: string,
  applicationId: string,
  application: { jobTitle: string },
  input: InterviewDateInput,
) {
  return repo.addInterviewToApplication(applicationId, userId, {
    jobTitle: application.jobTitle,
    type: input.type,
    scheduledDate: new Date(input.scheduledDate),
  });
}

export async function removeInterviewDate(userId: string, interviewId: string) {
  return repo.deleteInterview(interviewId, userId);
}
