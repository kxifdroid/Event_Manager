export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession, canViewEvent } from '@/lib/auth';
import { Role } from '@prisma/client';

const albumSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const eventId = new URL(req.url).searchParams.get('eventId');
    if (!eventId) return apiError('eventId required', 400);

    const session = await getSession();
    const canView = await canViewEvent(
      eventId,
      session?.user?.id,
      session?.user?.role as Role | undefined,
    );
    if (!canView) return apiError('Access denied', 403);

    const albums = await prisma.album.findMany({
      where: { eventId },
      include: {
        _count: { select: { media: true } },
        media: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { thumbnailUrl: true, url: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return apiSuccess(albums);
  } catch (err) {
    console.error('GET /api/albums error:', err);
    return apiError('Failed to fetch albums', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);
    if (session.user.role !== Role.ADMIN && session.user.role !== Role.PHOTOGRAPHER) {
      return apiError('Forbidden', 403);
    }

    const body = await req.json();
    const parsed = albumSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || 'Invalid input', 400);

    const album = await prisma.album.create({ data: parsed.data });
    return apiSuccess(album, 201);
  } catch (err) {
    console.error('POST /api/albums error:', err);
    return apiError('Failed to create album', 500);
  }
}

