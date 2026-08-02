import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/whatsapp',
  '/chats',
  '/contacts',
  '/send',
  '/docs',
  '/logs',
  '/settings',
];

// Routes only for unauthenticated users
const AUTH_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('wa_token')?.value;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);

  // Not logged in → trying to access protected page → redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname); // Remember where they were going
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in → trying to access /login → redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static assets, API routes, and Next internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
