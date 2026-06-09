export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession, canViewEvent } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const albumId = searchParams.get('albumId');
    const eventId = searchParams.get('eventId');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    if (!albumId && !eventId) return apiError('albumId or eventId required', 400);

    const session = await getSession();
    const targetEventId =
      eventId ||
      (albumId
        ? (await prisma.album.findUnique({ where: { id: albumId }, select: { eventId: true } }))
            ?.eventId
        : null);

    if (!targetEventId) return apiError('Not found', 404);

    const canView = await canViewEvent(
      targetEventId,
      session?.user?.id,
      session?.user?.role as Role | undefined,
    );
    if (!canView) return apiError('Access denied', 403);

    const media = await prisma.media.findMany({
      where: {
        ...(albumId ? { albumId } : { eventId: targetEventId }),
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
        likes: session?.user?.id
          ? { where: { userId: session.user.id }, select: { id: true } }
          : false,
        favourites: session?.user?.id
          ? { where: { userId: session.user.id }, select: { id: true } }
          : false,
      },
    });

    const hasMore = media.length > limit;
    const items = hasMore ? media.slice(0, limit) : media;
    const nextCursor = hasMore ? items[items.length - 1]?.createdAt.toISOString() : null;

    return apiSuccess({ items, nextCursor });
  } catch (err) {
    console.error('GET /api/media error:', err);
    return apiError('Failed to fetch media', 500);
  }
}

