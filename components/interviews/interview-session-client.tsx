"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Question {
  question: string;
  category: string;
}

interface AnswerFeedback {
  question: string;
  feedback: string;
}

interface InterviewSessionClientProps {
  sessionId: string;
  questions: Question[];
  initialAnswers: { question: string; answer: string }[] | null;
  initialFeedback: AnswerFeedback[] | null;
  initialOverallScore: number | null;
  initialStrongAreas: string[];
  initialWeakAreas: string[];
}

export function InterviewSessionClient({
  sessionId,
  questions,
  initialAnswers,
  initialFeedback,
  initialOverallScore,
  initialStrongAreas,
  initialWeakAreas,
}: InterviewSessionClientProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const a of initialAnswers ?? []) map[a.question] = a.answer;
    return map;
  });
  const [feedback, setFeedback] = useState<AnswerFeedback[] | null>(initialFeedback);
  const [overallScore, setOverallScore] = useState(initialOverallScore);
  const [strongAreas, setStrongAreas] = useState(initialStrongAreas);
  const [weakAreas, setWeakAreas] = useState(initialWeakAreas);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluated = feedback !== null;

  const submit = async () => {
    const payload = questions.map((q) => ({ question: q.question, answer: answers[q.question] ?? "" }));
    if (payload.some((a) => !a.answer.trim())) {
      setError("Answer every question before submitting.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/interviews/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setFeedback(body.data.feedback);
      setOverallScore(body.data.overallScore);
      setStrongAreas(body.data.strongAreas);
      setWeakAreas(body.data.weakAreas);
    } finally {
      setSubmitting(false);
    }
  };

  const feedbackFor = (question: string) => feedback?.find((f) => f.question === question)?.feedback;

  return (
    <div className="flex flex-col gap-4">
      {evaluated && (
        <Card>
          <CardHeader>
            <CardTitle>Score: {overallScore}/100</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {strongAreas.length > 0 && (
              <div>
                <h4 className="mb-1.5 text-xs font-semibold">Strong areas</h4>
                <div className="flex flex-wrap gap-1.5">
                  {strongAreas.map((area) => (
                    <Badge key={area} variant="success">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {weakAreas.length > 0 && (
              <div>
                <h4 className="mb-1.5 text-xs font-semibold">Areas to improve</h4>
                <div className="flex flex-wrap gap-1.5">
                  {weakAreas.map((area) => (
                    <Badge key={area} variant="warning">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {questions.map((q, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-base">
              {i + 1}. {q.question}
            </CardTitle>
            <CardDescription>{q.category}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              value={answers[q.question] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.question]: e.target.value }))}
              placeholder="Your answer..."
              rows={4}
              disabled={evaluated}
            />
            {evaluated && feedbackFor(q.question) && (
              <div className="bg-muted rounded-md p-3 text-sm">{feedbackFor(q.question)}</div>
            )}
          </CardContent>
        </Card>
      ))}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {!evaluated && (
        <Button type="button" disabled={submitting} onClick={submit}>
          {submitting ? "Evaluating..." : "Submit answers"}
        </Button>
      )}
    </div>
  );
}
