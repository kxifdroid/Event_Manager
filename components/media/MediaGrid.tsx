'use client';

import { useEffect, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import Masonry from 'react-masonry-css';
import { MediaCard } from '@/components/media/MediaCard';
import { LightboxModal } from '@/components/media/LightboxModal';
import { Skeleton } from '@/components/ui/skeleton';

type MediaItem = {
  id: string;
  thumbnailUrl: string | null;
  url: string;
  type: string;
  tags: string[];
  _count?: { likes: number; comments: number };
  likes?: { id: string }[];
  favourites?: { id: string }[];
};

export function MediaGrid({ albumId, eventId }: { albumId?: string; eventId?: string }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { ref, inView } = useInView();

  const fetchMedia = useCallback(
    async (nextCursor?: string | null) => {
      const params = new URLSearchParams();
      if (albumId) params.set('albumId', albumId);
      if (eventId) params.set('eventId', eventId);
      if (nextCursor) params.set('cursor', nextCursor);
      params.set('limit', '20');

      const res = await fetch(`/api/media?${params}`);
      const json = await res.json();
      if (json.data) {
        setItems((prev) => (nextCursor ? [...prev, ...json.data.items] : json.data.items));
        setCursor(json.data.nextCursor);
        setHasMore(!!json.data.nextCursor);
      }
      setLoading(false);
    },
    [albumId, eventId],
  );

  useEffect(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setLoading(true);
    fetchMedia();
  }, [fetchMedia]);

  useEffect(() => {
    if (inView && hasMore && !loading && cursor) {
      fetchMedia(cursor);
    }
  }, [inView, hasMore, loading, cursor, fetchMedia]);

  if (loading && items.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p>No media yet. Upload photos to get started.</p>
      </div>
    );
  }

  return (
    <>
      <Masonry
        breakpointCols={{ default: 4, 1100: 3, 700: 2, 500: 2 }}
        className="flex w-auto gap-3"
        columnClassName="bg-clip-padding space-y-3"
      >
        {items.map((item, index) => (
          <MediaCard key={item.id} media={item} onClick={() => setLightboxIndex(index)} />
        ))}
      </Masonry>

      {hasMore && (
        <div ref={ref} className="flex justify-center py-8">
          <Skeleton className="h-8 w-32" />
        </div>
      )}

      {lightboxIndex !== null && (
        <LightboxModal
          items={items}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
