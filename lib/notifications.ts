import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/pusher';
import type { NotificationType } from '@prisma/client';

export async function createAndPushNotification(params: {
  userId: string;
  type: NotificationType;
  message: string;
  relatedMediaId?: string;
  triggeredBy?: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      message: params.message,
      relatedMediaId: params.relatedMediaId,
      triggeredBy: params.triggeredBy,
    },
    include: {
      trigger: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  await sendNotification(params.userId, 'notification', {
    notification,
    unreadCount: await prisma.notification.count({
      where: { userId: params.userId, isRead: false },
    }),
  });

  return notification;
}
