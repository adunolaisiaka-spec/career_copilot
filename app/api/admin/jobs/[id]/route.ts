import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/helpers";
import { removeJob } from "@/server/services/admin.service";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await removeJob(admin.id, id);
  return NextResponse.json({ data: { message: "Job deleted" } });
}
