import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ImageIcon, Lock, Globe } from 'lucide-react';

type EventCardProps = {
  event: {
    id: string;
    name: string;
    description: string;
    category: string;
    date: string;
    coverImageUrl: string | null;
    isPublic: boolean;
    _count?: { albums: number; media: number };
  };
};

export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`}>
      <Card className="group overflow-hidden transition-transform hover:scale-[1.02]">
        <div className="relative aspect-video overflow-hidden bg-white/5">
          {event.coverImageUrl ? (
            <Image
              src={event.coverImageUrl}
              alt={event.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute right-2 top-2">
            {event.isPublic ? (
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3 w-3" /> Public
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" /> Private
              </Badge>
            )}
          </div>
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-lg">{event.name}</CardTitle>
            <Badge variant="outline">{event.category}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(event.date)}
            </span>
            {event._count && (
              <span className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {event._count.media} photos
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
