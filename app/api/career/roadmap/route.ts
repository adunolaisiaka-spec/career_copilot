import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { checkRateLimit } from "@/lib/utilities/rate-limit";
import { generateRoadmapRequestSchema } from "@/lib/validation/ai";
import { listRoadmaps, generateRoadmap } from "@/server/services/career-roadmap.service";

const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 }; // 5 roadmaps / hour / user

export async function GET() {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roadmaps = await listRoadmaps(user.id);
  return NextResponse.json({ data: roadmaps });
}

export async function POST(request: Request) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed, retryAfterMs } = checkRateLimit(`career-roadmap:${user.id}`, RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "You've reached the roadmap generation limit. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = generateRoadmapRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const roadmap = await generateRoadmap(user.id, parsed.data.goalTitle);
    return NextResponse.json({ data: roadmap }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate roadmap";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
