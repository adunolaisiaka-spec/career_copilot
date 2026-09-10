import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { experienceInputSchema } from "@/lib/validation/background";
import { addExperience } from "@/server/services/background.service";

export async function POST(request: Request) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = experienceInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const experience = await addExperience(user.id, parsed.data);
  return NextResponse.json({ data: experience }, { status: 201 });
}
