import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { deleteNotification, markNotificationRead } from "@/server/services/notification.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await markNotificationRead(user.id, id);
  if (result.count === 0) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { message: "Marked read" } });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await deleteNotification(user.id, id);
  if (result.count === 0) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }
  return NextResponse.json({ data: { message: "Deleted" } });
}
