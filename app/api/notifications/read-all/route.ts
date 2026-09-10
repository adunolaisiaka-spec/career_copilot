import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { markAllNotificationsRead } from "@/server/services/notification.service";

export async function POST() {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await markAllNotificationsRead(user.id);
  return NextResponse.json({ data: { message: "All marked read" } });
}
