import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { setAuthCookie } from '@/lib/auth-cookie';
import { sendVerificationEmail } from '@/lib/email';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('FATAL: NEXTAUTH_SECRET environment variable is not set.');
}
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(ip, 5, 15 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan registrasi. Coba lagi nanti.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
      );
    }

    const { name, email, password } = await req.json();

    // 1. Validasi input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Kata sandi harus minimal 8 karakter' },
        { status: 400 }
      );
    }

    // 2. Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan gunakan email lain.' },
        { status: 409 }
      );
    }

    // 3. Hash kata sandi
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Buat organisasi baru (default) dan User baru dalam satu transaksi database
    const newUser = await prisma.$transaction(async (tx) => {
      // Buat organisasi default
      const org = await tx.organization.create({
        data: {
          name: 'Peternakan Saya', // Default name, user will update this during onboarding
        },
      });

      // Buat user dan hubungkan ke organisasi tersebut
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'OWNER',
          orgId: org.id,
        },
      });

      return user;
    });

    // 5. Generate verification token JWT
    const verifyToken = await new SignJWT({
      userId: newUser.id,
      purpose: 'email-verification'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/auth/verify-email?token=${verifyToken}`;
    await sendVerificationEmail(newUser.email, newUser.name, verifyUrl);

    // 6. Generate session token JWT menggunakan library 'jose'
    const token = await new SignJWT({
      userId: newUser.id,
      email: newUser.email,
      orgId: newUser.orgId,
      role: newUser.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // 7. Return data sukses + set httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'Registrasi berhasil',
      orgId: newUser.orgId,
      user: {
        name: newUser.name,
        email: newUser.email,
      }
    }, { status: 201 });
    return setAuthCookie(response, token);

  } catch (error: any) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan pendaftaran akun' },
      { status: 500 }
    );
  }
}
