import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import type { NextBestMove } from "@/server/services/dashboard.service";

const PRIORITY_DOT: Record<NextBestMove["priority"], string> = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-muted-foreground",
};

export function NextBestMoves({ moves }: { moves: NextBestMove[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles className="text-primary size-4" />
          Your Next Best Moves
        </CardTitle>
        <CardDescription>Personalized next steps, based on your current progress.</CardDescription>
      </CardHeader>
      <div className="flex flex-col divide-y">
        {moves.length === 0 ? (
          <p className="text-muted-foreground px-4 pb-4 text-sm">
            You&apos;re all caught up — nothing urgent needs your attention right now.
          </p>
        ) : (
          moves.map((move) => (
            <div key={move.title} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <span
                  className={`mt-1.5 size-1.5 shrink-0 rounded-full ${PRIORITY_DOT[move.priority]}`}
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium">{move.title}</p>
                  <p className="text-muted-foreground text-sm">{move.description}</p>
                </div>
              </div>
              <Link
                href={move.href}
                className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}
              >
                {move.cta}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
