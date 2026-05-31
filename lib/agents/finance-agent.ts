import { prisma } from '@/lib/prisma';

export async function runFinanceAgent(
  message: string,
  animal: string,
  cycleId: string | undefined,
  orgId: string,
  geminiKey: string
): Promise<string> {
  let cycleSummaryText = '';
  if (cycleId) {
    try {
      const cycle = await prisma.cycle.findUnique({
        where: { id: cycleId },
        include: {
          inventoryUsages: {
            include: {
              item: true
            }
          }
        }
      });

      if (cycle && cycle.orgId === orgId) {
        const data = (cycle.data as any) || {};
        
        // Hitung pengeluaran dari data JSON biaya
        const biayaList = data.biaya || [];
        let totalBiayaUmum = 0;
        let totalBiayaPakan = 0;
        let totalBiayaObat = 0;
        let totalBiayaLainnya = 0;

        biayaList.forEach((b: any) => {
          const nominal = parseFloat(b.nominal) || 0;
          totalBiayaUmum += nominal;
          if (b.type === 'pakan') totalBiayaPakan += nominal;
          else if (b.type === 'obat') totalBiayaObat += nominal;
          else totalBiayaLainnya += nominal;
        });

        // Hitung pengeluaran dari Inventory Usages
        let totalBiayaInventory = 0;
        const inventorySummary = cycle.inventoryUsages.map(usage => {
          const cost = (usage.qtyUsed || 0) * (usage.item.costPerUnit || 0);
          totalBiayaInventory += cost;
          return {
            namaItem: usage.item.name,
            kategori: usage.item.category,
            qtyUsed: usage.qtyUsed,
            unit: usage.item.unit,
            cost
          };
        });

        // Hitung total mati untuk hitung penyusutan skala
        let totalMati = 0;
        if (data.panen) {
          totalMati = data.panen.reduce((s: number, p: any) => s + (parseFloat(p.jml_mati) || 0), 0);
        }

        cycleSummaryText = `
Informasi Keuangan Siklus Peternakan Pengguna saat ini:
- Nama Siklus: "${cycle.name}"
- Komoditas Hewan: ${cycle.animal}
- Skala Awal: ${cycle.scale} ekor
- Jumlah Kematian (Mortalitas): ${totalMati} ekor
- Total Biaya Dicatat Manual (Opex): Rp ${totalBiayaUmum.toLocaleString('id-ID')} (Pakan: Rp ${totalBiayaPakan.toLocaleString('id-ID')}, Obat: Rp ${totalBiayaObat.toLocaleString('id-ID')}, Lainnya: Rp ${totalBiayaLainnya.toLocaleString('id-ID')})
- Total Pengeluaran Stok Gudang (Inventory Usages): Rp ${totalBiayaInventory.toLocaleString('id-ID')}
- Detail Pemakaian Gudang: ${JSON.stringify(inventorySummary)}
`;
      }
    } catch (dbError) {
      console.error('Error loading Finance agent DB context:', dbError);
    }
  }

  const systemPrompt = `Anda adalah Radeya Finance Agent, konsultan bisnis dan keuangan peternakan profesional di Indonesia.
Tugas utama Anda adalah menganalisis biaya operasional siklus peternakan, menghitung estimasi Break Even Point (BEP), memberikan rekomendasi efisiensi biaya pakan/obat, memproyeksikan laba-rugi, serta memberikan tips manajemen finansial peternakan.
Hewan yang ditangani saat ini: ${animal || 'Umum'}.
${cycleSummaryText}

Aturan Penting:
1. Analisis data pengeluaran dan pemakaian inventaris di atas secara logis untuk memberikan jawaban terarah mengenai keuntungan atau inefisiensi pengeluaran.
2. Gunakan terminologi keuangan yang mudah dipahami oleh peternak (misal: modal awal, biaya operasional, harga jual per ekor/per kg, keuntungan bersih).
3. Bantu peternak merencanakan strategi pembiayaan agar usaha peternakan mereka berkelanjutan (sustainable) dan menguntungkan.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Pertanyaan peternak: ${message}`
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: systemPrompt
            }
          ]
        }
      }),
    }
  );

  if (response.ok) {
    const geminiData = await response.json();
    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (reply) {
      return reply;
    }
  }

  throw new Error('Finance Agent gagal menghasilkan respon dari Gemini API');
}
