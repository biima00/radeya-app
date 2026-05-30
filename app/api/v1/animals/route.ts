import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

export const dynamic = 'force-dynamic';

const createAnimalSchema = z.object({
  cycleId: z.string().uuid('ID siklus harus berupa UUID valid'),
  earTag: z.string().min(1, 'Nomor Tag Telinga harus diisi'),
  rfidTag: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE']),
  birthDate: z.string().optional().nullable(),
  breed: z.string().optional().nullable(),
  fatherTag: z.string().optional().nullable(),
  motherTag: z.string().optional().nullable(),
});

// 1. GET: Mengambil daftar identitas hewan dalam organisasi/siklus
export async function GET(req: Request) {
  try {
    const orgId = req.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json(
        { error: 'Unauthorized: Organisasi tidak ditemukan' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get('cycleId');

    if (!cycleId) {
      return NextResponse.json(
        { error: 'Query parameter cycleId wajib diisi' },
        { status: 400 }
      );
    }

    // Verifikasi akses siklus
    const cycle = await prisma.cycle.findUnique({
      where: { id: cycleId }
    });

    if (!cycle || cycle.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Siklus tidak ditemukan atau tidak memiliki akses' },
        { status: 404 }
      );
    }

    const animals = await prisma.animalIdentity.findMany({
      where: { cycleId },
      include: {
        treatments: {
          orderBy: { treatmentDate: 'desc' }
        }
      },
      orderBy: { earTag: 'asc' }
    });

    return NextResponse.json(animals);
  } catch (error: any) {
    console.error('Error fetching animals:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data identitas hewan' },
      { status: 500 }
    );
  }
}

// 2. POST: Mendaftarkan identitas hewan baru ke dalam siklus
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
    const parsed = createAnimalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { cycleId, earTag, rfidTag, gender, birthDate, breed, fatherTag, motherTag } = parsed.data;

    // Verifikasi siklus milik organisasi
    const cycle = await prisma.cycle.findUnique({
      where: { id: cycleId }
    });

    if (!cycle || cycle.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Siklus tidak ditemukan atau tidak memiliki akses' },
        { status: 404 }
      );
    }

    // Cek duplikasi RFID
    if (rfidTag) {
      const existingRfid = await prisma.animalIdentity.findUnique({
        where: { rfidTag }
      });
      if (existingRfid) {
        return NextResponse.json(
          { error: `Nomor EID/RFID "${rfidTag}" sudah terdaftar pada hewan lain.` },
          { status: 400 }
        );
      }
    }

    const newAnimal = await prisma.animalIdentity.create({
      data: {
        cycleId,
        earTag,
        rfidTag: rfidTag || null,
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
        breed,
        fatherTag,
        motherTag,
        status: 'ACTIVE'
      }
    });

    return NextResponse.json(newAnimal, { status: 201 });
  } catch (error: any) {
    console.error('Error creating animal:', error);
    return NextResponse.json(
      { error: 'Gagal mendaftarkan hewan baru' },
      { status: 500 }
    );
  }
}
