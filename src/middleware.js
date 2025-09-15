import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';

export async function middleware(req) {
  const token = cookies().get('auth_token')?.value;
  const { pathname } = req.nextUrl;

  // Allow requests for API routes, static files, and the login page to pass through
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname === '/login') {
    return NextResponse.next();
  }

  if (!token) {
    // If no token and not on the login page, redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    // JWT_SECRET should be in your .env.local file
    const jwtSecret = process.env.JWT_SECRET || 'a-very-strong-secret-key-for-development';
    const secret = new TextEncoder().encode(jwtSecret);

    // Using jose for verification as it's recommended for Edge environments like middleware
    await jose.jwtVerify(token, secret);

    // If token is valid, allow the request to continue
    return NextResponse.next();
  } catch (error) {
    // If token verification fails, redirect to login
    console.error('Middleware JWT verification error:', error.code);
    const response = NextResponse.redirect(new URL('/login', req.url));
    // Clear the invalid cookie
    response.cookies.delete('auth_token');
    return response;
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login page itself
     * - / (root redirects to /login, so no need to protect)
     */
    '/((?!_next/static|_next/image|favicon.ico|login|\\/).*)',
  ],
}
