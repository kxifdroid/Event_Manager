export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';

function mediaHasAnyTag(mediaTags: unknown, requiredTags: string[]) {
  if (!requiredTags.length) return true;
  if (!Array.isArray(mediaTags)) return false;

  const normalizedTags = mediaTags
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.toLowerCase());

  return requiredTags.some((tag) => normalizedTags.includes(tag.toLowerCase()));
}

const searchSchema = z.object({
  q: z.string().optional(),
  eventName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  username: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = searchSchema.safeParse({
      q: searchParams.get('q') || undefined,
      eventName: searchParams.get('eventName') || undefined,
      tags: searchParams.getAll('tags').filter(Boolean),
      username: searchParams.get('username') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || 20,
    });

    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || 'Invalid input', 400);

    const { q, eventName, tags, username, dateFrom, dateTo, cursor, limit } = parsed.data;
    const session = await getSession();

    const eventFilter: Record<string, unknown> = {};
    if (session?.user?.role && ['ADMIN', 'PHOTOGRAPHER', 'MEMBER'].includes(session.user.role)) {
      // can see all events they have access to
    } else {
      eventFilter.isPublic = true;
    }

    if (eventName || q) {
      eventFilter.name = { contains: eventName || q };
    }

    const mediaWhere: Record<string, unknown> = {
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo) } : {}),
            },
          }
        : {}),
      ...(username
        ? { uploadedBy: { name: { contains: username } } }
        : {}),
      event: eventFilter,
    };

    if (q && !eventName) {
      mediaWhere.OR = [
        { event: { name: { contains: q } } },
      ];
    }

    const media = await prisma.media.findMany({
      where: mediaWhere,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
        event: { select: { id: true, name: true, isPublic: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    const requiredTags = [...(tags ?? []), ...(q && !eventName ? [q] : [])];
    const filteredMedia = requiredTags.length
      ? media.filter((item) => mediaHasAnyTag(item.tags, requiredTags))
      : media;

    const hasMore = filteredMedia.length > limit;
    const items = hasMore ? filteredMedia.slice(0, limit) : filteredMedia;
    const nextCursor = hasMore ? items[items.length - 1]?.createdAt.toISOString() : null;

    return apiSuccess({ items, nextCursor });
  } catch (err) {
    console.error('GET /api/search error:', err);
    return apiError('Search failed', 500);
  }
}

