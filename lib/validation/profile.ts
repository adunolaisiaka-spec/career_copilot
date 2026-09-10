import { z } from "zod";
import { CareerLevel, WorkArrangement } from "@prisma/client";

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
});
export type EducationInput = z.infer<typeof educationInputSchema>;

const profileCoreSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  location: z.string().trim().min(2, "Location is required").max(120),
  careerLevel: z.nativeEnum(CareerLevel),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  currentJobTitle: optionalTrimmedString(120),
  desiredJobTitle: z.string().trim().min(2, "Desired job title is required").max(120),
  desiredIndustry: z.string().trim().min(2, "Desired industry is required").max(120),
  preferredWorkArrangement: z.nativeEnum(WorkArrangement),
  preferredLocation: z.string().trim().min(2, "Preferred location is required").max(120),
  salaryExpectationMin: z.coerce.number().int().min(0).optional(),
  salaryExpectationMax: z.coerce.number().int().min(0).optional(),
  professionalInterests: z.array(z.string().trim().min(1)).default([]),
  skillNames: z.array(z.string().trim().min(1)).default([]),
});

export const onboardingSchema = profileCoreSchema.extend({
  education: educationInputSchema.optional(),
});
/** Parsed/output shape (after zod coercion) — use for API payloads. */
export type OnboardingInput = z.infer<typeof onboardingSchema>;
/** Raw form shape (before zod coercion) — use as the useForm<> generic. */
export type OnboardingFormInput = z.input<typeof onboardingSchema>;

export const profileUpdateSchema = profileCoreSchema;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfileUpdateFormInput = z.input<typeof profileUpdateSchema>;
