import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CircleCheck } from "lucide-react";

interface CompletionCardProps {
  completion: number;
  missingLabels: string[];
}

export function CompletionCard({ completion, missingLabels }: CompletionCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Profile completion</span>
          <span className="text-sm font-semibold tabular-nums">{completion}%</span>
        </div>
        <Progress value={completion} />
        {missingLabels.length > 0 ? (
          <p className="text-muted-foreground text-sm">
            Add {missingLabels.slice(0, 2).join(" and ")}
            {missingLabels.length > 2 ? `, and ${missingLabels.length - 2} more` : ""} to complete
            your profile.
          </p>
        ) : (
          <p className="text-success flex items-center gap-1.5 text-sm">
            <CircleCheck className="size-4" />
            Your profile is complete.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
