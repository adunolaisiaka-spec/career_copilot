import { prisma } from "@/lib/database/prisma";
import { notify } from "@/server/services/notification.service";

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  GENERAL: "interview",
  BEHAVIORAL: "behavioral interview",
  TECHNICAL: "technical interview",
  HR: "HR interview",
  SITUATIONAL: "situational interview",
};

/**
 * Finds interviews scheduled for tomorrow (the next full UTC calendar day)
 * that haven't already been reminded, and sends an in-app notification for
 * each. Meant to be called once/day by the Vercel Cron job at
 * app/api/cron/interview-reminders — the only time-based (as opposed to
 * event-triggered) notification in this app, since there's no other
 * background job runner. Idempotent across runs: re-checks for an existing
 * "interview_reminder" notification per interview rather than a separate
 * "reminded" flag, so re-running the same day (or a retry) never double-sends.
 */
export async function sendInterviewReminders(): Promise<{ remindersSent: number }> {
  const now = new Date();
  const startOfTomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const startOfDayAfter = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2),
  );

  const interviews = await prisma.interview.findMany({
    where: { scheduledDate: { gte: startOfTomorrow, lt: startOfDayAfter } },
    include: { application: true },
  });

  let remindersSent = 0;
  for (const interview of interviews) {
    const alreadyReminded = await prisma.notification.findFirst({
      where: {
        type: "interview_reminder",
        relatedEntityType: "Interview",
        relatedEntityId: interview.id,
      },
    });
    if (alreadyReminded) continue;

    const typeLabel = INTERVIEW_TYPE_LABELS[interview.type] ?? "interview";
    const company = interview.application?.companyName;

    await notify(
      interview.userId,
      "interview_reminder",
      "Interview tomorrow",
      `Your ${typeLabel} for ${interview.jobTitle}${company ? ` at ${company}` : ""} is scheduled for tomorrow.`,
      { entityType: "Interview", entityId: interview.id },
    );
    remindersSent++;
  }

  return { remindersSent };
}
