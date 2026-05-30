import { prisma } from '@/lib/prisma';

export async function runVetAgent(
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
          animals: {
            include: {
              treatments: {
                orderBy: { treatmentDate: 'desc' },
                take: 5
              }
            }
          }
        }
      });

      if (cycle && cycle.orgId === orgId) {
        const data = (cycle.data as any) || {};
        
        // Cek masa henti obat aktif
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const activeObatList: any[] = [];

        if (cycle.animals) {
          for (const animalIdentity of cycle.animals) {
            for (const treatment of animalIdentity.treatments) {
              const tDate = new Date(treatment.treatmentDate);
              const endDate = new Date(tDate.getTime());
              endDate.setDate(endDate.getDate() + (treatment.withdrawalDays || 0));
              const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (daysLeft > 0) {
                activeObatList.push({
                  hewan: `${animalIdentity.earTag} (${animalIdentity.breed || 'Umum'})`,
                  diagnose: treatment.diagnose,
                  obat: treatment.medicineName,
                  withdrawalDays: treatment.withdrawalDays,
                  daysLeft
                });
              }
            }
          }
        }

        const generalObat = (data.biaya || [])
          .filter((b: any) => b.type === 'obat')
          .map((b: any) => {
            const tDate = new Date(b.tgl);
            const endDate = new Date(tDate.getTime());
            endDate.setDate(endDate.getDate() + (parseInt(b.withdrawalDays) || 0));
            const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return { nama: b.nama, tgl: b.tgl, withdrawalDays: b.withdrawalDays, daysLeft };
          })
          .filter((m: any) => m.daysLeft > 0);

        cycleSummaryText = `
Informasi Siklus Peternakan Pengguna saat ini:
- Nama Siklus: "${cycle.name}"
- Komoditas Hewan: ${cycle.animal}
- Skala: ${cycle.scale} ekor
- Obat yang Sedang Aktif dalam Masa Henti Obat (Withdrawal Period) - Data Individu Hewan: ${JSON.stringify(activeObatList)}
- Obat yang Sedang Aktif dalam Masa Henti Obat - Data Umum Siklus: ${JSON.stringify(generalObat)}
`;
      }
    } catch (dbError) {
      console.error('Error loading Vet agent DB context:', dbError);
    }
  }

  const systemPrompt = `Anda adalah Radeya Vet Agent, asisten dokter hewan digital profesional untuk peternak Indonesia.
Tugas utama Anda adalah memberikan diagnosis awal, penanganan penyakit, saran sanitasi kandang, dan instruksi medis yang aman dan praktis untuk peternak kecil hingga komersil.
Hewan yang ditangani saat ini: ${animal || 'Umum'}.
${cycleSummaryText}

Aturan Penting:
1. Jika ada obat-obatan aktif dalam masa henti obat (withdrawal period), Anda WAJIB memperingatkan pengguna dengan sangat tebal, jelas, dan keras tentang bahaya mengonsumsi atau menjual susu, daging, atau telur dari hewan tersebut saat ini.
2. Gunakan bahasa Indonesia yang ramah, sopan, praktis, serta terstruktur menggunakan poin-poin/list bernomor agar mudah dibaca oleh peternak di lapangan.
3. Di akhir jawaban, SELALU ingatkan peternak untuk menghubungi dokter hewan terdekat atau Dinas Peternakan setempat untuk penanganan klinis lebih lanjut apabila kondisi hewan memburuk atau kritis.`;

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

  throw new Error('Vet Agent gagal menghasilkan respon dari Gemini API');
}
