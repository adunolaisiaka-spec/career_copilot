import { prisma } from "@/lib/database/prisma";
import type { Prisma } from "@prisma/client";

export const listRoadmapsByUser = (userId: string) =>
  prisma.careerRoadmap.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });

export const findRoadmapById = (id: string, userId: string) =>
  prisma.careerRoadmap.findFirst({ where: { id, userId } });

export const createRoadmap = (
  userId: string,
  data: Omit<Prisma.CareerRoadmapUncheckedCreateInput, "userId">,
) => prisma.careerRoadmap.create({ data: { ...data, userId } });

export const deleteRoadmap = (id: string, userId: string) =>
  prisma.careerRoadmap.deleteMany({ where: { id, userId } });
