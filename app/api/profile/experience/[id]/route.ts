import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { experienceInputSchema } from "@/lib/validation/background";
import { editExperience, removeExperience } from "@/server/services/background.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = experienceInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await editExperience(user.id, id, parsed.data);
  if (result.count === 0) {
    return NextResponse.json({ error: "Experience entry not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { message: "Updated" } });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await removeExperience(user.id, id);
  if (result.count === 0) {
    return NextResponse.json({ error: "Experience entry not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { message: "Deleted" } });
}
