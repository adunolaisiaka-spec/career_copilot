import { afterEach, describe, expect, it } from "vitest";
import { prisma, cleanupUser } from "@/tests/integration/helpers/db";
import {
  sendMessage,
  listConversations,
  getConversation,
} from "@/server/services/ai-copilot.service";

// No ANTHROPIC_API_KEY is set in this test environment, so these exercise the
// real persistence/data-flow path against the mock AI provider fallback —
// confirming the whole "swap in a real key later, no code changes" promise.

let userId: string | null = null;

afterEach(async () => {
  if (userId) await cleanupUser(userId);
  userId = null;
});

async function makeUser() {
  const user = await prisma.user.create({
    data: { email: `test-copilot-${Date.now()}@example.test`, passwordHash: "irrelevant" },
  });
  userId = user.id;
  return user;
}

describe("AI copilot conversations (real DB, mock AI provider)", () => {
  it("creates a new conversation on the first message and persists both sides", async () => {
    const user = await makeUser();

    const result = await sendMessage(user.id, undefined, "What should I focus on?");

    expect(result.conversationId).toBeTruthy();
    expect(result.reply.length).toBeGreaterThan(0);

    const conversation = await getConversation(user.id, result.conversationId);
    expect(conversation?.messages).toHaveLength(2);
    expect(conversation?.messages[0].role).toBe("USER");
    expect(conversation?.messages[0].content).toBe("What should I focus on?");
    expect(conversation?.messages[1].role).toBe("ASSISTANT");
  });

  it("appends to an existing conversation rather than creating a new one", async () => {
    const user = await makeUser();
    const first = await sendMessage(user.id, undefined, "Hi");

    const second = await sendMessage(user.id, first.conversationId, "Follow-up question");

    expect(second.conversationId).toBe(first.conversationId);
    const conversation = await getConversation(user.id, first.conversationId);
    expect(conversation?.messages).toHaveLength(4);
  });

  it("throws when sending to a conversation that doesn't belong to the caller", async () => {
    const owner = await makeUser();
    const { conversationId } = await sendMessage(owner.id, undefined, "Hi");

    const otherUser = await prisma.user.create({
      data: { email: `test-copilot-other-${Date.now()}@example.test`, passwordHash: "irrelevant" },
    });
    try {
      await expect(sendMessage(otherUser.id, conversationId, "Hijack attempt")).rejects.toThrow(
        "Conversation not found",
      );
    } finally {
      await cleanupUser(otherUser.id);
    }
  });

  it("lists conversations for a user, most recently updated first", async () => {
    const user = await makeUser();
    const first = await sendMessage(user.id, undefined, "First conversation");
    await sendMessage(user.id, undefined, "Second conversation");
    await sendMessage(user.id, first.conversationId, "Back to the first one");

    const conversations = await listConversations(user.id);
    expect(conversations).toHaveLength(2);
    expect(conversations[0].id).toBe(first.conversationId);
  });
});
