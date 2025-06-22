import { NextResponse, type NextRequest } from 'next/server';

// This middleware is currently disabled to prevent build and routing issues.
// All routes are publicly accessible.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
