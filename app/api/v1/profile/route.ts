import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEffectivePlan } from '@/lib/subscription'; // ADDED CLAUDE AI

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const userId = req.headers.get('x-user-id');
    const orgId = req.headers.get('x-org-id');
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, emailVerified: true, role: true },
    });
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, plan: true, subscriptionActive: true, subscriptionEnd: true },
    });
    if (!user || !org) {
      return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 });
    }
    // ADDED CLAUDE AI: Return effective plan to frontend (includes expiry check)
    const effectivePlan = getEffectivePlan(org);
    return NextResponse.json({ user, organization: { ...org, plan: effectivePlan } });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Gagal mengambil data profil' }, { status: 500 });
  }
}
