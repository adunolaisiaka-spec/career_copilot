import { z } from "zod";

export const JOB_SORT_OPTIONS = ["newest", "salary_high", "salary_low", "title_az"] as const;

// A blank <select>/<input> in the /jobs search form always submits its name with
// an empty string value (never omits it). Both helpers treat that as "no filter"
// instead of letting z.coerce.number() turn "" into 0 (failing .min(1)) or z.enum
// reject "" outright — either of which previously made safeParse() fail and
// silently discarded every filter the user picked, not just the offending one.
const optionalNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().min(min).max(max).optional());

export const jobSearchSchema = z.object({
  q: z.string().trim().max(160).optional(),
  location: z.string().trim().max(160).optional(),
  remoteType: z
    .enum(["REMOTE", "HYBRID", "ONSITE"])
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  experienceLevel: z.string().trim().max(60).optional(),
  industry: z.string().trim().max(60).optional(),
  salaryMin: optionalNumber(0, Number.MAX_SAFE_INTEGER),
  postedWithinDays: optionalNumber(1, 365),
  savedOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  sort: z.enum(JOB_SORT_OPTIONS).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type JobSearchInput = z.infer<typeof jobSearchSchema>;

export const savedJobNoteSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
});
