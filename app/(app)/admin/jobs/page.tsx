import Link from "next/link";
import { requireRole } from "@/lib/auth/helpers";
import { listAllJobs } from "@/server/services/admin.service";
import { AdminJobsClient } from "@/components/admin/admin-jobs-client";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Briefcase } from "lucide-react";

export default async function AdminJobsPage() {
  await requireRole("ADMIN");
  const jobs = await listAllJobs();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader icon={Briefcase} title="Jobs" description="Manage admin-added job listings." />
        <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Back to dashboard
        </Link>
      </div>
      <AdminJobsClient jobs={jobs} />
    </div>
  );
}
