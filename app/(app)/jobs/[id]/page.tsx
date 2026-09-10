import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { findJobById, isJobSaved } from "@/server/services/job.service";
import { listResumes } from "@/server/services/resume.service";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { TrackApplicationButton } from "@/components/jobs/track-application-button";
import { AiJobTools } from "@/components/jobs/ai-job-tools";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  return `$${(min ?? max)!.toLocaleString()}+`;
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const { id } = await params;
  const job = await findJobById(id);
  if (!job) notFound();

  const [saved, resumes] = await Promise.all([
    isJobSaved(user.id, id),
    listResumes(user.id),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <Card>
        <CardHeader>
          <CardTitle>{job.title}</CardTitle>
          <CardDescription>
            {job.company} · {job.location}
            {job.remoteType && ` · ${job.remoteType}`}
          </CardDescription>
          {formatSalary(job.salaryMin, job.salaryMax) && (
            <p className="text-muted-foreground text-sm">
              {formatSalary(job.salaryMin, job.salaryMax)}
            </p>
          )}
          {job.industry && (
            <p className="text-muted-foreground text-xs">
              {job.industry} {job.experienceLevel && `· ${job.experienceLevel}`}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Description</h3>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{job.description}</p>
          </div>
          {job.requirements && (
            <div>
              <h3 className="mb-1 text-sm font-semibold">Requirements</h3>
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {job.requirements}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <SaveJobButton jobId={job.id} initialSaved={saved} />
            <TrackApplicationButton jobId={job.id} />
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline" })}
              >
                Apply externally
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <AiJobTools jobId={job.id} resumes={resumes.map((r) => ({ id: r.id, title: r.title }))} />
    </div>
  );
}
