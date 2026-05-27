import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const orgId = req.headers.get('x-org-id');
    const userId = req.headers.get('x-user-id');
    if (!orgId || !userId) {
      return NextResponse.json({ error: 'Unauthorized: Sesi tidak ditemukan' }, { status: 401 });
    }
    const { plan } = await req.json();
    if (plan !== 'PRO' && plan !== 'ENTERPRISE') {
      return NextResponse.json({ error: 'Paket langganan tidak valid' }, { status: 400 });
    }
    const amount = plan === 'PRO' ? 50000 : 150000;
    const timestamp = Date.now();
    const orderId = `radeya-${plan}-${orgId}-${timestamp}`;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json({ error: 'Konfigurasi pembayaran server belum diset.' }, { status: 500 });
    }
    const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const midtransUrl = isProd
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');
    const payload = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      credit_card: { secure: true },
      customer_details: { first_name: user.name, email: user.email },
      item_details: [{ id: plan, price: amount, quantity: 1, name: `Paket Radeya ${plan} (1 Bulan)` }],
    };
    const midtransRes = await fetch(midtransUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: authHeader },
      body: JSON.stringify(payload),
    });
    if (!midtransRes.ok) {
      const errorText = await midtransRes.text();
      console.error('Midtrans API Error:', errorText);
      return NextResponse.json({ error: 'Gagal menghubungi gerbang pembayaran Midtrans' }, { status: 502 });
    }
    const data = await midtransRes.json();
    return NextResponse.json({ token: data.token, redirect_url: data.redirect_url });
  } catch (error: any) {
    console.error('Error in Midtrans checkout:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem pembayaran' }, { status: 500 });
  }
}
