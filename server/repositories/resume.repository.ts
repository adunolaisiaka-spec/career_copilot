import { prisma } from "@/lib/database/prisma";
import { Prisma } from "@prisma/client";

export const listResumesByUser = (userId: string) =>
  prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { analyses: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

export const findResumeById = (id: string, userId: string) =>
  prisma.resume.findFirst({
    where: { id, userId },
    include: { analyses: { orderBy: { createdAt: "desc" } } },
  });

export const createResume = (
  userId: string,
  data: Omit<Prisma.ResumeUncheckedCreateInput, "userId">,
) => prisma.resume.create({ data: { ...data, userId } });

export const updateResume = (id: string, userId: string, data: Prisma.ResumeUncheckedUpdateInput) =>
  prisma.resume.updateMany({ where: { id, userId }, data });

export const deleteResume = (id: string, userId: string) =>
  prisma.resume.deleteMany({ where: { id, userId } });

export const createResumeAnalysis = (
  resumeId: string,
  data: Omit<Prisma.ResumeAnalysisUncheckedCreateInput, "resumeId">,
) => prisma.resumeAnalysis.create({ data: { ...data, resumeId } });
