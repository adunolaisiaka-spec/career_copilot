import { z } from "zod";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined));

export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL_INTERVIEW",
  "FINAL_INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

export const applicationInputSchema = z.object({
  companyName: z.string().trim().min(1, "Company is required").max(160),
  jobTitle: z.string().trim().min(1, "Job title is required").max(160),
  status: applicationStatusSchema.default("SAVED"),
  appliedDate: optionalTrimmedString(20),
  notes: optionalTrimmedString(4000),
  jobLink: optionalTrimmedString(500),
});
export type ApplicationInput = z.infer<typeof applicationInputSchema>;
export type ApplicationFormInput = z.input<typeof applicationInputSchema>;

export const applicationStatusUpdateSchema = z.object({
  status: applicationStatusSchema,
});

export const interviewDateInputSchema = z.object({
  scheduledDate: z.string().trim().min(1, "Date is required"),
  type: z.enum(["GENERAL", "BEHAVIORAL", "TECHNICAL", "HR", "SITUATIONAL"]).default("GENERAL"),
});
export type InterviewDateInput = z.infer<typeof interviewDateInputSchema>;
