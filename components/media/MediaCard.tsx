'use client';

import Image from 'next/image';
import { Heart, MessageCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type MediaCardProps = {
  media: {
    id: string;
    thumbnailUrl: string | null;
    url: string;
    type: string;
    tags: string[];
    _count?: { likes: number; comments: number };
    likes?: { id: string }[];
    favourites?: { id: string }[];
  };
  onClick?: () => void;
  className?: string;
};

export function MediaCard({ media, onClick, className }: MediaCardProps) {
  const isLiked = media.likes && media.likes.length > 0;
  const isFavourited = media.favourites && media.favourites.length > 0;
  const src = media.thumbnailUrl || media.url;

  return (
    <div
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg bg-white/5',
        className,
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {media.type === 'VIDEO' ? (
        <video src={src} className="aspect-square w-full object-cover" muted />
      ) : (
        <div className="relative aspect-square w-full">
          <Image src={src} alt="" fill className="object-cover transition-transform group-hover:scale-105" sizes="300px" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex gap-3">
          <span className={cn('flex items-center gap-1', isLiked && 'text-coral')}>
            <Heart className="h-3 w-3" fill={isLiked ? 'currentColor' : 'none'} />
            {media._count?.likes ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {media._count?.comments ?? 0}
          </span>
        </div>
        {isFavourited && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
      </div>
    </div>
  );
}
