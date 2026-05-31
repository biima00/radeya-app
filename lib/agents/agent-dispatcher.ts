import { runVetAgent } from './vet-agent';
import { runFeedAgent } from './feed-agent';
import { runFinanceAgent } from './finance-agent';

// Fallback respons offline berbasis aturan lokal (Bahasa Indonesia)
export function getOfflineResponse(message: string, animal: string): string {
  const msg = message.toLowerCase();
  const animalType = animal || 'umum';

  // Respon umum keuangan / bisnis (Finance fallback)
  if (msg.includes('biaya') || msg.includes('harga') || msg.includes('untung') || msg.includes('rugi') || msg.includes('bep') || msg.includes('modal') || msg.includes('keuangan')) {
    return `💰 **Radeya AI Finance (Offline Mode)**
Untuk mengoptimalkan finansial peternakan Anda:
1. Pastikan mencatat semua biaya operasional (pakan, obat, bibit) secara disiplin di halaman **Biaya Siklus**.
2. **Break Even Point (BEP)** dapat diproyeksikan dengan membandingkan total biaya input terhadap bobot total panen dikali estimasi harga jual pasar.
3. *Tips:* Kurangi inefisiensi pakan dengan memantau FCR (Feed Conversion Ratio) secara ketat. Pakan berkontribusi hingga 70% dari total opex.`;
  }

  // Respon umum pakan (Feed fallback)
  if (msg.includes('pakan') || msg.includes('nutrisi') || msg.includes('makan') || msg.includes('ransum') || msg.includes('pearson')) {
    return `🌾 **Radeya AI Feed (Offline Mode)**
Untuk mengoptimalkan biaya dan nutrisi pakan, pastikan kadar protein kasar (CP) sesuai umur ternak. 
 
💡 *Tips:* Anda bisa menggunakan **Kalkulator Formulasi Pakan Pearson** di Tab **Simulasi** Radeya untuk menghitung rasio pencampuran bahan baku (seperti jagung, bekatul, atau konsentrat) agar mencapai target protein yang ideal secara presisi!`;
  }

  // Respon spesifik unggas (ayam/bebek) - Vet fallback
  if (['ayam_petelur', 'ayam_pedaging', 'bebek_petelur', 'bebek_pedaging', 'enthok_pedaging'].includes(animalType)) {
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

  // Respon spesifik ruminansia (sapi/kambing) - Vet fallback
  if (['sapi_pedaging', 'sapi_perah', 'kambing_pedaging', 'kambing_perah'].includes(animalType)) {
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

  // Respon spesifik perikanan (ikan_pembesaran/ikan_pembibitan) - Vet fallback
  if (['ikan_pembesaran', 'ikan_pembibitan'].includes(animalType)) {
    if (msg.includes('mati') || msg.includes('jamur') || msg.includes('putih') || msg.includes('aeromonas') || msg.includes('insang')) {
      return `🐟 **Radeya AI Vet - Penanganan Penyakit/Kematian Ikan**
1. **Kualitas Air:** Cek parameter pH (ideal 6.5-8) dan kadar Amonia. Sebagian besar kematian ikan disebabkan oleh penumpukan amonia/kotoran pakan.
2. **Karantina:** Segera pisahkan ikan yang lemas, memiliki bercak putih/merah (jamur/bakteri Aeromonas), atau berenang tidak normal.
3. **Tindakan:** Kurangi pemberian pakan sementara waktu, lakukan pergantian air 30% dari dasar kolam.
4. **Pengobatan:** Berikan garam krosok (garam ikan) 1-3 kg per meter kubik air kolam, atau campur pakan dengan obat antibiotik ikan (seperti *Oxytetracycline*) sesuai dosis selama 3-5 hari.`;
    }
    if (msg.includes('pakan') || msg.includes('makan') || msg.includes('kurang nafsu')) {
      return `🐟 **Radeya AI Vet - Analisis Nafsu Makan Ikan Menurun**
1. Periksa suhu air kolam. Suhu dingin di musim hujan menurunkan metabolisme ikan sehingga mereka malas makan.
2. Cek kandungan oksigen terlarut (DO). Jika ikan sering menggantung di permukaan di pagi hari, berarti kolam kekurangan oksigen. Nyalakan aerator/kincir air.
3. Puasakan ikan selama 1-2 hari untuk membersihkan sistem pencernaan mereka, kemudian berikan pakan yang dicampur vitamin C/probiotik penambah nafsu makan.`;
    }
  }

  // Respon umum
  return `🌿 **Halo! Saya Radeya AI Assistant**
Ada yang bisa saya bantu terkait kesehatan, pakan, atau keuangan peternakan Anda? 
*Pertanyaan yang sering ditanyakan:*
- Gejala penyakit ternak (misal: "Ayam ngorok", "Kambing kembung", "Sapi pincang")
- Rekomendasi pakan dan nutrisi (misal: "formulasi ransum sapi")
- Manajemen finansial (misal: "hitung BEP biaya siklus")
 
Silakan ketik pertanyaan Anda secara spesifik. *(Saat ini sistem beroperasi dalam mode asisten lokal)*`;
}

// Fungsi untuk melakukan klasifikasi intent (VET, FEED, atau FINANCE)
export async function classifyIntent(message: string, geminiKey: string | undefined): Promise<'VET' | 'FEED' | 'FINANCE'> {
  if (!geminiKey) {
    return ruleBasedClassify(message);
  }

  try {
    const classificationPrompt = `Analyze the following user question from an Indonesian livestock breeder and classify it into exactly one of three categories:
- "VET": questions about animal diseases, symptoms, sickness, diagnoses, treatments, medicines, injuries, or deaths.
- "FEED": questions about feed formulation, nutrition, protein content (CP), feeding schedules, forage, concentrate, or food recipes.
- "FINANCE": questions about costs, expenses, budgets, selling prices, purchasing items, profits, losses, scale projections, or financial efficiency.

Return ONLY the classification category word in uppercase: either VET, FEED, or FINANCE. Do not include any other text or punctuation.

User question: "${message}"`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: classificationPrompt }] }]
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
      if (reply === 'VET' || reply === 'FEED' || reply === 'FINANCE') {
        return reply;
      }
    }
  } catch (error) {
    console.error('Gemini intent classification error:', error);
  }

  return ruleBasedClassify(message);
}

