import { searchAdzunaJobs } from "@/lib/jobs/adzuna";
import * as repo from "@/server/repositories/job.repository";

// A deliberately diverse spread across tech/business/healthcare/finance —
// this is a general career platform, not tech-only. Small enough to stay
// well within Adzuna's free tier on a daily cron run.
const SYNC_QUERIES = [
  "software engineer",
  "product manager",
  "data analyst",
  "marketing manager",
  "registered nurse",
  "accountant",
];

/**
 * Pulls live listings from Adzuna for a curated set of search queries and
 * upserts them into our own Job table (source: EXTERNAL), keyed on Adzuna's
 * job id — so re-running this (daily, via the cron route) updates existing
 * rows in place rather than duplicating them, and SavedJob/Application still
 * have a stable Job.id to reference exactly as they do for MANUAL jobs. No
 * changes needed to job search/save/track — they already just query the Job
 * table directly.
 *
 * Upserts within a query run in parallel (not one-by-one) since Vercel's
 * Hobby-tier function timeout is 10s and 6 queries x 20 sequential DB round
 * trips would risk exceeding that, especially on a cold Neon compute.
 */
export async function syncExternalJobs(): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  for (const query of SYNC_QUERIES) {
    let results;
    try {
      results = await searchAdzunaJobs(query);
    } catch {
      // One query failing (e.g. a transient Adzuna error) shouldn't abort
      // the rest of the sync — the remaining queries still run.
      failed++;
      continue;
    }

    const outcomes = await Promise.allSettled(
      results.map((result) =>
        repo.upsertExternalJob(result.id, {
          title: result.title,
          company: result.company.display_name,
          location: result.location?.display_name ?? null,
          salaryMin: result.salary_min ? Math.round(result.salary_min) : null,
          salaryMax: result.salary_max ? Math.round(result.salary_max) : null,
          description: result.description,
          industry: result.category?.label ?? null,
          datePosted: new Date(result.created),
          url: result.redirect_url,
        }),
      ),
    );
    synced += outcomes.filter((o) => o.status === "fulfilled").length;
    failed += outcomes.filter((o) => o.status === "rejected").length;
  }

  return { synced, failed };
}
