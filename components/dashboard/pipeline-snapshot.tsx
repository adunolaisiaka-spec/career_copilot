import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, MessagesSquare, Trophy, TrendingUp } from "lucide-react";
import type { getApplicationStats } from "@/server/services/application.service";

export function PipelineSnapshot({
  stats,
}: {
  stats: Awaited<ReturnType<typeof getApplicationStats>>;
}) {
  const responseRate =
    stats.total > 0 ? Math.round(((stats.interviews + stats.offers) / stats.total) * 100) : null;

  const items = [
    { label: "Applications", value: stats.total, icon: Briefcase },
    { label: "Interviews", value: stats.interviews, icon: MessagesSquare },
    { label: "Offers", value: stats.offers, icon: Trophy },
    {
      label: "Response rate",
      value: responseRate === null ? "—" : `${responseRate}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
              <item.icon className="size-4.5" />
            </div>
            <div>
              <div className="text-xl font-semibold tabular-nums">{item.value}</div>
              <div className="text-muted-foreground text-xs">{item.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
