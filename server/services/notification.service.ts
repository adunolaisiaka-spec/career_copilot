import * as repo from "@/server/repositories/notification.repository";

export const listNotifications = (userId: string) => repo.listNotificationsByUser(userId);
export const countUnread = (userId: string) => repo.countUnread(userId);
export const markNotificationRead = (userId: string, id: string) => repo.markRead(id, userId);
export const markAllNotificationsRead = (userId: string) => repo.markAllRead(userId);
export const deleteNotification = (userId: string, id: string) =>
  repo.deleteNotification(id, userId);

export type NotificationType =
  | "application_status_changed"
  | "goal_completed"
  | "resume_analyzed"
  | "interview_reminder";

/**
 * Creates an in-app notification. Most call sites are event-triggered (fire
 * immediately when something happens); server/services/reminder.service.ts
 * is the one time-based exception, driven by a daily Vercel Cron job since
 * there's no other background job runner in this app. Email/push delivery
 * can be layered on here later without changing call sites, per the master
 * spec's "design so these can be added later."
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
