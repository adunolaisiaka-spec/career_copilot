"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";

export function SaveJobButton({ jobId, initialSaved }: { jobId: string; initialSaved: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      await fetch(`/api/jobs/${jobId}/save`, { method: next ? "POST" : "DELETE" });
      router.refresh();
    });
  };

  return (
    <Button
      variant={saved ? "secondary" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={toggle}
    >
      {saved ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
