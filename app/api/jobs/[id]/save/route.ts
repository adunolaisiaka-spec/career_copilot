import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { savedJobNoteSchema } from "@/lib/validation/job";
import { findJobById, toggleSaveJob } from "@/server/services/job.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await findJobById(id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const parsed = savedJobNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    await toggleSaveJob(user.id, id, true, parsed.data.notes);
    return NextResponse.json({ data: { saved: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save job";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await toggleSaveJob(user.id, id, false);
  return NextResponse.json({ data: { saved: false } });
}
