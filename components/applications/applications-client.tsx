"use client";

import { useState } from "react";
import type { listApplications } from "@/server/services/application.service";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/applications/kanban-board";
import { ApplicationDialog } from "@/components/applications/application-dialog";

type Application = Awaited<ReturnType<typeof listApplications>>[number];

export function ApplicationsClient({ applications }: { applications: Application[] }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>Add application</Button>
      </div>

      <KanbanBoard applications={applications} />

      <ApplicationDialog open={createOpen} onOpenChange={setCreateOpen} application={null} />
    </div>
  );
}
