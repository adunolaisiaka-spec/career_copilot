import { afterEach, describe, expect, it } from "vitest";
import { prisma, cleanupUser } from "@/tests/integration/helpers/db";
import { startSession, submitAnswers, getSession, listSessions } from "@/server/services/interview.service";

// No ANTHROPIC_API_KEY is set in this test environment, so these exercise the
// real persistence/data-flow path against the mock AI provider fallback.

let userId: string | null = null;

afterEach(async () => {
  if (userId) await cleanupUser(userId);
  userId = null;
});

async function makeUser() {
  const user = await prisma.user.create({
    data: { email: `test-interview-${Date.now()}@example.test`, passwordHash: "irrelevant" },
  });
  userId = user.id;
  return user;
}

describe("interview sessions (real DB, mock AI provider)", () => {
  it("starts a session with generated questions and no evaluation yet", async () => {
    const user = await makeUser();

    const session = await startSession(user.id, {
      jobTitle: "Software Engineer",
      type: "TECHNICAL",
      mode: "PRACTICE",
    });

    expect(session.mode).toBe("PRACTICE");
    expect(session.overallScore).toBeNull();
    expect(session.answers).toBeNull();

    const stored = session.questions as unknown as { jobTitle: string; questions: unknown[] };
    expect(stored.jobTitle).toBe("Software Engineer");
    expect(stored.questions.length).toBeGreaterThan(0);
  });

  it("submitting answers evaluates the session and persists the result", async () => {
    const user = await makeUser();
    const session = await startSession(user.id, {
      jobTitle: "Software Engineer",
      type: "GENERAL",
      mode: "MOCK",
    });
    const stored = session.questions as unknown as { questions: { question: string }[] };

    const updated = await submitAnswers(
      user.id,
      session.id,
      stored.questions.map((q) => ({ question: q.question, answer: "A reasonably detailed answer." })),
    );

    expect(updated?.overallScore).not.toBeNull();
    expect(updated?.answers).not.toBeNull();
    expect(updated?.feedback).not.toBeNull();

    const refetched = await getSession(user.id, session.id);
    expect(refetched?.overallScore).toBe(updated?.overallScore);
  });

  it("throws when submitting answers for another user's session", async () => {
    const owner = await makeUser();
    const session = await startSession(owner.id, { jobTitle: "Engineer", type: "GENERAL", mode: "PRACTICE" });

    const otherUser = await prisma.user.create({
      data: { email: `test-interview-other-${Date.now()}@example.test`, passwordHash: "irrelevant" },
    });
    try {
      await expect(
        submitAnswers(otherUser.id, session.id, [{ question: "x", answer: "y" }]),
      ).rejects.toThrow("Interview session not found");
    } finally {
      await cleanupUser(otherUser.id);
    }
  });

  it("lists only the calling user's sessions", async () => {
    const user = await makeUser();
    await startSession(user.id, { jobTitle: "A", type: "GENERAL", mode: "PRACTICE" });
    await startSession(user.id, { jobTitle: "B", type: "GENERAL", mode: "PRACTICE" });

    const sessions = await listSessions(user.id);
    expect(sessions).toHaveLength(2);
  });
});
