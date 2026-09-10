import { prisma } from "@/lib/database/prisma";
import { Prisma, SkillCategory } from "@prisma/client";

export function findProfileByUserId(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    include: {
      educations: { orderBy: { createdAt: "desc" } },
    },
  });
}

export function findUserSkillsByUserId(userId: string) {
  return prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true },
  });
}

export function upsertProfileCore(
  userId: string,
  data: Omit<Prisma.ProfileUncheckedCreateInput, "userId">,
) {
  return prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export function addEducation(
  profileId: string,
  data: Omit<Prisma.EducationUncheckedCreateInput, "profileId">,
) {
  return prisma.education.create({ data: { ...data, profileId } });
}

export async function findOrCreateSkills(names: string[], defaultCategory: SkillCategory) {
  const uniqueNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (uniqueNames.length === 0) return [];

  const existing = await prisma.skill.findMany({ where: { name: { in: uniqueNames } } });
  const existingNames = new Set(existing.map((s) => s.name));
  const toCreate = uniqueNames.filter((n) => !existingNames.has(n));

  if (toCreate.length > 0) {
    await prisma.skill.createMany({
      data: toCreate.map((name) => ({ name, category: defaultCategory })),
      skipDuplicates: true,
    });
  }

  return prisma.skill.findMany({ where: { name: { in: uniqueNames } } });
}

/** Replaces a user's skill set with exactly the given skill ids. */
export async function syncUserSkills(userId: string, skillIds: string[]) {
  await prisma.userSkill.deleteMany({
    where: { userId, skillId: { notIn: skillIds } },
  });

  for (const skillId of skillIds) {
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId, skillId } },
      update: {},
      create: { userId, skillId },
    });
  }
}

export function listSkillCatalog() {
  return prisma.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
}
