import { prisma } from "@/lib/database/prisma";
import { Prisma } from "@prisma/client";

export const listGoalsByUser = (userId: string) =>
  prisma.careerGoal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

export const findGoalById = (id: string, userId: string) =>
  prisma.careerGoal.findFirst({ where: { id, userId } });

export const createGoal = (
  userId: string,
  data: Omit<Prisma.CareerGoalUncheckedCreateInput, "userId">,
) => prisma.careerGoal.create({ data: { ...data, userId } });

export const updateGoal = (
  id: string,
  userId: string,
  data: Prisma.CareerGoalUncheckedUpdateInput,
) => prisma.careerGoal.updateMany({ where: { id, userId }, data });

export const deleteGoal = (id: string, userId: string) =>
  prisma.careerGoal.deleteMany({ where: { id, userId } });
