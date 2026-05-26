import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default-super-secret-key-change-in-production'
);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Validasi input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    // 2. Temukan user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        org: true, // Ambil info organisasi juga
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email atau kata sandi salah' },
        { status: 401 }
      );
    }

    // 3. Verifikasi kata sandi
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email atau kata sandi salah' },
        { status: 401 }
      );
    }

    // 4. Generate token JWT menggunakan library 'jose'
    const token = await new SignJWT({ 
      userId: user.id, 
      email: user.email,
      orgId: user.orgId,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d') // Token berlaku selama 7 hari
      .sign(JWT_SECRET);

    // 5. Cek apakah user perlu onboarding
    // Jika nama organisasi masih default "Peternakan Saya", user perlu onboarding
    const needsOnboarding = user.org.name === 'Peternakan Saya';

    // 6. Return data sukses
    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      token,
      orgId: user.orgId,
      needsOnboarding,
      user: {
        name: user.name,
        email: user.email,
      }
    });

  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Gagal memproses masuk akun' },
      { status: 500 }
    );
  }
}
