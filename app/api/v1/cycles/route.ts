import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

// Skema validasi input untuk memastikan data yang masuk sudah benar
const createCycleSchema = z.object({
  name: z.string().min(2, 'Nama siklus minimal 2 karakter'),
  animal: z.string().min(1, 'Jenis ternak harus diisi'),
  scale: z.number().int().positive('Skala ternak (jumlah) harus angka positif'),
  mode: z.string().min(1, 'Mode bisnis harus diisi'),
  data: z.any().optional(), // detail transaksi (biaya, panen, dll) opsional di awal
});

// 1. GET: Mengambil daftar semua siklus ternak milik organisasi user yang login
export async function GET(req: Request) {
  try {
    // Membaca orgId dari header request
    const orgId = req.headers.get('x-org-id');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Unauthorized: Organisasi tidak ditemukan' },
        { status: 401 }
      );
    }

    const cycles = await prisma.cycle.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' }, // Mengurutkan dari yang terbaru
    });

    return NextResponse.json(cycles);
  } catch (error: any) {
    console.error('Error fetching cycles:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data siklus ternak' },
      { status: 500 }
    );
  }
}

// 2. POST: Membuat siklus ternak baru di database
export async function POST(req: Request) {
  try {
    const orgId = req.headers.get('x-org-id');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Unauthorized: Organisasi tidak ditemukan' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = createCycleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, animal, scale, mode, data } = parsed.data;

    // Menyimpan data siklus baru ke PostgreSQL menggunakan Prisma
    const newCycle = await prisma.cycle.create({
      data: {
        name,
        animal,
        scale,
        mode,
        orgId,
        // Jika tidak ada data awal, kita buat struktur default kosong
        data: data || {
          modal: 0,
          biaya: [],
          panen: [],
          penjualan: [],
          catatan: '',
        },
      },
    });

    return NextResponse.json(newCycle, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cycle:', error);
    return NextResponse.json(
      { error: 'Gagal membuat siklus ternak baru' },
      { status: 500 }
    );
  }
}
