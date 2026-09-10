import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { projectInputSchema } from "@/lib/validation/background";
import { addProject } from "@/server/services/background.service";

export async function POST(request: Request) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = projectInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const project = await addProject(user.id, parsed.data);
  return NextResponse.json({ data: project }, { status: 201 });
}
