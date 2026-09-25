import { requireAuth } from "@/lib/auth/helpers";
import {
  getProfileForUser,
  getMissingProfileFields,
  listSkillCatalog,
} from "@/server/services/profile.service";
import { ProfileForm } from "@/components/profile/profile-form";
import { CompletionCard } from "@/components/profile/completion-card";

export default async function ProfilePage() {
  const user = await requireAuth();
  const [{ profile, skills }, skillCatalog] = await Promise.all([
    getProfileForUser(user.id),
    listSkillCatalog(),
  ]);

  const missingLabels = profile
    ? getMissingProfileFields(profile, profile.educations.length > 0, skills.length > 0)
    : [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">
          Keep this up to date for stronger AI matches and recommendations.
        </p>
      </div>

      <CompletionCard completion={profile?.profileCompletion ?? 0} missingLabels={missingLabels} />

      <ProfileForm
        skillCatalog={skillCatalog}
        initialValues={{
          fullName: profile?.fullName ?? "",
          location: profile?.location ?? "",
          careerLevel: profile?.careerLevel ?? undefined,
          yearsExperience: profile?.yearsExperience ?? 0,
          currentJobTitle: profile?.currentJobTitle ?? "",
          desiredJobTitle: profile?.desiredJobTitle ?? "",
          desiredIndustry: profile?.desiredIndustry ?? "",
          preferredWorkArrangement: profile?.preferredWorkArrangement ?? undefined,
          preferredLocation: profile?.preferredLocation ?? "",
          salaryExpectationMin: profile?.salaryExpectationMin ?? undefined,
          salaryExpectationMax: profile?.salaryExpectationMax ?? undefined,
          professionalInterests: profile?.professionalInterests ?? [],
          selectedSkillNames: skills.map((s) => s.name),
        }}
      />
    </div>
  );
}
