export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession, canInteract } from '@/lib/auth';
import { createAndPushNotification } from '@/lib/notifications';
import { Role } from '@prisma/client';

const commentSchema = z.object({ content: z.string().min(1).max(2000) });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const comments = await prisma.comment.findMany({
      where: { mediaId: params.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
    return apiSuccess(comments);
  } catch (err) {
    console.error('GET /api/media/[id]/comment error:', err);
    return apiError('Failed to fetch comments', 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);
    if (!canInteract(session.user.role as Role)) return apiError('Forbidden', 403);

    const body = await req.json();
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || 'Invalid input', 400);

    const media = await prisma.media.findUnique({ where: { id: params.id } });
    if (!media) return apiError('Media not found', 404);

    const comment = await prisma.comment.create({
      data: {
        mediaId: params.id,
        userId: session.user.id,
        content: parsed.data.content,
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    if (media.uploadedById !== session.user.id) {
      await createAndPushNotification({
        userId: media.uploadedById,
        type: 'COMMENT',
        message: `${session.user.name} commented on your photo`,
        relatedMediaId: media.id,
        triggeredBy: session.user.id,
      });
    }

    return apiSuccess(comment, 201);
  } catch (err) {
    console.error('POST /api/media/[id]/comment error:', err);
    return apiError('Failed to create comment', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');
    if (!commentId) return apiError('commentId required', 400);

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.mediaId !== params.id) return apiError('Comment not found', 404);
    if (comment.userId !== session.user.id && session.user.role !== Role.ADMIN) {
      return apiError('Forbidden', 403);
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error('DELETE /api/media/[id]/comment error:', err);
    return apiError('Failed to delete comment', 500);
  }
}

