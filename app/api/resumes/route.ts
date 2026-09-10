import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { resumeContentSchema } from "@/lib/validation/resume";
import { createBuiltResume, listResumes } from "@/server/services/resume.service";

export async function GET() {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resumes = await listResumes(user.id);
  return NextResponse.json({ data: resumes });
}

export async function POST(request: Request) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = resumeContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const resume = await createBuiltResume(user.id, parsed.data);
  return NextResponse.json({ data: resume }, { status: 201 });
}
