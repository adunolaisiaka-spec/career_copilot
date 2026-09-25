import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { createCheckoutSession } from "@/server/services/subscription.service";

export async function POST() {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const url = await createCheckoutSession(user.id, baseUrl);
    return NextResponse.json({ data: { url } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start checkout";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
