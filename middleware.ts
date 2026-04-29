import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Don't intercept API routes, static files, or files with extensions
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // For all other routes, try to serve the .html version
  // This handles the case where static prerendered pages exist as .html
  // but Next.js routing is trying to serve them without the extension
  const htmlPath = pathname.endsWith('/')
    ? pathname.slice(0, -1) + '.html'
    : pathname + '.html';

  const htmlUrl = new URL(htmlPath, request.url);
  return NextResponse.rewrite(htmlUrl);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
