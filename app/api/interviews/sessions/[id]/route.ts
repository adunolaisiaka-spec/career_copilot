import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { checkRateLimit } from "@/lib/utilities/rate-limit";
import { submitInterviewAnswersSchema } from "@/lib/validation/ai";
import { getSession, submitAnswers } from "@/server/services/interview.service";

const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 }; // 10 evaluations / hour / user

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const session = await getSession(user.id, id);
  if (!session) return NextResponse.json({ error: "Interview session not found" }, { status: 404 });

  return NextResponse.json({ data: session });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed, retryAfterMs } = checkRateLimit(`interview-evaluate:${user.id}`, RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "You've reached the evaluation limit. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = submitInterviewAnswersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const session = await submitAnswers(user.id, id, parsed.data.answers);
    return NextResponse.json({ data: session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit answers";
    const status = message === "Interview session not found" ? 404 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
