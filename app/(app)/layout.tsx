import { requireAuth } from "@/lib/auth/helpers";
import { countUnread } from "@/server/services/notification.service";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const unreadCount = await countUnread(user.id);

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <AppSidebar isAdmin={user.role === "ADMIN"} unreadCount={unreadCount} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
