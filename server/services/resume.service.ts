import { prisma } from "@/lib/database/prisma";
import { getAIService } from "@/lib/ai";
import { getStorageService } from "@/lib/storage";
import * as repo from "@/server/repositories/resume.repository";
import type { ResumeContentInput } from "@/lib/validation/resume";
import { assertWithinLimit } from "@/server/services/subscription.service";

const EXTENSION_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      // Strip pdf-parse's own "-- N of M --" page-boundary markers — noise, not resume content.
      return result.text
        .replace(/^-- \d+ of \d+ --$/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    } finally {
      await parser.destroy();
    }
  }

  // Only PDF and DOCX are accepted (validated by the caller), so anything else is DOCX.
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function uploadResume(
  userId: string,
  file: { buffer: Buffer; mimeType: string; title: string },
) {
  const rawText = await extractText(file.buffer, file.mimeType);
  if (rawText.trim().length < 50) {
    throw new Error("We couldn't read enough text from this file. Try a different file.");
  }

  const ext = EXTENSION_BY_MIME[file.mimeType] ?? "bin";
  const resume = await repo.createResume(userId, {
    title: file.title,
    source: "UPLOADED",
    structuredContent: { rawText },
  });

  const key = `resumes/${userId}/${resume.id}.${ext}`;
  await getStorageService().save(key, file.buffer);
  await repo.updateResume(resume.id, userId, { fileUrl: key });

  return { ...resume, fileUrl: key };
}

export const listResumes = (userId: string) => repo.listResumesByUser(userId);
export const getResume = (userId: string, id: string) => repo.findResumeById(id, userId);

async function unsetOtherPrimaries(userId: string, exceptId?: string) {
  await prisma.resume.updateMany({
    where: { userId, isPrimary: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { isPrimary: false },
  });
}

export async function createBuiltResume(userId: string, input: ResumeContentInput) {
  if (input.isPrimary) await unsetOtherPrimaries(userId);
  return repo.createResume(userId, {
    title: input.title,
    isPrimary: input.isPrimary,
    source: "BUILT",
    structuredContent: {
      personalInfo: input.personalInfo,
      summary: input.summary ?? null,
      awards: input.awards,
      references: input.references,
    },
  });
}

export async function updateBuiltResume(userId: string, id: string, input: ResumeContentInput) {
  if (input.isPrimary) await unsetOtherPrimaries(userId, id);
  return repo.updateResume(id, userId, {
    title: input.title,
    isPrimary: input.isPrimary,
    structuredContent: {
      personalInfo: input.personalInfo,
      summary: input.summary ?? null,
      awards: input.awards,
      references: input.references,
    },
  });
}

export async function deleteResume(userId: string, id: string) {
  const resume = await repo.findResumeById(id, userId);
  if (resume?.fileUrl) {
    await getStorageService().delete(resume.fileUrl);
  }
  return repo.deleteResume(id, userId);
}

interface StructuredResumeContent {
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
    github?: string;
  };
  summary?: string | null;
  awards?: { title: string; issuer?: string; date?: string; description?: string }[];
  references?: { name: string; relationship?: string; contact?: string }[];
  rawText?: string;
}

/** Assembles a plain-text representation of a resume for AI analysis. */
export async function buildResumeText(userId: string, resumeId: string): Promise<string> {
  const resume = await repo.findResumeById(resumeId, userId);
  if (!resume) throw new Error("Resume not found");

  const content = (resume.structuredContent ?? {}) as StructuredResumeContent;

  if (resume.source === "UPLOADED" && content.rawText) {
    return content.rawText;
  }

  const [profile, userSkills] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      include: { educations: true, experiences: true, projects: true, certifications: true },
    }),
    prisma.userSkill.findMany({ where: { userId }, include: { skill: true } }),
  ]);

  const lines: string[] = [];
  const personal = content.personalInfo;
  if (personal) {
    lines.push(personal.fullName ?? "");
    lines.push([personal.email, personal.phone, personal.location].filter(Boolean).join(" | "));
    lines.push(
      [personal.linkedin, personal.portfolio, personal.github].filter(Boolean).join(" | "),
    );
  }

  if (content.summary) {
    lines.push("", "SUMMARY", content.summary);
  }

  if (profile?.experiences.length) {
    lines.push("", "EXPERIENCE");
    for (const exp of profile.experiences) {
      lines.push(`${exp.jobTitle} at ${exp.company}${exp.location ? `, ${exp.location}` : ""}`);
      if (exp.responsibilities) lines.push(exp.responsibilities);
      if (exp.achievements) lines.push(exp.achievements);
    }
  }

  if (profile?.educations.length) {
    lines.push("", "EDUCATION");
    for (const edu of profile.educations) {
      lines.push([edu.degree, edu.fieldOfStudy, edu.institution].filter(Boolean).join(", "));
    }
  }

  if (userSkills.length) {
    lines.push("", "SKILLS", userSkills.map((us) => us.skill.name).join(", "));
  }

  if (profile?.projects.length) {
    lines.push("", "PROJECTS");
    for (const proj of profile.projects) {
      lines.push(`${proj.name}${proj.description ? `: ${proj.description}` : ""}`);
    }
  }

  if (profile?.certifications.length) {
    lines.push("", "CERTIFICATIONS");
    for (const cert of profile.certifications) {
      lines.push([cert.name, cert.issuer].filter(Boolean).join(", "));
    }
  }

  if (content.awards?.length) {
    lines.push("", "AWARDS");
    for (const award of content.awards) {
      lines.push([award.title, award.issuer].filter(Boolean).join(", "));
    }
  }

  return lines.join("\n");
}

export async function analyzeResume(userId: string, resumeId: string, targetRole?: string) {
  await assertWithinLimit(userId, "maxResumeAnalysesPerMonth");

  const resumeText = await buildResumeText(userId, resumeId);
  if (resumeText.trim().length < 50) {
    throw new Error(
      "This resume doesn't have enough content to analyze yet. Add more details first.",
    );
  }

  const result = await getAIService().analyzeResume({ resumeText, targetRole });

  return repo.createResumeAnalysis(resumeId, {
    overallScore: result.overallScore,
    structureScore: result.structureScore,
    readabilityScore: result.readabilityScore,
    keywordScore: result.keywordScore,
    atsScore: result.atsScore,
    recommendations: result.recommendations,
  });
}
