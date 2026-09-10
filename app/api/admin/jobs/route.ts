import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/helpers";
import { adminJobInputSchema } from "@/lib/validation/admin";
import { createAdminJob, listAllJobs } from "@/server/services/admin.service";

export async function GET() {
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const jobs = await listAllJobs();
  return NextResponse.json({ data: jobs });
}

export async function POST(request: Request) {
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = adminJobInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const job = await createAdminJob(admin.id, parsed.data);
  return NextResponse.json({ data: job }, { status: 201 });
}
