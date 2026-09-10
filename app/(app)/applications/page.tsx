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
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Applications</h1>
      </div>

      <StatsBar stats={stats} />

      <ApplicationsClient applications={applications} />
    </div>
  );
}
