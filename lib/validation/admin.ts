import { z } from "zod";

export const userListSchema = z.object({
  q: z.string().trim().max(160).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type UserListInput = z.infer<typeof userListSchema>;

export const userStatusUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const adminJobInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  company: z.string().trim().min(1).max(160),
  location: z.string().trim().max(160).optional(),
  remoteType: z.enum(["REMOTE", "HYBRID", "ONSITE"]).optional(),
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),
  description: z.string().trim().min(1).max(5000),
  requirements: z.string().trim().max(2000).optional(),
  industry: z.string().trim().max(80).optional(),
  experienceLevel: z.string().trim().max(60).optional(),
  url: z.string().trim().max(500).optional(),
});
export type AdminJobInput = z.infer<typeof adminJobInputSchema>;
