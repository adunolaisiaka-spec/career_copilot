import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { getSession } from "@/server/services/interview.service";
import { InterviewSessionClient } from "@/components/interviews/interview-session-client";
import { PageHeader } from "@/components/layout/page-header";
import { MessagesSquare } from "lucide-react";

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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8">
      <PageHeader
        icon={MessagesSquare}
        title={stored.jobTitle}
        description={session.mode === "MOCK" ? "Mock interview" : "Practice session"}
      />

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
