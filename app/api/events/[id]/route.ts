export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession, canViewEvent } from '@/lib/auth';
import { Role } from '@prisma/client';

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  category: z
    .enum(['Cultural', 'Sports', 'Workshop', 'Trip', 'Competition', 'Party'])
    .optional(),
  date: z.string().optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  isPublic: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    const canView = await canViewEvent(
      params.id,
      session?.user?.id,
      session?.user?.role as Role | undefined,
    );
    if (!canView) return apiError('Event not found or access denied', 404);

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        albums: {
          include: { _count: { select: { media: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { media: true } },
      },
    });

    if (!event) return apiError('Event not found', 404);
    return apiSuccess(event);
  } catch (err) {
    console.error('GET /api/events/[id] error:', err);
    return apiError('Failed to fetch event', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);
    if (session.user.role !== Role.ADMIN) return apiError('Forbidden', 403);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || 'Invalid input', 400);

    const { date, ...rest } = parsed.data;
    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(date ? { date: new Date(date) } : {}),
      },
    });

    return apiSuccess(event);
  } catch (err) {
    console.error('PATCH /api/events/[id] error:', err);
    return apiError('Failed to update event', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);
    if (session.user.role !== Role.ADMIN) return apiError('Forbidden', 403);

    await prisma.event.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (err) {
    console.error('DELETE /api/events/[id] error:', err);
    return apiError('Failed to delete event', 500);
  }
}

