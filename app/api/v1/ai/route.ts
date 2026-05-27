import { NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Fallback cerdas offline berbasis aturan (medis ternak Indonesia)
function getOfflineResponse(message: string, animal: string): string {
  const msg = message.toLowerCase();
  const animalType = animal || 'umum';

  // Respon umum pakan
  if (msg.includes('pakan') || msg.includes('nutrisi') || msg.includes('makan')) {
    return `🌾 **Radeya AI Vet (Offline Mode)**
Untuk mengoptimalkan biaya dan nutrisi pakan, pastikan kadar protein kasar (CP) sesuai umur ternak. 

💡 *Tips:* Anda bisa menggunakan **Kalkulator Formulasi Pakan Pearson** di Tab **Simulasi** Radeya untuk menghitung rasio pencampuran bahan baku (seperti jagung, bekatul, atau konsentrat) agar mencapai target protein yang ideal secara presisi!`;
  }

  // Respon spesifik unggas (ayam/bebek)
  if (['ayam_petelur', 'ayam_pedaging', 'bebek', 'enthok'].includes(animalType)) {
    if (msg.includes('kapur') || msg.includes('berak putih') || msg.includes('pullorum')) {
      return `🐔 **Radeya AI Vet - Analisis Berak Kapur (Pullorum)**
Gejala berak kapur ditandai dengan kotoran putih menempel di dubur, lemas, dan sayap menggantung.
1. **Isolasi** segera ayam yang sakit agar tidak menulari yang lain.
2. **Keringkan sekam** (litter), ganti yang basah karena kelembapan tinggi memicu bakteri *Salmonella pullorum*.
3. **Pengobatan:** Berikan antibiotik khusus unggas seperti *Amoxicillin* atau *Oxytetracycline* sesuai dosis pada wadah selama 3-5 hari.
4. **Pendukung:** Berikan multivitamin penambah imun setelah pengobatan.`;
    }
    if (msg.includes('ngorok') || msg.includes('flu') || msg.includes('snot') || msg.includes('crd') || msg.includes('napas')) {
      return `🐔 **Radeya AI Vet - Analisis Gangguan Pernapasan (CRD / Snot)**
Gejala ngorok disebabkan oleh sirkulasi udara kandang yang kurang baik atau infeksi bakteri *Mycoplasma*.
1. **Cek Ventilasi:** Pastikan tirai kandang tidak terlalu rapat di siang hari, dan amonia dari kotoran tidak menyengat.
2. **Sanitasi:** Semprot kandang dengan desinfektan aman.
3. **Pengobatan:** Berikan obat yang mengandung *Tylosin* atau *Erythromycin* lewat air minum selama 3-5 hari berturut-turut.
4. Jangan berikan air dingin, berikan air hangat/suhu ruang yang dicampur vitamin pemulihan.`;
    }
    if (msg.includes('mati') || msg.includes('mati mendadak') || msg.includes('tetelo') || msg.includes('nd')) {
      return `🐔 **Radeya AI Vet - Kewaspadaan Penyakit Tetelo (ND) / AI (Flu Burung)**
Kematian mendadak dalam jumlah banyak dengan gejala leher berputar (tetelo) atau jengger biru mengarah ke infeksi virus ND atau AI.
1. **Penting:** Penyakit virus TIDAK BISA diobati dengan antibiotik. Kuncinya adalah pencegahan.
2. **Vaksinasi:** Pastikan program vaksinasi ND-IB (pada umur 4 hari, 18 hari, dst) telah dijalankan secara disiplin (bisa dilihat di Tab **Kalender Kerja**).
3. **Biosekuriti:** Perketat akses kandang dari orang asing, semprot desinfektan setiap hari.
4. Musnahkan bangkai ayam dengan dibakar atau dikubur dalam agar virus mati.`;
    }
    if (msg.includes('lesu') || msg.includes('lemas') || msg.includes('lambat')) {
      return `🐔 **Radeya AI Vet - Analisis Kondisi Lemas/Stres**
1. Periksa suhu kandang. Anak ayam (DOC) sangat rentan kedinginan. Gunakan pemanas jika umurnya di bawah 14 hari.
2. Berikan suplemen vitamin anti-stres (misal yang mengandung elektrolit dan Vitamin B-Kompleks) melalui air minum.
3. Pastikan tempat makan dan minum bersih dari endapan kotoran.`;
    }
  }

  // Respon spesifik ruminansia (sapi/kambing)
  if (['sapi_pedaging', 'sapi_perah', 'kambing', 'kambing_perah'].includes(animalType)) {
    if (msg.includes('kembung') || msg.includes('bloat') || msg.includes('begah')) {
      return `🥩 **Radeya AI Vet - Penanganan Bloat (Kembung)**
Kembung terjadi akibat akumulasi gas di rumen, biasanya karena mengonsumsi rumput muda yang masih basah (embun pagi) atau leguminosa berlebih.
1. **Tindakan Darurat:** Berikan obat anti-bloat komersil seperti *Tympanol* atau berikan minyak goreng hangat sebanyak 100-200 ml secara perlahan (dosis kambing lebih sedikit, sekitar 50ml).
2. **Posisi:** Posisikan kaki depan ternak lebih tinggi dari kaki belakang agar gas lebih mudah keluar.
3. **Pijat:** Pijat perut sebelah kiri secara perlahan untuk merangsang pengeluaran gas (sendawa).
4. Hindari pemberian rumput segar yang basah, layukan rumput minimal 3-4 jam sebelum diberikan.`;
    }
    if (msg.includes('mencret') || msg.includes('diare')) {
      return `🥩 **Radeya AI Vet - Analisis Diare (Mencret)**
Diare pada ruminansia sering disebabkan oleh cacingan atau kualitas pakan konsentrat yang berjamur.
1. **Cacingan:** Berikan obat cacing spektrum luas seperti *Albendazole* atau *Oxyclozanide* secara rutin setiap 3-4 bulan.
2. **Pertolongan:** Berikan oralit hewan atau arang aktif (norit) untuk menyerap racun di usus.
3. **Pakan:** Hentikan sementara pakan konsentrat basah, berikan serat kasar berkualitas seperti rumput kering (hay) atau jerami kering.`;
    }
    if (msg.includes('pincang') || msg.includes('kuku') || msg.includes('luka kuku') || msg.includes('pmk')) {
      return `🥩 **Radeya AI Vet - Penanganan Luka Kuku / PMK**
Masalah kuku pincang bisa disebabkan oleh kandang yang terlalu basah (becek) atau infeksi virus Penyakit Mulut dan Kuku (PMK).
1. **Kebersihan Kandang:** Pastikan lantai kandang kering dan kotoran dibersihkan berkala.
2. **Foot Bath:** Rendam atau bersihkan kuku kaki ternak dengan larutan antiseptik seperti tembaga sulfat (terusi) 5% atau formalin 2%.
3. **Isolasi:** Segera pisahkan ternak yang pincang agar tidak membebani kakinya dan mencegah penularan jika terindikasi PMK.
4. Laporkan ke Dinas Peternakan jika mulut ternak tampak berbusa dan tidak mau makan sama sekali.`;
    }
    if (msg.includes('ambruk') || msg.includes('milk fever') || msg.includes('lemas')) {
      return `🥛 **Radeya AI Vet - Deteksi Milk Fever / Ambruk Pasca Melahirkan**
Ternak yang ambruk setelah melahirkan (terutama sapi perah produktivitas tinggi) sering mengalami *Milk Fever* akibat kekurangan kalsium secara drastis dalam darah (hipokalsemia).
1. **Penting:** Ini kondisi darurat! Hubungi dokter hewan terdekat segera untuk penyuntikan kalsium glukonat secara intravena (lewat darah).
2. Hindari pemaksaan ternak untuk berdiri jika ia terlalu lemah karena berisiko cedera otot/tulang panggul.
3. Berikan pakan hijau segar dan air hangat yang dicampur garam mineral.`;
    }
  }

  // Respon umum
  return `🌿 **Halo! Saya Radeya AI Vet**
Ada yang bisa saya bantu terkait kesehatan ternak Anda? 
*Pertanyaan yang sering ditanyakan:*
- Gejala penyakit ternak (misal: "Ayam ngorok", "Kambing kembung", "Sapi pincang")
- Rekomendasi pakan dan nutrisi
- Manajemen vaksinasi harian

Silakan ketik pertanyaan Anda secara spesifik. *(Saat ini sistem beroperasi dalam mode asisten lokal)*`;
}

export async function POST(req: Request) {
  try {
    // Check Rate Limiting (Max 15 requests per minute)
    const ip = getClientIp(req);
    const limitRes = rateLimit(ip, 15, 60 * 1000);
    if (!limitRes.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan percakapan. Silakan coba lagi dalam satu menit.' },
        { status: 429 }
      );
    }

    const orgId = req.headers.get('x-org-id');
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, animal } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const systemPrompt = `Anda adalah Radeya AI Vet, asisten dokter hewan digital dan konsultan peternakan profesional di Indonesia. 
Ternak aktif pengguna saat ini adalah jenis: ${animal || 'Umum'}.
Berikan analisis medis, solusi pakan, sanitasi kandang, dan saran operasional yang konkret dan aman untuk peternak.
Gunakan bahasa Indonesia yang ramah, sopan, praktis, serta mudah dipahami oleh peternak skala kecil maupun komersil.
Gunakan markdown tebal, poin-poin, dan list bernomor untuk menjelaskan tindakan medis atau langkah pertolongan pertama.
SELALU ingatkan peternak di akhir jawaban untuk menghubungi dokter hewan atau Dinas Peternakan setempat apabila kondisi ternak kritis/gawat darurat.`;

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
            return NextResponse.json({ reply });
          }
        }
        
        console.warn('Gemini API call failed, falling back to offline logic');
      } catch (geminiError) {
        console.error('Error invoking Gemini:', geminiError);
      }
    }

    // Jika key tidak ada atau call API gagal, gunakan fallback cerdas offline
    const reply = getOfflineResponse(message, animal);
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('Error in AI Vet endpoint:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
