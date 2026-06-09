'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { NotificationList } from '@/components/notifications/NotificationList';
import { createPusherClient } from '@/lib/pusher';

type Notification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  relatedMediaId: string | null;
  createdAt: string;
  trigger?: { name: string; avatarUrl: string | null };
};

export function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch('/api/notifications');
    const json = await res.json();
    if (json.data) {
      setNotifications(json.data.notifications);
      setUnreadCount(json.data.unreadCount);
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchNotifications();

    const pusher = createPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(`private-user-${session.user.id}`);
    channel.bind('notification', (data: { notification: Notification; unreadCount: number }) => {
      setNotifications((prev) => [data.notification, ...prev].slice(0, 20));
      setUnreadCount(data.unreadCount);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-user-${session.user.id}`);
    };
  }, [session?.user?.id, fetchNotifications]);

  const markAsRead = async (id?: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { notificationId: id } : { markAllRead: true }),
    });
    fetchNotifications();
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-coral text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80">
            <NotificationList
              notifications={notifications}
              onMarkRead={markAsRead}
              onClose={() => setOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
