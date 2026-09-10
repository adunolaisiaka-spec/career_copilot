import { z } from "zod";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined));

export const educationInputSchema = z.object({
  institution: z.string().trim().min(2, "Institution is required").max(160),
  degree: optionalTrimmedString(120),
  fieldOfStudy: optionalTrimmedString(120),
  startDate: optionalTrimmedString(20),
  endDate: optionalTrimmedString(20),
  description: optionalTrimmedString(2000),
});
export type EducationInput = z.infer<typeof educationInputSchema>;

export const experienceInputSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(160),
  jobTitle: z.string().trim().min(1, "Job title is required").max(160),
  location: optionalTrimmedString(160),
  startDate: optionalTrimmedString(20),
  endDate: optionalTrimmedString(20),
  isCurrent: z.boolean().default(false),
  responsibilities: optionalTrimmedString(4000),
  achievements: optionalTrimmedString(4000),
});
export type ExperienceInput = z.infer<typeof experienceInputSchema>;

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(160),
  description: optionalTrimmedString(2000),
  technologies: z.array(z.string().trim().min(1)).default([]),
  url: optionalTrimmedString(300),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const certificationInputSchema = z.object({
  name: z.string().trim().min(1, "Certification name is required").max(160),
  issuer: optionalTrimmedString(160),
  issueDate: optionalTrimmedString(20),
  expiryDate: optionalTrimmedString(20),
  credentialUrl: optionalTrimmedString(300),
});
export type CertificationInput = z.infer<typeof certificationInputSchema>;
