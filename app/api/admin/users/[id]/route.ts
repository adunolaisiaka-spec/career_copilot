import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/helpers";
import { getClientIp } from "@/lib/utilities/request";
import { userStatusUpdateSchema } from "@/lib/validation/admin";
import { removeUser, setUserStatus } from "@/server/services/admin.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = userStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const user = await setUserStatus(admin.id, id, parsed.data.status, getClientIp(request));
    return NextResponse.json({ data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    await removeUser(admin.id, id, getClientIp(request));
    return NextResponse.json({ data: { message: "User deleted" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
