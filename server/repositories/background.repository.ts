import { prisma } from "@/lib/database/prisma";
import { Prisma } from "@prisma/client";

// ---------- Education ----------
export const listEducation = (profileId: string) =>
  prisma.education.findMany({ where: { profileId }, orderBy: { createdAt: "desc" } });

export const createEducation = (
  profileId: string,
  data: Omit<Prisma.EducationUncheckedCreateInput, "profileId">,
) => prisma.education.create({ data: { ...data, profileId } });

export const updateEducation = (
  id: string,
  profileId: string,
  data: Prisma.EducationUncheckedUpdateInput,
) => prisma.education.updateMany({ where: { id, profileId }, data });

export const deleteEducation = (id: string, profileId: string) =>
  prisma.education.deleteMany({ where: { id, profileId } });

// ---------- Experience ----------
export const listExperience = (profileId: string) =>
  prisma.experience.findMany({ where: { profileId }, orderBy: { createdAt: "desc" } });

export const createExperience = (
  profileId: string,
  data: Omit<Prisma.ExperienceUncheckedCreateInput, "profileId">,
) => prisma.experience.create({ data: { ...data, profileId } });

export const updateExperience = (
  id: string,
  profileId: string,
  data: Prisma.ExperienceUncheckedUpdateInput,
) => prisma.experience.updateMany({ where: { id, profileId }, data });

export const deleteExperience = (id: string, profileId: string) =>
  prisma.experience.deleteMany({ where: { id, profileId } });

// ---------- Projects ----------
export const listProjects = (profileId: string) =>
  prisma.project.findMany({ where: { profileId }, orderBy: { createdAt: "desc" } });

export const createProject = (
  profileId: string,
  data: Omit<Prisma.ProjectUncheckedCreateInput, "profileId">,
) => prisma.project.create({ data: { ...data, profileId } });

export const updateProject = (
  id: string,
  profileId: string,
  data: Prisma.ProjectUncheckedUpdateInput,
) => prisma.project.updateMany({ where: { id, profileId }, data });

export const deleteProject = (id: string, profileId: string) =>
  prisma.project.deleteMany({ where: { id, profileId } });

// ---------- Certifications ----------
export const listCertifications = (profileId: string) =>
  prisma.certification.findMany({ where: { profileId }, orderBy: { createdAt: "desc" } });

export const createCertification = (
  profileId: string,
  data: Omit<Prisma.CertificationUncheckedCreateInput, "profileId">,
) => prisma.certification.create({ data: { ...data, profileId } });

export const updateCertification = (
  id: string,
  profileId: string,
  data: Prisma.CertificationUncheckedUpdateInput,
) => prisma.certification.updateMany({ where: { id, profileId }, data });

export const deleteCertification = (id: string, profileId: string) =>
  prisma.certification.deleteMany({ where: { id, profileId } });
