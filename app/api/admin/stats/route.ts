export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);
    if (session.user.role !== Role.ADMIN) return apiError('Forbidden', 403);

    const [users, events, media, notifications] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.media.count(),
      prisma.notification.count(),
    ]);

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    return apiSuccess({ users, events, media, notifications, usersByRole });
  } catch (err) {
    console.error('GET /api/admin/stats error:', err);
    return apiError('Failed to fetch stats', 500);
  }
}

