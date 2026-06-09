'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { MediaGrid } from '@/components/media/MediaGrid';
import { UploadZone } from '@/components/media/UploadZone';
import { QRCodeModal } from '@/components/media/QRCodeModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ArrowLeft, QrCode } from 'lucide-react';

export default function AlbumPage() {
  const params = useParams();
  const { data: session } = useSession();
  const eventId = params.id as string;
  const albumId = params.albumId as string;
  const [album, setAlbum] = useState<{ name: string; description: string | null } | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const canUpload =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'PHOTOGRAPHER';

  useEffect(() => {
    fetch(`/api/albums/${albumId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setAlbum(json.data);
      });
  }, [albumId]);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/events/${eventId}/albums/${albumId}`
      : '';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            {album ? (
              <>
                <h1 className="font-heading text-2xl font-bold">{album.name}</h1>
                {album.description && (
                  <p className="text-sm text-muted-foreground">{album.description}</p>
                )}
              </>
            ) : (
              <Skeleton className="h-8 w-48" />
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            Share QR
          </Button>
          {canUpload && (
            <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
              {showUpload ? 'Hide Upload' : 'Upload Media'}
            </Button>
          )}
        </div>
      </div>

      {showUpload && canUpload && (
        <div className="mb-8">
          <UploadZone albumId={albumId} eventId={eventId} />
        </div>
      )}

      <ErrorBoundary>
        <MediaGrid albumId={albumId} eventId={eventId} />
      </ErrorBoundary>

      <QRCodeModal
        open={qrOpen}
        onOpenChange={setQrOpen}
        url={shareUrl}
        title={`Share: ${album?.name || 'Album'}`}
      />
    </div>
  );
}
