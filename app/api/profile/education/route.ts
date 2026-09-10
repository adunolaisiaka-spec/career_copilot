import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { educationInputSchema } from "@/lib/validation/background";
import { addEducation } from "@/server/services/background.service";

export async function POST(request: Request) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = educationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const education = await addEducation(user.id, parsed.data);
  return NextResponse.json({ data: education }, { status: 201 });
}
