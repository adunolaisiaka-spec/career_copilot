import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { getRoadmap, deleteRoadmap } from "@/server/services/career-roadmap.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const roadmap = await getRoadmap(user.id, id);
  if (!roadmap) return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });

  return NextResponse.json({ data: roadmap });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteRoadmap(user.id, id);
  return NextResponse.json({ data: { message: "Deleted" } });
}
