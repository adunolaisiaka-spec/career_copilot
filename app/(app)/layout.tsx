import { requireAuth } from "@/lib/auth/helpers";
import { countUnread } from "@/server/services/notification.service";
import { AppNav } from "@/components/layout/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const unreadCount = await countUnread(user.id);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppNav isAdmin={user.role === "ADMIN"} unreadCount={unreadCount} />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
