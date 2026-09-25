import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Send, MessagesSquare, Trophy, XCircle, Clock } from "lucide-react";

interface StatsBarProps {
  stats: {
    total: number;
    applied: number;
    interviews: number;
    offers: number;
    rejected: number;
    pending: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Total", value: stats.total, icon: Briefcase },
    { label: "Applied", value: stats.applied, icon: Send },
    { label: "Interviews", value: stats.interviews, icon: MessagesSquare },
    { label: "Offers", value: stats.offers, icon: Trophy },
    { label: "Rejected", value: stats.rejected, icon: XCircle },
    { label: "Pending", value: stats.pending, icon: Clock },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardContent className="flex flex-col items-center gap-1.5 text-center">
            <div className="bg-accent text-accent-foreground flex size-8 items-center justify-center rounded-lg">
              <item.icon className="size-4" />
            </div>
            <div className="text-xl font-semibold tabular-nums">{item.value}</div>
            <div className="text-muted-foreground text-xs">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
