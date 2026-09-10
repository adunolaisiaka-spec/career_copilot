import { requireAuth } from "@/lib/auth/helpers";
import { getUsageSummary } from "@/server/services/subscription.service";
import { PLAN_FEATURES } from "@/lib/subscriptions/plans";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = !Number.isFinite(limit);
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {used} / {isUnlimited ? "Unlimited" : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default async function SettingsPage() {
  const user = await requireAuth();
  const usage = await getUsageSummary(user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your plan</CardTitle>
          <CardDescription>
            {usage.plan === "PRO" ? "Pro" : "Free"} plan · {usage.status.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <UsageBar
              label="Tracked applications"
              used={usage.applications.used}
              limit={usage.applications.limit}
            />
            <UsageBar
              label="Saved jobs"
              used={usage.savedJobs.used}
              limit={usage.savedJobs.limit}
            />
            <UsageBar
              label="Resume analyses this month"
              used={usage.resumeAnalysesThisMonth.used}
              limit={usage.resumeAnalysesThisMonth.limit}
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">
              {usage.plan === "PRO" ? "Pro" : "Free"} plan includes
            </h3>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              {PLAN_FEATURES[usage.plan].map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          {usage.plan === "FREE" && (
            <p className="text-muted-foreground text-sm">
              Self-serve upgrades aren&apos;t available yet — reach out if you&apos;d like Pro
              access.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
