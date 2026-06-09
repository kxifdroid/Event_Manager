export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession, canViewEvent } from '@/lib/auth';
import { deleteFromLocalStorage } from '@/lib/storage';
import { Role } from '@prisma/client';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const media = await prisma.media.findUnique({
      where: { id: params.id },
      include: {
        uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
        event: { select: { id: true, name: true, isPublic: true } },
        album: { select: { id: true, name: true } },
        _count: { select: { likes: true, comments: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        likes: true,
      },
    });
    if (!media) return apiError('Media not found', 404);

    const session = await getSession();
    const canView = await canViewEvent(
      media.eventId,
      session?.user?.id,
      session?.user?.role as Role | undefined,
    );
    if (!canView) return apiError('Access denied', 403);

    return apiSuccess(media);
  } catch (err) {
    console.error('GET /api/media/[id] error:', err);
    return apiError('Failed to fetch media', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);

    const media = await prisma.media.findUnique({ where: { id: params.id } });
    if (!media) return apiError('Media not found', 404);

    const isOwner = media.uploadedById === session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;
    if (!isOwner && !isAdmin) return apiError('Forbidden', 403);

    if (!media.url.startsWith('http') && !media.url.startsWith('data:')) {
      await deleteFromLocalStorage(media.url);
    }
    if (
      media.thumbnailUrl &&
      media.thumbnailUrl !== media.url &&
      !media.thumbnailUrl.startsWith('http') &&
      !media.thumbnailUrl.startsWith('data:')
    ) {
      await deleteFromLocalStorage(media.thumbnailUrl);
    }
    await prisma.media.delete({ where: { id: params.id } });

    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error('DELETE /api/media/[id] error:', err);
    return apiError('Failed to delete media', 500);
  }
}

