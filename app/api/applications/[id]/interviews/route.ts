import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { interviewDateInputSchema } from "@/lib/validation/application";
import { addInterviewDate, getApplication } from "@/server/services/application.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const application = await getApplication(user.id, id);
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = interviewDateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const interview = await addInterviewDate(user.id, id, application, parsed.data);
  return NextResponse.json({ data: interview }, { status: 201 });
}
