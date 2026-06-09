'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AlbumCreateForm } from '@/components/events/AlbumCreateForm';
import { useSession } from 'next-auth/react';
import { ImageIcon, FolderOpen } from 'lucide-react';

type Album = {
  id: string;
  name: string;
  description: string | null;
  _count: { media: number };
  media: { thumbnailUrl: string | null; url: string }[];
};

type Event = {
  id: string;
  name: string;
  description: string;
  category: string;
  date: string;
  coverImageUrl: string | null;
  isPublic: boolean;
  albums: Album[];
};

export default function EventDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const canCreateAlbum =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'PHOTOGRAPHER';
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setEvent(json.data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (!event) return <p className="py-16 text-center text-muted-foreground">Event not found</p>;

  return (
    <div>
      <div className="relative mb-8 aspect-[21/9] overflow-hidden rounded-xl bg-white/5">
        {event.coverImageUrl ? (
          <Image src={event.coverImageUrl} alt={event.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <div className="mb-2 flex gap-2">
            <Badge>{event.category}</Badge>
            <Badge variant="outline">{event.isPublic ? 'Public' : 'Private'}</Badge>
          </div>
          <h1 className="font-heading text-4xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">{formatDate(event.date)}</p>
        </div>
      </div>

      <p className="mb-8 max-w-3xl text-muted-foreground">{event.description}</p>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold">Albums</h2>
        {canCreateAlbum && <AlbumCreateForm eventId={params.id as string} />}
      </div>
      <ErrorBoundary>
        {event.albums.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No albums yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {event.albums.map((album) => (
              <Link
                key={album.id}
                href={`/events/${event.id}/albums/${album.id}`}
                className="glass-card group overflow-hidden transition-transform hover:scale-[1.02]"
              >
                <div className="relative aspect-video bg-white/5">
                  {album.media[0] ? (
                    <Image
                      src={album.media[0].thumbnailUrl || album.media[0].url}
                      alt={album.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FolderOpen className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{album.name}</h3>
                  {album.description && (
                    <p className="line-clamp-1 text-sm text-muted-foreground">{album.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{album._count.media} items</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}
