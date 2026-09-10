"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  goalInputSchema,
  type GoalFormInput,
  type GoalInput,
  GOAL_TERMS,
  GOAL_STATUSES,
} from "@/lib/validation/goal";
import type { listGoals } from "@/server/services/goal.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Goal = Awaited<ReturnType<typeof listGoals>>[number];

const TERM_LABELS: Record<(typeof GOAL_TERMS)[number], string> = {
  SHORT: "Short-term",
  MEDIUM: "Medium-term",
  LONG: "Long-term",
};

const STATUS_LABELS: Record<(typeof GOAL_STATUSES)[number], string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
};

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  defaultTerm?: (typeof GOAL_TERMS)[number];
}

export function GoalDialog({ open, onOpenChange, goal, defaultTerm }: GoalDialogProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormInput, unknown, GoalInput>({
    resolver: zodResolver(goalInputSchema),
    values: goal
      ? {
          title: goal.title,
          description: goal.description ?? "",
          term: goal.term,
          targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().slice(0, 10) : "",
          progress: goal.progress,
          status: goal.status,
        }
      : {
          title: "",
          description: "",
          term: defaultTerm ?? "SHORT",
          targetDate: "",
          progress: 0,
          status: "NOT_STARTED",
        },
  });

  const onSubmit = async (values: GoalInput) => {
    setServerError(null);
    const url = goal ? `/api/goals/${goal.id}` : "/api/goals";
    const method = goal ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }

    reset();
    onOpenChange(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!goal) return;
    setDeleting(true);
    try {
      await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      onOpenChange(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{goal ? "Edit goal" : "New career goal"}</DialogTitle>
            <DialogDescription>Set a measurable goal and track your progress.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Get a junior developer role"
                {...register("title")}
              />
              {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} {...register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="term">Term</Label>
                <Controller
                  control={control}
                  name="term"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="term" className="w-full">
                        <SelectValue>{(value: string) => TERM_LABELS[value as (typeof GOAL_TERMS)[number]]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {GOAL_TERMS.map((term) => (
                          <SelectItem key={term} value={term}>
                            {TERM_LABELS[term]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="targetDate">Target date</Label>
                <Input id="targetDate" type="date" {...register("targetDate")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="status">Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue>{(value: string) => STATUS_LABELS[value as (typeof GOAL_STATUSES)[number]]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {GOAL_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input id="progress" type="number" min={0} max={100} {...register("progress")} />
              </div>
            </div>

            {serverError && <p className="text-destructive text-sm">{serverError}</p>}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {goal ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
