import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

export const dynamic = 'force-dynamic';

const createInventoryItemSchema = z.object({
  name: z.string().min(2, 'Nama barang minimal 2 karakter'),
  category: z.enum(['FEED', 'MEDICINE', 'EQUIPMENT']),
  stock: z.number().nonnegative('Jumlah stok awal tidak boleh negatif'),
  unit: z.string().min(1, 'Satuan unit harus diisi (misal: kg, ml, bag)'),
  minAlert: z.number().nonnegative('Batas peringatan tidak boleh negatif').optional(),
  costPerUnit: z.number().nonnegative('Harga per unit tidak boleh negatif'),
});

// 1. GET: Mengambil daftar semua barang inventaris organisasi
export async function GET(req: Request) {
  try {
    const orgId = req.headers.get('x-org-id');

    if (!orgId) {
      return NextResponse.json(
        { error: 'Unauthorized: Organisasi tidak ditemukan' },
        { status: 401 }
      );
    }

    const items = await prisma.inventoryItem.findMany({
      where: { orgId },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data inventaris' },
      { status: 500 }
    );
  }
}

// 2. POST: Membuat item inventaris baru
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
    const parsed = createInventoryItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, category, stock, unit, minAlert, costPerUnit } = parsed.data;

    const newItem = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        stock,
        unit,
        minAlert: minAlert !== undefined ? minAlert : 5.0,
        costPerUnit,
        orgId
      }
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan barang inventaris baru' },
      { status: 500 }
    );
  }
}
