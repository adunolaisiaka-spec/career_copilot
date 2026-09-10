import type { GoalInput } from "@/lib/validation/goal";
import * as repo from "@/server/repositories/goal.repository";
import { notify } from "@/server/services/notification.service";

export const listGoals = (userId: string) => repo.listGoalsByUser(userId);
export const getGoal = (userId: string, id: string) => repo.findGoalById(id, userId);

export function reconcileProgressAndStatus(progress: number, status: GoalInput["status"]) {
  if (status === "COMPLETED") return { progress: 100, status };
  if (progress >= 100) return { progress: 100, status: "COMPLETED" as const };
  return { progress, status };
}

export async function createGoal(userId: string, input: GoalInput) {
  const { progress, status } = reconcileProgressAndStatus(input.progress, input.status);
  return repo.createGoal(userId, {
    title: input.title,
    description: input.description,
    term: input.term,
    targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
    progress,
    status,
  });
}

async function notifyIfNewlyCompleted(
  userId: string,
  id: string,
  previousStatus: GoalInput["status"] | undefined,
  newStatus: GoalInput["status"],
  title: string,
) {
  if (previousStatus !== "COMPLETED" && newStatus === "COMPLETED") {
    await notify(
      userId,
      "goal_completed",
      "Goal completed!",
      `You completed your goal: ${title}.`,
      { entityType: "CareerGoal", entityId: id },
    );
  }
}

export async function updateGoal(userId: string, id: string, input: GoalInput) {
  const existing = await repo.findGoalById(id, userId);
  const { progress, status } = reconcileProgressAndStatus(input.progress, input.status);
  const result = await repo.updateGoal(id, userId, {
    title: input.title,
    description: input.description,
    term: input.term,
    targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
    progress,
    status,
  });
  await notifyIfNewlyCompleted(userId, id, existing?.status, status, input.title);
  return result;
}

export async function updateGoalProgress(userId: string, id: string, progress: number) {
  const existing = await repo.findGoalById(id, userId);
  const status = progress >= 100 ? ("COMPLETED" as const) : undefined;
  const result = await repo.updateGoal(id, userId, {
    progress: Math.min(progress, 100),
    ...(status ? { status } : {}),
  });
  if (existing && status) {
    await notifyIfNewlyCompleted(userId, id, existing.status, status, existing.title);
  }
  return result;
}

export async function deleteGoal(userId: string, id: string) {
  return repo.deleteGoal(id, userId);
}
