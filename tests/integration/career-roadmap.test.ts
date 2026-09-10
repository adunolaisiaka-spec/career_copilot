import { afterEach, describe, expect, it } from "vitest";
import { prisma, cleanupUser } from "@/tests/integration/helpers/db";
import {
  generateRoadmap,
  getRoadmap,
  listRoadmaps,
  deleteRoadmap,
} from "@/server/services/career-roadmap.service";

// No ANTHROPIC_API_KEY is set in this test environment, so these exercise the
// real persistence/data-flow path against the mock AI provider fallback.

let userId: string | null = null;

afterEach(async () => {
  if (userId) await cleanupUser(userId);
  userId = null;
});

async function makeUser() {
  const user = await prisma.user.create({
    data: { email: `test-roadmap-${Date.now()}@example.test`, passwordHash: "irrelevant" },
  });
  userId = user.id;
  return user;
}

describe("career roadmap (real DB, mock AI provider)", () => {
  it("generates and persists a roadmap grounded in the user's real profile", async () => {
    const user = await makeUser();
    await prisma.profile.create({
      data: { userId: user.id, currentJobTitle: "Software Engineer", desiredJobTitle: "Staff Engineer" },
    });

    const roadmap = await generateRoadmap(user.id, "Become a Staff Engineer");

    expect(roadmap.goalTitle).toBe("Become a Staff Engineer");
    expect(roadmap.generatedByAI).toBe(true);
    const phases = roadmap.phases as unknown as { title: string }[];
    expect(phases.length).toBeGreaterThan(0);
  });

  it("generates a roadmap even with no profile at all", async () => {
    const user = await makeUser();
    const roadmap = await generateRoadmap(user.id, "Switch into product management");
    expect(roadmap.goalTitle).toBe("Switch into product management");
  });

  it("lists only the calling user's roadmaps, most recent first", async () => {
    const user = await makeUser();
    const first = await generateRoadmap(user.id, "Goal A");
    await generateRoadmap(user.id, "Goal B");

    const roadmaps = await listRoadmaps(user.id);
    expect(roadmaps).toHaveLength(2);
    expect(roadmaps.map((r) => r.id)).toContain(first.id);
  });

  it("scopes get/delete to the owning user", async () => {
    const owner = await makeUser();
    const roadmap = await generateRoadmap(owner.id, "Owner's goal");

    const otherUser = await prisma.user.create({
      data: { email: `test-roadmap-other-${Date.now()}@example.test`, passwordHash: "irrelevant" },
    });
    try {
      expect(await getRoadmap(otherUser.id, roadmap.id)).toBeNull();
      await deleteRoadmap(otherUser.id, roadmap.id);
      expect(await getRoadmap(owner.id, roadmap.id)).not.toBeNull();

      await deleteRoadmap(owner.id, roadmap.id);
      expect(await getRoadmap(owner.id, roadmap.id)).toBeNull();
    } finally {
      await cleanupUser(otherUser.id);
    }
  });
});
