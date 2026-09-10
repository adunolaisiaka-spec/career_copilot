import { afterEach, describe, expect, it } from "vitest";
import { prisma, cleanupUser } from "@/tests/integration/helpers/db";
import type { ApplicationInput } from "@/lib/validation/application";
import {
  createApplication,
  deleteApplication,
  getApplicationStats,
  listApplications,
  updateApplicationStatus,
} from "@/server/services/application.service";
import { listNotifications } from "@/server/services/notification.service";

let userId: string | null = null;

afterEach(async () => {
  if (userId) await cleanupUser(userId);
  userId = null;
});

async function makeUser() {
  const user = await prisma.user.create({
    data: {
      email: `test-apps-${Date.now()}@example.test`,
      passwordHash: "irrelevant",
      subscription: { create: { plan: "FREE", status: "ACTIVE" } },
    },
  });
  userId = user.id;
  return user;
}

function appInput(overrides: Partial<ApplicationInput> = {}): ApplicationInput {
  return {
    companyName: "Nimbus Cloud",
    jobTitle: "Engineer",
    status: "SAVED",
    appliedDate: undefined,
    notes: undefined,
    jobLink: undefined,
    ...overrides,
  };
}

describe("application CRUD (real DB)", () => {
  it("creates, lists, and deletes an application", async () => {
    const user = await makeUser();

    const app = await createApplication(user.id, appInput());

    const list = await listApplications(user.id);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(app.id);

    await deleteApplication(user.id, app.id);
    expect(await listApplications(user.id)).toHaveLength(0);
  });

  it("computes stats correctly across multiple statuses", async () => {
    const user = await makeUser();

    await createApplication(user.id, appInput({ companyName: "A", status: "APPLIED" }));
    const b = await createApplication(user.id, appInput({ companyName: "B", status: "APPLIED" }));
    const c = await createApplication(user.id, appInput({ companyName: "C", status: "SAVED" }));
    await updateApplicationStatus(user.id, b.id, "OFFER");
    await updateApplicationStatus(user.id, c.id, "REJECTED");

    const stats = await getApplicationStats(user.id);
    expect(stats.total).toBe(3);
    expect(stats.offers).toBe(1);
    expect(stats.rejected).toBe(1);
  });

  it("fires a notification when status changes to a notify-worthy value", async () => {
    const user = await makeUser();
    const app = await createApplication(user.id, appInput({ status: "APPLIED" }));

    await updateApplicationStatus(user.id, app.id, "INTERVIEW");

    const notifications = await listNotifications(user.id);
    expect(notifications.some((n) => n.type === "application_status_changed")).toBe(true);
  });

  it("does not fire a duplicate notification when the status doesn't actually change", async () => {
    const user = await makeUser();
    const app = await createApplication(user.id, appInput({ status: "INTERVIEW" }));

    await updateApplicationStatus(user.id, app.id, "INTERVIEW");

    const notifications = await listNotifications(user.id);
    expect(notifications.filter((n) => n.type === "application_status_changed")).toHaveLength(0);
  });

  it("enforces the Free plan's application limit end-to-end", async () => {
    const user = await makeUser();

    for (let i = 0; i < 10; i++) {
      await createApplication(user.id, appInput({ companyName: `Co${i}` }));
    }

    await expect(
      createApplication(user.id, appInput({ companyName: "OneTooMany" })),
    ).rejects.toThrow(/Free plan limit/);

    expect(await listApplications(user.id)).toHaveLength(10);
  });
});
