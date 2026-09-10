import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { applicationInputSchema } from "@/lib/validation/application";
import { createApplication, listApplications } from "@/server/services/application.service";

export async function GET() {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applications = await listApplications(user.id);
  return NextResponse.json({ data: applications });
}

export async function POST(request: Request) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = applicationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const application = await createApplication(user.id, parsed.data);
    return NextResponse.json({ data: application }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create application";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
