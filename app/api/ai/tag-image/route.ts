export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import { detectLabels } from '@/lib/vision';

const schema = z.object({
  mediaId: z.string().cuid(),
  imageBase64: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0]?.message || 'Invalid input', 400);

    const media = await prisma.media.findUnique({ where: { id: parsed.data.mediaId } });
    if (!media) return apiError('Media not found', 404);

    let buffer: Buffer;
    if (parsed.data.imageBase64) {
      buffer = Buffer.from(parsed.data.imageBase64, 'base64');
    } else if (media.url.startsWith('http')) {
      const res = await fetch(media.url);
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      return apiError('imageBase64 required for private media', 400);
    }

    const labels = await detectLabels(buffer);
    const tags = labels.map((l) => l.description.toLowerCase());

    const updated = await prisma.media.update({
      where: { id: media.id },
      data: { tags },
    });

    return apiSuccess({ tags: updated.tags, labels });
  } catch (err) {
    console.error('POST /api/ai/tag-image error:', err);
    return apiError('Tagging failed', 500);
  }
}

