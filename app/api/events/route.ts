export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import { Role } from '@prisma/client';

const eventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.enum(['Cultural', 'Sports', 'Workshop', 'Trip', 'Competition', 'Party']),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  coverImageUrl: z.string().url().optional().nullable(),
  isPublic: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sortBy') || 'date';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    const session = await getSession();

    const where =
      session?.user?.role && ['ADMIN', 'PHOTOGRAPHER', 'MEMBER'].includes(session.user.role)
        ? {}
        : { isPublic: true };

    const orderBy =
      sortBy === 'name'
        ? { name: order as 'asc' | 'desc' }
        : sortBy === 'category'
          ? { category: order as 'asc' | 'desc' }
          : { date: order as 'asc' | 'desc' };

    const events = await prisma.event.findMany({
      where,
      orderBy,
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { albums: true, media: true } },
      },
    });

    return apiSuccess(events);
  } catch (err) {
    console.error('GET /api/events error:', err);
    return apiError('Failed to fetch events', 500);
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
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || 'Invalid input', 400);

    const event = await prisma.event.create({
      data: {
        ...parsed.data,
        date: new Date(parsed.data.date),
        createdById: session.user.id,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return apiSuccess(event, 201);
  } catch (err) {
    console.error('POST /api/events error:', err);
    return apiError('Failed to create event', 500);
  }
}

