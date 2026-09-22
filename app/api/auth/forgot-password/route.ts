import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { createPasswordResetToken } from "@/lib/auth/tokens";
import { sendMail } from "@/lib/mail/mailer";
import { checkRateLimit } from "@/lib/utilities/rate-limit";

const RATE_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 }; // 3 reset emails / hour / address

// Always returns a generic success message, whether or not the email exists,
// to avoid leaking which addresses have accounts.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // Rate limit by the target email (not the caller) — this route's abuse case is
  // flooding one inbox with reset emails, not the requester making many requests.
  const { allowed } = await checkRateLimit(`forgot-password:${parsed.data.email}`, RATE_LIMIT);
  if (!allowed) {
    return NextResponse.json({
      data: { message: "If an account exists for that email, a reset link has been sent." },
    });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (user) {
    const token = await createPasswordResetToken(user.id);
    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Reset your Career Copilot password",
      html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a> (expires in 1 hour)</p>`,
    });
  }

  return NextResponse.json({
    data: { message: "If an account exists for that email, a reset link has been sent." },
  });
}
