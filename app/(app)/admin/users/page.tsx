import Link from "next/link";
import { requireRole } from "@/lib/auth/helpers";
import { userListSchema } from "@/lib/validation/admin";
import { listUsers } from "@/server/services/admin.service";
import { UsersTable } from "@/components/admin/users-table";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Users, Search } from "lucide-react";

const NATIVE_FIELD_CLASS =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border bg-transparent pl-8 pr-2.5 text-sm outline-none transition-colors focus-visible:ring-3";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireRole("ADMIN");
  const params = await searchParams;
  const parsed = userListSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : userListSchema.parse({});

  const [users, total] = await listUsers(filters);
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader icon={Users} title="Users" description={`${total} user(s)`} />
        <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Back to dashboard
        </Link>
      </div>

      <form method="GET" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <input
            name="q"
            placeholder="Search by name or email..."
            defaultValue={filters.q ?? ""}
            className={NATIVE_FIELD_CLASS}
          />
        </div>
        <button type="submit" className={buttonVariants({ size: "sm" })}>
          Search
        </button>
      </form>

      <UsersTable users={users} currentUserId={user.id} />

      {totalPages > 1 && (
        <p className="text-muted-foreground text-center text-sm">
          Page {filters.page} of {totalPages}
        </p>
      )}
    </div>
  );
}
