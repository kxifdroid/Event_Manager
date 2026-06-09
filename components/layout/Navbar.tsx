'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-background/80 px-4 pl-16 backdrop-blur-md lg:pl-72 lg:pr-8">
      <div className="flex items-center gap-2">
        {session?.user?.role && (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {session.user.role}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        {session ? (
          <>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-white/5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || undefined} />
                    <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm md:inline">{session.user.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button asChild size="sm">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
