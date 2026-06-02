import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default-super-secret-key-change-in-production'
);

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential (ID Token) wajib dikirimkan' },
        { status: 400 }
      );
    }

    // 1. Verifikasi token ke Google API
    const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
    const googleRes = await fetch(googleVerifyUrl);

    if (!googleRes.ok) {
      const errorText = await googleRes.text();
      console.error('Google token verification failed:', errorText);
      return NextResponse.json(
        { error: 'Autentikasi Google gagal atau token kedaluwarsa' },
        { status: 401 }
      );
    }

    const tokenInfo = await googleRes.json();

    // 2. Validasi aud (Client ID) dan email_verified
    const expectedClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!expectedClientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
      return NextResponse.json(
        { error: 'Konfigurasi Google Client ID belum diset di server.' },
        { status: 500 }
      );
    }

    if (tokenInfo.aud !== expectedClientId) {
      console.error(`Audience mismatch. Expected: ${expectedClientId}, Got: ${tokenInfo.aud}`);
      return NextResponse.json(
        { error: 'Aplikasi Client ID tidak cocok (invalid audience)' },
        { status: 400 }
      );
    }

    if (tokenInfo.email_verified !== 'true') {
      return NextResponse.json(
        { error: 'Email Google Anda belum terverifikasi' },
        { status: 400 }
      );
    }

    const { email, name } = tokenInfo;

    // 3. Cari user di database
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        org: true,
      },
    });

    let needsOnboarding = false;

    // 4. Jika user belum terdaftar, buat akun & organisasi baru (OAuth Sign-up)
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-12) + crypto.randomUUID().slice(0, 8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.$transaction(async (tx) => {
        // Buat organisasi default
        const org = await tx.organization.create({
          data: {
            name: 'Peternakan Saya',
          },
        });

        // Buat user baru sebagai OWNER
        const newUser = await tx.user.create({
          data: {
            name: name || email.split('@')[0],
            email,
            password: hashedPassword,
            role: 'OWNER',
            orgId: org.id,
          },
          include: {
            org: true,
          },
        });

        return newUser;
      });

      needsOnboarding = true;
    } else {
      // Jika organisasi masih bernama default, anggap perlu onboarding
      needsOnboarding = user.org.name === 'Peternakan Saya';
    }

    // 5. Generate token JWT Radeya standar
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      orgId: user.orgId,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    return NextResponse.json({
      success: true,
      message: 'Autentikasi Google berhasil',
      token,
      orgId: user.orgId,
      needsOnboarding,
      user: {
        name: user.name,
        email: user.email,
      },
    });

  } catch (error: any) {
    console.error('Error during Google authentication:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat autentikasi Google' },
      { status: 500 }
    );
  }
}
