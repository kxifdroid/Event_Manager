export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { getSession } from '@/lib/auth';
import { canUpload } from '@/lib/auth';
import { uploadToLocalStorage, buildMediaKey, buildThumbnailKey } from '@/lib/storage';
import { compressImage, generateThumbnail } from '@/lib/image-processing';
import { detectLabels } from '@/lib/vision';
import { computePerceptualHash, similarityPercent } from '@/lib/phash';
import { createAndPushNotification } from '@/lib/notifications';
import { MediaType, Role } from '@prisma/client';

const MAX_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
  'video/quicktime',
];

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return apiError('Unauthorized', 401);
    if (!canUpload(session.user.role as Role)) return apiError('Forbidden', 403);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const albumId = formData.get('albumId') as string;
    const eventId = formData.get('eventId') as string;
    const faceDescriptorRaw = formData.get('faceDescriptor') as string | null;

    if (!file || !albumId || !eventId) return apiError('file, albumId, eventId required', 400);
    if (file.size > MAX_SIZE) return apiError('File exceeds 100MB limit', 400);
    if (!ALLOWED_TYPES.includes(file.type)) return apiError('Unsupported file type', 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type.startsWith('video/')
      ? file.type === 'video/quicktime'
        ? 'mov'
        : 'mp4'
      : file.type === 'image/png'
        ? 'png'
        : file.type === 'image/gif'
          ? 'gif'
          : 'jpg';

    const filename = `${uuidv4()}.${ext}`;
    const isPhoto = file.type.startsWith('image/');
    const type = isPhoto ? MediaType.PHOTO : MediaType.VIDEO;

    let uploadBuffer: Buffer = buffer;
    let width: number | undefined;
    let height: number | undefined;
    let thumbnailBuffer: Buffer | null = null;
    let perceptualHash: string | undefined;
    let tags: string[] = [];
    let faceDescriptor: number[] | undefined;

    if (isPhoto) {
      const compressed = await compressImage(buffer);
      uploadBuffer = Buffer.from(compressed.buffer);
      width = compressed.width;
      height = compressed.height;
      thumbnailBuffer = await generateThumbnail(uploadBuffer);
      perceptualHash = await computePerceptualHash(uploadBuffer);

      const existing = await prisma.media.findMany({
        where: { eventId, perceptualHash: { not: null }, type: MediaType.PHOTO },
        select: { id: true, perceptualHash: true },
      });

      const duplicates = existing.filter(
        (m) => m.perceptualHash && similarityPercent(perceptualHash!, m.perceptualHash) > 90,
      );

      if (duplicates.length > 0) {
        return apiError('Possible duplicate detected (>90% similarity)', 409);
      }

      const labels = await detectLabels(uploadBuffer);
      tags = labels.map((l) => l.description.toLowerCase());

      if (faceDescriptorRaw) {
        try {
          faceDescriptor = JSON.parse(faceDescriptorRaw);
        } catch {
          console.error('Invalid faceDescriptor JSON on upload');
        }
      }
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });

    const mediaKey = buildMediaKey(eventId, albumId, filename);
    const { url } = await uploadToLocalStorage(mediaKey, uploadBuffer);

    let thumbnailUrl: string | undefined;
    if (thumbnailBuffer) {
      const thumbKey = buildThumbnailKey(eventId, albumId, `${uuidv4()}.jpg`);
      const thumb = await uploadToLocalStorage(thumbKey, thumbnailBuffer);
      thumbnailUrl = thumb.url;
    }

    const media = await prisma.media.create({
      data: {
        albumId,
        eventId,
        uploadedById: session.user.id,
        url,
        thumbnailUrl: thumbnailUrl || url,
        type,
        tags,
        size: uploadBuffer.length,
        width,
        height,
        perceptualHash,
        faceDescriptor: faceDescriptor ?? undefined,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    if (!event?.isPublic) {
      const members = await prisma.user.findMany({
        where: { role: { in: [Role.MEMBER, Role.PHOTOGRAPHER, Role.ADMIN] } },
        select: { id: true },
      });
      await Promise.all(
        members
          .filter((m) => m.id !== session.user!.id)
          .map((m) =>
            createAndPushNotification({
              userId: m.id,
              type: 'UPLOAD',
              message: `${session.user!.name} uploaded new media to ${event?.name}`,
              relatedMediaId: media.id,
              triggeredBy: session.user!.id,
            }),
          ),
      );
    }

    return apiSuccess(media, 201);
  } catch (err) {
    console.error('POST /api/media/upload error:', err);
    return apiError('Upload failed', 500);
  }
}

