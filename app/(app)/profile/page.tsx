import { requireAuth } from "@/lib/auth/helpers";
import { getProfileForUser, listSkillCatalog } from "@/server/services/profile.service";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const user = await requireAuth();
  const [{ profile, skills }, skillCatalog] = await Promise.all([
    getProfileForUser(user.id),
    listSkillCatalog(),
  ]);

  return (
    <div className="mx-auto max-w-2xl p-8">
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
