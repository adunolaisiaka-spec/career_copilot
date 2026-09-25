import Link from "next/link";
import { requireAuth } from "@/lib/auth/helpers";
import { listRoadmaps } from "@/server/services/career-roadmap.service";
import { GenerateRoadmapForm } from "@/components/career/generate-roadmap-form";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Map } from "lucide-react";

interface StoredPhase {
  title: string;
}

export default async function CareerRoadmapPage() {
  const user = await requireAuth();
  const roadmaps = await listRoadmaps(user.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8">
      <PageHeader
        icon={Map}
        title="Career Roadmap"
        description="AI-generated, phase-by-phase plans toward a career goal."
      />

      <GenerateRoadmapForm />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Past roadmaps</h2>
        {roadmaps.length === 0 ? (
          <Card>
            <CardHeader className="items-center text-center">
              <Map className="text-muted-foreground size-6" />
              <CardTitle className="text-base">No roadmaps yet</CardTitle>
              <CardDescription>Generate one above to get a phased plan toward your goal.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          roadmaps.map((roadmap) => {
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
          })
        )}
      </div>
    </div>
  );
}
