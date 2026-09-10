import { describe, expect, it } from "vitest";
import { MockAIService } from "@/lib/ai/adapters/mock";
import {
  resumeAnalysisResponseSchema,
  jobMatchResponseSchema,
  coverLetterResponseSchema,
  interviewQuestionsResponseSchema,
  interviewEvaluationResponseSchema,
  roadmapResponseSchema,
} from "@/lib/validation/ai";

describe("MockAIService", () => {
  const service = new MockAIService();

  it("analyzeResume returns output matching the real response schema", async () => {
    const result = await service.analyzeResume({ resumeText: "Some resume text here." });
    expect(resumeAnalysisResponseSchema.safeParse(result).success).toBe(true);
  });

  it("matchResumeToJob returns output matching the real response schema", async () => {
    const result = await service.matchResumeToJob({
      resumeText: "Some resume text.",
      jobTitle: "Software Engineer",
      company: "Acme",
      jobDescription: "Build things.",
    });
    expect(jobMatchResponseSchema.safeParse(result).success).toBe(true);
  });

  it("generateCoverLetter returns output matching the real response schema", async () => {
    const result = await service.generateCoverLetter({
      resumeText: "Some resume text.",
      jobTitle: "Software Engineer",
      company: "Acme",
      jobDescription: "Build things.",
    });
    expect(coverLetterResponseSchema.safeParse(result).success).toBe(true);
  });

  it("chat echoes the last user message and clearly labels itself as a mock", async () => {
    const result = await service.chat({
      messages: [{ role: "user", content: "What should I focus on?" }],
    });
    expect(result.content).toContain("What should I focus on?");
    expect(result.content.toLowerCase()).toContain("mock");
  });

  it("generateInterviewQuestions returns output matching the real response schema", async () => {
    const result = await service.generateInterviewQuestions({
      jobTitle: "Software Engineer",
      type: "TECHNICAL",
    });
    expect(interviewQuestionsResponseSchema.safeParse(result).success).toBe(true);
  });

  it("evaluateInterview returns one feedback entry per answer, matching the real response schema", async () => {
    const result = await service.evaluateInterview({
      jobTitle: "Software Engineer",
      answers: [
        { question: "Tell me about yourself.", answer: "I'm an engineer." },
        { question: "Why this role?", answer: "I like the mission." },
      ],
    });
    expect(interviewEvaluationResponseSchema.safeParse(result).success).toBe(true);
    expect(result.answerFeedback).toHaveLength(2);
  });

  it("generateRoadmap returns output matching the real response schema", async () => {
    const result = await service.generateRoadmap({ goalTitle: "Become a Staff Engineer" });
    expect(roadmapResponseSchema.safeParse(result).success).toBe(true);
  });
});
