import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { findJobById, isJobSaved } from "@/server/services/job.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await findJobById(id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const saved = await isJobSaved(user.id, id);
  return NextResponse.json({ data: { ...job, saved } });
}
