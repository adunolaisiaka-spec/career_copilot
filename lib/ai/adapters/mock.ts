import type {
  AIService,
  AnalyzeResumeInput,
  ResumeAnalysisResult,
  MatchResumeToJobInput,
  JobMatchResult,
  GenerateCoverLetterInput,
  CoverLetterResult,
  ChatInput,
  ChatResult,
  GenerateInterviewQuestionsInput,
  GenerateInterviewQuestionsResult,
  EvaluateInterviewInput,
  EvaluateInterviewResult,
  GenerateRoadmapInput,
  GenerateRoadmapResult,
} from "@/lib/ai/AIService";

const MOCK_NOTICE =
  "[Mock AI response — ANTHROPIC_API_KEY is not set, so this is placeholder content, not a real analysis]";

/**
 * Placeholder AIService used when no ANTHROPIC_API_KEY is configured, so the
 * rest of the app (routes, UI, data flow, rate limiting, persistence) can be
 * built and exercised end-to-end before a real key exists. Output is clearly
 * labeled as a mock everywhere it's shown — never trust it as real analysis.
 */
export class MockAIService implements AIService {
  async analyzeResume({ resumeText }: AnalyzeResumeInput): Promise<ResumeAnalysisResult> {
    const wordCount = resumeText.trim().split(/\s+/).length;
    return {
      overallScore: 65,
      structureScore: 70,
      readabilityScore: 68,
      keywordScore: 60,
      atsScore: 62,
      recommendations: [
        MOCK_NOTICE,
        `Your resume has roughly ${wordCount} words — add ANTHROPIC_API_KEY for a real evaluation.`,
      ],
    };
  }

  async matchResumeToJob({ jobTitle }: MatchResumeToJobInput): Promise<JobMatchResult> {
    return {
      matchScore: 50,
      keySkillsRequired: [`Skills for ${jobTitle} (mock — add ANTHROPIC_API_KEY for real output)`],
      strengths: [MOCK_NOTICE],
      gaps: [],
      summary: `${MOCK_NOTICE} This is a placeholder match summary for "${jobTitle}".`,
    };
  }

  async generateCoverLetter({
    jobTitle,
    company,
  }: GenerateCoverLetterInput): Promise<CoverLetterResult> {
    return {
      coverLetter:
        `${MOCK_NOTICE}\n\n` +
        `Dear Hiring Manager,\n\nThis is a placeholder cover letter for the ${jobTitle} role at ${company}. ` +
        "Add ANTHROPIC_API_KEY to generate a real, resume-grounded cover letter.\n\nSincerely,\n[Your name]",
    };
  }

  async chat({ messages }: ChatInput): Promise<ChatResult> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    return {
      content:
        `${MOCK_NOTICE}\n\nYou said: "${lastUserMessage?.content ?? ""}"\n\n` +
        "Add ANTHROPIC_API_KEY to .env to get real Career Copilot responses.",
    };
  }

  async generateInterviewQuestions({
    jobTitle,
    type,
  }: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsResult> {
    return {
      questions: [
        { question: `${MOCK_NOTICE} Tell me about yourself and this ${jobTitle} role.`, category: "GENERAL" },
        { question: `Describe a challenging situation relevant to a ${jobTitle} position.`, category: type },
        { question: `Why are you interested in this ${jobTitle} role?`, category: "GENERAL" },
      ],
    };
  }

  async evaluateInterview({ answers }: EvaluateInterviewInput): Promise<EvaluateInterviewResult> {
    return {
      overallScore: 55,
      strongAreas: [MOCK_NOTICE],
      weakAreas: ["Add ANTHROPIC_API_KEY for real, specific feedback"],
      answerFeedback: answers.map((a) => ({
        question: a.question,
        feedback: `${MOCK_NOTICE} Your answer was ${a.answer.length} characters long.`,
      })),
    };
  }

  async generateRoadmap({ goalTitle }: GenerateRoadmapInput): Promise<GenerateRoadmapResult> {
    return {
      phases: [
        {
          title: "Assess your starting point",
          description: `${MOCK_NOTICE} Placeholder first phase toward "${goalTitle}".`,
          durationEstimate: "2-4 weeks",
          milestones: ["Add ANTHROPIC_API_KEY for a real, personalized roadmap"],
        },
        {
          title: "Build toward the goal",
          description: `Placeholder middle phase toward "${goalTitle}".`,
          durationEstimate: "2-3 months",
          milestones: ["This is mock content, not real career advice"],
        },
      ],
    };
  }
}
