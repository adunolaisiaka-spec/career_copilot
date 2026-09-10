import { getAIService } from "@/lib/ai";
import * as repo from "@/server/repositories/ai-conversation.repository";
import { getProfileWithSkills, formatProfileContext } from "@/server/services/profile-context.service";

const MAX_HISTORY_MESSAGES = 20;

export const listConversations = (userId: string) => repo.listConversationsByUser(userId);
export const getConversation = (userId: string, id: string) =>
  repo.findConversationById(id, userId);

export async function sendMessage(userId: string, conversationId: string | undefined, content: string) {
  const conversation = conversationId
    ? await repo.findConversationById(conversationId, userId)
    : null;
  if (conversationId && !conversation) {
    throw new Error("Conversation not found");
  }

  const activeConversation =
    conversation ?? (await repo.createConversation(userId, content.slice(0, 60)));
  const priorMessages = conversation?.messages ?? [];

  await repo.addMessage(activeConversation.id, "USER", content);

  const history = [...priorMessages, { role: "USER" as const, content }]
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role === "USER" ? ("user" as const) : ("assistant" as const), content: m.content }));

  const { profile, skills } = await getProfileWithSkills(userId);
  const profileContext = formatProfileContext(profile, skills);
  const result = await getAIService().chat({ messages: history, profileContext });

  await repo.addMessage(activeConversation.id, "ASSISTANT", result.content);
  await repo.touchConversation(activeConversation.id);

  return { conversationId: activeConversation.id, reply: result.content };
}
