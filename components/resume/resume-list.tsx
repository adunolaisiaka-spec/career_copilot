"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { listResumes } from "@/server/services/resume.service";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { scoreBadgeVariant } from "@/lib/utilities/score-variant";

interface ResumeListProps {
  resumes: Awaited<ReturnType<typeof listResumes>>;
}

export function ResumeList({ resumes }: ResumeListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (resumes.length === 0) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <FileText className="text-muted-foreground size-6" />
          <CardTitle className="text-base">No resumes yet</CardTitle>
          <CardDescription>Build one from scratch or analyze an uploaded file.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {resumes.map((resume) => {
        const latestScore = resume.analyses[0]?.overallScore;
        return (
          <Card key={resume.id}>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {resume.title}
                  {resume.isPrimary && (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      (primary)
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <Badge variant="secondary">
                    {resume.source === "UPLOADED" ? "Uploaded" : "Built"}
                  </Badge>
                  {typeof latestScore === "number" && (
                    <Badge variant={scoreBadgeVariant(latestScore)}>{latestScore}/100</Badge>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {resume.source === "BUILT" && (
                  <Link
                    href={`/resume/${resume.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Edit
                  </Link>
                )}
                {resume.fileUrl && (
                  <a
                    href={`/api/resumes/${resume.id}/file`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    View file
                  </a>
                )}
                <Link
                  href={`/resume/analyzer?resumeId=${resume.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Analyze
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletingId === resume.id}
                  onClick={() => handleDelete(resume.id)}
                >
                  {deletingId === resume.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
