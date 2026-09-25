import { requireAuth } from "@/lib/auth/helpers";
import { countUnread, listNotifications } from "@/server/services/notification.service";
import { NotificationsClient } from "@/components/notifications/notifications-client";
import { PageHeader } from "@/components/layout/page-header";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const user = await requireAuth();
  const [notifications, unread] = await Promise.all([
    listNotifications(user.id),
    countUnread(user.id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6 sm:p-8">
      <PageHeader
        icon={Bell}
        title="Notifications"
        description={unread > 0 ? `${unread} unread` : "You're all caught up."}
      />
      <NotificationsClient notifications={notifications} unread={unread} />
    </div>
  );
}
