import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('FATAL: NEXTAUTH_SECRET environment variable is not set.');
}
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get('token');
    if (!token) {
      return NextResponse.redirect(new URL('/dashboard?verify=missing', req.url));
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.purpose !== 'email-verification') {
      return NextResponse.redirect(new URL('/dashboard?verify=invalid', req.url));
    }

    await prisma.user.update({
      where: { id: payload.userId as string },
      data: { emailVerified: true }
    });

    return NextResponse.redirect(new URL('/dashboard?verify=success', req.url));
  } catch (error: any) {
    console.error('Error verifying email:', error);
    return NextResponse.redirect(new URL('/dashboard?verify=invalid', req.url));
  }
}
