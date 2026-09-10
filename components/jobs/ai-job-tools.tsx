"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JobMatchResult } from "@/lib/ai";

interface AiJobToolsProps {
  jobId: string;
  resumes: { id: string; title: string }[];
}

export function AiJobTools({ jobId, resumes }: AiJobToolsProps) {
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "");
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [match, setMatch] = useState<JobMatchResult | null>(null);
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterError, setLetterError] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);

  if (resumes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI tools</CardTitle>
          <CardDescription>
            Create a resume first to check your fit or generate a cover letter for this job.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const checkFit = async () => {
    setMatchError(null);
    setMatch(null);
    setMatchLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setMatchError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setMatch(body.data);
    } finally {
      setMatchLoading(false);
    }
  };

  const generateLetter = async () => {
    setLetterError(null);
    setCoverLetter(null);
    setLetterLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setLetterError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setCoverLetter(body.data.coverLetter);
    } finally {
      setLetterLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI tools</CardTitle>
        <CardDescription>Check your fit or generate a cover letter for this job.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Resume</Label>
          <Select value={resumeId} onValueChange={(value) => setResumeId(value ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a resume">
                {(value: string) => resumes.find((r) => r.id === value)?.title}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {resumes.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={matchLoading} onClick={checkFit}>
            {matchLoading ? "Checking fit..." : "Check your fit"}
          </Button>
          <Button type="button" variant="outline" disabled={letterLoading} onClick={generateLetter}>
            {letterLoading ? "Writing..." : "Generate cover letter"}
          </Button>
        </div>

        {matchError && <p className="text-destructive text-sm">{matchError}</p>}
        {match && (
          <div className="flex flex-col gap-3 rounded-md border p-3">
            <div className="text-sm font-semibold">Match score: {match.matchScore}/100</div>
            <p className="text-muted-foreground text-sm">{match.summary}</p>
            {match.keySkillsRequired.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-semibold">Key skills required</h4>
                <p className="text-muted-foreground text-sm">
                  {match.keySkillsRequired.join(", ")}
                </p>
              </div>
            )}
            {match.strengths.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-semibold">Strengths</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {match.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {match.gaps.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-semibold">Gaps</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {match.gaps.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {letterError && <p className="text-destructive text-sm">{letterError}</p>}
        {coverLetter && (
          <div className="rounded-md border p-3">
            <h4 className="mb-2 text-xs font-semibold">Cover letter</h4>
            <p className="text-sm whitespace-pre-wrap">{coverLetter}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
