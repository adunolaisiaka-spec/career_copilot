import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { trackJobApplication } from "@/server/services/job.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const application = await trackJobApplication(user.id, id);
    return NextResponse.json({ data: application }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Job not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Failed to track application";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
