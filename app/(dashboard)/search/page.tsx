'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { MediaCard } from '@/components/media/MediaCard';
import { LightboxModal } from '@/components/media/LightboxModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [filters, setFilters] = useState({
    q: '',
    eventName: '',
    username: '',
    dateFrom: '',
    dateTo: '',
    tags: '',
  });
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { ref, inView } = useInView();

  const search = useCallback(
    async (nextCursor?: string | null) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.eventName) params.set('eventName', filters.eventName);
      if (filters.username) params.set('username', filters.username);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.tags) filters.tags.split(',').forEach((t) => params.append('tags', t.trim()));
      if (nextCursor) params.set('cursor', nextCursor);

      const res = await fetch(`/api/search?${params}`);
      const json = await res.json();
      if (json.data) {
        setItems((prev: typeof items) => (nextCursor ? [...prev, ...json.data.items] : json.data.items));
        setCursor(json.data.nextCursor);
        setHasMore(!!json.data.nextCursor);
      }
      setLoading(false);
    },
    [filters],
  );

  useEffect(() => {
    if (inView && hasMore && cursor && !loading) search(cursor);
  }, [inView, hasMore, cursor, loading, search]);

  return (
    <div>
      <h1 className="font-heading mb-6 text-3xl font-bold">Search Media</h1>

      <div className="glass-card mb-8 grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Search</Label>
          <Input
            placeholder="Keywords, tags..."
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
        </div>
        <div>
          <Label>Event Name</Label>
          <Input
            value={filters.eventName}
            onChange={(e) => setFilters({ ...filters, eventName: e.target.value })}
          />
        </div>
        <div>
          <Label>Username</Label>
          <Input
            value={filters.username}
            onChange={(e) => setFilters({ ...filters, username: e.target.value })}
          />
        </div>
        <div>
          <Label>Tags (comma-separated)</Label>
          <Input
            value={filters.tags}
            onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
            placeholder="celebration, crowd"
          />
        </div>
        <div>
          <Label>From Date</Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </div>
        <div>
          <Label>To Date</Label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <Button onClick={() => search()} disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      <ErrorBoundary>
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No results. Try adjusting filters.</p>
        ) : (
          <>
            <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
              {items.map((item: { id: string }, index: number) => (
                <div key={item.id} className="mb-3 break-inside-avoid">
                  <MediaCard
                    media={item as Parameters<typeof MediaCard>[0]['media']}
                    onClick={() => setLightboxIndex(index)}
                  />
                </div>
              ))}
            </div>
            {hasMore && (
              <div ref={ref} className="flex justify-center py-8">
                <Skeleton className="h-8 w-32" />
              </div>
            )}
          </>
        )}
      </ErrorBoundary>

      {lightboxIndex !== null && (
        <LightboxModal
          items={items as Parameters<typeof LightboxModal>[0]['items']}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
