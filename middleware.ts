import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (path.startsWith('/profile/my-photos') && !token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        const publicPaths = ['/login', '/register', '/', '/search'];
        const publicEventPaths =
          path === '/events' ||
          /^\/events\/[^/]+$/.test(path) ||
          /^\/events\/[^/]+\/albums\/[^/]+$/.test(path);

        if (publicPaths.includes(path)) return true;
        if (publicEventPaths) return true;

        const protectedPrefixes = ['/dashboard', '/profile', '/admin'];
        const needsAuth = protectedPrefixes.some((p) => path.startsWith(p));

        if (path === '/events/new') return !!token;
        if (needsAuth) return !!token;
        return true;
      },
    },
  },
);

export const config = {
  matcher: ['/dashboard/:path*', '/events/:path*', '/profile/:path*', '/admin/:path*', '/search'],
};
