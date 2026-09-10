"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPE_OPTIONS = [
  { value: "GENERAL", label: "General" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "HR", label: "HR" },
  { value: "SITUATIONAL", label: "Situational" },
] as const;

const MODE_OPTIONS = [
  { value: "PRACTICE", label: "Practice (relaxed, review anytime)" },
  { value: "MOCK", label: "Mock interview (answer all, then get scored)" },
] as const;

export function StartSessionForm() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]["value"]>("GENERAL");
  const [mode, setMode] = useState<(typeof MODE_OPTIONS)[number]["value"]>("PRACTICE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      setError("Job title is required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/interviews/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          type,
          mode,
          industry: industry || undefined,
          experienceLevel: experienceLevel || undefined,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(`/interviews/${body.data.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start a session</CardTitle>
        <CardDescription>Practice questions for a specific role.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="type">Question type</Label>
              <Select value={type} onValueChange={(v) => v && setType(v as typeof type)}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue>
                    {(value: string) => TYPE_OPTIONS.find((o) => o.value === value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="industry">Industry (optional)</Label>
              <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="experienceLevel">Experience level (optional)</Label>
              <Input
                id="experienceLevel"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                placeholder="e.g. Senior"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mode">Mode</Label>
            <Select value={mode} onValueChange={(v) => v && setMode(v as typeof mode)}>
              <SelectTrigger id="mode" className="w-full">
                <SelectValue>
                  {(value: string) => MODE_OPTIONS.find((o) => o.value === value)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MODE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>
        <CardContent className="pt-0">
          <Button type="submit" disabled={loading}>
            {loading ? "Generating questions..." : "Start session"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
