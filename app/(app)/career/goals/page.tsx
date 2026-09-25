import { requireAuth } from "@/lib/auth/helpers";
import { listGoals } from "@/server/services/goal.service";
import { GoalsClient } from "@/components/goals/goals-client";
import { PageHeader } from "@/components/layout/page-header";
import { Target } from "lucide-react";

export default async function CareerGoalsPage() {
  const user = await requireAuth();
  const goals = await listGoals(user.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-8">
      <PageHeader
        icon={Target}
        title="Career Goals"
        description="Set short, medium, and long-term goals and track your progress."
      />
      <GoalsClient goals={goals} />
    </div>
  );
}
