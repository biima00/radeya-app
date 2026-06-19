import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('FATAL: NEXTAUTH_SECRET environment variable is not set. Server cannot start without a secure JWT secret.');
}
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function middleware(request: NextRequest) {
  // Baca token: prioritas httpOnly cookie, fallback ke Authorization header
  let token = request.cookies.get('radeya_token')?.value || '';
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (
    request.nextUrl.pathname.startsWith('/api/v1') &&
    !request.nextUrl.pathname.startsWith('/api/v1/auth') &&
    !request.nextUrl.pathname.startsWith('/api/v1/billing/webhook')
  ) {
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Token tidak ditemukan' },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      const requestHeaders = new Headers(request.headers);
      requestHeaders.delete('x-user-id');
      requestHeaders.delete('x-org-id');
      requestHeaders.delete('x-role');

      if (payload.userId) requestHeaders.set('x-user-id', payload.userId as string);
      if (payload.orgId) requestHeaders.set('x-org-id', payload.orgId as string);
      if (payload.role) requestHeaders.set('x-role', payload.role as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('Middleware JWT Verification Error:', error);
      return NextResponse.json(
        { error: 'Unauthorized: Token tidak valid atau kedaluwarsa' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/v1/:path*'],
};
