import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { getRoadmap } from "@/server/services/career-roadmap.service";
import { DeleteRoadmapButton } from "@/components/career/delete-roadmap-button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Map } from "lucide-react";

interface StoredPhase {
  title: string;
  description: string;
  durationEstimate: string;
  milestones: string[];
}

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const roadmap = await getRoadmap(user.id, id);
  if (!roadmap) notFound();

  const phases = roadmap.phases as unknown as StoredPhase[];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader icon={Map} title={roadmap.goalTitle} />
        <DeleteRoadmapButton roadmapId={roadmap.id} />
      </div>

      <div className="flex flex-col gap-4">
        {phases.map((phase, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-base">
                Phase {i + 1}: {phase.title}
              </CardTitle>
              <CardDescription>{phase.durationEstimate}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm">{phase.description}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {phase.milestones.map((m, j) => (
                  <li key={j}>{m}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
