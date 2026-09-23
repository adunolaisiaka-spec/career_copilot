import path from "path";

// Vitest doesn't auto-load .env the way Next.js does. Some modules under test
// (e.g. server/services/*) import lib/database/prisma.ts at the top level,
// which constructs a PrismaClient — loading .env here keeps that safe even
// though unit tests never issue a real query.
try {
  process.loadEnvFile(path.resolve(process.cwd(), ".env"));
} catch {
  // .env not present — fine for pure unit tests that don't touch the DB.
}

// Safety-critical: redirect DATABASE_URL to the dedicated test branch for the
// whole test run, BEFORE any test file (and therefore lib/database/prisma.ts,
// which reads DATABASE_URL once at construction) is imported. Vitest guarantees
// setupFiles run before test files are collected, so this ordering is safe.
// If TEST_DATABASE_URL isn't set, DATABASE_URL is left alone — integration
// tests then refuse to run at all (see tests/integration/helpers/db.ts) rather
// than silently writing to production.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Force the deterministic mock AI provider for every test run, regardless of
// whether a real ANTHROPIC_API_KEY is present in .env. Without this, local
// test runs silently call the real Anthropic API once a real key is added
// for manual/dev use — costing real credits and making "(mock AI provider)"
// tests non-deterministic (real model output isn't guaranteed to match the
// strict response schemas the way the mock adapter is by construction).
process.env.AI_PROVIDER = "mock";
