'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { EventCard } from '@/components/events/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Plus } from 'lucide-react';

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('desc');

  const canCreate =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'PHOTOGRAPHER';

  useEffect(() => {
    setLoading(true);
    fetch(`/api/events?sortBy=${sortBy}&order=${order}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setEvents(json.data);
        setLoading(false);
      });
  }, [sortBy, order]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Browse and manage club events</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
          <Select value={order} onValueChange={setOrder}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Desc</SelectItem>
              <SelectItem value="asc">Asc</SelectItem>
            </SelectContent>
          </Select>
          {canCreate && (
            <Button asChild>
              <Link href="/events/new">
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Link>
            </Button>
          )}
        </div>
      </div>

      <ErrorBoundary>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No events found.</p>
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
