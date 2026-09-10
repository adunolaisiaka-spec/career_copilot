import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { removeInterviewDate } from "@/server/services/application.service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; interviewId: string }> },
) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { interviewId } = await params;
  const result = await removeInterviewDate(user.id, interviewId);
  if (result.count === 0) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { message: "Deleted" } });
}
