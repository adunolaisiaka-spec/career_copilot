"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body?.data?.url) {
        throw new Error(body?.error ?? "Failed to open billing portal");
      }
      window.location.href = body.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Button variant="outline" onClick={handleManage} disabled={loading}>
        {loading ? "Redirecting..." : "Manage subscription"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
