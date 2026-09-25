import { NextResponse } from "next/server";
import { syncExternalJobs } from "@/server/services/job-sync.service";

/**
 * Triggered by the Vercel Cron job configured in vercel.json (daily).
 * Same CRON_SECRET auth pattern as /api/cron/interview-reminders.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await syncExternalJobs();
  return NextResponse.json({ data: result });
}
