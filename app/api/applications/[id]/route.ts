import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import {
  applicationInputSchema,
  applicationStatusUpdateSchema,
} from "@/lib/validation/application";
import {
  deleteApplication,
  getApplication,
  updateApplication,
  updateApplicationStatus,
} from "@/server/services/application.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const application = await getApplication(user.id, id);
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  return NextResponse.json({ data: application });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getApplication(user.id, id);
  if (!existing) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = applicationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await updateApplication(user.id, id, parsed.data);
  const updated = await getApplication(user.id, id);
  return NextResponse.json({ data: updated });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getApplication(user.id, id);
  if (!existing) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = applicationStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await updateApplicationStatus(user.id, id, parsed.data.status);
  return NextResponse.json({ data: { message: "Status updated" } });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getApplication(user.id, id);
  if (!existing) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  await deleteApplication(user.id, id);
  return NextResponse.json({ data: { message: "Deleted" } });
}
