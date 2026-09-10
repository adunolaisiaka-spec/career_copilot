import { z } from "zod";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined));

export const personalInfoSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(160),
  email: optionalTrimmedString(160),
  phone: optionalTrimmedString(40),
  location: optionalTrimmedString(160),
  linkedin: optionalTrimmedString(300),
  portfolio: optionalTrimmedString(300),
  github: optionalTrimmedString(300),
});
export type PersonalInfo = z.infer<typeof personalInfoSchema>;

export const awardInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  issuer: optionalTrimmedString(160),
  date: optionalTrimmedString(20),
  description: optionalTrimmedString(500),
});
export type AwardInput = z.infer<typeof awardInputSchema>;

export const referenceInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  relationship: optionalTrimmedString(160),
  contact: optionalTrimmedString(200),
});
export type ReferenceInput = z.infer<typeof referenceInputSchema>;

export const resumeContentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  isPrimary: z.boolean().default(false),
  personalInfo: personalInfoSchema,
  summary: optionalTrimmedString(2000),
  awards: z.array(awardInputSchema).default([]),
  references: z.array(referenceInputSchema).default([]),
});
export type ResumeContentInput = z.infer<typeof resumeContentSchema>;
export type ResumeContentFormInput = z.input<typeof resumeContentSchema>;

export const ACCEPTED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_RESUME_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export const analyzeResumeSchema = z.object({
  resumeId: z.string().min(1).optional(),
  targetRole: z.string().trim().max(160).optional(),
});
