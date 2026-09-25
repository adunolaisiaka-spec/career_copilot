"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body?.data?.url) {
        throw new Error(body?.error ?? "Failed to start checkout");
      }
      window.location.href = body.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Button onClick={handleUpgrade} disabled={loading}>
        {loading ? "Redirecting..." : "Upgrade to Pro — $9/month"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
