import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { getSession } from "@/server/services/interview.service";
import { InterviewSessionClient } from "@/components/interviews/interview-session-client";

interface StoredSessionData {
  jobTitle: string;
  questions: { question: string; category: string }[];
}

interface StoredAnswer {
  question: string;
  answer: string;
}

interface StoredFeedback {
  question: string;
  feedback: string;
}

export default async function InterviewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const session = await getSession(user.id, id);
  if (!session) notFound();

  const stored = session.questions as unknown as StoredSessionData;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">{stored.jobTitle}</h1>
        <p className="text-muted-foreground text-sm">
          {session.mode === "MOCK" ? "Mock interview" : "Practice session"}
        </p>
      </div>

      <InterviewSessionClient
        sessionId={session.id}
        questions={stored.questions}
        initialAnswers={(session.answers as unknown as StoredAnswer[] | null) ?? null}
        initialFeedback={(session.feedback as unknown as StoredFeedback[] | null) ?? null}
        initialOverallScore={session.overallScore}
        initialStrongAreas={session.strongAreas}
        initialWeakAreas={session.weakAreas}
      />
    </div>
  );
}
