import Link from "next/link";
import { requireAuth } from "@/lib/auth/helpers";
import { listRoadmaps } from "@/server/services/career-roadmap.service";
import { GenerateRoadmapForm } from "@/components/career/generate-roadmap-form";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface StoredPhase {
  title: string;
}

export default async function CareerRoadmapPage() {
  const user = await requireAuth();
  const roadmaps = await listRoadmaps(user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Career Roadmap</h1>
        <p className="text-muted-foreground text-sm">
          AI-generated, phase-by-phase plans toward a career goal.
        </p>
      </div>

      <GenerateRoadmapForm />

      {roadmaps.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Past roadmaps</h2>
          {roadmaps.map((roadmap) => {
            const phases = roadmap.phases as unknown as StoredPhase[];
            return (
              <Link key={roadmap.id} href={`/career/roadmap/${roadmap.id}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">{roadmap.goalTitle}</CardTitle>
                    <CardDescription>{phases.length} phases</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
