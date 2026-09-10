import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { consumeVerificationToken } from "@/lib/auth/tokens";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${origin}/login?verified=missing-token`);
  }

  const record = await consumeVerificationToken(token);
  if (!record) {
    return NextResponse.redirect(`${origin}/login?verified=invalid`);
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });

  return NextResponse.redirect(`${origin}/login?verified=success`);
}
