import path from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Playwright doesn't auto-load .env — this file is imported first by every spec.
try {
  process.loadEnvFile(path.resolve(process.cwd(), ".env"));
} catch {
  // ignore
}

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL is not set — refusing to run E2E setup against an unknown database.");
}

export const prisma = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });

export const E2E_PASSWORD = "Password123!";

export interface E2eUser {
  id: string;
  email: string;
  password: string;
}

/** Creates a fully onboarded user directly via Prisma so E2E specs can log in immediately. */
export async function createOnboardedUser(emailPrefix: string): Promise<E2eUser> {
  const email = `e2e-${emailPrefix}-${Date.now()}@example.test`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(E2E_PASSWORD, 10),
      emailVerified: new Date(),
      profile: {
        create: {
          fullName: "E2E Test User",
          location: "Remote",
          careerLevel: "MID",
          desiredJobTitle: "Software Engineer",
          desiredIndustry: "Technology",
          yearsExperience: 2,
          preferredWorkArrangement: "REMOTE",
          preferredLocation: "Remote",
          onboardingCompletedAt: new Date(),
        },
      },
      subscription: { create: { plan: "FREE", status: "ACTIVE" } },
    },
  });
  return { id: user.id, email, password: E2E_PASSWORD };
}

export async function cleanupE2eUser(userId: string) {
  await prisma.user.deleteMany({ where: { id: userId } });
}
