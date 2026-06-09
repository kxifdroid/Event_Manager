export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);

    const favourites = await prisma.favourite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          include: {
            event: { select: { id: true, name: true } },
            uploadedBy: { select: { id: true, name: true } },
            _count: { select: { likes: true } },
          },
        },
      },
    });

    return apiSuccess(favourites.map((f) => f.media));
  } catch (err) {
    console.error('GET /api/profile/favourites error:', err);
    return apiError('Failed to fetch favourites', 500);
  }
}

