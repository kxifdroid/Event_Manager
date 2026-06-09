'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { EventCard } from '@/components/events/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Calendar, ImageIcon, Heart } from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events?sortBy=date&order=desc')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setEvents(json.data.slice(0, 6));
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">
          Welcome{session?.user?.name ? `, ${session.user.name}` : ''}
        </h1>
        <p className="text-muted-foreground">Your club media hub at a glance</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Calendar, label: 'Events', href: '/events' },
          { icon: ImageIcon, label: 'Browse Media', href: '/search' },
          { icon: Heart, label: 'Favourites', href: '/profile' },
        ].map(({ icon: Icon, label, href }) => (
          <Link key={label} href={href} className="glass-card flex items-center gap-3 p-4 transition-colors hover:bg-white/5">
            <Icon className="h-8 w-8 text-accent" />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold">Recent Events</h2>
        <Button asChild variant="outline" size="sm">
          <Link href="/events">View all</Link>
        </Button>
      </div>

      <ErrorBoundary>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No events yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event: { id: string }) => (
              <EventCard key={event.id} event={event as Parameters<typeof EventCard>[0]['event']} />
            ))}
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}
