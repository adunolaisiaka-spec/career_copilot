import Link from "next/link";
import { requireAuth } from "@/lib/auth/helpers";
import { listSessions } from "@/server/services/interview.service";
import { StartSessionForm } from "@/components/interviews/start-session-form";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { MessagesSquare } from "lucide-react";
import { scoreBadgeVariant } from "@/lib/utilities/score-variant";

interface StoredSessionMeta {
  jobTitle: string;
}

export default async function InterviewsPage() {
  const user = await requireAuth();
  const sessions = await listSessions(user.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8">
      <PageHeader
        icon={MessagesSquare}
        title="Interview Prep"
        description="Generate practice questions for a role, answer them, and get feedback."
      />

      <StartSessionForm />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Past sessions</h2>
        {sessions.length === 0 ? (
          <Card>
            <CardHeader className="items-center text-center">
              <MessagesSquare className="text-muted-foreground size-6" />
              <CardTitle className="text-base">No sessions yet</CardTitle>
              <CardDescription>Start one above to begin practicing.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          sessions.map((session) => {
            const meta = session.questions as unknown as StoredSessionMeta;
            return (
              <Link key={session.id} href={`/interviews/${session.id}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{meta.jobTitle}</CardTitle>
                      <CardDescription>
                        {session.mode === "MOCK" ? "Mock interview" : "Practice"}
                      </CardDescription>
                    </div>
                    {session.overallScore != null ? (
                      <Badge variant={scoreBadgeVariant(session.overallScore)}>
                        {session.overallScore}/100
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Not yet evaluated</Badge>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
