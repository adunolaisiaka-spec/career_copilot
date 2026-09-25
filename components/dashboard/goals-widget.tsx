import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import type { CareerGoal } from "@prisma/client";

const TERM_LABELS: Record<CareerGoal["term"], string> = {
  SHORT: "Short-term",
  MEDIUM: "Medium-term",
  LONG: "Long-term",
};

export function GoalsWidget({ goals }: { goals: CareerGoal[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Target className="text-primary size-4" />
          Career Goals
        </CardTitle>
        <CardDescription>Progress on what you&apos;re working toward.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {goals.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No active goals yet. Set one to give your job search direction.
          </p>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{goal.title}</span>
                <span className="text-muted-foreground text-xs">{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} />
              <span className="text-muted-foreground text-xs">{TERM_LABELS[goal.term]}</span>
            </div>
          ))
        )}
        <Link
          href="/career/goals"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}
        >
          {goals.length === 0 ? "Set a goal" : "View all goals"}
        </Link>
      </CardContent>
    </Card>
  );
}
