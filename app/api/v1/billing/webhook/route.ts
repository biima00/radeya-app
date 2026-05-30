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

    // 2. Cek apakah transaksi sukses
    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    if (isSuccess) {
      // Parse order_id: radeya_[PLAN]_[ORG_ID]_[TIMESTAMP]
      // Menggunakan underscore sebagai delimiter agar UUID orgId (yang mengandung hyphen) tetap utuh
      const parts = order_id.split('_');
      // Struktur: parts[0]='radeya', parts[1]='PRO'/'ENTERPRISE', parts[2..N-1]=UUID orgId, parts[N]=timestamp
      if (parts[0] === 'radeya' && parts.length >= 4) {
        const plan = parts[1]; // 'PRO' atau 'ENTERPRISE'
        // UUID orgId ada di tengah: dari index 2 hingga index kedua dari belakang
        const orgId = parts.slice(2, parts.length - 1).join('_');

        // Hitung masa tenggang (30 hari dari sekarang)
        const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // Update status plan organisasi di database PostgreSQL via Prisma
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan,
            subscriptionActive: true,
            subscriptionEnd: expiryDate,
          },
        });

        console.log(`[Midtrans Success] Org ${orgId} upgraded to ${plan} until ${expiryDate}`);
      }
    } else if (
      transaction_status === 'expire' ||
      transaction_status === 'cancel' ||
      transaction_status === 'deny'
    ) {
      // Jika kedaluwarsa atau dibatalkan, kembalikan status langganan
      const parts = order_id.split('_');
      if (parts[0] === 'radeya' && parts.length >= 4) {
        // UUID orgId ada di tengah: dari index 2 hingga index kedua dari belakang
        const orgId = parts.slice(2, parts.length - 1).join('_');
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan: 'FREE',
            subscriptionActive: false,
            subscriptionEnd: null,
          },
        });
        console.log(`[Midtrans Failure] Org ${orgId} downgraded to FREE due to status: ${transaction_status}`);
      }
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
