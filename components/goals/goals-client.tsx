"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { listGoals } from "@/server/services/goal.service";
import { GOAL_TERMS } from "@/lib/validation/goal";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GoalDialog } from "@/components/goals/goal-dialog";

type Goal = Awaited<ReturnType<typeof listGoals>>[number];

const TERM_LABELS: Record<(typeof GOAL_TERMS)[number], string> = {
  SHORT: "Short-term",
  MEDIUM: "Medium-term",
  LONG: "Long-term",
};

const STATUS_STYLES: Record<Goal["status"], string> = {
  NOT_STARTED: "text-muted-foreground",
  IN_PROGRESS: "text-blue-600 dark:text-blue-400",
  COMPLETED: "text-emerald-600 dark:text-emerald-400",
  ABANDONED: "text-muted-foreground line-through",
};

function GoalCard({ goal, onEdit }: { goal: Goal; onEdit: () => void }) {
  const router = useRouter();
  const [progress, setProgress] = useState(goal.progress);
  const [saving, setSaving] = useState(false);

  const commitProgress = async (value: number) => {
    setProgress(value);
    setSaving(true);
    try {
      await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: value }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onEdit}>
        <CardTitle className="text-base">{goal.title}</CardTitle>
        {goal.description && <CardDescription>{goal.description}</CardDescription>}
        <p className={`text-xs font-medium ${STATUS_STYLES[goal.status]}`}>
          {goal.status.replace("_", " ")}
          {goal.targetDate && ` · Target: ${new Date(goal.targetDate).toLocaleDateString()}`}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            disabled={saving}
            onChange={(e) => setProgress(Number(e.target.value))}
            onMouseUp={(e) => commitProgress(Number(e.currentTarget.value))}
            onTouchEnd={(e) => commitProgress(Number(e.currentTarget.value))}
            className="w-24"
          />
          <span className="text-muted-foreground w-10 text-right text-sm">{progress}%</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function GoalsClient({ goals }: { goals: Goal[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Goal | null>(null);
  const [defaultTerm, setDefaultTerm] = useState<(typeof GOAL_TERMS)[number]>("SHORT");

  const openCreate = (term: (typeof GOAL_TERMS)[number]) => {
    setSelected(null);
    setDefaultTerm(term);
    setDialogOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setSelected(goal);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-8">
      {GOAL_TERMS.map((term) => {
        const termGoals = goals.filter((g) => g.term === term);
        return (
          <div key={term} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{TERM_LABELS[term]}</h2>
              <Button variant="outline" size="sm" onClick={() => openCreate(term)}>
                Add {TERM_LABELS[term].toLowerCase()} goal
              </Button>
            </div>
            {termGoals.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No {TERM_LABELS[term].toLowerCase()} goals yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {termGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onEdit={() => openEdit(goal)} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <GoalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelected(null);
        }}
        goal={selected}
        defaultTerm={defaultTerm}
      />
    </div>
  );
}
