import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { jobSearchSchema } from "@/lib/validation/job";
import { searchJobs } from "@/server/services/job.service";

export async function GET(request: Request) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsed = jobSearchSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { jobs, total } = await searchJobs(user.id, parsed.data);
  return NextResponse.json({
    data: jobs,
    meta: { total, page: parsed.data.page, pageSize: parsed.data.pageSize },
  });
}
