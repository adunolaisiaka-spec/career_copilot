"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { listNotifications } from "@/server/services/notification.service";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell } from "lucide-react";

type Notification = Awaited<ReturnType<typeof listNotifications>>[number];

export function NotificationsClient({
  notifications,
  unread,
}: {
  notifications: Notification[];
  unread: number;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const markRead = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      router.refresh();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {unread > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled={markingAll} onClick={markAllRead}>
            {markingAll ? "Marking..." : "Mark all as read"}
          </Button>
        </div>
      )}

      {notifications.length === 0 && (
        <Card>
          <CardHeader className="items-center text-center">
            <Bell className="text-muted-foreground size-6" />
            <CardTitle className="text-base">No notifications yet</CardTitle>
            <CardDescription>
              You&apos;ll see updates here when your applications or goals change status.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {notifications.map((n) => (
        <Card key={n.id} className={n.isRead ? "opacity-60" : undefined}>
          <CardHeader className="flex-row items-start justify-between">
            <div className="flex items-start gap-2">
              {!n.isRead && (
                <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden />
              )}
              <div>
                <CardTitle className="text-base">{n.title}</CardTitle>
                <CardDescription>{n.message}</CardDescription>
                <p className="text-muted-foreground mt-1 text-xs">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {!n.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === n.id}
                  onClick={() => markRead(n.id)}
                >
                  Mark read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={busyId === n.id}
                onClick={() => remove(n.id)}
              >
                Delete
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
