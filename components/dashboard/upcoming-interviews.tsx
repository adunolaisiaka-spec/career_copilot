import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CalendarClock } from "lucide-react";

interface UpcomingInterview {
  id: string;
  type: string;
  scheduledDate: Date;
  jobTitle: string;
  companyName: string;
  applicationId: string;
}

const TYPE_LABELS: Record<string, string> = {
  GENERAL: "General",
  BEHAVIORAL: "Behavioral",
  TECHNICAL: "Technical",
  HR: "HR",
  SITUATIONAL: "Situational",
};

function formatWhen(date: Date): string {
  const days = Math.round((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(
    date,
  );
  if (days <= 0) return `Today, ${time}`;
  if (days === 1) return `Tomorrow, ${time}`;
  if (days < 7) return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date) + `, ${time}`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date) + `, ${time}`;
}

export function UpcomingInterviews({ interviews }: { interviews: UpcomingInterview[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <CalendarClock className="text-primary size-4" />
          Upcoming Interviews
        </CardTitle>
        <CardDescription>Interview dates from your tracked applications.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {interviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No interviews scheduled yet. Add a date when you log an application.
          </p>
        ) : (
          interviews.map((iv) => (
            <Link
              key={iv.id}
              href={`/applications`}
              className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">
                  {iv.jobTitle} · {iv.companyName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {TYPE_LABELS[iv.type] ?? iv.type} interview
                </p>
              </div>
              <span className="text-xs font-medium whitespace-nowrap">
                {formatWhen(iv.scheduledDate)}
              </span>
            </Link>
          ))
        )}
        <Link
          href="/interviews"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}
        >
          Practice for an interview
        </Link>
      </CardContent>
    </Card>
  );
}
