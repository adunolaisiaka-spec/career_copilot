import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { checkRateLimit } from "@/lib/utilities/rate-limit";
import { jobMatchRequestSchema } from "@/lib/validation/ai";
import { matchResumeToJob } from "@/server/services/ai-job-tools.service";

const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 }; // 10 matches / hour / user

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed, retryAfterMs } = checkRateLimit(`job-match:${user.id}`, RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "You've reached the job match limit. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = jobMatchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "resumeId is required" }, { status: 400 });
  }

  try {
    const result = await matchResumeToJob(user.id, id, parsed.data.resumeId);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to match resume to job";
    const status = message === "Job not found" || message === "Resume not found" ? 404 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
