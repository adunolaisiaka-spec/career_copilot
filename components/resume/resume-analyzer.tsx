"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResumeAnalysisResult } from "@/lib/ai";

interface ResumeAnalyzerProps {
  resumes: { id: string; title: string }[];
  initialResumeId?: string;
}

type Mode = "existing" | "upload";

const SCORE_LABELS: { key: keyof ResumeAnalysisResult; label: string }[] = [
  { key: "structureScore", label: "Structure" },
  { key: "readabilityScore", label: "Readability" },
  { key: "keywordScore", label: "Keywords" },
  { key: "atsScore", label: "ATS compatibility" },
];

function scoreColorClass(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning-foreground";
  return "text-destructive";
}

export function ResumeAnalyzer({ resumes, initialResumeId }: ResumeAnalyzerProps) {
  const [mode, setMode] = useState<Mode>(resumes.length > 0 ? "existing" : "upload");
  const [resumeId, setResumeId] = useState(initialResumeId ?? resumes[0]?.id ?? "");
  const [targetRole, setTargetRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      let res: Response;
      if (mode === "existing") {
        if (!resumeId) {
          setError("Select a resume to analyze.");
          setLoading(false);
          return;
        }
        res = await fetch("/api/resumes/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeId, targetRole: targetRole || undefined }),
        });
      } else {
        if (!file) {
          setError("Choose a PDF or DOCX file.");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        if (targetRole) formData.append("targetRole", targetRole);
        res = await fetch("/api/resumes/analyze", { method: "POST", body: formData });
      }

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult(body.data.analysis);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Resume Analyzer</CardTitle>
          <CardDescription>
            Get an AI-powered score and actionable recommendations for your resume.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("existing")}
                disabled={resumes.length === 0}
              >
                Analyze an existing resume
              </Button>
              <Button
                type="button"
                variant={mode === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("upload")}
              >
                Upload a file
              </Button>
            </div>

            {mode === "existing" ? (
              resumes.length > 0 ? (
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
              ) : (
                <p className="text-muted-foreground text-sm">
                  You don&apos;t have any built resumes yet — upload a file instead.
                </p>
              )
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="file">Resume file (PDF or DOCX, max 5MB)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="targetRole">Target role (optional)</Label>
              <Input
                id="targetRole"
                placeholder="e.g. Senior Frontend Developer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}
          </CardContent>
          <CardFooter className="border-t-0 bg-transparent pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Analyzing..." : "Analyze resume"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resume Score: {result.overallScore}/100</CardTitle>
            <CardDescription>Based on the content you provided.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SCORE_LABELS.map(({ key, label }) => {
                const score = result[key] as number; // recommendations is the only non-number field on this type
                return (
                  <div key={key} className="rounded-md border p-3 text-center">
                    <div className={`text-lg font-semibold ${scoreColorClass(score)}`}>{score}</div>
                    <div className="text-muted-foreground text-xs">{label}</div>
                  </div>
                );
              })}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Recommendations</h3>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {result.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
