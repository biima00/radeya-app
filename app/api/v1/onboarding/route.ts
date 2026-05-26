import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as z from 'zod';

const onboardingSchema = z.object({
  farmName: z.string().min(2, 'Nama peternakan minimal 2 karakter'),
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
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { farmName } = parsed.data;

    // Update nama organisasi/peternakan di database
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: farmName,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Peternakan berhasil diinisialisasi',
      organization: updatedOrg,
    });
  } catch (error: any) {
    console.error('Error in onboarding:', error);
    return NextResponse.json(
      { error: 'Gagal memproses inisialisasi peternakan' },
      { status: 500 }
    );
  }
}
