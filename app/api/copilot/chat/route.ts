import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { checkRateLimit } from "@/lib/utilities/rate-limit";
import { copilotChatRequestSchema } from "@/lib/validation/ai";
import { sendMessage } from "@/server/services/ai-copilot.service";

const RATE_LIMIT = { limit: 30, windowMs: 60 * 60 * 1000 }; // 30 messages / hour / user

export async function POST(request: Request) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed, retryAfterMs } = checkRateLimit(`copilot-chat:${user.id}`, RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "You've reached the copilot message limit. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = copilotChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await sendMessage(user.id, parsed.data.conversationId, parsed.data.message);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send message";
    const status = message === "Conversation not found" ? 404 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
