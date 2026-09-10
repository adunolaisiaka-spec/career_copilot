import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/helpers";
import { getAnalyticsSeries } from "@/server/services/admin.service";

export async function GET() {
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const series = await getAnalyticsSeries();
  return NextResponse.json({ data: series });
}
