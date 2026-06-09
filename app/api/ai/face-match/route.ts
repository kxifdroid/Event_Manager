export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import {
  euclideanDistance,
  distanceToConfidence,
  FACE_MATCH_THRESHOLD,
} from '@/lib/face-match';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.faceDescriptor) {
      return apiError('Upload a selfie on your profile first', 400);
    }

    const userDescriptor = user.faceDescriptor as number[];

    const allMedia = await prisma.media.findMany({
      where: { type: 'PHOTO', NOT: { faceDescriptor: { equals: Prisma.DbNull } } },
      include: {
        event: { select: { id: true, name: true, isPublic: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    const matches: Array<{
      media: (typeof allMedia)[0];
      distance: number;
      confidence: number;
    }> = [];

    for (const media of allMedia) {
      const descriptor = media.faceDescriptor as number[];
      const distance = euclideanDistance(userDescriptor, descriptor);
      if (distance < FACE_MATCH_THRESHOLD) {
        matches.push({
          media,
          distance,
          confidence: distanceToConfidence(distance),
        });
      }
    }

    matches.sort((a, b) => a.distance - b.distance);

    await Promise.all(
      matches.map((m) =>
        prisma.faceMatch.upsert({
          where: { userId_mediaId: { userId: session.user!.id, mediaId: m.media.id } },
          create: {
            userId: session.user!.id,
            mediaId: m.media.id,
            confidence: m.confidence,
          },
          update: { confidence: m.confidence },
        }),
      ),
    );

    return apiSuccess({
      matches: matches.map((m) => ({
        ...m.media,
        matchConfidence: m.confidence,
        matchDistance: m.distance,
      })),
      count: matches.length,
    });
  } catch (err) {
    console.error('POST /api/ai/face-match error:', err);
    return apiError('Face match failed', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);

    const { faceDescriptor } = await req.json();
    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return apiError('Invalid face descriptor (expected 128-dim array)', 400);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { faceDescriptor },
    });

    return apiSuccess({ saved: true });
  } catch (err) {
    console.error('PUT /api/ai/face-match error:', err);
    return apiError('Failed to save face descriptor', 500);
  }
}

