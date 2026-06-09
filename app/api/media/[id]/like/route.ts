export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession, canInteract } from '@/lib/auth';
import { createAndPushNotification } from '@/lib/notifications';
import { Role } from '@prisma/client';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);
    if (!canInteract(session.user.role as Role)) return apiError('Forbidden', 403);

    const media = await prisma.media.findUnique({
      where: { id: params.id },
      include: { uploadedBy: true },
    });
    if (!media) return apiError('Media not found', 404);

    const existing = await prisma.like.findUnique({
      where: { mediaId_userId: { mediaId: params.id, userId: session.user.id } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      const count = await prisma.like.count({ where: { mediaId: params.id } });
      return apiSuccess({ liked: false, count });
    }

    await prisma.like.create({
      data: { mediaId: params.id, userId: session.user.id },
    });

    if (media.uploadedById !== session.user.id) {
      await createAndPushNotification({
        userId: media.uploadedById,
        type: 'LIKE',
        message: `${session.user.name} liked your photo`,
        relatedMediaId: media.id,
        triggeredBy: session.user.id,
      });
    }

    const count = await prisma.like.count({ where: { mediaId: params.id } });
    return apiSuccess({ liked: true, count });
  } catch (err) {
    console.error('POST /api/media/[id]/like error:', err);
    return apiError('Failed to toggle like', 500);
  }
}

