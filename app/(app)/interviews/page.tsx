import Link from "next/link";
import { requireAuth } from "@/lib/auth/helpers";
import { listSessions } from "@/server/services/interview.service";
import { StartSessionForm } from "@/components/interviews/start-session-form";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface StoredSessionMeta {
  jobTitle: string;
}

export default async function InterviewsPage() {
  const user = await requireAuth();
  const sessions = await listSessions(user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Interview Prep</h1>
        <p className="text-muted-foreground text-sm">
          Generate practice questions for a role, answer them, and get feedback.
        </p>
      </div>

      <StartSessionForm />

      {sessions.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Past sessions</h2>
          {sessions.map((session) => {
            const meta = session.questions as unknown as StoredSessionMeta;
            return (
              <Link key={session.id} href={`/interviews/${session.id}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">{meta.jobTitle}</CardTitle>
                    <CardDescription>
                      {session.mode === "MOCK" ? "Mock interview" : "Practice"} ·{" "}
                      {session.overallScore != null
                        ? `Score: ${session.overallScore}/100`
                        : "Not yet evaluated"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
