import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/prisma";
import { registerSchema } from "@/lib/validation/auth";
import { createVerificationToken } from "@/lib/auth/tokens";
import { sendMail } from "@/lib/mail/mailer";
import { checkRateLimit } from "@/lib/utilities/rate-limit";
import { getClientIp } from "@/lib/utilities/request";

const RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 }; // 5 registrations / hour / IP

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(
    `register:${getClientIp(request) ?? "unknown"}`,
    RATE_LIMIT,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many accounts created from this network. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { fullName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: { create: { fullName } },
      subscription: { create: { plan: "FREE", status: "ACTIVE" } },
    },
  });

  const token = await createVerificationToken(user.id);
  const verifyUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/auth/verify-email?token=${token}`;

  await sendMail({
    to: user.email,
    subject: "Verify your Career Copilot account",
    html: `<p>Welcome to Career Copilot! Verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });

  return NextResponse.json({ data: { id: user.id, email: user.email } }, { status: 201 });
}
