import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/helpers";
import { userListSchema } from "@/lib/validation/admin";
import { listUsers } from "@/server/services/admin.service";

export async function GET(request: Request) {
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const parsed = userListSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const [users, total] = await listUsers(parsed.data);
  return NextResponse.json({
    data: users,
    meta: { total, page: parsed.data.page, pageSize: parsed.data.pageSize },
  });
}
