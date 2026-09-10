import { prisma } from "@/lib/database/prisma";
import { Prisma } from "@prisma/client";

export const listSessionsByUser = (userId: string) =>
  prisma.interviewSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

export const findSessionById = (id: string, userId: string) =>
  prisma.interviewSession.findFirst({ where: { id, userId } });

export const createSession = (
  userId: string,
  data: Omit<Prisma.InterviewSessionUncheckedCreateInput, "userId">,
) => prisma.interviewSession.create({ data: { ...data, userId } });

export const updateSession = (
  id: string,
  userId: string,
  data: Prisma.InterviewSessionUncheckedUpdateInput,
) => prisma.interviewSession.updateMany({ where: { id, userId }, data });
