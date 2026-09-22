import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";
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

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  return JSON.parse(candidate.trim());
}

export class AnthropicAIService implements AIService {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async analyzeResume({
    resumeText,
    targetRole,
  }: AnalyzeResumeInput): Promise<ResumeAnalysisResult> {
    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system:
        "You are an expert resume reviewer and ATS (Applicant Tracking System) analyst. " +
        "Base your evaluation strictly on the resume text provided — never invent skills, " +
        "experience, achievements, or qualifications that are not present in the text. " +
        "Respond with ONLY a single valid JSON object, no markdown fences, no commentary, " +
        'matching exactly this shape: {"overallScore": number 0-100, "structureScore": number 0-100, ' +
        '"readabilityScore": number 0-100, "keywordScore": number 0-100, "atsScore": number 0-100, ' +
        '"recommendations": string[] (3-6 concrete, actionable suggestions)}.',
      messages: [
        {
          role: "user",
          content: [targetRole ? `Target role: ${targetRole}` : null, "Resume:", resumeText]
            .filter(Boolean)
            .join("\n\n"),
        },
      ],
    });

    return parseJsonResponse(message, resumeAnalysisResponseSchema);
  }

  async matchResumeToJob({
    resumeText,
    jobTitle,
    company,
    jobDescription,
    jobRequirements,
  }: MatchResumeToJobInput): Promise<JobMatchResult> {
    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system:
        "You are an expert career coach comparing a candidate's resume against a specific job. " +
        "Base your evaluation strictly on the resume and job text provided — never invent skills, " +
        "experience, or qualifications the resume doesn't actually contain, and never invent " +
        "job requirements the posting doesn't actually state. " +
        "Respond with ONLY a single valid JSON object, no markdown fences, no commentary, " +
        'matching exactly this shape: {"matchScore": number 0-100, "keySkillsRequired": string[] ' +
        "(skills/qualifications the job posting asks for), " +
        '"strengths": string[] (ways the resume matches), "gaps": string[] (job requirements the ' +
        'resume doesn\'t show — empty array if none), "summary": string (2-3 sentence overview)}.',
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
    });

    return parseJsonResponse(message, jobMatchResponseSchema);
  }

  async generateCoverLetter({
    resumeText,
    jobTitle,
    company,
    jobDescription,
  }: GenerateCoverLetterInput): Promise<CoverLetterResult> {
    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system:
        "You are an expert cover letter writer. Write a concise, professional cover letter " +
        "(3-4 short paragraphs) based strictly on the candidate's actual resume content — never " +
        "invent experience, achievements, or skills the resume doesn't contain. If the resume is " +
        "missing something the job clearly wants, don't fabricate it; just don't claim it. " +
        "Respond with ONLY a single valid JSON object, no markdown fences, no commentary, " +
        'matching exactly this shape: {"coverLetter": string}.',
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
    });

    return parseJsonResponse(message, coverLetterResponseSchema);
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
    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system:
        "You are an expert interview coach. Generate realistic interview questions for the " +
        "role described. Only generate questions — don't answer them. " +
        "Respond with ONLY a single valid JSON object, no markdown fences, no commentary, " +
        'matching exactly this shape: {"questions": {"question": string, "category": ' +
        '"GENERAL"|"BEHAVIORAL"|"TECHNICAL"|"HR"|"SITUATIONAL"}[] (5 questions, mostly of the ' +
        "requested category, a couple of GENERAL mixed in is fine)}.",
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
    });

    return parseJsonResponse(message, interviewQuestionsResponseSchema);
  }

  async evaluateInterview({
    jobTitle,
    answers,
  }: EvaluateInterviewInput): Promise<EvaluateInterviewResult> {
    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1536,
      system:
        "You are an expert interview coach evaluating a candidate's practice answers for a " +
        "specific role. Base your evaluation strictly on what the candidate actually wrote — " +
        "never invent experience or achievements on their behalf, and don't penalize brevity " +
        "alone if the content is still sound. " +
        "Respond with ONLY a single valid JSON object, no markdown fences, no commentary, " +
        'matching exactly this shape: {"overallScore": number 0-100, "strongAreas": string[] ' +
        '(0-5 themes the candidate did well on), "weakAreas": string[] (0-5 themes to improve), ' +
        '"answerFeedback": {"question": string, "feedback": string}[] (one entry per question, ' +
        "specific and actionable)}.",
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
    });

    return parseJsonResponse(message, interviewEvaluationResponseSchema);
  }

  async generateRoadmap({
    goalTitle,
    currentRole,
    targetRole,
    careerLevel,
    yearsExperience,
    skills,
  }: GenerateRoadmapInput): Promise<GenerateRoadmapResult> {
    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1536,
      system:
        "You are an expert career coach building a step-by-step roadmap toward a candidate's " +
        "stated career goal. Base the plan strictly on the candidate's actual current role, " +
        "level, and skills given below — never invent experience or qualifications they don't " +
        "have, and don't assume specifics about the target role beyond what's stated. " +
        "Respond with ONLY a single valid JSON object, no markdown fences, no commentary, " +
        'matching exactly this shape: {"phases": {"title": string, "description": string, ' +
        '"durationEstimate": string (e.g. "1-2 months"), "milestones": string[] (2-5 concrete, ' +
        'actionable steps)}[] (3-6 sequential phases from where they are now to the goal)}.',
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
    });

    return parseJsonResponse(message, roadmapResponseSchema);
  }
}

function parseJsonResponse<T>(message: Anthropic.Message, schema: z.ZodType<T>): T {
  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI provider returned no text content");
  }

  let parsed: unknown;
  try {
    parsed = extractJson(textBlock.text);
  } catch {
    throw new Error("AI provider returned a response that could not be parsed as JSON");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error("AI provider returned a response that did not match the expected shape");
  }

  return result.data;
}
