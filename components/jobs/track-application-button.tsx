"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function TrackApplicationButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await fetch(`/api/jobs/${jobId}/track`, { method: "POST" });
      router.push("/applications");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Adding..." : "Track this application"}
    </Button>
  );
}
