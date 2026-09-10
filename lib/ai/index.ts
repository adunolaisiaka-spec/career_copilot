import type { AIService } from "@/lib/ai/AIService";
import { AnthropicAIService } from "@/lib/ai/adapters/anthropic";
import { MockAIService } from "@/lib/ai/adapters/mock";

export type {
  AIService,
  ResumeAnalysisResult,
  AnalyzeResumeInput,
  JobMatchResult,
  MatchResumeToJobInput,
  CoverLetterResult,
  GenerateCoverLetterInput,
  ChatMessage,
  ChatInput,
  ChatResult,
  InterviewQuestionCategory,
  InterviewQuestion,
  GenerateInterviewQuestionsInput,
  GenerateInterviewQuestionsResult,
  InterviewAnswer,
  EvaluateInterviewInput,
  InterviewAnswerFeedback,
  EvaluateInterviewResult,
  RoadmapPhase,
  GenerateRoadmapInput,
  GenerateRoadmapResult,
} from "@/lib/ai/AIService";

let cached: AIService | null = null;

/**
 * Returns the configured AI provider. Server-only — never import from client
 * code. Falls back to a clearly-labeled mock provider when no
 * ANTHROPIC_API_KEY is set, so AI-dependent features stay buildable and
 * testable end-to-end before a real key exists — swap it in later by just
 * adding the key, no code changes needed. Set AI_PROVIDER=mock to opt into
 * the mock explicitly even with a key present (useful for local dev/tests).
 */
export function getAIService(): AIService {
  if (cached) return cached;

  const provider = process.env.AI_PROVIDER ?? "anthropic";

  if (provider === "mock") {
    cached = new MockAIService();
    return cached;
  }

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn(
        "ANTHROPIC_API_KEY is not set — falling back to the mock AI provider. " +
          "AI-powered features will return clearly-labeled placeholder content until a real key is added.",
      );
      cached = new MockAIService();
      return cached;
    }
    cached = new AnthropicAIService(apiKey);
    return cached;
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}
