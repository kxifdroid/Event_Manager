export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession, canInteract } from '@/lib/auth';
import { createAndPushNotification } from '@/lib/notifications';
import { Role } from '@prisma/client';

const tagSchema = z.object({
  taggedUserId: z.string().cuid().optional(),
  username: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);
    if (!canInteract(session.user.role as Role)) return apiError('Forbidden', 403);

    const body = await req.json();
    const parsed = tagSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || 'Invalid input', 400);

    let taggedUserId = parsed.data.taggedUserId;
    if (!taggedUserId && parsed.data.username) {
      const name = parsed.data.username.replace(/^@/, '');
      const user = await prisma.user.findFirst({
        where: { name: { contains: name } },
      });
      if (!user) return apiError('User not found', 404);
      taggedUserId = user.id;
    }

    if (!taggedUserId) return apiError('taggedUserId or username required', 400);

    const media = await prisma.media.findUnique({ where: { id: params.id } });
    if (!media) return apiError('Media not found', 404);

    const tag = await prisma.tag.create({
      data: {
        mediaId: params.id,
        taggedUserId,
        taggedBy: session.user.id,
      },
      include: {
        taggedUser: { select: { id: true, name: true } },
      },
    });

    await createAndPushNotification({
      userId: taggedUserId,
      type: 'TAG',
      message: `${session.user.name} tagged you in a photo`,
      relatedMediaId: media.id,
      triggeredBy: session.user.id,
    });

    return apiSuccess(tag, 201);
  } catch (err) {
    console.error('POST /api/media/[id]/tag error:', err);
    return apiError('Failed to tag user', 500);
  }
}

