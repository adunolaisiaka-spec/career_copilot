import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { countUnread, listNotifications } from "@/server/services/notification.service";

export async function GET() {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notifications, unread] = await Promise.all([
    listNotifications(user.id),
    countUnread(user.id),
  ]);

  return NextResponse.json({ data: notifications, meta: { unread } });
}
