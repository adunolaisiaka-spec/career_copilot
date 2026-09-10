import { afterEach, describe, expect, it } from "vitest";
import { prisma, cleanupUser } from "@/tests/integration/helpers/db";
import type { GoalInput } from "@/lib/validation/goal";
import {
  createGoal,
  deleteGoal,
  getGoal,
  listGoals,
  updateGoalProgress,
} from "@/server/services/goal.service";
import { listNotifications } from "@/server/services/notification.service";

let userId: string | null = null;

afterEach(async () => {
  if (userId) await cleanupUser(userId);
  userId = null;
});

async function makeUser() {
  const user = await prisma.user.create({
    data: { email: `test-goals-${Date.now()}@example.test`, passwordHash: "irrelevant" },
  });
  userId = user.id;
  return user;
}

function goalInput(overrides: Partial<GoalInput> = {}): GoalInput {
  return {
    title: "Land a new role",
    description: undefined,
    term: "SHORT",
    targetDate: undefined,
    progress: 0,
    status: "NOT_STARTED",
    ...overrides,
  };
}

describe("career goal CRUD and completion (real DB)", () => {
  it("creates, lists, and deletes a goal", async () => {
    const user = await makeUser();

    const goal = await createGoal(user.id, goalInput());

    expect(await listGoals(user.id)).toHaveLength(1);

    await deleteGoal(user.id, goal.id);
    expect(await listGoals(user.id)).toHaveLength(0);
  });

  it("auto-completes and fires a notification when progress reaches 100 via the API path", async () => {
    const user = await makeUser();
    const goal = await createGoal(
      user.id,
      goalInput({ title: "Finish onboarding", progress: 20, status: "IN_PROGRESS" }),
    );

    await updateGoalProgress(user.id, goal.id, 100);

    const updated = await getGoal(user.id, goal.id);
    expect(updated?.status).toBe("COMPLETED");
    expect(updated?.progress).toBe(100);

    const notifications = await listNotifications(user.id);
    expect(notifications.some((n) => n.type === "goal_completed")).toBe(true);
  });

  it("does not re-fire the completion notification on a later no-op update", async () => {
    const user = await makeUser();
    const goal = await createGoal(
      user.id,
      goalInput({ title: "Finish onboarding", progress: 100, status: "COMPLETED" }),
    );

    await updateGoalProgress(user.id, goal.id, 100);

    const notifications = await listNotifications(user.id);
    expect(notifications.filter((n) => n.type === "goal_completed")).toHaveLength(0);
  });
});
