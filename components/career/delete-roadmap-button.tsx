"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteRoadmapButton({ roadmapId }: { roadmapId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/career/roadmap/${roadmapId}`, { method: "DELETE" });
      router.push("/career/roadmap");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button type="button" variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
      {deleting ? "Deleting..." : "Delete"}
    </Button>
  );
}
