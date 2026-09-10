import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { certificationInputSchema } from "@/lib/validation/background";
import { editCertification, removeCertification } from "@/server/services/background.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = certificationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await editCertification(user.id, id, parsed.data);
  if (result.count === 0) {
    return NextResponse.json({ error: "Certification not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { message: "Updated" } });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await removeCertification(user.id, id);
  if (result.count === 0) {
    return NextResponse.json({ error: "Certification not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { message: "Deleted" } });
}
