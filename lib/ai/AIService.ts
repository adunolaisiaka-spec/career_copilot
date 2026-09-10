export interface ResumeAnalysisResult {
  overallScore: number;
  structureScore: number;
  readabilityScore: number;
  keywordScore: number;
  atsScore: number;
  recommendations: string[];
}

export interface AnalyzeResumeInput {
  resumeText: string;
  targetRole?: string;
}

export interface JobMatchResult {
  matchScore: number;
  keySkillsRequired: string[];
  strengths: string[];
  gaps: string[];
  summary: string;
}

export interface MatchResumeToJobInput {
  resumeText: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  jobRequirements?: string;
}

export interface CoverLetterResult {
  coverLetter: string;
}

export interface GenerateCoverLetterInput {
  resumeText: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatInput {
  messages: ChatMessage[];
  profileContext?: string;
}

export interface ChatResult {
  content: string;
}

export type InterviewQuestionCategory =
  | "GENERAL"
  | "BEHAVIORAL"
  | "TECHNICAL"
  | "HR"
  | "SITUATIONAL";

export interface InterviewQuestion {
  question: string;
  category: InterviewQuestionCategory;
}

export interface GenerateInterviewQuestionsInput {
  jobTitle: string;
  type: InterviewQuestionCategory;
  industry?: string;
  experienceLevel?: string;
}

export interface GenerateInterviewQuestionsResult {
  questions: InterviewQuestion[];
}

export interface InterviewAnswer {
  question: string;
  answer: string;
}

export interface EvaluateInterviewInput {
  jobTitle: string;
  answers: InterviewAnswer[];
}

export interface InterviewAnswerFeedback {
  question: string;
  feedback: string;
}

export interface EvaluateInterviewResult {
  overallScore: number;
  strongAreas: string[];
  weakAreas: string[];
  answerFeedback: InterviewAnswerFeedback[];
}

export interface RoadmapPhase {
  title: string;
  description: string;
  durationEstimate: string;
  milestones: string[];
}

export interface GenerateRoadmapInput {
  goalTitle: string;
  currentRole?: string;
  targetRole?: string;
  careerLevel?: string;
  yearsExperience?: number;
  skills?: string[];
}

export interface GenerateRoadmapResult {
  phases: RoadmapPhase[];
}

/**
 * Provider-agnostic AI capabilities used across the app. Add methods here as
 * features are implemented — never call a provider SDK directly from route
 * handlers or components.
 */
export interface AIService {
  analyzeResume(input: AnalyzeResumeInput): Promise<ResumeAnalysisResult>;
  matchResumeToJob(input: MatchResumeToJobInput): Promise<JobMatchResult>;
  generateCoverLetter(input: GenerateCoverLetterInput): Promise<CoverLetterResult>;
  chat(input: ChatInput): Promise<ChatResult>;
  generateInterviewQuestions(
    input: GenerateInterviewQuestionsInput,
  ): Promise<GenerateInterviewQuestionsResult>;
  evaluateInterview(input: EvaluateInterviewInput): Promise<EvaluateInterviewResult>;
  generateRoadmap(input: GenerateRoadmapInput): Promise<GenerateRoadmapResult>;
}
