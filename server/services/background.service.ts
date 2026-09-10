import { prisma } from "@/lib/database/prisma";
import type {
  CertificationInput,
  EducationInput,
  ExperienceInput,
  ProjectInput,
} from "@/lib/validation/background";
import * as repo from "@/server/repositories/background.repository";

async function getProfileIdOrThrow(userId: string): Promise<string> {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) throw new Error("Profile not found for user");
  return profile.id;
}

const toDate = (value?: string) => (value ? new Date(value) : undefined);

export async function getBackground(userId: string) {
  const profileId = await getProfileIdOrThrow(userId);
  const [education, experience, projects, certifications] = await Promise.all([
    repo.listEducation(profileId),
    repo.listExperience(profileId),
    repo.listProjects(profileId),
    repo.listCertifications(profileId),
  ]);
  return { education, experience, projects, certifications };
}

// ---------- Education ----------
export async function addEducation(userId: string, input: EducationInput) {
  const profileId = await getProfileIdOrThrow(userId);
  return repo.createEducation(profileId, {
    institution: input.institution,
    degree: input.degree,
    fieldOfStudy: input.fieldOfStudy,
    startDate: toDate(input.startDate),
    endDate: toDate(input.endDate),
    description: input.description,
  });
}

export async function editEducation(userId: string, id: string, input: EducationInput) {
  const profileId = await getProfileIdOrThrow(userId);
  return repo.updateEducation(id, profileId, {
    institution: input.institution,
    degree: input.degree,
    fieldOfStudy: input.fieldOfStudy,
    startDate: toDate(input.startDate),
    endDate: toDate(input.endDate),
    description: input.description,
  });
}

export async function removeEducation(userId: string, id: string) {
  const profileId = await getProfileIdOrThrow(userId);
  return repo.deleteEducation(id, profileId);
}

// ---------- Experience ----------
export async function addExperience(userId: string, input: ExperienceInput) {
  const profileId = await getProfileIdOrThrow(userId);
  return repo.createExperience(profileId, {
    company: input.company,
    jobTitle: input.jobTitle,
    location: input.location,
    startDate: toDate(input.startDate),
    endDate: toDate(input.endDate),
    isCurrent: input.isCurrent,
    responsibilities: input.responsibilities,
    achievements: input.achievements,
  });
}

export async function editExperience(userId: string, id: string, input: ExperienceInput) {
  const profileId = await getProfileIdOrThrow(userId);
  return repo.updateExperience(id, profileId, {
    company: input.company,
    jobTitle: input.jobTitle,
    location: input.location,
    startDate: toDate(input.startDate),
    endDate: toDate(input.endDate),
    isCurrent: input.isCurrent,
    responsibilities: input.responsibilities,
    achievements: input.achievements,
  });
}

export async function removeExperience(userId: string, id: string) {
  const profileId = await getProfileIdOrThrow(userId);
  return repo.deleteExperience(id, profileId);
}

// ---------- Projects ----------
export async function addProject(userId: string, input: ProjectInput) {
  const profileId = await getProfileIdOrThrow(userId);
  return repo.createProject(profileId, input);
}

export async function editProject(userId: string, id: string, input: ProjectInput) {
  const profileId = await getProfileIdOrThrow(userId);
  return repo.updateProject(id, profileId, input);
}

export async function removeProject(userId: string, id: string) {
  const profileId = await getProfileIdOrThrow(userId);
  return repo.deleteProject(id, profileId);
}

// ---------- Certifications ----------
export async function addCertification(userId: string, input: CertificationInput) {
  const profileId = await getProfileIdOrThrow(userId);
  return repo.createCertification(profileId, {
    name: input.name,
    issuer: input.issuer,
    issueDate: toDate(input.issueDate),
    expiryDate: toDate(input.expiryDate),
    credentialUrl: input.credentialUrl,
  });
}

export async function editCertification(userId: string, id: string, input: CertificationInput) {
  const profileId = await getProfileIdOrThrow(userId);
  return repo.updateCertification(id, profileId, {
    name: input.name,
    issuer: input.issuer,
    issueDate: toDate(input.issueDate),
    expiryDate: toDate(input.expiryDate),
    credentialUrl: input.credentialUrl,
  });
}

export async function removeCertification(userId: string, id: string) {
  const profileId = await getProfileIdOrThrow(userId);
  return repo.deleteCertification(id, profileId);
}
