import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, ImageIcon, Users, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-16 text-center">
          <h1 className="font-heading mb-4 text-5xl font-bold tracking-tight md:text-6xl">
            <span className="text-accent">Club</span>Media
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            The all-in-one event & media management platform for college clubs. Upload, tag, share, and discover
            memories with AI-powered search and facial recognition.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/events">Browse Events</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Calendar, title: 'Event Management', desc: 'Organize cultural fests, sports days, and workshops' },
            { icon: ImageIcon, title: 'Media Galleries', desc: 'Bulk upload with AI auto-tagging and thumbnails' },
            { icon: Users, title: 'Social Features', desc: 'Like, comment, favourite, and tag club members' },
            { icon: Sparkles, title: 'AI Powered', desc: 'Face matching and smart search across all media' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-6">
              <Icon className="mb-3 h-8 w-8 text-accent" />
              <h3 className="font-heading mb-1 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
