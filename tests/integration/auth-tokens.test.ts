import { afterEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { prisma, cleanupUser } from "@/tests/integration/helpers/db";
import {
  createVerificationToken,
  consumeVerificationToken,
  createPasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/auth/tokens";

let userId: string | null = null;

afterEach(async () => {
  if (userId) await cleanupUser(userId);
  userId = null;
});

async function makeUser(emailSuffix: string) {
  const user = await prisma.user.create({
    data: {
      email: `test-${emailSuffix}-${Date.now()}@example.test`,
      passwordHash: await bcrypt.hash("Password123!", 10),
      profile: { create: { fullName: "Test User" } },
      subscription: { create: { plan: "FREE", status: "ACTIVE" } },
    },
  });
  userId = user.id;
  return user;
}

describe("user creation (register route's DB logic)", () => {
  it("creates a user with a hashed password, a profile, and a subscription", async () => {
    const user = await makeUser("create");

    expect(user.passwordHash).not.toBe("Password123!");
    expect(await bcrypt.compare("Password123!", user.passwordHash)).toBe(true);

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    expect(profile?.fullName).toBe("Test User");

    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    expect(subscription?.plan).toBe("FREE");
  });

  it("rejects a duplicate email at the database level (unique constraint)", async () => {
    const user = await makeUser("dup");

    await expect(
      prisma.user.create({
        data: { email: user.email, passwordHash: "irrelevant" },
      }),
    ).rejects.toThrow();
  });

  it("cascades deletion to profile and subscription when the user is deleted", async () => {
    const user = await makeUser("cascade");

    await prisma.user.delete({ where: { id: user.id } });
    userId = null; // already deleted, nothing for afterEach to clean up

    expect(await prisma.profile.findUnique({ where: { userId: user.id } })).toBeNull();
    expect(await prisma.subscription.findUnique({ where: { userId: user.id } })).toBeNull();
  });
});

describe("email verification tokens", () => {
  it("issues a token that can be consumed exactly once", async () => {
    const user = await makeUser("verify");

    const token = await createVerificationToken(user.id);
    const first = await consumeVerificationToken(token);
    expect(first?.userId).toBe(user.id);

    const second = await consumeVerificationToken(token);
    expect(second).toBeNull();
  });

  it("rejects an expired token", async () => {
    const user = await makeUser("verify-expired");

    const expired = await prisma.verificationToken.create({
      data: { userId: user.id, token: "expired-token-value", expiresAt: new Date(Date.now() - 1000) },
    });

    const result = await consumeVerificationToken(expired.token);
    expect(result).toBeNull();
  });

  it("creating a new verification token invalidates any previous one for that user", async () => {
    const user = await makeUser("verify-replace");

    const first = await createVerificationToken(user.id);
    await createVerificationToken(user.id);

    const result = await consumeVerificationToken(first);
    expect(result).toBeNull();
  });
});

describe("password reset tokens", () => {
  it("issues a token that can be consumed exactly once", async () => {
    const user = await makeUser("reset");

    const token = await createPasswordResetToken(user.id);
    const first = await consumePasswordResetToken(token);
    expect(first?.userId).toBe(user.id);

    const second = await consumePasswordResetToken(token);
    expect(second).toBeNull();
  });
});
