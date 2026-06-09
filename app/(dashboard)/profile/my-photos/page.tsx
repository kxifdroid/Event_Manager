'use client';

import { useState } from 'react';
import Masonry from 'react-masonry-css';
import dynamic from 'next/dynamic';

const FaceCapture = dynamic(() => import('@/components/face/FaceCapture').then((m) => m.FaceCapture), {
  ssr: false,
  loading: () => <div className="glass-card h-32 animate-pulse rounded-xl" />,
});
import { MediaCard } from '@/components/media/MediaCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { toast } from '@/components/ui/use-toast';
import { Sparkles } from 'lucide-react';

export default function MyPhotosPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const findPhotos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/face-match', { method: 'POST' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setMatches(json.data.matches);
      setSearched(true);
      toast({ title: `Found ${json.data.count} matching photos` });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-heading mb-2 text-3xl font-bold">My Photos</h1>
      <p className="mb-6 text-muted-foreground">
        Facial recognition matches photos across all club events
      </p>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <FaceCapture onSaved={() => setSearched(false)} />
        <div className="glass-card flex flex-col items-center justify-center p-6">
          <Sparkles className="mb-4 h-12 w-12 text-accent" />
          <p className="mb-4 text-center text-sm text-muted-foreground">
            After saving your selfie, run face matching to find all photos you appear in.
          </p>
          <Button onClick={findPhotos} disabled={loading}>
            {loading ? 'Matching...' : 'Find My Photos'}
          </Button>
        </div>
      </div>

      <ErrorBoundary>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : searched && matches.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No matches found. Try uploading a clearer selfie.
          </p>
        ) : matches.length > 0 ? (
          <Masonry
            breakpointCols={{ default: 4, 1100: 3, 700: 2 }}
            className="flex w-auto gap-3"
            columnClassName="space-y-3"
          >
            {matches.map((m: { id: string }) => (
              <MediaCard key={m.id} media={m as Parameters<typeof MediaCard>[0]['media']} />
            ))}
          </Masonry>
        ) : null}
      </ErrorBoundary>
    </div>
  );
}
