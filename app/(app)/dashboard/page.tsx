import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { getDashboardSnapshot } from "@/server/services/dashboard.service";
import { ReadinessScore } from "@/components/dashboard/readiness-score";
import { PipelineSnapshot } from "@/components/dashboard/pipeline-snapshot";
import { NextBestMoves } from "@/components/dashboard/next-best-moves";
import { UpcomingInterviews } from "@/components/dashboard/upcoming-interviews";
import { GoalsWidget } from "@/components/dashboard/goals-widget";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const snapshot = await getDashboardSnapshot(user.id);

  if (!snapshot.profile?.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const name = snapshot.profile.fullName?.split(" ")[0] || user.email?.split("@")[0] || "there";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {name}
        </h1>
        <p className="text-muted-foreground text-sm">Here&apos;s your career snapshot.</p>
      </div>

      <PipelineSnapshot stats={snapshot.stats} />

      <ReadinessScore score={snapshot.readinessScore} breakdown={snapshot.readiness} />

      <NextBestMoves moves={snapshot.nextBestMoves} />

      <div className="grid gap-6 sm:grid-cols-2">
        <UpcomingInterviews interviews={snapshot.upcomingInterviews} />
        <GoalsWidget goals={snapshot.activeGoals} />
      </div>
    </div>
  );
}
