import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { goalInputSchema, goalProgressUpdateSchema } from "@/lib/validation/goal";
import {
  deleteGoal,
  getGoal,
  updateGoal,
  updateGoalProgress,
} from "@/server/services/goal.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const goal = await getGoal(user.id, id);
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  return NextResponse.json({ data: goal });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getGoal(user.id, id);
  if (!existing) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = goalInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await updateGoal(user.id, id, parsed.data);
  const updated = await getGoal(user.id, id);
  return NextResponse.json({ data: updated });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getGoal(user.id, id);
  if (!existing) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = goalProgressUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid progress value" }, { status: 400 });
  }

  await updateGoalProgress(user.id, id, parsed.data.progress);
  const updated = await getGoal(user.id, id);
  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getGoal(user.id, id);
  if (!existing) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  await deleteGoal(user.id, id);
  return NextResponse.json({ data: { message: "Deleted" } });
}
