import { Card, CardContent } from "@/components/ui/card";

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
    { label: "Total", value: stats.total },
    { label: "Applied", value: stats.applied },
    { label: "Interviews", value: stats.interviews },
    { label: "Offers", value: stats.offers },
    { label: "Rejected", value: stats.rejected },
    { label: "Pending", value: stats.pending },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardContent className="text-center">
            <div className="text-xl font-semibold">{item.value}</div>
            <div className="text-muted-foreground text-xs">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
