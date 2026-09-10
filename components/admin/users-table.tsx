"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { listUsers } from "@/server/services/admin.service";
import { Button } from "@/components/ui/button";

type User = Awaited<ReturnType<typeof listUsers>>[0][number];

export function UsersTable({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (fn: () => Promise<Response>, id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Action failed");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatus = (user: User) =>
    runAction(
      () =>
        fetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }),
        }),
      user.id,
    );

  const deleteUser = (user: User) => {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    runAction(() => fetch(`/api/admin/users/${user.id}`, { method: "DELETE" }), user.id);
  };

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-3">{user.profile?.fullName ?? "—"}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.role}</td>
                <td className="p-3">
                  <span
                    className={
                      user.status === "ACTIVE" ? "text-emerald-600" : "text-muted-foreground"
                    }
                  >
                    {user.status}
                  </span>
                </td>
                <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="flex gap-2 p-3">
                  {user.id !== currentUserId && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === user.id}
                        onClick={() => toggleStatus(user)}
                      >
                        {user.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={busyId === user.id}
                        onClick={() => deleteUser(user)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="text-muted-foreground p-6 text-center text-sm">No users found.</p>
        )}
      </div>
    </div>
  );
}
