"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { listAllJobs } from "@/server/services/admin.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";

type Job = Awaited<ReturnType<typeof listAllJobs>>[number];

const NATIVE_SELECT_CLASS =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border bg-transparent px-2 text-sm outline-none transition-colors focus-visible:ring-3";

export function AdminJobsClient({ jobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);

    const payload = {
      title: form.get("title"),
      company: form.get("company"),
      location: form.get("location") || undefined,
      remoteType: form.get("remoteType") || undefined,
      salaryMin: form.get("salaryMin") || undefined,
      salaryMax: form.get("salaryMax") || undefined,
      description: form.get("description"),
      requirements: form.get("requirements") || undefined,
      industry: form.get("industry") || undefined,
      experienceLevel: form.get("experienceLevel") || undefined,
      url: form.get("url") || undefined,
    };

    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Failed to create job");
        return;
      }
      e.currentTarget.reset();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job listing?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admin/jobs/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a job listing</CardTitle>
          <CardDescription>Manually posted jobs appear in Job Search immediately.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreate} className="flex flex-col gap-3 px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <Input name="title" placeholder="Job title" required />
            <Input name="company" placeholder="Company" required />
            <Input name="location" placeholder="Location" />
            <select name="remoteType" className={NATIVE_SELECT_CLASS}>
              <option value="">Any arrangement</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">On-site</option>
            </select>
            <Input name="salaryMin" type="number" placeholder="Min salary" />
            <Input name="salaryMax" type="number" placeholder="Max salary" />
            <Input name="industry" placeholder="Industry" />
            <Input name="experienceLevel" placeholder="Experience level" />
          </div>
          <Textarea name="description" placeholder="Description" rows={3} required />
          <Textarea name="requirements" placeholder="Requirements" rows={2} />
          <Input name="url" placeholder="External application URL (optional)" />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={submitting} className="self-start">
            {submitting ? "Adding..." : "Add job"}
          </Button>
        </form>
      </Card>

      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">{job.title}</CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  {job.company} · {job.location}
                  <Badge variant={job.source === "EXTERNAL" ? "info" : "secondary"}>
                    {job.source === "EXTERNAL" ? "Synced" : "Manual"}
                  </Badge>
                </CardDescription>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={deletingId === job.id}
                onClick={() => handleDelete(job.id)}
              >
                {deletingId === job.id ? "Deleting..." : "Delete"}
              </Button>
            </CardHeader>
          </Card>
        ))}
        {jobs.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Briefcase className="text-muted-foreground size-6" />
            <p className="text-muted-foreground text-sm">No jobs yet — add one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
