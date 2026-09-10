import Link from "next/link";
import { requireRole } from "@/lib/auth/helpers";
import { getAnalyticsSeries, getPlatformStats } from "@/server/services/admin.service";
import { TrendChart } from "@/components/admin/trend-chart";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CHART_COLORS = {
  userGrowth: "#2a78d6",
  applications: "#eb6834",
  resumeAnalyses: "#1baf7a",
  interviewSessions: "#eda100",
};

export default async function AdminPage() {
  const user = await requireRole("ADMIN");
  const [stats, series] = await Promise.all([getPlatformStats(), getAnalyticsSeries()]);

  const statCards = [
    { label: "Total users", value: stats.totalUsers },
    { label: "Active users", value: stats.activeUsers },
    { label: "Total applications", value: stats.totalApplications },
    { label: "Resumes analyzed", value: stats.totalResumeAnalyses },
    { label: "Interview sessions", value: stats.totalInterviewSessions },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Signed in as {user.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Users
          </Link>
          <Link href="/admin/jobs" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Jobs
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {statCards.map((card) => (
          <Card key={card.label} size="sm">
            <CardContent className="text-center">
              <div className="text-xl font-semibold">{card.value}</div>
              <div className="text-muted-foreground text-xs">{card.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Platform activity (30 days)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TrendChart title="New users" data={series.userGrowth} color={CHART_COLORS.userGrowth} />
          <TrendChart
            title="Applications"
            data={series.applications}
            color={CHART_COLORS.applications}
          />
          <TrendChart
            title="Resumes analyzed"
            data={series.resumeAnalyses}
            color={CHART_COLORS.resumeAnalyses}
          />
          <TrendChart
            title="Interview sessions"
            data={series.interviewSessions}
            color={CHART_COLORS.interviewSessions}
          />
        </div>
      </div>
    </div>
  );
}
