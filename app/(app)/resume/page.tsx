import Link from "next/link";
import { requireAuth } from "@/lib/auth/helpers";
import { listResumes } from "@/server/services/resume.service";
import { getBackground } from "@/server/services/background.service";
import { BackgroundManager } from "@/components/resume/background-manager";
import { ResumeList } from "@/components/resume/resume-list";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { FileText } from "lucide-react";

export default async function ResumePage() {
  const user = await requireAuth();
  const [resumes, background] = await Promise.all([listResumes(user.id), getBackground(user.id)]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          icon={FileText}
          title="My Resume"
          description="Build, upload, and get AI-scored feedback on your resume."
        />
        <div className="flex gap-2">
          <Link href="/resume/analyzer" className={buttonVariants({ variant: "outline" })}>
            Analyze a resume
          </Link>
          <Link href="/resume/new" className={buttonVariants()}>
            New resume
          </Link>
        </div>
      </div>

      <ResumeList resumes={resumes} />

      <div>
        <h2 className="mb-4 text-lg font-semibold">Background</h2>
        <BackgroundManager
          education={background.education}
          experience={background.experience}
          projects={background.projects}
          certifications={background.certifications}
        />
      </div>
    </div>
  );
}
