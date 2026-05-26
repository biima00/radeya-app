import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = req.headers.get('x-org-id');
    const { id } = params;

    if (!orgId) {
      return NextResponse.json(
        { error: 'Unauthorized: Organisasi tidak ditemukan' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Pastikan siklus tersebut milik organisasi user
    const existingCycle = await prisma.cycle.findUnique({
      where: { id },
    });

    if (!existingCycle || existingCycle.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Siklus tidak ditemukan atau tidak memiliki akses' },
        { status: 404 }
      );
    }

    const updatedCycle = await prisma.cycle.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        animal: body.animal !== undefined ? body.animal : undefined,
        scale: body.scale !== undefined ? parseInt(body.scale) : undefined,
        mode: body.mode !== undefined ? body.mode : undefined,
        data: body.data !== undefined ? body.data : undefined,
      },
    });

    return NextResponse.json(updatedCycle);
  } catch (error: any) {
    console.error('Error updating cycle:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui data siklus' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orgId = req.headers.get('x-org-id');
    const { id } = params;

    if (!orgId) {
      return NextResponse.json(
        { error: 'Unauthorized: Organisasi tidak ditemukan' },
        { status: 401 }
      );
    }

    // Pastikan siklus tersebut milik organisasi user
    const existingCycle = await prisma.cycle.findUnique({
      where: { id },
    });

    if (!existingCycle || existingCycle.orgId !== orgId) {
      return NextResponse.json(
        { error: 'Siklus tidak ditemukan atau tidak memiliki akses' },
        { status: 404 }
      );
    }

    await prisma.cycle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Siklus berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting cycle:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus siklus' },
      { status: 500 }
    );
  }
}
