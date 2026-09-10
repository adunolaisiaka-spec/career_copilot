import { describe, expect, it } from "vitest";
import { prisma } from "@/tests/integration/helpers/db";
import { createApplication } from "@/server/services/application.service";
import { createGoal } from "@/server/services/goal.service";
import { notify } from "@/server/services/notification.service";

describe("cascading delete (real DB, schema-level onDelete: Cascade)", () => {
  it("removes applications, career goals, and notifications when the owning user is deleted", async () => {
    const user = await prisma.user.create({
      data: { email: `test-cascade-full-${Date.now()}@example.test`, passwordHash: "irrelevant" },
    });

    const app = await createApplication(user.id, {
      companyName: "Nimbus Cloud",
      jobTitle: "Engineer",
      status: "SAVED",
      appliedDate: undefined,
      notes: undefined,
      jobLink: undefined,
    });
    const goal = await createGoal(user.id, {
      title: "Test goal",
      description: undefined,
      term: "SHORT",
      targetDate: undefined,
      progress: 0,
      status: "NOT_STARTED",
    });
    const notification = await notify(user.id, "goal_completed", "Test", "Test message");

    // Sanity check everything actually exists before deleting.
    expect(await prisma.application.findUnique({ where: { id: app.id } })).not.toBeNull();
    expect(await prisma.careerGoal.findUnique({ where: { id: goal.id } })).not.toBeNull();
    expect(await prisma.notification.findUnique({ where: { id: notification.id } })).not.toBeNull();

    await prisma.user.delete({ where: { id: user.id } });

    expect(await prisma.application.findUnique({ where: { id: app.id } })).toBeNull();
    expect(await prisma.careerGoal.findUnique({ where: { id: goal.id } })).toBeNull();
    expect(await prisma.notification.findUnique({ where: { id: notification.id } })).toBeNull();
  });
});
