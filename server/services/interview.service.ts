import type { Prisma } from "@prisma/client";
import { getAIService } from "@/lib/ai";
import type { InterviewQuestion, InterviewQuestionCategory } from "@/lib/ai";
import * as repo from "@/server/repositories/interview-session.repository";

// InterviewSession.questions (Json) has no dedicated jobTitle/industry/type columns
// on the model, so this wrapper shape is stored there instead of a bare question
// array — avoids a schema migration for data that's only ever read back by this
// service, and keeps the info the evaluate step needs (jobTitle) alongside it.
interface StoredSessionData {
  jobTitle: string;
  type: InterviewQuestionCategory;
  industry?: string;
  experienceLevel?: string;
  questions: InterviewQuestion[];
}

interface StoredAnswer {
  question: string;
  answer: string;
}

export const listSessions = (userId: string) => repo.listSessionsByUser(userId);
export const getSession = (userId: string, id: string) => repo.findSessionById(id, userId);

export interface StartSessionInput {
  jobTitle: string;
  type: InterviewQuestionCategory;
  industry?: string;
  experienceLevel?: string;
  mode: "PRACTICE" | "MOCK";
}

export async function startSession(userId: string, input: StartSessionInput) {
  const { questions } = await getAIService().generateInterviewQuestions({
    jobTitle: input.jobTitle,
    type: input.type,
    industry: input.industry,
    experienceLevel: input.experienceLevel,
  });

  const data: StoredSessionData = {
    jobTitle: input.jobTitle,
    type: input.type,
    industry: input.industry,
    experienceLevel: input.experienceLevel,
    questions,
  };

  return repo.createSession(userId, {
    mode: input.mode,
    questions: data as unknown as Prisma.InputJsonValue,
  });
}

export async function submitAnswers(
  userId: string,
  sessionId: string,
  answers: StoredAnswer[],
) {
  const session = await repo.findSessionById(sessionId, userId);
  if (!session) throw new Error("Interview session not found");

  const stored = session.questions as unknown as StoredSessionData;

  const evaluation = await getAIService().evaluateInterview({
    jobTitle: stored.jobTitle,
    answers,
  });

  await repo.updateSession(sessionId, userId, {
    answers: answers as unknown as Prisma.InputJsonValue,
    feedback: evaluation.answerFeedback as unknown as Prisma.InputJsonValue,
    overallScore: evaluation.overallScore,
    strongAreas: evaluation.strongAreas,
    weakAreas: evaluation.weakAreas,
  });

  return repo.findSessionById(sessionId, userId);
}
