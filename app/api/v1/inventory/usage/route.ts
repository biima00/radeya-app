import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

const createInventoryUsageSchema = z.object({
  itemId: z.string().uuid('ID barang harus berupa UUID valid'),
  cycleId: z.string().uuid('ID siklus harus berupa UUID valid'),
  qtyUsed: z.number().positive('Jumlah yang digunakan harus angka positif'),
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
    const parsed = createInventoryUsageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { itemId, cycleId, qtyUsed, notes } = parsed.data;

    // 1. Verifikasi barang milik organisasi
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId }
    });

    if (!item || item.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Barang inventaris tidak ditemukan' },
        { status: 404 }
      );
    }

    // 2. Verifikasi siklus milik organisasi
    const cycle = await prisma.cycle.findUnique({
      where: { id: cycleId }
    });

    if (!cycle || cycle.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Siklus ternak tidak ditemukan' },
        { status: 404 }
      );
    }

    // 3. Verifikasi ketersediaan stok
    if (item.stock < qtyUsed) {
      return NextResponse.json(
        { error: `Stok tidak mencukupi. Tersisa: ${item.stock} ${item.unit}` },
        { status: 400 }
      );
    }

    // 4. Jalankan transaksi Prisma untuk mengurangi stok, mencatat usage, dan mengupdate data Cycle JSON
    const costAmount = qtyUsed * item.costPerUnit;
    const todayStr = new Date().toISOString().slice(0, 10);

    // Persiapkan data transaksi biaya baru untuk ditambahkan ke cycle.data.biaya
    const currentData = (cycle.data as any) || {};
    let newCostItem: any = {};

    if (item.category === 'FEED') {
      newCostItem = {
        type: 'pakan',
        tgl: todayStr,
        jenis: item.name,
        sak: (qtyUsed / 50).toFixed(2), // Konversi kg ke sak (asumsi 1 sak = 50kg)
        kg_sak: '50',
        kg: qtyUsed,
        harga_sak: (item.costPerUnit * 50).toString(),
        total: costAmount,
        keterangan: notes || `Pemberian pakan otomatis dari inventaris`
      };
    } else if (item.category === 'MEDICINE') {
      newCostItem = {
        type: 'obat',
        tgl: todayStr,
        nama: item.name,
        keterangan: notes || `Pemberian obat otomatis dari inventaris`,
        total: costAmount,
        withdrawalDays: 0 // Default, dapat diupdate di dashboard jika ada masa henti khusus
      };
    } else {
      newCostItem = {
        type: 'lain',
        tgl: todayStr,
        nama: item.name,
        keterangan: notes || `Penggunaan barang inventaris`,
        total: costAmount
      };
    }

    const updatedData = {
      ...currentData,
      biaya: [...(currentData.biaya || []), newCostItem]
    };

    // Jalankan database update
    const [updatedItem, newUsage, updatedCycle] = await prisma.$transaction([
      // Kurangi stok inventaris
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: { stock: { decrement: qtyUsed } }
      }),
      // Catat log usage
      prisma.inventoryUsage.create({
        data: {
          itemId,
          cycleId,
          qtyUsed,
          notes: notes || 'Pemakaian otomatis'
        }
      }),
      // Update data JSON di dalam Cycle
      prisma.cycle.update({
        where: { id: cycleId },
        data: { data: updatedData }
      })
    ]);

    return NextResponse.json({
      success: true,
      usage: newUsage,
      item: updatedItem,
      cycle: updatedCycle
    });

  } catch (error: any) {
    console.error('Error logging inventory usage:', error);
    return NextResponse.json(
      { error: 'Gagal mencatat pemakaian inventaris' },
      { status: 500 }
    );
  }
}
