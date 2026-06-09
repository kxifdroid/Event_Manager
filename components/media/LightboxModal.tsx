'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Share2,
  Download,
  Tag,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { formatRelativeTime } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type MediaItem = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  type: string;
  tags: string[];
  _count?: { likes: number; comments: number };
  likes?: { id: string }[];
  favourites?: { id: string }[];
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; avatarUrl: string | null };
};

export function LightboxModal({
  items,
  initialIndex,
  onClose,
  onNavigate,
}: {
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const { data: session } = useSession();
  const [index, setIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favourited, setFavourited] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagUsername, setTagUsername] = useState('');

  const media = items[index];

  const loadMediaDetails = useCallback(async () => {
    if (!media) return;
    const res = await fetch(`/api/media/${media.id}`);
    const json = await res.json();
    if (json.data) {
      setLikeCount(json.data._count?.likes ?? 0);
      setLiked(
        json.data.likes?.some((l: { userId: string }) => l.userId === session?.user?.id) ??
          (media.likes?.length ?? 0) > 0,
      );
      setFavourited((media.favourites?.length ?? 0) > 0);
      setComments(json.data.comments ?? []);
    }
  }, [media, session?.user?.id]);

  useEffect(() => {
    loadMediaDetails();
  }, [loadMediaDetails]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) {
        const next = index - 1;
        setIndex(next);
        onNavigate(next);
      }
      if (e.key === 'ArrowRight' && index < items.length - 1) {
        const next = index + 1;
        setIndex(next);
        onNavigate(next);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, items.length, onClose, onNavigate]);

  const toggleLike = async () => {
    const res = await fetch(`/api/media/${media.id}/like`, { method: 'POST' });
    const json = await res.json();
    if (json.data) {
      setLiked(json.data.liked);
      setLikeCount(json.data.count);
    }
  };

  const toggleFavourite = async () => {
    const res = await fetch(`/api/media/${media.id}/favourite`, { method: 'POST' });
    const json = await res.json();
    if (json.data) setFavourited(json.data.favourited);
  };

  const shareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/events?media=${media.id}`);
    toast({ title: 'Link copied to clipboard' });
  };

  const downloadMedia = () => {
    window.open(`/api/media/${media.id}/download`, '_blank');
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    const res = await fetch(`/api/media/${media.id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: commentText }),
    });
    const json = await res.json();
    if (json.data) {
      setComments([json.data, ...comments]);
      setCommentText('');
    }
  };

  const deleteComment = async (commentId: string) => {
    await fetch(`/api/media/${media.id}/comment?commentId=${commentId}`, { method: 'DELETE' });
    setComments(comments.filter((c) => c.id !== commentId));
  };

  const submitTag = async () => {
    const res = await fetch(`/api/media/${media.id}/tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: tagUsername }),
    });
    const json = await res.json();
    if (json.error) {
      toast({ title: 'Error', description: json.error, variant: 'destructive' });
    } else {
      toast({ title: 'User tagged' });
      setTagModalOpen(false);
      setTagUsername('');
    }
  };

  if (!media) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/95">
      <Button variant="ghost" size="icon" className="absolute right-4 top-4 z-10" onClick={onClose}>
        <X className="h-6 w-6" />
      </Button>

      <div className="relative flex flex-1 items-center justify-center p-4">
        {index > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4"
            onClick={() => {
              const next = index - 1;
              setIndex(next);
              onNavigate(next);
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}

        {media.type === 'VIDEO' ? (
          <video src={media.url} controls className="max-h-[85vh] max-w-full" />
        ) : (
          <div className="relative max-h-[85vh] max-w-full">
            <Image
              src={media.url}
              alt=""
              width={1200}
              height={800}
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        )}

        {index < items.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 md:right-80"
            onClick={() => {
              const next = index + 1;
              setIndex(next);
              onNavigate(next);
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}
      </div>

      <div className="hidden w-80 flex-col border-l border-white/10 bg-surface p-4 md:flex">
        <div className="mb-4 flex gap-2">
          <Button variant={liked ? 'destructive' : 'outline'} size="sm" onClick={toggleLike}>
            <Heart className="mr-1 h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
            {likeCount}
          </Button>
          <Button variant={favourited ? 'default' : 'outline'} size="sm" onClick={toggleFavourite}>
            <Star className="mr-1 h-4 w-4" fill={favourited ? 'currentColor' : 'none'} />
          </Button>
          <Button variant="outline" size="sm" onClick={shareLink}>
            <Share2 className="h-4 w-4" />
          </Button>
          {session && (
            <>
              <Button variant="outline" size="sm" onClick={downloadMedia}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTagModalOpen(true)}>
                <Tag className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {media.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {media.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <h4 className="mb-2 flex items-center gap-1 text-sm font-semibold">
            <MessageCircle className="h-4 w-4" /> Comments
          </h4>
          {session && (
            <div className="mb-3 flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              />
              <Button size="sm" onClick={submitComment}>
                Post
              </Button>
            </div>
          )}
          {comments.map((c) => (
            <div key={c.id} className="mb-3 rounded-lg bg-white/5 p-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{c.user.name}</span>
                {session?.user?.id === c.user.id && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteComment(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{c.content}</p>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(c.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={tagModalOpen} onOpenChange={setTagModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag a user</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="@username"
            value={tagUsername}
            onChange={(e) => setTagUsername(e.target.value)}
          />
          <Button onClick={submitTag}>Tag User</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
