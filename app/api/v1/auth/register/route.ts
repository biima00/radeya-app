import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default-super-secret-key-change-in-production'
);

export async function POST(req: Request) {
  try {
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

    // 5. Generate token JWT menggunakan library 'jose'
    const token = await new SignJWT({ 
      userId: newUser.id, 
      email: newUser.email,
      orgId: newUser.orgId,
      role: newUser.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d') // Token berlaku selama 7 hari
      .sign(JWT_SECRET);

    // 6. Return data sukses
    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil',
      token,
      orgId: newUser.orgId,
      user: {
        name: newUser.name,
        email: newUser.email,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error during registration:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan pendaftaran akun' },
      { status: 500 }
    );
  }
}
