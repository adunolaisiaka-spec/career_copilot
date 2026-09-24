import { afterEach, describe, expect, it } from "vitest";
import { prisma, cleanupUser } from "@/tests/integration/helpers/db";
import { sendInterviewReminders } from "@/server/services/reminder.service";
import { listNotifications } from "@/server/services/notification.service";

let userId: string | null = null;

afterEach(async () => {
  if (userId) await cleanupUser(userId);
  userId = null;
});

async function makeUser() {
  const user = await prisma.user.create({
    data: {
      email: `test-reminders-${Date.now()}@example.test`,
      passwordHash: "irrelevant",
      subscription: { create: { plan: "FREE", status: "ACTIVE" } },
    },
  });
  userId = user.id;
  return user;
}

function utcDaysFromNow(days: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days, 14));
}

describe("sendInterviewReminders (real DB)", () => {
  it("notifies for an interview scheduled tomorrow, referencing the company", async () => {
    const user = await makeUser();
    const application = await prisma.application.create({
      data: { userId: user.id, companyName: "Nimbus Cloud", jobTitle: "Engineer" },
    });
    await prisma.interview.create({
      data: {
        userId: user.id,
        applicationId: application.id,
        jobTitle: "Engineer",
        type: "TECHNICAL",
        scheduledDate: utcDaysFromNow(1),
      },
    });

    const result = await sendInterviewReminders();
    expect(result.remindersSent).toBeGreaterThanOrEqual(1);

    const notifications = await listNotifications(user.id);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("interview_reminder");
    expect(notifications[0].message).toContain("Nimbus Cloud");
    expect(notifications[0].message).toContain("Engineer");
  });

  it("does not notify for interviews scheduled today or more than a day out", async () => {
    const user = await makeUser();
    await prisma.interview.create({
      data: { userId: user.id, jobTitle: "Today Role", type: "GENERAL", scheduledDate: utcDaysFromNow(0) },
    });
    await prisma.interview.create({
      data: { userId: user.id, jobTitle: "Later Role", type: "GENERAL", scheduledDate: utcDaysFromNow(3) },
    });

    await sendInterviewReminders();

    const notifications = await listNotifications(user.id);
    expect(notifications).toHaveLength(0);
  });

  it("does not double-notify on a repeat run for the same interview", async () => {
    const user = await makeUser();
    await prisma.interview.create({
      data: { userId: user.id, jobTitle: "Engineer", type: "GENERAL", scheduledDate: utcDaysFromNow(1) },
    });

    await sendInterviewReminders();
    await sendInterviewReminders();

    // Scoped to this user specifically, since remindersSent is a global count
    // that other data present during the same test run could also affect.
    const notifications = await listNotifications(user.id);
    expect(notifications).toHaveLength(1);
  });

  it("ignores interviews with no scheduled date", async () => {
    const user = await makeUser();
    await prisma.interview.create({
      data: { userId: user.id, jobTitle: "Unscheduled Role", type: "GENERAL" },
    });

    await sendInterviewReminders();

    const notifications = await listNotifications(user.id);
    expect(notifications).toHaveLength(0);
  });
});
