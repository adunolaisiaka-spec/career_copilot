import Link from "next/link";
import { requireRole } from "@/lib/auth/helpers";
import { userListSchema } from "@/lib/validation/admin";
import { listUsers } from "@/server/services/admin.service";
import { UsersTable } from "@/components/admin/users-table";
import { buttonVariants } from "@/components/ui/button";

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
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Back to dashboard
        </Link>
      </div>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          placeholder="Search by name or email..."
          defaultValue={filters.q ?? ""}
          className="border-input h-8 flex-1 rounded-lg border bg-transparent px-2.5 text-sm"
        />
        <button type="submit" className={buttonVariants({ size: "sm" })}>
          Search
        </button>
      </form>

      <p className="text-muted-foreground text-sm">{total} user(s)</p>

      <UsersTable users={users} currentUserId={user.id} />

      {totalPages > 1 && (
        <p className="text-muted-foreground text-center text-sm">
          Page {filters.page} of {totalPages}
        </p>
      )}
    </div>
  );
}
