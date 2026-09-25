"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { APPLICATION_STATUSES } from "@/lib/validation/application";
import type { listApplications } from "@/server/services/application.service";
import { ApplicationDialog } from "@/components/applications/application-dialog";
import { formatRelativeTime } from "@/lib/utilities/format-relative-time";
import { MessagesSquare, ExternalLink } from "lucide-react";

type Application = Awaited<ReturnType<typeof listApplications>>[number];
type Status = (typeof APPLICATION_STATUSES)[number];

const STATUS_LABELS: Record<Status, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  TECHNICAL_INTERVIEW: "Technical Interview",
  FINAL_INTERVIEW: "Final Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

// Tailwind needs to see full class names statically — no dynamic string
// concatenation — so each status maps to a fixed dot color and an optional
// tint used for the column's count badge.
const STATUS_DOT: Record<Status, string> = {
  SAVED: "bg-muted-foreground",
  APPLIED: "bg-info",
  SCREENING: "bg-warning",
  INTERVIEW: "bg-primary",
  TECHNICAL_INTERVIEW: "bg-primary",
  FINAL_INTERVIEW: "bg-primary",
  OFFER: "bg-success",
  REJECTED: "bg-destructive",
  WITHDRAWN: "bg-muted-foreground",
};

function ApplicationCard({
  application,
  onClick,
}: {
  application: Application;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="bg-card ring-foreground/10 hover:ring-primary/30 flex cursor-grab touch-none flex-col gap-1 rounded-lg p-3 text-sm shadow-sm ring-1 transition-shadow active:cursor-grabbing"
    >
      <div className="font-medium">{application.jobTitle}</div>
      <div className="text-muted-foreground">{application.companyName}</div>
      <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
        <span>
          {application.appliedDate
            ? `Applied ${formatRelativeTime(application.appliedDate)}`
            : `Added ${formatRelativeTime(application.createdAt)}`}
        </span>
        <span className="flex items-center gap-2">
          {application.jobLink && <ExternalLink className="size-3.5" />}
          {application.interviews.length > 0 && (
            <span className="flex items-center gap-0.5">
              <MessagesSquare className="size-3.5" />
              {application.interviews.length}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  applications,
  onCardClick,
}: {
  status: Status;
  applications: Application[];
  onCardClick: (application: Application) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col gap-2 rounded-xl border p-3 transition-colors ${isOver ? "border-primary/40 bg-primary/5" : "bg-muted/30"}`}
    >
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} aria-hidden />
          {STATUS_LABELS[status]}
        </span>
        <span className="text-muted-foreground font-normal">{applications.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} onClick={() => onCardClick(app)} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ applications }: { applications: Application[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Application | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [items, setItems] = useState(applications);
  const [syncedApplications, setSyncedApplications] = useState(applications);

  // `items` starts as a local (mutable, for optimistic drag updates) copy of
  // `applications`, but useState only reads that initial value once. Re-deriving
  // it here during render (rather than in a useEffect, which would cost an extra
  // render pass) is React's recommended pattern for this:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-based-on-a-prop-or-state-change
  // Without this, a new/edited application delivered via router.refresh() (from
  // the create/edit dialog) would never appear — only drag-and-drop's manual
  // setItems calls updated the board. Caught by an E2E test that added an
  // application and found it never rendered.
  if (applications !== syncedApplications) {
    setSyncedApplications(applications);
    setItems(applications);
    // If the currently open/last-opened dialog's application is stale (e.g. the
    // edit dialog's own save just triggered this refresh), repoint `selected` at
    // the fresh copy so a quick reopen right after saving doesn't show old data
    // — `selected` is otherwise only set once, at click-time, and never revisited.
    setSelected((prev) => (prev ? (applications.find((a) => a.id === prev.id) ?? prev) : prev));
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const byStatus = (status: Status) => items.filter((a) => a.status === status);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as Status;
    const applicationId = active.id as string;
    const current = items.find((a) => a.id === applicationId);
    if (!current || current.status === newStatus) return;

    setItems((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a)));

    const res = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      setItems((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: current.status } : a)),
      );
      return;
    }

    router.refresh();
  };

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {APPLICATION_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              applications={byStatus(status)}
              onCardClick={(app) => {
                setSelected(app);
                setDialogOpen(true);
              }}
            />
          ))}
        </div>
      </DndContext>

      <ApplicationDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelected(null);
        }}
        application={selected}
      />
    </>
  );
}
