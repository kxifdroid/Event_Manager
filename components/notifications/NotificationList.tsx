'use client';

import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, MessageCircle, Tag, Upload } from 'lucide-react';

type Notification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  relatedMediaId: string | null;
  createdAt: string;
};

const icons: Record<string, React.ReactNode> = {
  LIKE: <Heart className="h-4 w-4 text-coral" />,
  COMMENT: <MessageCircle className="h-4 w-4 text-accent" />,
  TAG: <Tag className="h-4 w-4 text-accent" />,
  UPLOAD: <Upload className="h-4 w-4 text-accent" />,
};

export function NotificationList({
  notifications,
  onMarkRead,
  onClose,
}: {
  notifications: Notification[];
  onMarkRead: (id?: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 p-3">
        <h3 className="font-semibold">Notifications</h3>
        <Button variant="ghost" size="sm" onClick={() => onMarkRead()}>
          Mark all read
        </Button>
      </div>
      <ScrollArea className="h-80">
        {notifications.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <Link
              key={n.id}
              href={n.relatedMediaId ? `/events?media=${n.relatedMediaId}` : '#'}
              onClick={() => {
                if (!n.isRead) onMarkRead(n.id);
                onClose();
              }}
              className={`flex gap-3 border-b border-white/5 p-3 transition-colors hover:bg-white/5 ${!n.isRead ? 'bg-accent/5' : ''}`}
            >
              <div className="mt-0.5">{icons[n.type]}</div>
              <div className="flex-1">
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(n.createdAt)}</p>
              </div>
            </Link>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
