import Link from "next/link";
import { requireRole } from "@/lib/auth/helpers";
import { listAllJobs } from "@/server/services/admin.service";
import { AdminJobsClient } from "@/components/admin/admin-jobs-client";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminJobsPage() {
  await requireRole("ADMIN");
  const jobs = await listAllJobs();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Back to dashboard
        </Link>
      </div>
      <AdminJobsClient jobs={jobs} />
    </div>
  );
}
