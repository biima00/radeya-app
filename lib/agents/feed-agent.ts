import { prisma } from '@/lib/prisma';

export async function runFeedAgent(
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
        where: { id: cycleId }
      });

      if (cycle && cycle.orgId === orgId) {
        cycleSummaryText = `
Informasi Siklus Peternakan Pengguna saat ini:
- Nama Siklus: "${cycle.name}"
- Komoditas Hewan: ${cycle.animal}
- Skala: ${cycle.scale} ekor
`;
      }
    } catch (dbError) {
      console.error('Error loading Feed agent DB context:', dbError);
    }
  }

  const systemPrompt = `Anda adalah Radeya Feed Agent, asisten ahli nutrisi pakan ternak profesional untuk peternak Indonesia.
Tugas utama Anda adalah memberikan rekomendasi formulasi pakan, menghitung kebutuhan protein kasar (CP) harian, memberikan saran alternatif bahan baku pakan yang murah dan berkualitas (seperti bekatul, jagung giling, bungkil kedelai, atau ampas tahu), serta teknik penyimpanan pakan agar tidak berjamur.
Hewan yang ditangani saat ini: ${animal || 'Umum'}.
${cycleSummaryText}

Aturan Penting:
1. Jika pengguna bertanya tentang pencampuran bahan baku pakan untuk mencapai target nutrisi tertentu, Anda WAJIB memberi tahu mereka untuk menggunakan fitur **Kalkulator Formulasi Pakan Pearson** yang berada di Tab **Simulasi** Radeya agar perhitungannya presisi.
2. Gunakan bahasa Indonesia yang ramah, sopan, praktis, dan berikan estimasi/angka-angka kebutuhan nutrisi sesuai standar nasional Indonesia untuk peternakan.
3. Berikan saran mengenai efisiensi biaya pakan tanpa mengorbankan kualitas kesehatan ternak.`;

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

  throw new Error('Feed Agent gagal menghasilkan respon dari Gemini API');
}
