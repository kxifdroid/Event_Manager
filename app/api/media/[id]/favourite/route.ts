export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession, canInteract } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);
    if (!canInteract(session.user.role as Role)) return apiError('Forbidden', 403);

    const existing = await prisma.favourite.findUnique({
      where: { mediaId_userId: { mediaId: params.id, userId: session.user.id } },
    });

    if (existing) {
      await prisma.favourite.delete({ where: { id: existing.id } });
      return apiSuccess({ favourited: false });
    }

    await prisma.favourite.create({
      data: { mediaId: params.id, userId: session.user.id },
    });

    return apiSuccess({ favourited: true });
  } catch (err) {
    console.error('POST /api/media/[id]/favourite error:', err);
    return apiError('Failed to toggle favourite', 500);
  }
}

