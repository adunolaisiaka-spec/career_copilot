import Link from "next/link";
import { requireAuth } from "@/lib/auth/helpers";
import { jobSearchSchema } from "@/lib/validation/job";
import {
  distinctExperienceLevels,
  distinctIndustries,
  searchJobs,
} from "@/server/services/job.service";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  return `$${(min ?? max)!.toLocaleString()}+`;
}

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

  const buildPageHref = (page: number) => {
    const sp = new URLSearchParams(params as Record<string, string>);
    sp.set("page", String(page));
    return `/jobs?${sp.toString()}`;
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Job Search</h1>

      <form method="GET" className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input
            name="q"
            placeholder="Title, company, keyword..."
            defaultValue={filters.q ?? ""}
            className="border-input col-span-2 h-8 rounded-lg border bg-transparent px-2.5 text-sm sm:col-span-2"
          />
          <input
            name="location"
            placeholder="Location"
            defaultValue={filters.location ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
          />
          <select
            name="remoteType"
            defaultValue={filters.remoteType ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
          >
            <option value="">Any arrangement</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>
          <select
            name="experienceLevel"
            defaultValue={filters.experienceLevel ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
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
            className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
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
            className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
          />
          <select
            name="postedWithinDays"
            defaultValue={filters.postedWithinDays ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
          >
            <option value="">Any time</option>
            <option value="1">Past 24 hours</option>
            <option value="7">Past week</option>
            <option value="30">Past month</option>
          </select>
          <select
            name="sort"
            defaultValue={filters.sort}
            className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="salary_high">Salary: high to low</option>
            <option value="salary_low">Salary: low to high</option>
            <option value="title_az">Title: A-Z</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="savedOnly" value="true" defaultChecked={filters.savedOnly} />
          Saved jobs only
        </label>
        <button type="submit" className={buttonVariants({ size: "sm", className: "self-start" })}>
          Search
        </button>
      </form>

      <p className="text-muted-foreground text-sm">{total} job(s) found</p>

      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">
                  <Link href={`/jobs/${job.id}`} className="hover:underline">
                    {job.title}
                  </Link>
                </CardTitle>
                <CardDescription>
                  {job.company} · {job.location}
                  {job.remoteType && ` · ${job.remoteType}`}
                  {formatSalary(job.salaryMin, job.salaryMax) &&
                    ` · ${formatSalary(job.salaryMin, job.salaryMax)}`}
                </CardDescription>
                {job.industry && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {job.industry} {job.experienceLevel && `· ${job.experienceLevel}`}
                  </p>
                )}
              </div>
              <SaveJobButton jobId={job.id} initialSaved={job.savedJobs.length > 0} />
            </CardHeader>
          </Card>
        ))}
        {jobs.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No jobs match these filters</CardTitle>
              <CardDescription>Try widening your search.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {filters.page > 1 && (
            <Link
              href={buildPageHref(filters.page - 1)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
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
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
