import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { goalInputSchema } from "@/lib/validation/goal";
import { createGoal, listGoals } from "@/server/services/goal.service";

export async function GET() {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await listGoals(user.id);
  return NextResponse.json({ data: goals });
}

export async function POST(request: Request) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = goalInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const goal = await createGoal(user.id, parsed.data);
  return NextResponse.json({ data: goal }, { status: 201 });
}
