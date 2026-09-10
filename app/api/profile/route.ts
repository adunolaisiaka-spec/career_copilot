import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { profileUpdateSchema } from "@/lib/validation/profile";
import { getProfileForUser, updateProfile } from "@/server/services/profile.service";

export async function GET() {
  const user = await requireApiAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profile, skills } = await getProfileForUser(user.id);
  return NextResponse.json({ data: { profile, skills } });
}

export async function PUT(request: Request) {
  const user = await requireApiAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { profile, skills } = await updateProfile(user.id, parsed.data);
  return NextResponse.json({ data: { profile, skills } });
}
