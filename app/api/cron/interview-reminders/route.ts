import { NextResponse } from "next/server";
import { sendInterviewReminders } from "@/server/services/reminder.service";

/**
 * Triggered by the Vercel Cron job configured in vercel.json (daily). Vercel
 * automatically sends `Authorization: Bearer $CRON_SECRET` on cron-triggered
 * requests when CRON_SECRET is set — this is Vercel's own documented pattern
 * for securing cron routes, since they're otherwise just a public GET
 * endpoint anyone could hit repeatedly to spam notifications.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await sendInterviewReminders();
  return NextResponse.json({ data: result });
}
