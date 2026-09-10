import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { certificationInputSchema } from "@/lib/validation/background";
import { addCertification } from "@/server/services/background.service";

export async function POST(request: Request) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = certificationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const certification = await addCertification(user.id, parsed.data);
  return NextResponse.json({ data: certification }, { status: 201 });
}
