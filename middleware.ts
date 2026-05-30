import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default-super-secret-key-change-in-production'
);

export async function middleware(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Jika request ke API v1 dan bukan auth routes
  if (request.nextUrl.pathname.startsWith('/api/v1') && !request.nextUrl.pathname.startsWith('/api/v1/auth')) {
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Token tidak ditemukan' },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // Kloning request headers dan sisipkan userId, orgId, role
      const requestHeaders = new Headers(request.headers);
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

// Cocokkan semua path API yang dilindungi
export const config = {
  matcher: [
    '/api/v1/cycles',
    '/api/v1/cycles/:path*',
    '/api/v1/onboarding',
    '/api/v1/onboarding/:path*',
    '/api/v1/ai',
    '/api/v1/ai/:path*',
    '/api/v1/profile',
    '/api/v1/profile/:path*',
    '/api/v1/team',
    '/api/v1/team/:path*',
    '/api/v1/billing/:path*',
  ],
};

