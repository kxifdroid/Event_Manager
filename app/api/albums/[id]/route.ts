export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession, canViewEvent } from '@/lib/auth';
import { Role } from '@prisma/client';

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const album = await prisma.album.findUnique({
      where: { id: params.id },
      include: {
        event: true,
        _count: { select: { media: true } },
      },
    });
    if (!album) return apiError('Album not found', 404);

    const session = await getSession();
    const canView = await canViewEvent(
      album.eventId,
      session?.user?.id,
      session?.user?.role as Role | undefined,
    );
    if (!canView) return apiError('Access denied', 403);

    return apiSuccess(album);
  } catch (err) {
    console.error('GET /api/albums/[id] error:', err);
    return apiError('Failed to fetch album', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);
    if (session.user.role !== Role.ADMIN && session.user.role !== Role.PHOTOGRAPHER) {
      return apiError('Forbidden', 403);
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || 'Invalid input', 400);

    const album = await prisma.album.update({ where: { id: params.id }, data: parsed.data });
    return apiSuccess(album);
  } catch (err) {
    console.error('PATCH /api/albums/[id] error:', err);
    return apiError('Failed to update album', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);
    if (session.user.role !== Role.ADMIN) return apiError('Forbidden', 403);

    await prisma.album.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error('DELETE /api/albums/[id] error:', err);
    return apiError('Failed to delete album', 500);
  }
}

