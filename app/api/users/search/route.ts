export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);

    const q = new URL(req.url).searchParams.get('q') || '';
    if (q.length < 1) return apiSuccess([]);

    const users = await prisma.user.findMany({
      where: { name: { contains: q } },
      take: 10,
      select: { id: true, name: true, avatarUrl: true, email: true },
    });

    return apiSuccess(users);
  } catch (err) {
    console.error('GET /api/users/search error:', err);
    return apiError('User search failed', 500);
  }
}

