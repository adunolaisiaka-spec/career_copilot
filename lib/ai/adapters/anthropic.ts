import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
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
import {
  resumeAnalysisResponseSchema,
  jobMatchResponseSchema,
  coverLetterResponseSchema,
  interviewQuestionsResponseSchema,
  interviewEvaluationResponseSchema,
  roadmapResponseSchema,
} from "@/lib/validation/ai";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

// Anthropic's `strict: true` tool mode only supports basic structural JSON
// Schema (type/properties/required/items/enum) — numeric and length
// constraints (minimum/maximum/minLength/maxLength/minItems/maxItems) are
// rejected outright with a 400. Those bounds still get enforced locally via
// the full Zod schema's safeParse() on the returned tool input, so stripping
// them here only relaxes what the API itself checks, not what we accept.
const UNSUPPORTED_STRICT_SCHEMA_KEYS = new Set([
  "minItems",
  "maxItems",
  "minLength",
  "maxLength",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "$schema",
]);

function sanitizeStrictSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(sanitizeStrictSchema);
  if (schema && typeof schema === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema)) {
      if (UNSUPPORTED_STRICT_SCHEMA_KEYS.has(key)) continue;
      out[key] = sanitizeStrictSchema(value);
    }
    return out;
  }
  return schema;
}

