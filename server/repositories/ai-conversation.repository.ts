import { prisma } from "@/lib/database/prisma";
import type { AIMessageRole } from "@prisma/client";

export const listConversationsByUser = (userId: string) =>
  prisma.aIConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

export const findConversationById = (id: string, userId: string) =>
  prisma.aIConversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

export const createConversation = (userId: string, title?: string) =>
  prisma.aIConversation.create({ data: { userId, title } });

export const touchConversation = (id: string) =>
  prisma.aIConversation.update({ where: { id }, data: { updatedAt: new Date() } });

export const addMessage = (
  conversationId: string,
  role: AIMessageRole,
  content: string,
  tokensUsed?: number,
) => prisma.aIMessage.create({ data: { conversationId, role, content, tokensUsed } });
