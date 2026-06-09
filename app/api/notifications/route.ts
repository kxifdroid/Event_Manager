export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          trigger: { select: { id: true, name: true, avatarUrl: true } },
          relatedMedia: { select: { id: true, thumbnailUrl: true, url: true } },
        },
      }),
      prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      }),
    ]);

    return apiSuccess({ notifications, unreadCount });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return apiError('Failed to fetch notifications', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);

    const body = await req.json();
    const { notificationId, markAllRead } = body as {
      notificationId?: string;
      markAllRead?: boolean;
    };

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
      return apiSuccess({ updated: true });
    }

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: session.user.id },
        data: { isRead: true },
      });
      return apiSuccess({ updated: true });
    }

    return apiError('notificationId or markAllRead required', 400);
  } catch (err) {
    console.error('PATCH /api/notifications error:', err);
    return apiError('Failed to update notifications', 500);
  }
}

