import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { onboardingSchema } from "@/lib/validation/profile";
import { completeOnboarding } from "@/server/services/profile.service";

export async function POST(request: Request) {
  const user = await requireApiAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { profile } = await completeOnboarding(user.id, parsed.data);
  return NextResponse.json({ data: profile });
}
