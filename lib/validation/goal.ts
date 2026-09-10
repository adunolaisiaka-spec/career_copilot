import { z } from "zod";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined));

export const GOAL_TERMS = ["SHORT", "MEDIUM", "LONG"] as const;
export const GOAL_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ABANDONED"] as const;

export const goalInputSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  description: optionalTrimmedString(2000),
  term: z.enum(GOAL_TERMS),
  targetDate: optionalTrimmedString(20),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  status: z.enum(GOAL_STATUSES).default("NOT_STARTED"),
});
export type GoalInput = z.infer<typeof goalInputSchema>;
export type GoalFormInput = z.input<typeof goalInputSchema>;

export const goalProgressUpdateSchema = z.object({
  progress: z.coerce.number().int().min(0).max(100),
});
