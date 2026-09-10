import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/prisma";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { consumePasswordResetToken } from "@/lib/auth/tokens";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const record = await consumePasswordResetToken(parsed.data.token);
  if (!record) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });

  return NextResponse.json({ data: { message: "Password updated. You can now log in." } });
}
