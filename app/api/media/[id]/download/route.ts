export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import { getLocalObjectBuffer } from '@/lib/storage';
import { applyWatermark } from '@/lib/watermark';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Login required to download', 401);

    const media = await prisma.media.findUnique({
      where: { id: params.id },
      include: { event: { select: { name: true } } },
    });
    if (!media) return apiError('Media not found', 404);
    if (media.type !== 'PHOTO') return apiError('Only photos can be watermarked', 400);

    let imageBuffer: Buffer;
    if (media.url.startsWith('http')) {
      const res = await fetch(media.url);
      imageBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      imageBuffer = await getLocalObjectBuffer(media.url);
    }

    const clubName = process.env.CLUB_NAME || 'College Club';
    const watermarked = await applyWatermark(
      imageBuffer,
      clubName,
      media.event.name,
      session.user.role,
    );

    return new NextResponse(new Uint8Array(watermarked), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="media-${media.id}.jpg"`,
      },
    });
  } catch (err) {
    console.error('GET /api/media/[id]/download error:', err);
    return apiError('Download failed', 500);
  }
}

