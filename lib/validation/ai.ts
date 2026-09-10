import { z } from "zod";

export const resumeAnalysisResponseSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  structureScore: z.number().int().min(0).max(100),
  readabilityScore: z.number().int().min(0).max(100),
  keywordScore: z.number().int().min(0).max(100),
  atsScore: z.number().int().min(0).max(100),
  recommendations: z.array(z.string().min(1)).min(1).max(10),
});

export const jobMatchResponseSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  keySkillsRequired: z.array(z.string().min(1)).min(1).max(15),
  strengths: z.array(z.string().min(1)).min(1).max(10),
  gaps: z.array(z.string().min(1)).max(10),
  summary: z.string().min(1),
});

export const coverLetterResponseSchema = z.object({
  coverLetter: z.string().min(1),
});

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export const copilotChatRequestSchema = z.object({
  conversationId: z.string().trim().min(1).optional(),
  message: z.string().trim().min(1).max(4000),
});

export const jobMatchRequestSchema = z.object({
  resumeId: z.string().trim().min(1),
});

export const coverLetterRequestSchema = z.object({
  resumeId: z.string().trim().min(1),
});

const interviewQuestionCategorySchema = z.enum([
  "GENERAL",
  "BEHAVIORAL",
  "TECHNICAL",
  "HR",
  "SITUATIONAL",
]);

export const interviewQuestionsResponseSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        category: interviewQuestionCategorySchema,
      }),
    )
    .min(1)
    .max(10),
});

export const interviewEvaluationResponseSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  strongAreas: z.array(z.string().min(1)).max(10),
  weakAreas: z.array(z.string().min(1)).max(10),
  answerFeedback: z
    .array(z.object({ question: z.string().min(1), feedback: z.string().min(1) }))
    .min(1)
    .max(10),
});

export const startInterviewSessionSchema = z.object({
  jobTitle: z.string().trim().min(1).max(160),
  type: interviewQuestionCategorySchema.default("GENERAL"),
  industry: z.string().trim().max(80).optional(),
  experienceLevel: z.string().trim().max(60).optional(),
  mode: z.enum(["PRACTICE", "MOCK"]).default("PRACTICE"),
});

export const submitInterviewAnswersSchema = z.object({
  answers: z
    .array(z.object({ question: z.string().min(1), answer: z.string().trim().min(1).max(4000) }))
    .min(1)
    .max(10),
});

export const roadmapPhaseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  durationEstimate: z.string().min(1),
  milestones: z.array(z.string().min(1)).min(1).max(8),
});

export const roadmapResponseSchema = z.object({
  phases: z.array(roadmapPhaseSchema).min(1).max(8),
});

export const generateRoadmapRequestSchema = z.object({
  goalTitle: z.string().trim().min(1).max(160),
});
