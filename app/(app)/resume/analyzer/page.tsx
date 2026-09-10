import { requireAuth } from "@/lib/auth/helpers";
import { listResumes } from "@/server/services/resume.service";
import { ResumeAnalyzer } from "@/components/resume/resume-analyzer";

export default async function ResumeAnalyzerPage({
  searchParams,
}: {
  searchParams: Promise<{ resumeId?: string }>;
}) {
  const user = await requireAuth();
  const [resumes, { resumeId }] = await Promise.all([listResumes(user.id), searchParams]);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <ResumeAnalyzer
        resumes={resumes.map((r) => ({ id: r.id, title: r.title }))}
        initialResumeId={resumeId}
      />
    </div>
  );
}
