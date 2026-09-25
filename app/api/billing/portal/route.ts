import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/helpers";
import { createPortalSession } from "@/server/services/subscription.service";
import { getBaseUrl } from "@/lib/utilities/base-url";

export async function POST() {
  const user = await requireApiAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = await createPortalSession(user.id, getBaseUrl());
    return NextResponse.json({ data: { url } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to open billing portal";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
