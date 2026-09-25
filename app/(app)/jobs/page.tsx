import Link from "next/link";
import { requireAuth } from "@/lib/auth/helpers";
import { jobSearchSchema } from "@/lib/validation/job";
import {
  distinctExperienceLevels,
  distinctIndustries,
  searchJobs,
} from "@/server/services/job.service";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utilities/format-relative-time";
import { Search, MapPin, Briefcase, ChevronLeft, ChevronRight, X } from "lucide-react";

const NATIVE_FIELD_CLASS =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:ring-3";

const AVATAR_PALETTE = [
  "bg-primary/15 text-primary",
  "bg-info/15 text-info",
  "bg-success/15 text-success",
  "bg-warning/20 text-warning-foreground",
];

function companyInitial(name: string): { letter: string; className: string } {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  const hash = Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return { letter, className: AVATAR_PALETTE[hash % AVATAR_PALETTE.length] };
}

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  return `$${(min ?? max)!.toLocaleString()}+`;
}

const REMOTE_LABELS: Record<string, string> = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const parsed = jobSearchSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : jobSearchSchema.parse({});

  const [{ jobs, total }, industries, experienceLevels] = await Promise.all([
    searchJobs(user.id, filters),
    distinctIndustries(),
    distinctExperienceLevels(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const hasActiveFilters = Boolean(
    filters.q || filters.location || filters.remoteType || filters.experienceLevel ||
      filters.industry || filters.salaryMin || filters.postedWithinDays || filters.savedOnly,
  );

  const buildPageHref = (page: number) => {
    const sp = new URLSearchParams(params as Record<string, string>);
    sp.set("page", String(page));
    return `/jobs?${sp.toString()}`;
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Job Search</h1>
        <p className="text-muted-foreground text-sm">
          {total} opening{total === 1 ? "" : "s"} — including live listings synced daily.
        </p>
      </div>

      <Card>
        <CardContent>
          <form method="GET" className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="relative col-span-2 sm:col-span-2">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <input
                  name="q"
                  placeholder="Title, company, keyword..."
                  defaultValue={filters.q ?? ""}
                  className={`${NATIVE_FIELD_CLASS} pl-8`}
                />
              </div>
              <div className="relative">
                <MapPin className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <input
                  name="location"
                  placeholder="Location"
                  defaultValue={filters.location ?? ""}
                  className={`${NATIVE_FIELD_CLASS} pl-8`}
                />
              </div>
              <select
                name="remoteType"
                defaultValue={filters.remoteType ?? ""}
                className={NATIVE_FIELD_CLASS}
              >
                <option value="">Any arrangement</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-site</option>
              </select>
              <select
                name="experienceLevel"
                defaultValue={filters.experienceLevel ?? ""}
                className={NATIVE_FIELD_CLASS}
              >
                <option value="">Any experience level</option>
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <select
                name="industry"
                defaultValue={filters.industry ?? ""}
                className={NATIVE_FIELD_CLASS}
              >
                <option value="">Any industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              <input
                name="salaryMin"
                type="number"
                placeholder="Min salary"
                defaultValue={filters.salaryMin ?? ""}
                className={NATIVE_FIELD_CLASS}
              />
              <select
                name="postedWithinDays"
                defaultValue={filters.postedWithinDays ?? ""}
                className={NATIVE_FIELD_CLASS}
              >
                <option value="">Any time</option>
                <option value="1">Past 24 hours</option>
                <option value="7">Past week</option>
                <option value="30">Past month</option>
              </select>
              <select name="sort" defaultValue={filters.sort} className={NATIVE_FIELD_CLASS}>
                <option value="newest">Newest</option>
                <option value="salary_high">Salary: high to low</option>
                <option value="salary_low">Salary: low to high</option>
                <option value="title_az">Title: A-Z</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-muted-foreground flex items-center gap-2 text-sm">
                <input type="checkbox" name="savedOnly" value="true" defaultChecked={filters.savedOnly} />
                Saved jobs only
              </label>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <Link href="/jobs" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
                    <X className="size-3.5" />
                    Clear
                  </Link>
                )}
                <button type="submit" className={buttonVariants({ size: "sm" })}>
                  Search
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {jobs.map((job) => {
          const avatar = companyInitial(job.company);
          const salary = formatSalary(job.salaryMin, job.salaryMax);
          return (
            <Card key={job.id}>
              <CardContent className="flex items-start gap-3">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${avatar.className}`}
                  aria-hidden
                >
                  {avatar.letter}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                    {job.title}
                  </Link>
                  <p className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Briefcase className="size-3.5 shrink-0" />
                    {job.company}
                    {job.location && (
                      <>
                        <span aria-hidden>·</span>
                        {job.location}
                      </>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {job.remoteType && <Badge variant="info">{REMOTE_LABELS[job.remoteType]}</Badge>}
                    {salary && <Badge variant="success">{salary}</Badge>}
                    {job.experienceLevel && <Badge variant="secondary">{job.experienceLevel}</Badge>}
                    {job.industry && <Badge variant="outline">{job.industry}</Badge>}
                    {job.datePosted && (
                      <span className="text-muted-foreground text-xs">
                        {formatRelativeTime(job.datePosted)}
                      </span>
                    )}
                  </div>
                </div>
                <SaveJobButton jobId={job.id} initialSaved={job.savedJobs.length > 0} />
              </CardContent>
            </Card>
          );
        })}
        {jobs.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Search className="text-muted-foreground size-8" />
              <p className="font-medium">No jobs match these filters</p>
              <p className="text-muted-foreground text-sm">Try widening your search.</p>
              {hasActiveFilters && (
                <Link href="/jobs" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-1" })}>
                  Clear filters
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {filters.page > 1 && (
            <Link
              href={buildPageHref(filters.page - 1)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ChevronLeft className="size-3.5" />
              Previous
            </Link>
          )}
          <span className="text-muted-foreground flex items-center px-2 text-sm">
            Page {filters.page} of {totalPages}
          </span>
          {filters.page < totalPages && (
            <Link
              href={buildPageHref(filters.page + 1)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Next
              <ChevronRight className="size-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
