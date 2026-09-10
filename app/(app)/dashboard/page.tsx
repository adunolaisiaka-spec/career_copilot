import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/database/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireAuth();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

  if (!profile?.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Signed in as {user.email} ({user.role})
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {profile.fullName ?? user.email}</CardTitle>
          <CardDescription>
            Profile completion: {profile.profileCompletion}%. Career score, applications, and AI
            recommendations land in later phases.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
