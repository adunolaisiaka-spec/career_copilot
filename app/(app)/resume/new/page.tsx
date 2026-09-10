import { requireAuth } from "@/lib/auth/helpers";
import { ResumeForm } from "@/components/resume/resume-form";

export default async function NewResumePage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <ResumeForm mode="create" />
    </div>
  );
}
