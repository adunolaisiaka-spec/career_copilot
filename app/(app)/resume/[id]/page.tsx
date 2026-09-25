import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { getResume } from "@/server/services/resume.service";
import { ResumeForm } from "@/components/resume/resume-form";
import type { ResumeContentFormInput } from "@/lib/validation/resume";

interface StructuredContent {
  personalInfo?: ResumeContentFormInput["personalInfo"];
  summary?: string | null;
  awards?: ResumeContentFormInput["awards"];
  references?: ResumeContentFormInput["references"];
}

export default async function EditResumePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth();
  const { id } = await params;
  const resume = await getResume(user.id, id);

  if (!resume || resume.source !== "BUILT") {
    notFound();
  }

  const content = (resume.structuredContent ?? {}) as StructuredContent;

  return (
    <div className="mx-auto w-full max-w-2xl p-6 sm:p-8">
      <ResumeForm
        mode="edit"
        resumeId={resume.id}
        initialValues={{
          title: resume.title,
          isPrimary: resume.isPrimary,
          personalInfo: content.personalInfo ?? { fullName: "" },
          summary: content.summary ?? "",
          awards: content.awards ?? [],
          references: content.references ?? [],
        }}
      />
    </div>
  );
}
