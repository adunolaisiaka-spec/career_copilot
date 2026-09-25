import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ReadinessBreakdown } from "@/server/services/dashboard.service";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function readinessMessage(score: number): string {
  if (score >= 85) return "You're in excellent shape — keep the momentum going.";
  if (score >= 60) return "You're making strong progress. A few focused steps will close the gap.";
  if (score >= 30) return "You've got a foundation — let's build it out further.";
  return "Let's get your career profile off the ground.";
}

export function ReadinessScore({
  score,
  breakdown,
}: {
  score: number;
  breakdown: ReadinessBreakdown[];
}) {
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Career Readiness</CardTitle>
        <CardDescription>{readinessMessage(score)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative flex size-32 shrink-0 items-center justify-center self-center">
          <svg viewBox="0 0 120 120" className="size-32 -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              className="stroke-muted"
            />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-semibold tabular-nums">{score}</span>
            <span className="text-muted-foreground text-xs">/ 100</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          {breakdown.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground text-xs">{item.hint}</span>
              </div>
              <Progress value={item.value} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
