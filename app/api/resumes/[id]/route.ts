import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { resumeContentSchema } from "@/lib/validation/resume";
import { deleteResume, getResume, updateBuiltResume } from "@/server/services/resume.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const resume = await getResume(user.id, id);
  if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

  return NextResponse.json({ data: resume });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getResume(user.id, id);
  if (!existing) return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  if (existing.source !== "BUILT") {
    return NextResponse.json({ error: "Uploaded resumes cannot be edited" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = resumeContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await updateBuiltResume(user.id, id, parsed.data);
  const updated = await getResume(user.id, id);
  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getResume(user.id, id);
  if (!existing) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

  await deleteResume(user.id, id);
  return NextResponse.json({ data: { message: "Resume deleted" } });
}
