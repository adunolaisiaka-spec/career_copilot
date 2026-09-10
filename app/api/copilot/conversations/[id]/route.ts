import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { getConversation } from "@/server/services/ai-copilot.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conversation = await getConversation(user.id, id);
  if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  return NextResponse.json({ data: conversation });
}
