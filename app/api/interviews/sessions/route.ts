import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { checkRateLimit } from "@/lib/utilities/rate-limit";
import { startInterviewSessionSchema } from "@/lib/validation/ai";
import { startSession, listSessions } from "@/server/services/interview.service";

const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 }; // 10 sessions / hour / user

export async function GET() {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await listSessions(user.id);
  return NextResponse.json({ data: sessions });
}

export async function POST(request: Request) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed, retryAfterMs } = checkRateLimit(`interview-session:${user.id}`, RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "You've reached the interview session limit. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = startInterviewSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const session = await startSession(user.id, parsed.data);
    return NextResponse.json({ data: session }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start interview session";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
