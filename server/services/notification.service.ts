import * as repo from "@/server/repositories/notification.repository";

export const listNotifications = (userId: string) => repo.listNotificationsByUser(userId);
export const countUnread = (userId: string) => repo.countUnread(userId);
export const markNotificationRead = (userId: string, id: string) => repo.markRead(id, userId);
export const markAllNotificationsRead = (userId: string) => repo.markAllRead(userId);
export const deleteNotification = (userId: string, id: string) =>
  repo.deleteNotification(id, userId);

export type NotificationType = "application_status_changed" | "goal_completed" | "resume_analyzed";

/**
 * Creates an in-app notification. This is event-triggered (fires immediately when
 * something happens), not a scheduled reminder — there's no background job/cron
 * in this app yet, so true time-based reminders (e.g. "interview tomorrow") aren't
 * implemented. Email/push delivery can be layered on here later without changing
 * call sites, per the master spec's "design so these can be added later."
 */
export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  related?: { entityType: string; entityId: string },
) {
  return repo.createNotification({
    userId,
    type,
    title,
    message,
    relatedEntityType: related?.entityType,
    relatedEntityId: related?.entityId,
  });
}
