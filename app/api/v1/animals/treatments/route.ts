import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

const createTreatmentSchema = z.object({
  animalId: z.string().uuid('ID hewan harus berupa UUID valid'),
  diagnose: z.string().min(2, 'Diagnosis minimal 2 karakter'),
  medicineName: z.string().min(2, 'Nama obat harus diisi'),
  dosage: z.string().min(1, 'Dosis harus diisi'),
  withdrawalDays: z.number().int().nonnegative().default(0),
  cost: z.number().nonnegative().optional().default(0),
  notes: z.string().optional().nullable(),
});

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
    const parsed = createTreatmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { animalId, diagnose, medicineName, dosage, withdrawalDays, cost, notes } = parsed.data;

    // 1. Verifikasi hewan milik organisasi (melalui siklus)
    const animal = await prisma.animalIdentity.findUnique({
      where: { id: animalId },
      include: { cycle: true }
    });

    if (!animal || animal.cycle.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Identitas hewan tidak ditemukan atau tidak memiliki akses' },
        { status: 404 }
      );
    }

    // 2. Jalankan transaksi untuk membuat log treatment relasional, dan update biaya medis di data Cycle JSON
    const todayStr = new Date().toISOString().slice(0, 10);
    const currentData = (animal.cycle.data as any) || {};

    const newMedicalCost = {
      type: 'obat',
      tgl: todayStr,
      nama: `${medicineName} (Sapi: ${animal.earTag})`,
      keterangan: `Diagnosis: ${diagnose}. Dosis: ${dosage}. ${notes || ''}`,
      total: cost,
      withdrawalDays
    };

    const updatedData = {
      ...currentData,
      biaya: [...(currentData.biaya || []), newMedicalCost]
    };

    const [newTreatment, updatedCycle] = await prisma.$transaction([
      // Buat data treatment relasional
      prisma.animalTreatment.create({
        data: {
          animalId,
          diagnose,
          medicineName,
          dosage,
          withdrawalDays,
          notes: notes || `Pemberian obat harian`
        }
      }),
      // Sinkronkan biaya medis ke data cycle JSON
      prisma.cycle.update({
        where: { id: animal.cycleId },
        data: { data: updatedData }
      })
    ]);

    return NextResponse.json({
      success: true,
      treatment: newTreatment,
      cycle: updatedCycle
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error logging animal treatment:', error);
    return NextResponse.json(
      { error: 'Gagal mencatat pengobatan hewan' },
      { status: 500 }
    );
  }
}
