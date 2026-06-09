'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export function AlbumCreateForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, name }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast({ title: 'Album created' });
      setOpen(false);
      setName('');
      router.refresh();
      window.location.reload();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        + New Album
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card flex flex-wrap items-end gap-3 p-4">
      <div className="flex-1">
        <Label htmlFor="albumName">Album Name</Label>
        <Input id="albumName" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading}>
        Create
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
