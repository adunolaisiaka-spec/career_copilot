import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { listConversations } from "@/server/services/ai-copilot.service";

export async function GET() {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await listConversations(user.id);
  return NextResponse.json({ data: conversations });
}
