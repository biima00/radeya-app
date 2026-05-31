import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import * as z from 'zod';

export const dynamic = 'force-dynamic';

const createWorkerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string()
    .min(8, 'Kata sandi minimal 8 karakter')
    .regex(/[A-Z]/, 'Kata sandi harus mengandung minimal 1 huruf besar')
    .regex(/[a-z]/, 'Kata sandi harus mengandung minimal 1 huruf kecil')
    .regex(/[0-9]/, 'Kata sandi harus mengandung minimal 1 angka')
    .regex(/[^A-Za-z0-9]/, 'Kata sandi harus mengandung minimal 1 karakter khusus/simbol'),
});

// 1. GET: Ambil daftar seluruh anggota tim dalam satu organisasi
export async function GET(req: Request) {
  try {
    const orgId = req.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamMembers = await prisma.user.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(teamMembers);
  } catch (error: any) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Gagal memproses permintaan daftar tim' },
      { status: 500 }
    );
  }
}

// 2. POST: Boss (OWNER) mendaftarkan pekerja (MEMBER) baru
export async function POST(req: Request) {
  try {
    const orgId = req.headers.get('x-org-id');
    const myRole = req.headers.get('x-role');

    if (!orgId || !myRole) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hanya OWNER (Boss) yang dapat mendaftarkan pekerja
    if (myRole !== 'OWNER') {
      return NextResponse.json(
        { error: 'Akses Ditolak: Hanya pemilik (OWNER) yang dapat mengelola tim' },
        { status: 403 }
      );
    }

    // Periksa apakah organisasi berlangganan paket ENTERPRISE aktif
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org || org.plan !== 'ENTERPRISE' || !org.subscriptionActive) {
      return NextResponse.json(
        { error: 'Fitur pengelolaan anggota tim hanya tersedia pada paket ENTERPRISE aktif.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createWorkerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Periksa apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar dalam sistem.' },
        { status: 409 }
      );
    }

    // Hash sandi untuk akun pekerja baru
    const hashedPassword = await bcrypt.hash(password, 10);

    const newWorker = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'MEMBER', // Pekerja
        orgId,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newWorker.id,
        name: newWorker.name,
        email: newWorker.email,
        role: newWorker.role,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan anggota tim baru' },
      { status: 500 }
    );
  }
}
