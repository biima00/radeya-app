import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

function verifySignature(payload: any, serverKey: string): boolean {
  const { order_id, status_code, gross_amount, signature_key } = payload;
  const rawString = order_id + status_code + gross_amount + serverKey;
  const hash = createHash('sha512').update(rawString).digest('hex');
  return hash === signature_key;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      console.error('Webhook Error: MIDTRANS_SERVER_KEY is not defined');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // 1. Verifikasi tanda tangan (Signature Key) dari Midtrans untuk keamanan
    const isValid = verifySignature(payload, serverKey);
    if (!isValid) {
      console.warn('Unauthorized Webhook Signature detected for order:', payload.order_id);
      return NextResponse.json({ error: 'Signature is invalid' }, { status: 401 });
    }

    const { order_id, transaction_status, fraud_status } = payload;

    // ADDED CLAUDE AI: Parse orgId early to check idempotency
    const parts = order_id.split('_');
    if (parts[0] !== 'radeya' || parts.length < 4) {
      console.warn('Invalid order_id format:', order_id);
      return NextResponse.json({ success: true }); // Acknowledge but ignore malformed orders
    }

    const orgId = parts.slice(2, parts.length - 1).join('_');

    // ADDED CLAUDE AI: Check idempotency — if this webhook was already processed, return 200 without modifying data
    // Midtrans requires 200 to stop retrying
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { lastPaymentOrderId: true },
    });

    if (org?.lastPaymentOrderId === order_id) {
      console.log(`[Midtrans Idempotency] Duplicate webhook for order ${order_id}, skipping update`);
      return NextResponse.json({ success: true, duplicate: true });
    }

    // 2. Cek apakah transaksi sukses
    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (isSuccess) {
      const plan = parts[1]; // 'PRO' atau 'ENTERPRISE'

      // Hitung masa tenggang (30 hari dari sekarang)
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Update status plan organisasi di database PostgreSQL via Prisma
      // ADDED CLAUDE AI: Also set lastPaymentOrderId for idempotency
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          plan,
          subscriptionActive: true,
          subscriptionEnd: expiryDate,
          lastPaymentOrderId: order_id, // Track this order for dedup
        },
      });

      console.log(`[Midtrans Success] Org ${orgId} upgraded to ${plan} until ${expiryDate}`);
    } else if (
      transaction_status === 'expire' ||
      transaction_status === 'cancel' ||
      transaction_status === 'deny'
    ) {
      // Jika kedaluwarsa atau dibatalkan, kembalikan status langganan
      // ADDED CLAUDE AI: Also set lastPaymentOrderId for idempotency
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          plan: 'FREE',
          subscriptionActive: false,
          subscriptionEnd: null,
          lastPaymentOrderId: order_id, // Track this order for dedup
        },
      });
      console.log(`[Midtrans Failure] Org ${orgId} downgraded to FREE due to status: ${transaction_status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error handling Midtrans webhook:', error);
    return NextResponse.json(
      { error: 'Gagal memproses notifikasi pembayaran' },
      { status: 500 }
    );
  }
}
