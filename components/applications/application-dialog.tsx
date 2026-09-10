"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  applicationInputSchema,
  type ApplicationFormInput,
  type ApplicationInput,
  APPLICATION_STATUSES,
} from "@/lib/validation/application";
import type { listApplications } from "@/server/services/application.service";
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

type Application = Awaited<ReturnType<typeof listApplications>>[number];

const STATUS_LABELS: Record<(typeof APPLICATION_STATUSES)[number], string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  TECHNICAL_INTERVIEW: "Technical Interview",
  FINAL_INTERVIEW: "Final Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

interface ApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: Application | null;
}

export function ApplicationDialog({ open, onOpenChange, application }: ApplicationDialogProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormInput, unknown, ApplicationInput>({
    resolver: zodResolver(applicationInputSchema),
    values: application
      ? {
          companyName: application.companyName,
          jobTitle: application.jobTitle,
          status: application.status,
          appliedDate: application.appliedDate
            ? new Date(application.appliedDate).toISOString().slice(0, 10)
            : "",
          notes: application.notes ?? "",
          jobLink: application.jobLink ?? "",
        }
      : {
          companyName: "",
          jobTitle: "",
          status: "SAVED",
          appliedDate: "",
          notes: "",
          jobLink: "",
        },
  });

  const onSubmit = async (values: ApplicationInput) => {
    setServerError(null);
    const url = application ? `/api/applications/${application.id}` : "/api/applications";
    const method = application ? "PUT" : "POST";

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
    if (!application) return;
    setDeleting(true);
    try {
      await fetch(`/api/applications/${application.id}`, { method: "DELETE" });
      onOpenChange(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const addInterviewDate = async () => {
    if (!application || !interviewDate) return;
    await fetch(`/api/applications/${application.id}/interviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledDate: interviewDate, type: "GENERAL" }),
    });
    setInterviewDate("");
    router.refresh();
  };

  const removeInterviewDate = async (interviewId: string) => {
    if (!application) return;
    await fetch(`/api/applications/${application.id}/interviews/${interviewId}`, {
      method: "DELETE",
    });
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{application ? "Edit application" : "New application"}</DialogTitle>
            <DialogDescription>Track a job application through its lifecycle.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="companyName">Company</Label>
                <Input id="companyName" {...register("companyName")} />
                {errors.companyName && (
                  <p className="text-destructive text-sm">{errors.companyName.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="jobTitle">Job title</Label>
                <Input id="jobTitle" {...register("jobTitle")} />
                {errors.jobTitle && (
                  <p className="text-destructive text-sm">{errors.jobTitle.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status">Status</Label>
              <SelectController control={control} name="status" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="appliedDate">Applied date</Label>
                <Input id="appliedDate" type="date" {...register("appliedDate")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="jobLink">Job link</Label>
                <Input id="jobLink" placeholder="https://..." {...register("jobLink")} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} {...register("notes")} />
            </div>

            {application && (
              <div className="flex flex-col gap-2">
                <Label>Interview dates</Label>
                <ul className="flex flex-col gap-1">
                  {application.interviews.map((interview) => (
                    <li
                      key={interview.id}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      {interview.scheduledDate
                        ? new Date(interview.scheduledDate).toLocaleString()
                        : "No date"}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInterviewDate(interview.id)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Input
                    type="datetime-local"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addInterviewDate}>
                    Add
                  </Button>
                </div>
              </div>
            )}

            {serverError && <p className="text-destructive text-sm">{serverError}</p>}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            {application ? (
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

function SelectController({
  control,
  name,
}: {
  control: Control<ApplicationFormInput>;
  name: "status";
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger id={name} className="w-full">
            <SelectValue placeholder="Select status">
              {(value: string) => STATUS_LABELS[value as (typeof APPLICATION_STATUSES)[number]]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {APPLICATION_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
