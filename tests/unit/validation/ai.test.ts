import { describe, expect, it } from "vitest";
import {
  resumeAnalysisResponseSchema,
  jobMatchResponseSchema,
  coverLetterResponseSchema,
  chatMessageSchema,
  copilotChatRequestSchema,
  jobMatchRequestSchema,
  coverLetterRequestSchema,
  interviewQuestionsResponseSchema,
  interviewEvaluationResponseSchema,
  startInterviewSessionSchema,
  submitInterviewAnswersSchema,
  roadmapResponseSchema,
  generateRoadmapRequestSchema,
} from "@/lib/validation/ai";

describe("resumeAnalysisResponseSchema", () => {
  it("accepts a well-formed AI response", () => {
    const result = resumeAnalysisResponseSchema.safeParse({
      overallScore: 80,
      structureScore: 75,
      readabilityScore: 70,
      keywordScore: 65,
      atsScore: 60,
      recommendations: ["Add more quantified achievements"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a score outside 0-100", () => {
    const result = resumeAnalysisResponseSchema.safeParse({
      overallScore: 150,
      structureScore: 75,
      readabilityScore: 70,
      keywordScore: 65,
      atsScore: 60,
      recommendations: ["x"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty recommendations array", () => {
    const result = resumeAnalysisResponseSchema.safeParse({
      overallScore: 80,
      structureScore: 75,
      readabilityScore: 70,
      keywordScore: 65,
      atsScore: 60,
      recommendations: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("jobMatchResponseSchema", () => {
  it("accepts a well-formed match result, including an empty gaps array", () => {
    const result = jobMatchResponseSchema.safeParse({
      matchScore: 72,
      keySkillsRequired: ["React", "TypeScript"],
      strengths: ["3 years of React experience"],
      gaps: [],
      summary: "Strong frontend match.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty keySkillsRequired array", () => {
    const result = jobMatchResponseSchema.safeParse({
      matchScore: 72,
      keySkillsRequired: [],
      strengths: ["x"],
      gaps: [],
      summary: "x",
    });
    expect(result.success).toBe(false);
  });
});

describe("coverLetterResponseSchema", () => {
  it("accepts non-empty cover letter text", () => {
    expect(coverLetterResponseSchema.safeParse({ coverLetter: "Dear Hiring Manager," }).success).toBe(
      true,
    );
  });

  it("rejects an empty string", () => {
    expect(coverLetterResponseSchema.safeParse({ coverLetter: "" }).success).toBe(false);
  });
});

describe("chatMessageSchema", () => {
  it("accepts a valid user or assistant message", () => {
    expect(chatMessageSchema.safeParse({ role: "user", content: "Hi" }).success).toBe(true);
    expect(chatMessageSchema.safeParse({ role: "assistant", content: "Hello" }).success).toBe(true);
  });

  it("rejects an invalid role", () => {
    expect(chatMessageSchema.safeParse({ role: "system", content: "Hi" }).success).toBe(false);
  });
});

describe("copilotChatRequestSchema", () => {
  it("allows an omitted conversationId (starts a new conversation)", () => {
    const result = copilotChatRequestSchema.safeParse({ message: "Hello" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty message", () => {
    expect(copilotChatRequestSchema.safeParse({ message: "" }).success).toBe(false);
  });

  it("rejects a message over the max length", () => {
    expect(
      copilotChatRequestSchema.safeParse({ message: "x".repeat(4001) }).success,
    ).toBe(false);
  });
});

describe("jobMatchRequestSchema / coverLetterRequestSchema", () => {
  it("both require a non-empty resumeId", () => {
    expect(jobMatchRequestSchema.safeParse({ resumeId: "abc" }).success).toBe(true);
    expect(jobMatchRequestSchema.safeParse({ resumeId: "" }).success).toBe(false);
    expect(coverLetterRequestSchema.safeParse({ resumeId: "abc" }).success).toBe(true);
    expect(coverLetterRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe("interviewQuestionsResponseSchema", () => {
  it("accepts a well-formed question list", () => {
    const result = interviewQuestionsResponseSchema.safeParse({
      questions: [
        { question: "Tell me about yourself.", category: "GENERAL" },
        { question: "Describe a conflict you resolved.", category: "BEHAVIORAL" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid category", () => {
    const result = interviewQuestionsResponseSchema.safeParse({
      questions: [{ question: "x", category: "RANDOM" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty questions array", () => {
    expect(interviewQuestionsResponseSchema.safeParse({ questions: [] }).success).toBe(false);
  });
});

describe("interviewEvaluationResponseSchema", () => {
  it("accepts a well-formed evaluation, including empty strong/weak areas", () => {
    const result = interviewEvaluationResponseSchema.safeParse({
      overallScore: 70,
      strongAreas: [],
      weakAreas: [],
      answerFeedback: [{ question: "Tell me about yourself.", feedback: "Good structure." }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty answerFeedback array", () => {
    const result = interviewEvaluationResponseSchema.safeParse({
      overallScore: 70,
      strongAreas: [],
      weakAreas: [],
      answerFeedback: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("startInterviewSessionSchema", () => {
  it("applies GENERAL/PRACTICE defaults when type/mode are omitted", () => {
    const result = startInterviewSessionSchema.safeParse({ jobTitle: "Software Engineer" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("GENERAL");
      expect(result.data.mode).toBe("PRACTICE");
    }
  });

  it("rejects an empty jobTitle", () => {
    expect(startInterviewSessionSchema.safeParse({ jobTitle: "" }).success).toBe(false);
  });
});

describe("submitInterviewAnswersSchema", () => {
  it("rejects a blank answer", () => {
    const result = submitInterviewAnswersSchema.safeParse({
      answers: [{ question: "Tell me about yourself.", answer: "  " }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty answers array", () => {
    expect(submitInterviewAnswersSchema.safeParse({ answers: [] }).success).toBe(false);
  });
});

describe("roadmapResponseSchema", () => {
  it("accepts a well-formed roadmap", () => {
    const result = roadmapResponseSchema.safeParse({
      phases: [
        {
          title: "Build foundational skills",
          description: "Focus on core competencies.",
          durationEstimate: "1-2 months",
          milestones: ["Complete a certification"],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty phases array", () => {
    expect(roadmapResponseSchema.safeParse({ phases: [] }).success).toBe(false);
  });

  it("rejects a phase with an empty milestones array", () => {
    const result = roadmapResponseSchema.safeParse({
      phases: [{ title: "x", description: "x", durationEstimate: "x", milestones: [] }],
    });
    expect(result.success).toBe(false);
  });
});

describe("generateRoadmapRequestSchema", () => {
  it("rejects an empty goalTitle", () => {
    expect(generateRoadmapRequestSchema.safeParse({ goalTitle: "" }).success).toBe(false);
  });

  it("accepts a valid goalTitle", () => {
    expect(
      generateRoadmapRequestSchema.safeParse({ goalTitle: "Become a Staff Engineer" }).success,
    ).toBe(true);
  });
});
