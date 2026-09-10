import { prisma } from "@/lib/database/prisma";
import { Prisma } from "@prisma/client";

export const listNotificationsByUser = (userId: string) =>
  prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });

export const countUnread = (userId: string) =>
  prisma.notification.count({ where: { userId, isRead: false } });

export const createNotification = (data: Prisma.NotificationUncheckedCreateInput) =>
  prisma.notification.create({ data });

export const markRead = (id: string, userId: string) =>
  prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });

export const markAllRead = (userId: string) =>
  prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });

export const deleteNotification = (id: string, userId: string) =>
  prisma.notification.deleteMany({ where: { id, userId } });
