'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const FaceCapture = dynamic(() => import('@/components/face/FaceCapture').then((m) => m.FaceCapture), {
  ssr: false,
  loading: () => <div className="glass-card h-32 animate-pulse rounded-xl" />,
});
import { MediaCard } from '@/components/media/MediaCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ImageIcon } from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [favourites, setFavourites] = useState([]);

  useEffect(() => {
    fetch('/api/profile/favourites')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setFavourites(json.data);
      });
  }, []);

  if (!session) return null;

  return (
    <div>
      <div className="glass-card mb-8 flex items-center gap-6 p-6">
        <Avatar className="h-20 w-20">
          <AvatarImage src={session.user.image || undefined} />
          <AvatarFallback className="text-2xl">{session.user.name?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-2xl font-bold">{session.user.name}</h1>
          <p className="text-muted-foreground">{session.user.email}</p>
          <Badge className="mt-2">{session.user.role}</Badge>
        </div>
        <div className="ml-auto">
          <Button asChild variant="outline">
            <Link href="/profile/my-photos">
              <ImageIcon className="mr-2 h-4 w-4" />
              My Photos
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <FaceCapture />
      </div>

      <h2 className="font-heading mb-4 text-xl font-semibold">Favourites</h2>
      <ErrorBoundary>
        {favourites.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No favourites yet. Star photos to save them here.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {favourites.map((m: { id: string }) => (
              <MediaCard key={m.id} media={m as Parameters<typeof MediaCard>[0]['media']} />
            ))}
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}
