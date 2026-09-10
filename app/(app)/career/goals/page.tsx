import { requireAuth } from "@/lib/auth/helpers";
import { listGoals } from "@/server/services/goal.service";
import { GoalsClient } from "@/components/goals/goals-client";

export default async function CareerGoalsPage() {
  const user = await requireAuth();
  const goals = await listGoals(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Career Goals</h1>
      <GoalsClient goals={goals} />
    </div>
  );
}