// Klasifikasi fallback berbasis aturan kata kunci
function ruleBasedClassify(message: string): 'VET' | 'FEED' | 'FINANCE' {
  const msg = message.toLowerCase();

  // Pencocokan kata kunci keuangan
  if (
    msg.includes('biaya') ||
    msg.includes('harga') ||
    msg.includes('untung') ||
    msg.includes('rugi') ||
    msg.includes('bep') ||
    msg.includes('modal') ||
    msg.includes('keuangan') ||
    msg.includes('pengeluaran') ||
    msg.includes('profit') ||
    msg.includes('finance') ||
    msg.includes('investasi') ||
    msg.includes('ekonomi') ||
    msg.includes('jual') ||
    msg.includes('beli') ||
    msg.includes('fcr')
  ) {
    return 'FINANCE';
  }

  // Pencocokan kata kunci pakan
  if (
    msg.includes('pakan') ||
    msg.includes('makan') ||
    msg.includes('nutrisi') ||
    msg.includes('ransum') ||
    msg.includes('protein') ||
    msg.includes('pearson') ||
    msg.includes('konsentrat') ||
    msg.includes('rumput') ||
    msg.includes('jerami') ||
    msg.includes('bekatul') ||
    msg.includes('formula')
  ) {
    return 'FEED';
  }

  // Default atau kesehatan
  return 'VET';
}

// Dispatcher utama
export async function agentDispatcher(
  message: string,
  animal: string,
  cycleId: string | undefined,
  orgId: string,
  geminiKey: string | undefined
): Promise<{ reply: string; agent: 'VET' | 'FEED' | 'FINANCE'; isOfflineFallback: boolean }> {
  
  const intent = await classifyIntent(message, geminiKey);
  
  if (!geminiKey) {
    // Jika tidak ada kunci API, gunakan fallback offline berbasis aturan
    const reply = getOfflineResponse(message, animal);
    return { reply, agent: intent, isOfflineFallback: true };
  }

  try {
    let reply = '';
    if (intent === 'FEED') {
      reply = await runFeedAgent(message, animal, cycleId, orgId, geminiKey);
    } else if (intent === 'FINANCE') {
      reply = await runFinanceAgent(message, animal, cycleId, orgId, geminiKey);
    } else {
      reply = await runVetAgent(message, animal, cycleId, orgId, geminiKey);
    }

    return { reply, agent: intent, isOfflineFallback: false };
  } catch (error) {
    console.error(`Error invoking ${intent} agent:`, error);
    // Jika API error di tengah jalan, fallback ke respon offline
    const reply = getOfflineResponse(message, animal);
    return { reply, agent: intent, isOfflineFallback: true };
  }
}
