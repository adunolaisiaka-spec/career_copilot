import { prisma } from "@/lib/database/prisma";

// Defense in depth: tests/setup.ts already redirects DATABASE_URL to
// TEST_DATABASE_URL for the whole run, but if that ever silently failed to
// apply, every integration test would be writing/deleting real rows against
// production. Refuse outright rather than risk that.
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL is not set — refusing to run integration tests against an unknown database. " +
      "Set TEST_DATABASE_URL in .env to a dedicated test database (e.g. a Neon branch).",
  );
}

if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) {
  throw new Error(
    "DATABASE_URL does not match TEST_DATABASE_URL — the test-DB redirect in tests/setup.ts " +
      "did not apply. Refusing to run integration tests.",
  );
}

export { prisma };

/** Deletes all rows created by a test, in FK-safe order (children before parents). */
export async function cleanupUser(userId: string) {
  await prisma.user.deleteMany({ where: { id: userId } }); // cascades to everything else
}
