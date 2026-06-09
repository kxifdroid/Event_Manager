'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar, ImageIcon, Bell } from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState<{
    users: number;
    events: number;
    media: number;
    notifications: number;
    usersByRole: { role: string; _count: number }[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setStats(json.data);
      });
  }, []);

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading mb-6 text-3xl font-bold">Admin Dashboard</h1>

      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: 'Users', value: stats.users },
          { icon: Calendar, label: 'Events', value: stats.events },
          { icon: ImageIcon, label: 'Media', value: stats.media },
          { icon: Bell, label: 'Notifications', value: stats.notifications },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-4">
            {stats.usersByRole.map((r) => (
              <div key={r.role} className="rounded-lg bg-white/5 p-4 text-center">
                <p className="text-2xl font-bold">{r._count}</p>
                <p className="text-sm text-muted-foreground">{r.role}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
