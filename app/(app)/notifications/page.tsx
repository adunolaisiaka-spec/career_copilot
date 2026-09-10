import { requireAuth } from "@/lib/auth/helpers";
import { countUnread, listNotifications } from "@/server/services/notification.service";
import { NotificationsClient } from "@/components/notifications/notifications-client";

export default async function NotificationsPage() {
  const user = await requireAuth();
  const [notifications, unread] = await Promise.all([
    listNotifications(user.id),
    countUnread(user.id),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <NotificationsClient notifications={notifications} unread={unread} />
    </div>
  );
}
