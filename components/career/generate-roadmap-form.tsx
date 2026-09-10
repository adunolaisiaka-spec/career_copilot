"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function GenerateRoadmapForm() {
  const router = useRouter();
  const [goalTitle, setGoalTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) {
      setError("Enter a career goal.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/career/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalTitle }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(`/career/roadmap/${body.data.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate a roadmap</CardTitle>
        <CardDescription>
          Describe a career goal and get a step-by-step plan grounded in your profile.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goalTitle">Career goal</Label>
            <Input
              id="goalTitle"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g. Become a Staff Engineer"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>
        <CardContent className="pt-0">
          <Button type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate roadmap"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
