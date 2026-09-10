import { prisma } from "@/lib/database/prisma";
import { Prisma, ApplicationStatus } from "@prisma/client";

export const listApplicationsByUser = (userId: string) =>
  prisma.application.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { interviews: { orderBy: { scheduledDate: "asc" } } },
  });

export const findApplicationById = (id: string, userId: string) =>
  prisma.application.findFirst({
    where: { id, userId },
    include: { interviews: { orderBy: { scheduledDate: "asc" } } },
  });

export const createApplication = (
  userId: string,
  data: Omit<Prisma.ApplicationUncheckedCreateInput, "userId">,
) => prisma.application.create({ data: { ...data, userId } });

export const updateApplication = (
  id: string,
  userId: string,
  data: Prisma.ApplicationUncheckedUpdateInput,
) => prisma.application.updateMany({ where: { id, userId }, data });

export const deleteApplication = (id: string, userId: string) =>
  prisma.application.deleteMany({ where: { id, userId } });

export const countApplicationsByStatus = async (
  userId: string,
): Promise<Record<ApplicationStatus, number>> => {
  const rows = await prisma.application.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });

  const base = Object.fromEntries(
    Object.values(ApplicationStatus).map((status) => [status, 0]),
  ) as Record<ApplicationStatus, number>;

  for (const row of rows) {
    base[row.status] = row._count._all;
  }
  return base;
};

export const addInterviewToApplication = (
  applicationId: string,
  userId: string,
  data: { jobTitle: string; type: Prisma.InterviewCreateInput["type"]; scheduledDate: Date },
) =>
  prisma.interview.create({
    data: { ...data, applicationId, userId },
  });

export const deleteInterview = (id: string, userId: string) =>
  prisma.interview.deleteMany({ where: { id, userId } });
