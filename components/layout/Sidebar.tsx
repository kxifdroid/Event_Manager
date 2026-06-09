'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Calendar,
  Search,
  User,
  Shield,
  ImageIcon,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/profile/my-photos', label: 'My Photos', icon: ImageIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const navLinks = [
    ...links,
    ...(session?.user?.role === 'ADMIN'
      ? [{ href: '/admin', label: 'Admin', icon: Shield }]
      : []),
  ];

  const NavContent = () => (
    <nav className="flex flex-col gap-1 p-4">
      <div className="mb-6 px-2">
        <h1 className="font-heading text-xl font-bold text-accent">ClubMedia</h1>
        <p className="text-xs text-muted-foreground">Event & Media Platform</p>
      </div>
      {navLinks.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
            pathname === href || pathname.startsWith(href + '/')
              ? 'bg-accent/20 text-accent'
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-64 border-r border-white/5 bg-surface transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
