import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('FATAL: NEXTAUTH_SECRET environment variable is not set.');
}
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(ip, 3, 15 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan kirim ulang. Coba lagi nanti.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
      );
    }

    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, emailVerified: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email sudah terverifikasi' }, { status: 200 });
    }

    const verifyToken = await new SignJWT({
      userId: user.id,
      purpose: 'email-verification'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/auth/verify-email?token=${verifyToken}`;
    await sendVerificationEmail(user.email, user.name, verifyUrl);

    return NextResponse.json({ success: true, message: 'Email verifikasi telah dikirim' }, { status: 200 });
  } catch (error: any) {
    console.error('Error resending verification email:', error);
    return NextResponse.json({ error: 'Gagal mengirim email verifikasi' }, { status: 500 });
  }
}
