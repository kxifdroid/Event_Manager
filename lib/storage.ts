import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';

const uploadRoot = path.join(process.cwd(), 'public', 'uploads');
const publicPrefix = '/uploads/';

function normalizeKey(keyOrUrl: string) {
  const rawKey = keyOrUrl.startsWith(publicPrefix)
    ? keyOrUrl.slice(publicPrefix.length)
    : keyOrUrl;

  const normalized = rawKey.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..')) {
    throw new Error('Invalid storage key');
  }

  return normalized;
}

function getStoragePath(keyOrUrl: string) {
  const key = normalizeKey(keyOrUrl);
  const filePath = path.join(uploadRoot, ...key.split('/'));

  if (!filePath.startsWith(uploadRoot)) {
    throw new Error('Invalid storage path');
  }

  return { key, filePath };
}

export async function uploadToLocalStorage(key: string, body: Buffer) {
  const storage = getStoragePath(key);
  await mkdir(path.dirname(storage.filePath), { recursive: true });
  await writeFile(storage.filePath, body);

  return {
    key: storage.key,
    url: `${publicPrefix}${storage.key}`,
  };
}

export async function deleteFromLocalStorage(keyOrUrl: string) {
  try {
    const { filePath } = getStoragePath(keyOrUrl);
    await unlink(filePath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw err;
  }
}

export async function getLocalObjectBuffer(keyOrUrl: string): Promise<Buffer> {
  const { filePath } = getStoragePath(keyOrUrl);
  return readFile(filePath);
}

export function buildMediaKey(eventId: string, albumId: string, filename: string) {
  return `events/${eventId}/albums/${albumId}/${filename}`;
}

export function buildThumbnailKey(eventId: string, albumId: string, filename: string) {
  return `events/${eventId}/albums/${albumId}/thumb_${filename}`;
}
