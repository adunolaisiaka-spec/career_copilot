"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { listAllJobs } from "@/server/services/admin.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Job = Awaited<ReturnType<typeof listAllJobs>>[number];

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
            <select
              name="remoteType"
              className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
            >
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
                <CardDescription>
                  {job.company} · {job.location} · {job.source}
                </CardDescription>
              </div>
              <Button
                variant="destructive"
                size="sm"
                disabled={deletingId === job.id}
                onClick={() => handleDelete(job.id)}
              >
                Delete
              </Button>
            </CardHeader>
          </Card>
        ))}
        {jobs.length === 0 && <p className="text-muted-foreground text-sm">No jobs yet.</p>}
      </div>
    </div>
  );
}