export class AnthropicAIService implements AIService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Forces the model's response into a specific shape via Anthropic's native
   * tool-use (a forced tool call, `strict: true`) instead of asking nicely in
   * the system prompt and hoping. The prompt-only approach ("respond with
   * ONLY valid JSON matching this shape") was observed live to fail roughly
   * 1 in 4-5 calls on the richer schemas (career roadmap, interview
   * evaluation) — real (non-mock) output occasionally came back malformed or
   * schema-violating even with token budget to spare (stop_reason "end_turn",
   * well under max_tokens). Tool-use constrains output structurally at the
   * API level rather than relying on the model choosing to comply. A same-
   * request retry remains as a defense-in-depth safety net for the rare
   * residual failure (e.g. no tool call at all).
   */
  private async createStructured<T>(
    params: Omit<Anthropic.MessageCreateParamsNonStreaming, "tools" | "tool_choice">,
    tool: { name: string; description: string },
    schema: z.ZodType<T>,
    attempts = 3,
  ): Promise<T> {
    const toolDef: Anthropic.Tool = {
      name: tool.name,
      description: tool.description,
      input_schema: sanitizeStrictSchema(z.toJSONSchema(schema)) as Anthropic.Tool.InputSchema,
      strict: true,
    };

    let lastError: unknown = new Error("AI provider returned no tool call");
    for (let i = 0; i < attempts; i++) {
      const message = await this.client.messages.create({
        ...params,
        tools: [toolDef],
        tool_choice: { type: "tool", name: tool.name },
      });

      const toolUse = message.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
      );
      if (!toolUse) continue;

      const result = schema.safeParse(toolUse.input);
      if (result.success) return result.data;
      lastError = new Error(
        "AI provider returned a response that did not match the expected shape",
      );
    }
    throw lastError;
  }

  async analyzeResume({
    resumeText,
    targetRole,
  }: AnalyzeResumeInput): Promise<ResumeAnalysisResult> {
    return this.createStructured(
      {
        model: MODEL,
        max_tokens: 2048,
        system:
          "You are an expert resume reviewer and ATS (Applicant Tracking System) analyst. " +
          "Base your evaluation strictly on the resume text provided — never invent skills, " +
          "experience, achievements, or qualifications that are not present in the text.",
        messages: [
          {
            role: "user",
            content: [targetRole ? `Target role: ${targetRole}` : null, "Resume:", resumeText]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
      },
      {
        name: "submit_resume_analysis",
        description:
          "Submit the resume's scores (0-100 each) and 3-6 concrete, actionable recommendations.",
      },
      resumeAnalysisResponseSchema,
    );
  }

  async matchResumeToJob({
    resumeText,
    jobTitle,
    company,
    jobDescription,
    jobRequirements,
  }: MatchResumeToJobInput): Promise<JobMatchResult> {
    return this.createStructured(
      {
        model: MODEL,
        max_tokens: 2048,
        system:
          "You are an expert career coach comparing a candidate's resume against a specific job. " +
          "Base your evaluation strictly on the resume and job text provided — never invent skills, " +
          "experience, or qualifications the resume doesn't actually contain, and never invent " +
          "job requirements the posting doesn't actually state.",
        messages: [
          {
            role: "user",
            content: [
              `Job: ${jobTitle} at ${company}`,
              "Job description:",
              jobDescription,
              jobRequirements ? `Job requirements:\n${jobRequirements}` : null,
              "Resume:",
              resumeText,
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
      },
      {
        name: "submit_job_match",
        description:
          "Submit the match score, required skills, resume strengths, gaps, and a short summary.",
      },
      jobMatchResponseSchema,
    );
  }

  async generateCoverLetter({
    resumeText,
    jobTitle,
    company,
    jobDescription,
  }: GenerateCoverLetterInput): Promise<CoverLetterResult> {
    return this.createStructured(
      {
        model: MODEL,
        max_tokens: 2048,
        system:
          "You are an expert cover letter writer. Write a concise, professional cover letter " +
          "(3-4 short paragraphs) based strictly on the candidate's actual resume content — never " +
          "invent experience, achievements, or skills the resume doesn't contain. If the resume is " +
          "missing something the job clearly wants, don't fabricate it; just don't claim it.",
        messages: [
          {
            role: "user",
            content: [
              `Job: ${jobTitle} at ${company}`,
              "Job description:",
              jobDescription,
              "Resume:",
              resumeText,
            ].join("\n\n"),
          },
        ],
      },
      { name: "submit_cover_letter", description: "Submit the generated cover letter text." },
      coverLetterResponseSchema,
    );
  }

  async chat({ messages, profileContext }: ChatInput): Promise<ChatResult> {
    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system:
        "You are Career Copilot, an AI career assistant. Answer using only the information the " +
        "user has actually given you or that's in their profile context below — never invent " +
        "experience, qualifications, or achievements on the user's behalf. If you don't have " +
        "enough information to answer well, say what's missing and ask for it." +
        (profileContext ? `\n\nUser's profile context:\n${profileContext}` : ""),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("AI provider returned no text content");
    }

    return { content: textBlock.text };
  }

  async generateInterviewQuestions({
    jobTitle,
    type,
    industry,
    experienceLevel,
  }: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsResult> {
    return this.createStructured(
      {
        model: MODEL,
        max_tokens: 2048,
        system:
          "You are an expert interview coach. Generate realistic interview questions for the " +
          "role described. Only generate questions — don't answer them. Generate 5 questions, " +
          "mostly of the requested category, a couple of GENERAL mixed in is fine.",
        messages: [
          {
            role: "user",
            content: [
              `Job title: ${jobTitle}`,
              `Primary question category requested: ${type}`,
              industry ? `Industry: ${industry}` : null,
              experienceLevel ? `Experience level: ${experienceLevel}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      },
      { name: "submit_interview_questions", description: "Submit the generated interview questions." },
      interviewQuestionsResponseSchema,
    );
  }

  async evaluateInterview({
    jobTitle,
    answers,
  }: EvaluateInterviewInput): Promise<EvaluateInterviewResult> {
    return this.createStructured(
      {
        model: MODEL,
        max_tokens: 3072,
        system:
          "You are an expert interview coach evaluating a candidate's practice answers for a " +
          "specific role. Base your evaluation strictly on what the candidate actually wrote — " +
          "never invent experience or achievements on their behalf, and don't penalize brevity " +
          "alone if the content is still sound.",
        messages: [
          {
            role: "user",
            content: [
              `Job title: ${jobTitle}`,
              "Questions and the candidate's answers:",
              ...answers.map((a, i) => `${i + 1}. Q: ${a.question}\nA: ${a.answer}`),
            ].join("\n\n"),
          },
        ],
      },
      {
        name: "submit_interview_evaluation",
        description:
          "Submit the overall score, strong/weak areas, and specific per-question feedback.",
      },
      interviewEvaluationResponseSchema,
    );
  }

  async generateRoadmap({
    goalTitle,
    currentRole,
    targetRole,
    careerLevel,
    yearsExperience,
    skills,
  }: GenerateRoadmapInput): Promise<GenerateRoadmapResult> {
    return this.createStructured(
      {
        model: MODEL,
        max_tokens: 3072,
        system:
          "You are an expert career coach building a step-by-step roadmap toward a candidate's " +
          "stated career goal. Base the plan strictly on the candidate's actual current role, " +
          "level, and skills given below — never invent experience or qualifications they don't " +
          "have, and don't assume specifics about the target role beyond what's stated. Produce " +
          "3-6 sequential phases from where they are now to the goal.",
        messages: [
          {
            role: "user",
            content: [
              `Career goal: ${goalTitle}`,
              currentRole ? `Current role: ${currentRole}` : null,
              targetRole ? `Target role: ${targetRole}` : null,
              careerLevel ? `Career level: ${careerLevel}` : null,
              yearsExperience != null ? `Years of experience: ${yearsExperience}` : null,
              skills?.length ? `Current skills: ${skills.join(", ")}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      },
      {
        name: "submit_career_roadmap",
        description: "Submit the sequential career roadmap phases toward the stated goal.",
      },
      roadmapResponseSchema,
    );
  }
}
