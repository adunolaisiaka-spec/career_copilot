import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { getProfileForUser, listSkillCatalog } from "@/server/services/profile.service";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const user = await requireAuth();
  const [{ profile, skills }, skillCatalog] = await Promise.all([
    getProfileForUser(user.id),
    listSkillCatalog(),
  ]);

  if (profile?.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <OnboardingWizard
        skillCatalog={skillCatalog}
        initialValues={{
          fullName: profile?.fullName ?? "",
          selectedSkillNames: skills.map((s) => s.name),
        }}
      />
    </div>
  );
}
