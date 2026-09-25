import { requireAuth } from "@/lib/auth/helpers";
import { getApplicationStats, listApplications } from "@/server/services/application.service";
import { StatsBar } from "@/components/applications/stats-bar";
import { ApplicationsClient } from "@/components/applications/applications-client";

export default async function ApplicationsPage() {
  const user = await requireAuth();
  const [applications, stats] = await Promise.all([
    listApplications(user.id),
    getApplicationStats(user.id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="text-muted-foreground text-sm">
          Your career pipeline — drag a card to move it forward.
        </p>
      </div>

      <StatsBar stats={stats} />

      <ApplicationsClient applications={applications} />
    </div>
  );
}
