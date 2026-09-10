import crypto from "crypto";
import { prisma } from "@/lib/database/prisma";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createVerificationToken(userId: string): Promise<string> {
  await prisma.verificationToken.deleteMany({ where: { userId } });
  const token = generateToken();
  await prisma.verificationToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });
  return token;
}

export async function consumeVerificationToken(token: string) {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    if (record) await prisma.verificationToken.delete({ where: { id: record.id } });
    return null;
  }
  await prisma.verificationToken.delete({ where: { id: record.id } });
  return record;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  const token = generateToken();
  await prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });
  return token;
}

export async function consumePasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    if (record) await prisma.passwordResetToken.delete({ where: { id: record.id } });
    return null;
  }
  await prisma.passwordResetToken.delete({ where: { id: record.id } });
  return record;
}
