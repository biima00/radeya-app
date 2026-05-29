'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import NewCycleWizard from '@/components/NewCycleWizard';

// --- TS Interfaces ---
interface Cycle {
  id: string;
  name: string;
  animal: string;
  scale: number;
  mode: string;
  data: {
    scaleString?: string;
    modal?: any;
    biaya?: any[];
    panen?: any[];
    penjualan?: any[];
    produksi?: any[];
    penetasan?: any[];
    kelahiran?: any[];
    harian?: any[];
    checkedTasks?: string[]; // Menyimpan daftar task harian yang sudah dicentang
  };
  createdAt: string;
}

// --- Constants ---
const ANIMAL_LABELS: Record<string, string> = {
  ayam_petelur: '🐔 Ayam Petelur',
  ayam_pedaging: '🍗 Ayam Pedaging',
  bebek_petelur: '🦆 Bebek Petelur',
  bebek_pedaging: '🦆 Bebek Pedaging',
  enthok_pedaging: '🦢 Entok Pedaging',
  sapi_perah: '🥛 Sapi Perah',
  sapi_pedaging: '🥩 Sapi Pedaging',
  kambing_perah: '🥛 Kambing Perah',
  kambing_pedaging: '🐐 Kambing Pedaging',
  ikan_pembesaran: '🐟 Ikan Pembesaran',
  ikan_pembibitan: '🐟 Ikan Pembibitan'
};

const ANIMAL_CATEGORIES: Record<string, string> = {
  ayam_pedaging: 'Unggas (Poultry)',
  ayam_petelur: 'Unggas (Poultry)',
  bebek_pedaging: 'Unggas (Poultry)',
  bebek_petelur: 'Unggas (Poultry)',
  enthok_pedaging: 'Unggas (Poultry)',
  sapi_pedaging: 'Ruminansia (Luminant)',
  sapi_perah: 'Ruminansia (Luminant)',
  kambing_pedaging: 'Ruminansia (Luminant)',
  kambing_perah: 'Ruminansia (Luminant)',
  ikan_pembesaran: 'Perikanan & Lainnya',
  ikan_pembibitan: 'Perikanan & Lainnya'
};

const SCALE_LABELS: Record<string, string> = {
  besar: 'Skala Besar / Komersil',
  kecil: 'Skala Kecil / Rumahan'
};

// --- SVGs Icons Pack for Professional SaaS UI ---
const Icons = {
  dashboard: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  modalAwal: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  biaya: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  panen: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  simulasi: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  plus: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  ),
  trash: (className = "w-4 h-4") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  export: (className = "w-4 h-4") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  calendar: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  aiVet: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  team: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
};

// --- Mappers ---
const scaleToInt = (scaleStr: string): number => {
  if (scaleStr === 'besar') return 1;
  if (scaleStr === 'kecil') return 2;
  if (scaleStr === 'breeding') return 3;
  return 1;
};

const intToScale = (scaleInt: number): string => {
  if (scaleInt === 1) return 'besar';
  if (scaleInt === 2) return 'kecil';
  if (scaleInt === 3) return 'breeding';
  return 'besar';
};

const determineMode = (animal: string, scaleStr: string): string => {
  const isPerah = ['sapi_perah', 'kambing_perah'].includes(animal);
  const isAyamPetelur = ['ayam_petelur', 'bebek_petelur'].includes(animal);
  const isRuminanPedaging = ['sapi_pedaging', 'kambing_pedaging'].includes(animal);
  const isUnggasPedagingOrIkan = [
    'ayam_pedaging',
    'bebek_pedaging',
    'enthok_pedaging',
    'ikan_pembesaran'
  ].includes(animal);
  const isPembibitanOrBreeding = ['ikan_pembibitan'].includes(animal);

  if (isPerah) return 'susu';
  if (isAyamPetelur) return 'petelur';
  if (isRuminanPedaging) return 'penggemukan';
  if (isUnggasPedagingOrIkan) return 'broiler';
  if (isPembibitanOrBreeding) return 'pembibitan_unggas';
  return 'broiler';
};

// --- Operational Task Templates ---
const getCalendarTasks = (animal: string, scale: string, startDate: Date) => {
  const formatTaskDate = (daysToAdd: number) => {
    const d = new Date(startDate.getTime());
    d.setDate(d.getDate() + daysToAdd);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isUnggas = [
    'ayam_petelur',
    'ayam_pedaging',
    'bebek_petelur',
    'bebek_pedaging',
    'enthok_pedaging'
  ].includes(animal);
  const isPedaging = [
    'ayam_pedaging',
    'bebek_pedaging',
    'enthok_pedaging',
    'sapi_pedaging',
    'kambing_pedaging',
    'ikan_pembesaran'
  ].includes(animal);
  const isPerah = ['sapi_perah', 'kambing_perah'].includes(animal);

  if (isUnggas && isPedaging) {
    // Broiler
    return [
      { id: 'br_d1', day: 1, date: formatTaskDate(0), title: 'DOC Tiba & Adaptasi', desc: 'Berikan air gula merah 2% + vitamin anti-stres segera setelah DOC masuk. Set suhu pemanas (brooder) di kisaran 32-33°C.' },
      { id: 'br_d4', day: 4, date: formatTaskDate(3), title: 'Vaksinasi ND-IB Pertama', desc: 'Lakukan vaksinasi Newcastle Disease (ND) dan Infectious Bronchitis (IB) menggunakan tetes mata atau tetes hidung.' },
      { id: 'br_d7', day: 7, date: formatTaskDate(6), title: 'Pelebaran Pen & Timbang Bobot', desc: 'Lebarkan sekat kandang agar anak ayam tidak terlalu padat. Ambil sampel timbang 10% populasi (Target bobot badan: ~180 gram).' },
      { id: 'br_d11', day: 11, date: formatTaskDate(10), title: 'Vaksinasi Gumboro (IBD)', desc: 'Berikan vaksin Gumboro aktif lewat air minum. Puasakan ayam makan pakan basah 1-2 jam sebelum pemberian vaksin agar memicu kehausan.' },
      { id: 'br_d14', day: 14, date: formatTaskDate(13), title: 'Pembalikan Sekam & Cek Bobot', desc: 'Balik sekam yang menggumpal dan tambahkan sekam baru tipis-tipis. Timbang sampel mingguan (Target bobot badan: ~450 gram).' },
      { id: 'br_d18', day: 18, date: formatTaskDate(17), title: 'Vaksinasi ND LaSota Booster', desc: 'Pemberian vaksin ND aktif LaSota lewat air minum kandang.' },
      { id: 'br_d21', day: 21, date: formatTaskDate(20), title: 'Pelebaran Sekat Maksimal', desc: 'Buka sekat pembatas kandang agar luas ruang terpakai optimal. Timbang bobot badan (Target: ~850 gram).' },
      { id: 'br_d28', day: 28, date: formatTaskDate(27), title: 'Evaluasi FCR & Bobot Pra-Panen', desc: 'Hitung FCR sementara. Rata-rata bobot badan ideal berkisar di 1.4kg - 1.6kg. Cek persediaan krat panen.' },
      { id: 'br_d33', day: 33, date: formatTaskDate(32), title: 'Persiapan Panen (Puasa Pakan)', desc: 'Lakukan puasa pakan 8 jam sebelum penangkapan ayam panen agar kotoran tidak mencemari krat. Berikan air minum bersih tetap jalan.' }
    ];
  } else if (isUnggas && !isPedaging) {
    // Layer (Ayam Petelur)
    return [
      { id: 'ly_d1', day: 1, date: formatTaskDate(0), title: 'Pullet Masuk Kandang', desc: 'Isolasi pullet di kandang baterai. Berikan vitamin anti-stres dalam air minum selama 3 hari berturut-turut.' },
      { id: 'ly_d7', day: 7, date: formatTaskDate(6), title: 'Timbang Bobot Awal', desc: 'Timbang pullet secara acak. Target keseragaman ukuran pullet (uniformity) di atas 85%.' },
      { id: 'ly_d14', day: 14, date: formatTaskDate(13), title: 'Potong Paruh & Sanitasi', desc: 'Lakukan potong paruh (debeaking) ujung paruh jika ada indikasi kanibalisme. Semprot desinfektan lantai kandang.' },
      { id: 'ly_d21', day: 21, date: formatTaskDate(20), title: 'Vaksinasi ND-EDS', desc: 'Lakukan vaksinasi suntik emulsi ND-EDS untuk menjaga kestabilan saluran reproduksi telur.' },
      { id: 'ly_d30', day: 30, date: formatTaskDate(29), title: 'Transisi Pakan Pre-Lay', desc: 'Campurkan pakan pullet dengan pakan layer (fase bertelur) bertahap dengan rasio 50:50.' },
      { id: 'ly_d45', day: 45, date: formatTaskDate(44), title: 'Cek Telur Pertama (Perdana)', desc: 'Evaluasi telur perdana kecil. Pastikan pasokan kalsium (grit/kulit kerang) tercampur baik di pakan.' },
      { id: 'ly_d60', day: 60, date: formatTaskDate(59), title: 'Evaluasi Hen Day (HD %)', desc: 'Hitung persentase produktivitas telur harian. Target Hen Day minggu ke-8 di atas 50%.' }
    ];
  } else if (!isUnggas && isPerah) {
    // Sapi / Kambing Perah
    return [
      { id: 'df_d1', day: 1, date: formatTaskDate(0), title: 'Sanitasi Puting & Uji Mastitis', desc: 'Pemeriksaan awal mastitis dengan cairan CMT (California Mastitis Test). Mulai sanitasi celup puting (teat dipping) sebelum dan sesudah diperah.' },
      { id: 'df_d3', day: 3, date: formatTaskDate(2), title: 'Obat Cacing & Vitamin', desc: 'Berikan obat cacing laktasi aman (seperti *Eprinomectin*) dan injeksi vitamin B-Kompleks.' },
      { id: 'df_d7', day: 7, date: formatTaskDate(6), title: 'Evaluasi Produksi Kolostrum', desc: 'Pastikan susu kolostrum awal hari 1-5 disalurkan khusus anak sapi (pedet). Hari ke-7 susu siap disetor komersil.' },
      { id: 'df_d14', day: 14, date: formatTaskDate(13), title: 'Vaksinasi PMK Pertama', desc: 'Berikan vaksin PMK (Penyakit Mulut dan Kuku) intramuskular di area leher hewan.' },
      { id: 'df_d30', day: 30, date: formatTaskDate(29), title: 'Uji Mastitis Bulanan', desc: 'Lakukan screening mastitis subklinis rutin ke seluruh sapi perah yang sedang laktasi.' },
      { id: 'df_d60', day: 60, date: formatTaskDate(59), title: 'Pemeriksaan Kebuntingan (PK)', desc: 'Lakukan pemeriksaan kebuntingan pasca Inseminasi Buatan (IB) oleh petugas inseminator.' }
    ];
  } else {
    // Sapi / Kambing Penggemukan & Breeding
    return [
      { id: 'fm_d1', day: 1, date: formatTaskDate(0), title: 'Bakalan Tiba & Istirahat', desc: 'Jangan langsung diberi pakan konsentrat berat. Berikan air minum hangat dicampur garam/gula merah + jerami kering.' },
      { id: 'fm_d3', day: 3, date: formatTaskDate(2), title: 'Obat Cacing & Antiseptik Kuku', desc: 'Pemberian obat cacing bolus (Albendazole) dan bersihkan sela kuku kaki ternak dengan tembaga sulfat.' },
      { id: 'fm_d7', day: 7, date: formatTaskDate(6), title: 'Timbang Bobot Awal Individual', desc: 'Pasang ear-tag penanda nomor ternak dan catat berat badan awal sebagai basis ADG bulanan.' },
      { id: 'fm_d14', day: 14, date: formatTaskDate(13), title: 'Vaksinasi PMK Dosis 1', desc: 'Lakukan vaksinasi PMK mencegah penyakit mulut kaki menular.' },
      { id: 'fm_d30', day: 30, date: formatTaskDate(29), title: 'Timbang Berat Badan Bulanan', desc: 'Hitung ADG (Average Daily Gain / Pertambahan Bobot Harian). Target sapi penggemukan: > 1.0kg/hari.' },
      { id: 'fm_d60', day: 60, date: formatTaskDate(59), title: 'Timbang Bulanan II & Cek Pakan', desc: 'Cek konsumsi serat kasar rumput segar dan ampas tahu/konsentrat. Sesuaikan protein pakan jika target ADG kurang.' },
      { id: 'fm_d90', day: 90, date: formatTaskDate(89), title: 'Vaksin PMK Booster', desc: 'Suntik vaksin PMK penguat agar antibodi ternak terjaga penuh sampai waktu panen.' }
    ];
  }
};

export default function DashboardPage() {
  const router = useRouter();

  // --- Core States ---
  const [farmName, setFarmName] = useState('');
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [activeCycleIndex, setActiveCycleIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Onboarding Setup States (If user has 0 cycles) ---
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [obStep, setObStep] = useState(1);
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [selectedScale, setSelectedScale] = useState('');

  // --- Modal Form States ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [formFields, setFormFields] = useState<any>({});
  const [previewVal, setPreviewVal] = useState('');

  // --- Confirm Modal States ---
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    msg: string;
    action: () => void;
    btnText: string;
    btnColor: string;
  }>({
    show: false,
    title: '',
    msg: '',
    action: () => {},
    btnText: 'Hapus',
    btnColor: 'bg-rose-600 hover:bg-rose-700'
  });

  // --- Toast Alert State ---
  const [toastMsg, setToastMsg] = useState('');

  // --- Push Notification States & Logic ---
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification("🎉 Notifikasi Aktif", {
          body: "Anda akan menerima pengingat pakan dan waktu jual ideal.",
        });
        showToast("🔔 Notifikasi browser berhasil diaktifkan!");
      } else {
        showToast("⚠️ Izin notifikasi browser ditolak.");
      }
    } else {
      showToast("❌ Browser Anda tidak mendukung Web Notifications.");
    }
  };

  const triggerNativeNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  // Helper to calculate optimal sale and generate notifications
  useEffect(() => {
    if (cycles.length === 0 || activeCycleIndex < 0) return;
    const activeCycle = cycles[activeCycleIndex];
    if (!activeCycle) return;

    const startDayTime = activeCycle.data?.modal?.tgl_doc || activeCycle.data?.modal?.tgl_pullet || activeCycle.data?.modal?.tgl_beli || activeCycle.createdAt;
    const parsedStartDate = new Date(startDayTime);
    const ageInDays = Math.floor((new Date().getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const animalName = ANIMAL_LABELS[activeCycle.animal] || activeCycle.animal;

    const generated: any[] = [];

    const jamPagi = activeCycle.data?.modal?.jam_pakan_pagi || '07:00';
    const jamSiang = activeCycle.data?.modal?.jam_pakan_siang || '12:00';
    const jamSore = activeCycle.data?.modal?.jam_pakan_sore || '16:00';

    // 1. Feeding Reminders
    generated.push({
      id: 'feed_morning',
      title: `🌅 Pakan Pagi (${jamPagi})`,
      desc: `Berikan pakan porsi pagi untuk ${animalName}. Pastikan air minum bersih tersedia.`,
      type: 'feeding',
      time: `Hari ini, ${jamPagi}`,
      read: false
    });
    generated.push({
      id: 'feed_midday',
      title: `☀️ Pakan Siang (${jamSiang})`,
      desc: `Pemberian pakan porsi siang dan cek suhu kandang/kolam.`,
      type: 'feeding',
      time: `Hari ini, ${jamSiang}`,
      read: false
    });
    generated.push({
      id: 'feed_afternoon',
      title: `🌇 Pakan Sore (${jamSore})`,
      desc: `Pemberian pakan porsi sore/malam untuk ${animalName}. Cek kebersihan tempat pakan.`,
      type: 'feeding',
      time: `Hari ini, ${jamSore}`,
      read: false
    });

    // 2. Optimal Selling Time Logic
    let idealMin = 0;
    let idealMax = 0;
    let category = ANIMAL_CATEGORIES[activeCycle.animal] || 'Lainnya';

    if (category.startsWith('Unggas') && ['ayam_pedaging', 'bebek_pedaging', 'enthok_pedaging'].includes(activeCycle.animal)) {
      idealMin = 30;
      idealMax = 35;
    } else if (category.startsWith('Ruminansia') && ['sapi_pedaging', 'kambing_pedaging'].includes(activeCycle.animal)) {
      idealMin = 90;
      idealMax = 100;
    } else if (category.startsWith('Perikanan') && ['ikan_pembesaran'].includes(activeCycle.animal)) {
      idealMin = 120;
      idealMax = 150;
    }

    if (idealMin > 0 && idealMax > 0) {
      if (ageInDays >= idealMin && ageInDays <= idealMax) {
        const title = '📈 Waktu Ideal Penjualan!';
        const body = `Siklus ${activeCycle.name} berada pada umur ideal (${ageInDays} hari). Jual sekarang untuk memaksimalkan keuntungan dan menghindari kerugian pakan berlebih!`;
        generated.unshift({
          id: 'optimal_sale',
          title,
          desc: body,
          type: 'sale',
          time: 'Rekomendasi Hari Ini',
          read: false
        });

        // Trigger browser notification once per cycle age
        const notiKey = `radeya_shown_sale_${activeCycle.id}_${ageInDays}`;
        if (!localStorage.getItem(notiKey)) {
          triggerNativeNotification(title, body);
          localStorage.setItem(notiKey, 'true');
        }
      } else if (ageInDays > idealMax) {
        const title = '🚨 Batas Optimal Terlewati!';
        const body = `Siklus ${activeCycle.name} sudah berumur ${ageInDays} hari (melebihi batas optimal ${idealMax} hari). Biaya pakan harian dapat mengurangi margin keuntungan bersih Anda!`;
        generated.unshift({
          id: 'overage_sale',
          title,
          desc: body,
          type: 'sale',
          time: 'Peringatan Kritis',
          read: false
        });

        const notiKey = `radeya_shown_overage_${activeCycle.id}_${ageInDays}`;
        if (!localStorage.getItem(notiKey)) {
          triggerNativeNotification(title, body);
          localStorage.setItem(notiKey, 'true');
        }
      } else {
        const daysLeft = idealMin - ageInDays;
        generated.push({
          id: 'pre_sale_info',
          title: '🌱 Masa Pemeliharaan',
          desc: `Siklus ${activeCycle.name} berumur ${ageInDays} hari. Perkiraan waktu penjualan ideal sekitar ${daysLeft} hari lagi (${idealMin}-${idealMax} hari).`,
          type: 'general',
          time: 'Info Siklus',
          read: false
        });
      }
    }

    setNotifications(generated);
  }, [cycles, activeCycleIndex]);

  // Simulation handlers
  const simulateFeedingNotification = () => {
    if (cycles.length === 0 || activeCycleIndex < 0) return;
    const activeCycle = cycles[activeCycleIndex];
    const animalName = ANIMAL_LABELS[activeCycle.animal] || activeCycle.animal;
    const title = '🔔 Pengingat Pakan (Simulasi)';
    const body = `Pemberian pakan porsi terjadwal untuk ${animalName} berhasil disimulasikan!`;
    
    // Add to list
    setNotifications(prev => [
      {
        id: 'sim_feed_' + Date.now(),
        title,
        desc: body,
        type: 'feeding',
        time: 'Baru saja',
        read: false
      },
      ...prev
    ]);

    triggerNativeNotification(title, body);
    showToast("🔊 Simulasi Notifikasi Pakan Terkirim!");
  };

  const simulateSaleNotification = () => {
    if (cycles.length === 0 || activeCycleIndex < 0) return;
    const activeCycle = cycles[activeCycleIndex];
    const title = '📈 Rekomendasi Penjualan (Simulasi)';
    const body = `Simulasi: Siklus ${activeCycle.name} mendekati batas optimal. Lakukan persiapan pemasaran sekarang!`;
    
    setNotifications(prev => [
      {
        id: 'sim_sale_' + Date.now(),
        title,
        desc: body,
        type: 'sale',
        time: 'Baru saja',
        read: false
      },
      ...prev
    ]);

    triggerNativeNotification(title, body);
    showToast("🔊 Simulasi Rekomendasi Penjualan Terkirim!");
  };

  // --- Profile & Subscription States ---
  const [profile, setProfile] = useState<any>({
    user: { role: 'OWNER', name: '', email: '' },
    organization: { plan: 'FREE', subscriptionActive: false, subscriptionEnd: null }
  });
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  // --- Team Management States ---
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // --- Simulation States ---
  const [simHarga, setSimHarga] = useState<number>(0);

  // --- AI Vet Chat States ---
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- Pearson Feed Formulation States ---
  const [pearsonTarget, setPearsonTarget] = useState<number>(18);
  const [pearsonIngA, setPearsonIngA] = useState<string>('Jagung');
  const [pearsonProtA, setPearsonProtA] = useState<number>(9);
  const [pearsonIngB, setPearsonIngB] = useState<string>('Konsentrat');
  const [pearsonProtB, setPearsonProtB] = useState<number>(36);
  const [pearsonTotalKg, setPearsonTotalKg] = useState<number>(100);

  // --- Manual FCR Calculator States ---
  const [manualFcrFeed, setManualFcrFeed] = useState<number>(1500);
  const [manualFcrWeight, setManualFcrWeight] = useState<number>(1000);

  // --- Fetch Data on Mount ---
  useEffect(() => {
    const token = localStorage.getItem('radeya_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load Midtrans Snap Script dynamically
    const script = document.createElement('script');
    const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    script.src = isProd
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    document.body.appendChild(script);

    fetchDashboardData();

    return () => {
      document.body.removeChild(script);
    };
  }, [router]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // 1. Fetch user & organization profile
      const profileData = await apiGet('/api/v1/profile');
      setProfile(profileData);

      if (profileData?.organization?.name) {
        setFarmName(profileData.organization.name);
        localStorage.setItem('radeya_farm_name', profileData.organization.name);
      }

      // 2. Fetch cycles
      const data = await apiGet('/api/v1/cycles');
      if (data && data.length > 0) {
        setCycles(data);
        setActiveCycleIndex(0);
        setIsOnboarding(false);
        setActiveTab('dashboard');
      } else {
        setIsOnboarding(true);
        setObStep(1);
      }

      // 3. Fetch team members if Enterprise & Owner
      if (
        profileData?.organization?.plan === 'ENTERPRISE' &&
        profileData?.user?.role === 'OWNER'
      ) {
        const team = await apiGet('/api/v1/team');
        setTeamMembers(team);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyinkronkan data.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleSignOut = () => {
    localStorage.removeItem('radeya_token');
    localStorage.removeItem('radeya_org_id');
    localStorage.removeItem('radeya_farm_name');
    router.push('/login');
  };

  const handleCheckoutMidtrans = async (selectedPlan: 'PRO' | 'ENTERPRISE') => {
    setBillingLoading(true);
    try {
      const res = await apiPost('/api/v1/billing/checkout', { plan: selectedPlan });
      if (res.redirect_url) {
        showToast('⏳ Mengalihkan ke halaman pembayaran...');
        window.location.href = res.redirect_url;
      } else if (res.token) {
        // @ts-ignore
        if (window.snap && typeof window.snap.pay === 'function') {
          // @ts-ignore
          window.snap.pay(res.token, {
            onSuccess: async function (result: any) {
              showToast('🎉 Pembayaran sukses! Mengubah paket...');
              await fetchDashboardData();
              setBillingModalOpen(false);
            },
            onPending: function (result: any) {
              showToast('⏳ Menunggu pembayaran...');
            },
            onError: function (result: any) {
              showToast('❌ Pembayaran gagal. Silakan coba lagi.');
            },
            onClose: function () {
              showToast('ℹ️ Pembayaran dibatalkan.');
            }
          });
        } else {
          throw new Error('Metode pembayaran Snap tidak tersedia.');
        }
      } else {
        throw new Error('Gagal memproses pembayaran (Token kosong)');
      }
    } catch (err: any) {
      showToast('❌ Error: ' + err.message);
    } finally {
      setBillingLoading(false);
    }
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail || !newMemberPassword) return;
    setIsAddingMember(true);
    try {
      await apiPost('/api/v1/team', {
        name: newMemberName,
        email: newMemberEmail,
        password: newMemberPassword
      });
      showToast('🎉 Berhasil menambahkan anggota tim!');
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPassword('');
      // Reload list tim
      const team = await apiGet('/api/v1/team');
      setTeamMembers(team);
    } catch (err: any) {
      showToast('❌ Gagal: ' + err.message);
    } finally {
      setIsAddingMember(false);
    }
  };

  // --- API Actions ---
  const handleSaveCycleData = async (updatedData: any) => {
    if (activeCycleIndex < 0 || !cycles[activeCycleIndex]) return;
    const activeCycle = cycles[activeCycleIndex];
    try {
      const result = await apiPatch(`/api/v1/cycles/${activeCycle.id}`, {
        data: updatedData
      });
      setCycles((prev) => {
        const next = [...prev];
        next[activeCycleIndex] = result;
        return next;
      });
    } catch (err: any) {
      showToast('❌ Gagal menyimpan ke cloud: ' + err.message);
    }
  };

  const handleCreateCycle = async (name: string, animal: string, scaleStr: string, modalData: any = {}) => {
    if (scaleStr === 'besar' && profile?.organization?.plan === 'FREE') {
      showToast('⚠️ Skala Besar / Komersil hanya tersedia untuk paket PRO & ENTERPRISE!');
      setBillingModalOpen(true);
      return;
    }
    setIsLoading(true);
    try {
      const mode = determineMode(animal, scaleStr);
      const initialData = {
        scaleString: scaleStr,
        modal: modalData,
        biaya: [],
        panen: [],
        penjualan: [],
        produksi: [],
        penetasan: [],
        kelahiran: [],
        harian: [],
        checkedTasks: []
      };

      const newCycle = await apiPost('/api/v1/cycles', {
        name,
        animal,
        scale: scaleToInt(scaleStr),
        mode,
        data: initialData
      });

      setCycles((prev) => [newCycle, ...prev]);
      setActiveCycleIndex(0);
      setIsOnboarding(false);
      setActiveTab('dashboard');
      showToast('✅ Siklus baru berhasil dibuat');
    } catch (err: any) {
      setError(err.message || 'Gagal membuat siklus baru.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCycle = async () => {
    if (activeCycleIndex < 0 || !cycles[activeCycleIndex]) return;
    const activeCycle = cycles[activeCycleIndex];
    try {
      await apiDelete(`/api/v1/cycles/${activeCycle.id}`);
      showToast('🗑️ Siklus berhasil dihapus');
      fetchDashboardData();
    } catch (err: any) {
      showToast('❌ Gagal menghapus: ' + err.message);
    }
  };

  // --- Onboarding Handlers ---
  const handleOnboardingSubmit = () => {
    if (!selectedAnimal || !selectedScale) return;
    handleCreateCycle('Siklus 1', selectedAnimal, selectedScale);
  };

  // --- Helper Calculations ---
  const getActiveCycle = (): Cycle | null => {
    if (activeCycleIndex >= 0 && cycles[activeCycleIndex]) {
      return cycles[activeCycleIndex];
    }
    return null;
  };

  const getTabsForMode = (mode: string) => {
    let baseTabs = [];
    switch (mode) {
      case 'broiler':
        baseTabs = [
          { id: 'dashboard', icon: Icons.dashboard(), label: 'Dashboard' },
          { id: 'modal_awal', icon: Icons.modalAwal(), label: 'Modal Awal' },
          { id: 'biaya', icon: Icons.biaya(), label: 'Biaya' },
          { id: 'panen', icon: Icons.panen(), label: 'Panen' },
          { id: 'simulasi', icon: Icons.simulasi(), label: 'Simulasi' }
        ];
        break;
      case 'petelur':
        baseTabs = [
          { id: 'dashboard', icon: Icons.dashboard(), label: 'Dashboard' },
          { id: 'modal_awal', icon: Icons.modalAwal(), label: 'Modal Awal' },
          { id: 'biaya', icon: Icons.biaya(), label: 'Biaya' },
          { id: 'panen', icon: Icons.panen(), label: 'Produksi' },
          { id: 'penjualan', icon: Icons.modalAwal(), label: 'Penjualan' },
          { id: 'simulasi', icon: Icons.simulasi(), label: 'Simulasi' }
        ];
        break;
      case 'pembibitan_unggas':
        baseTabs = [
          { id: 'dashboard', icon: Icons.dashboard(), label: 'Dashboard' },
          { id: 'modal_awal', icon: Icons.modalAwal(), label: 'Modal Awal' },
          { id: 'biaya', icon: Icons.biaya(), label: 'Telur' },
          { id: 'panen', icon: Icons.panen(), label: 'Penetasan' },
          { id: 'penjualan', icon: Icons.modalAwal(), label: 'Penjualan' }
        ];
        break;
      case 'penggemukan':
        baseTabs = [
          { id: 'dashboard', icon: Icons.dashboard(), label: 'Dashboard' },
          { id: 'modal_awal', icon: Icons.modalAwal(), label: 'Modal Awal' },
          { id: 'biaya', icon: Icons.biaya(), label: 'Biaya' },
          { id: 'panen', icon: Icons.panen(), label: 'Panen' },
          { id: 'simulasi', icon: Icons.simulasi(), label: 'Simulasi' }
        ];
        break;
      case 'susu':
        baseTabs = [
          { id: 'dashboard', icon: Icons.dashboard(), label: 'Dashboard' },
          { id: 'modal_awal', icon: Icons.modalAwal(), label: 'Modal Awal' },
          { id: 'biaya', icon: Icons.biaya(), label: 'Biaya' },
          { id: 'panen', icon: Icons.panen(), label: 'Produksi' },
          { id: 'penjualan', icon: Icons.modalAwal(), label: 'Penjualan' },
          { id: 'simulasi', icon: Icons.simulasi(), label: 'Simulasi' }
        ];
        break;
      case 'breeding_ruminansia':
        baseTabs = [
          { id: 'dashboard', icon: Icons.dashboard(), label: 'Dashboard' },
          { id: 'modal_awal', icon: Icons.modalAwal(), label: 'Modal Awal' },
          { id: 'panen', icon: Icons.panen(), label: 'Kelahiran' },
          { id: 'penjualan', icon: Icons.modalAwal(), label: 'Penjualan' }
        ];
        break;
      default:
        baseTabs = [{ id: 'dashboard', icon: Icons.dashboard(), label: 'Dashboard' }];
    }
    const finalTabs = [...baseTabs];
    finalTabs.push({ id: 'jadwal_kerja', icon: Icons.calendar(), label: 'Jadwal Kerja' });

    const isFree = profile?.organization?.plan === 'FREE';
    finalTabs.push({
      id: 'ai_vet',
      icon: Icons.aiVet(),
      label: isFree ? 'AI Vet 🔒' : 'AI Vet'
    });

    if (profile?.user?.role === 'OWNER') {
      finalTabs.push({
        id: 'team_management',
        icon: Icons.team(),
        label: profile?.organization?.plan === 'ENTERPRISE' ? 'Kelola Tim' : 'Kelola Tim 🔒'
      });
    }

    return finalTabs;
  };

  const getScaleOptions = (animal: string) => {
    return [
      { val: 'besar', icon: '🏭', title: 'Skala Besar / Komersil', desc: 'Operasional kapasitas besar & modern' },
      { val: 'kecil', icon: '🏡', title: 'Skala Kecil / Rumahan', desc: 'Operasional kapasitas terbatas & rumahan' }
    ];
  };

  // --- Business Logic Calculation Core ---
  const calculateStats = () => {
    const cycle = getActiveCycle();
    if (!cycle) return null;

    const data = cycle.data || {};
    const mode = cycle.mode;
    const m = data.modal || {};

    const startDayTime = m.tgl_doc || m.tgl_pullet || m.tgl_beli || m.tgl_indukan || m.tgl_mulai || cycle.createdAt;
    const tglStart = startDayTime ? new Date(startDayTime) : null;
    const umur = tglStart ? Math.max(0, Math.floor((new Date().getTime() - tglStart.getTime()) / 86400000)) : 0;

    const biayaKandang = parseFloat(m.kandang_total) || parseFloat(m.biaya_kandang) || 0;
    const manfaatTahun = parseFloat(m.kandang_manfaat_tahun) || 5;
    const depresiasiHarian = biayaKandang / (manfaatTahun * 365);
    const depresiasiKandang = Math.round(depresiasiHarian * umur);

    if (mode === 'broiler') {
      const totalDOC = (parseFloat(m.jml_doc) || 0) * (parseFloat(m.harga_doc) || 0);
      let totalPakan = 0, totalObat = 0, totalLain = 0;
      (data.biaya || []).forEach((b: any) => {
        if (b.type === 'pakan') totalPakan += parseFloat(b.total) || 0;
        else if (b.type === 'obat') totalObat += parseFloat(b.total) || 0;
        else totalLain += parseFloat(b.total) || 0;
      });
      const totalModal = totalDOC + biayaKandang + totalPakan + totalObat + totalLain;
      let totalPendapatan = 0, totalKgPanen = 0;
      const panen = data.panen || [];
      panen.forEach((p: any) => {
        totalPendapatan += (parseFloat(p.kg) || 0) * (parseFloat(p.harga_kg) || 0);
        totalKgPanen += parseFloat(p.kg) || 0;
      });
      const ebitda = totalPendapatan - (totalDOC + totalPakan + totalObat + totalLain);
      const laba = ebitda - depresiasiKandang;
      const mati = panen.reduce((s: number, p: any) => s + (parseFloat(p.jml_mati) || 0), 0);
      const jmlDoc = parseFloat(m.jml_doc) || 1;
      const srPct = ((jmlDoc - mati) / jmlDoc) * 100;
      const hpp = totalKgPanen > 0 ? totalModal / totalKgPanen : 0;
      const totalKgPakan = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => {
        const sak = parseFloat(b.sak) || 0;
        const kgSak = parseFloat(b.kg_sak) || 0;
        return s + sak * kgSak;
      }, 0);
      const fcr = totalKgPanen > 0 ? totalKgPakan / totalKgPanen : 0;
      const bbRata = jmlDoc > 0 ? totalKgPanen / (jmlDoc - mati) || 0 : 0;
      const ip = (fcr > 0 && umur > 0) ? (srPct / 100 * bbRata) / (fcr * umur) * 100 : 0;

      return {
        totalModal, totalPendapatan, laba, ebitda, depresiasi: depresiasiKandang, totalKgPanen, hpp, fcr, srPct, umur, ip, mati, jmlDoc,
        breakdown: [
          { label: 'DOC', val: totalDOC },
          { label: 'Kandang (Investasi)', val: biayaKandang },
          { label: 'Pakan', val: totalPakan },
          { label: 'Obat/Vaksin', val: totalObat },
          { label: 'Lain-lain', val: totalLain }
        ]
      };
    }

    if (mode === 'petelur') {
      const totalIndukan = (parseFloat(m.jml_ekor) || 0) * (parseFloat(m.harga_ekor) || 0);
      let totalBiaya = 0;
      (data.biaya || []).forEach((b: any) => totalBiaya += parseFloat(b.total) || 0);
      const totalModal = totalIndukan + biayaKandang + totalBiaya;

      let totalButir = 0, totalKgTelur = 0, totalRetak = 0;
      (data.harian || []).forEach((h: any) => {
        totalButir += parseFloat(h.butir) || 0;
        totalKgTelur += parseFloat(h.kg) || 0;
        totalRetak += parseFloat(h.retak) || 0;
      });

      let totalPendapatan = 0;
      (data.penjualan || []).forEach((p: any) => totalPendapatan += (parseFloat(p.kg) || 0) * (parseFloat(p.harga_kg) || 0));
      
      const ebitda = totalPendapatan - (totalIndukan + totalBiaya);
      const laba = ebitda - depresiasiKandang;

      const jmlAyam = parseFloat(m.jml_ekor) || 1;
      const henDay = (data.harian || []).length > 0 ? (totalButir / (data.harian || []).length / jmlAyam) * 100 : 0;

      const totalKgPakan = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => {
        return s + (parseFloat(b.sak) || 0) * (parseFloat(b.kg_sak) || 0);
      }, 0);
      const fcrTelur = totalKgTelur > 0 ? totalKgPakan / totalKgTelur : 0;
      const hppButir = totalButir > 0 ? totalModal / totalButir : 0;
      const hppKg = totalKgTelur > 0 ? totalModal / totalKgTelur : 0;

      return { totalModal, totalPendapatan, laba, ebitda, depresiasi: depresiasiKandang, umur, totalButir, totalKgTelur, totalRetak, henDay, fcrTelur, hppButir, hppKg };
    }

    if (mode === 'pembibitan_unggas') {
      const totalIndukan = ((parseFloat(m.jml_betina) || 0) + (parseFloat(m.jml_jantan) || 0)) * (parseFloat(m.harga_indukan) || 0);
      const totalBiaya = (data.biaya || []).reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      const totalModal = totalIndukan + biayaKandang + totalBiaya;

      const telurMasukTetas = (data.produksi || []).reduce((s: number, p: any) => s + (parseFloat(p.masuk_tetas) || 0), 0);
      const docMenetas = (data.penetasan || []).reduce((s: number, p: any) => s + (parseFloat(p.berhasil) || 0), 0);
      const gagalTetas = (data.penetasan || []).reduce((s: number, p: any) => s + (parseFloat(p.gagal) || 0), 0);
      const dayaTetas = telurMasukTetas > 0 ? (docMenetas / telurMasukTetas) * 100 : 0;

      const totalTerjual = (data.penjualan || []).reduce((s: number, p: any) => s + (parseFloat(p.jml) || 0), 0);
      const totalPendapatan = (data.penjualan || []).reduce((s: number, p: any) => s + (parseFloat(p.total) || 0), 0);

      const jmlBetina = parseFloat(m.jml_betina) || 0;
      const jmlJantan = parseFloat(m.jml_jantan) || 0;
      const populasi = jmlBetina + jmlJantan + docMenetas - totalTerjual;
      
      const ebitda = totalPendapatan - (totalIndukan + totalBiaya);
      const laba = ebitda - depresiasiKandang;
      const margin = totalModal > 0 ? (laba / totalModal) * 100 : 0;

      return { totalModal, totalPendapatan, laba, ebitda, depresiasi: depresiasiKandang, umur, margin, dayaTetas, docMenetas, populasi, telurMasukTetas, gagalTetas };
    }

    if (mode === 'penggemukan') {
      const jmlEkor = parseFloat(m.jml_ekor) || 0;
      const bbAwal = parseFloat(m.bb_awal) || 0;
      const hargaBakalan = parseFloat(m.harga_kg_bakalan) || 0;
      const totalBakalan = jmlEkor * bbAwal * hargaBakalan;
      const totalBiaya = (data.biaya || []).reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      const totalModal = totalBakalan + biayaKandang + totalBiaya;

      let totalPendapatan = 0, totalKgPanen = 0;
      const panen = data.panen || [];
      panen.forEach((p: any) => {
        const bbAkhir = parseFloat(p.bb_akhir) || 0;
        const jmlJual = parseFloat(p.jml_jual) || jmlEkor;
        const harga = parseFloat(p.harga_kg) || 0;
        const kg = bbAkhir * jmlJual;
        totalPendapatan += kg * harga;
        totalKgPanen += kg;
      });

      const ebitda = totalPendapatan - (totalBakalan + totalBiaya);
      const laba = ebitda - depresiasiKandang;
      const hpp = totalKgPanen > 0 ? totalModal / totalKgPanen : 0;
      const totalKgPakan = (data.biaya || []).reduce((s: number, b: any) => s + (parseFloat(b.kg) || 0), 0);
      const fcr = totalKgPanen > 0 ? totalKgPakan / totalKgPanen : 0;

      const bbAkhirRata = panen.length > 0 ? parseFloat(panen[panen.length - 1].bb_akhir) || 0 : 0;
      const adg = umur > 0 ? (bbAkhirRata - bbAwal) / umur * 1000 : 0;
      const mati = panen.reduce((s: number, p: any) => s + (parseFloat(p.jml_mati) || 0), 0);
      const srPct = jmlEkor > 0 ? ((jmlEkor - mati) / jmlEkor) * 100 : 100;

      return { totalModal, totalPendapatan, laba, ebitda, depresiasi: depresiasiKandang, umur, hpp, fcr, adg, lamaHari: umur, totalKgPanen, srPct, mati, jmlDoc: jmlEkor };
    }

    if (mode === 'susu') {
      const totalIndukan = (parseFloat(m.jml_ekor) || 0) * (parseFloat(m.harga_ekor) || 0);
      const totalBiaya = (data.biaya || []).reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      const totalModal = totalIndukan + biayaKandang + totalBiaya;

      const totalLiter = (data.harian || []).reduce((s: number, h: any) => s + (parseFloat(h.liter) || 0), 0);
      const totalPendapatan = (data.penjualan || []).reduce((s: number, p: any) => s + (parseFloat(p.total) || 0), 0);
      
      const ebitda = totalPendapatan - (totalIndukan + totalBiaya);
      const laba = ebitda - depresiasiKandang;

      const jmlEkor = parseFloat(m.jml_ekor) || 1;
      const hariProduksi = (data.harian || []).length;
      const produksiRata = hariProduksi > 0 ? totalLiter / hariProduksi / jmlEkor : 0;

      const totalKgPakanKering = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => s + (parseFloat(b.kg) || 0), 0);
      const fcrSusu = totalLiter > 0 ? totalKgPakanKering / totalLiter : 0;
      const hppLiter = totalLiter > 0 ? totalModal / totalLiter : 0;

      return { totalModal, totalPendapatan, laba, ebitda, depresiasi: depresiasiKandang, umur, totalLiter, produksiRata, fcrSusu, hppLiter };
    }

    if (mode === 'breeding_ruminansia') {
      const jmlBetina = parseFloat(m.jml_betina) || 0;
      const jmlJantan = parseFloat(m.jml_jantan) || 0;
      const hargaEkor = parseFloat(m.harga_ekor) || 0;
      const totalIndukan = (jmlBetina + jmlJantan) * hargaEkor;
      const totalBiaya = (data.biaya || []).reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      const totalModal = totalIndukan + biayaKandang + totalBiaya;

      let totalLahir = 0, totalLahirJantan = 0, totalLahirBetina = 0;
      (data.kelahiran || []).forEach((k: any) => {
        totalLahirJantan += parseFloat(k.jantan) || 0;
        totalLahirBetina += parseFloat(k.betina) || 0;
        totalLahir += (parseFloat(k.jantan) || 0) + (parseFloat(k.betina) || 0);
      });

      const totalJual = (data.penjualan || []).reduce((s: number, p: any) => s + (parseFloat(p.jml) || 0), 0);
      const totalPendapatan = (data.penjualan || []).reduce((s: number, p: any) => s + (parseFloat(p.total) || 0), 0);

      const populasiBetina = jmlBetina + totalLahirBetina - (data.penjualan || []).filter((p: any) => p.jenis === 'betina').reduce((s: number, p: any) => s + (parseFloat(p.jml) || 0), 0);
      const populasiJantan = jmlJantan + totalLahirJantan - (data.penjualan || []).filter((p: any) => p.jenis === 'jantan').reduce((s: number, p: any) => s + (parseFloat(p.jml) || 0), 0);
      const populasiTotal = jmlBetina + jmlJantan + totalLahir - totalJual;

      const hargaPasar = parseFloat(m.harga_pasar) || 0;
      const bobotTaksiran = parseFloat(m.bobot_taksiran) || 30;
      const nilaiAset = populasiTotal * bobotTaksiran * hargaPasar;

      const ebitda = totalPendapatan - (totalIndukan + totalBiaya);
      const laba = ebitda - depresiasiKandang;
      const keuntunganPct = totalModal > 0 ? (laba / totalModal) * 100 : 0;

      return { totalModal, totalPendapatan, laba, ebitda, depresiasi: depresiasiKandang, umur, keuntunganPct, populasiTotal, populasiBetina, populasiJantan, totalLahir, nilaiAset };
    }

    return null;
  };

  // --- Currency Formatter ---
  const formatRp = (val: any) => {
    const n = parseFloat(val) || 0;
    if (Math.abs(n) >= 1000000) return (n < 0 ? '-' : '') + 'Rp' + (Math.abs(n) / 1000000).toFixed(2) + ' jt';
    if (Math.abs(n) >= 1000) return (n < 0 ? '-' : '') + 'Rp ' + Math.abs(n).toLocaleString('id-ID');
    return (n < 0 ? '-' : '') + 'Rp ' + Math.abs(n).toFixed(0);
  };

  // --- Dynamic SVG Line Chart for Production ---
  const renderSVGLineChart = () => {
    const cycle = getActiveCycle();
    if (!cycle) return null;

    let points: Array<{ date: string; value: number }> = [];
    let title = 'Grafik Produksi';
    let unit = '';

    if (cycle.mode === 'petelur') {
      points = (cycle.data?.harian || []).map((h: any) => ({
        date: h.tgl.slice(5),
        value: parseFloat(h.butir) || 0
      }));
      title = 'Tren Produksi Telur (Butir)';
      unit = 'butir';
    } else if (cycle.mode === 'susu') {
      points = (cycle.data?.harian || []).map((h: any) => ({
        date: h.tgl.slice(5),
        value: parseFloat(h.liter) || 0
      }));
      title = 'Tren Produksi Susu (Liter)';
      unit = 'L';
    } else if (cycle.mode === 'pembibitan_unggas') {
      points = (cycle.data?.produksi || []).map((p: any) => ({
        date: p.periode,
        value: parseFloat(p.dikumpulkan) || 0
      }));
      title = 'Tren Telur Dikumpulkan';
      unit = 'butir';
    }

    // Sort by date key or string
    points = points.sort((a, b) => a.date.localeCompare(b.date));

    if (points.length < 2) {
      return (
        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl text-center py-12 text-slate-500 text-xs">
          📈 Grafik Tren Produksi akan muncul otomatis setelah Anda mencatat minimal 2 entri data harian.
        </div>
      );
    }

    const maxVal = Math.max(...points.map((p) => p.value)) || 10;
    const minVal = Math.min(...points.map((p) => p.value)) || 0;
    const range = maxVal - minVal || 10;
    const height = 180;
    const width = 600;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const getX = (idx: number) => paddingLeft + (idx / (points.length - 1)) * chartWidth;
    const getY = (val: number) => height - paddingBottom - ((val - minVal) / range) * chartHeight;

    const pathData = points.reduce((acc, p, idx) => {
      const x = getX(idx);
      const y = getY(p.value);
      return acc + `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');

    // Path area for background gradient
    const fillPathData = pathData + 
      ` L ${getX(points.length - 1).toFixed(1)} ${(height - paddingBottom).toFixed(1)}` +
      ` L ${getX(0).toFixed(1)} ${(height - paddingBottom).toFixed(1)} Z`;

    return (
      <div className="bg-slate-900/40 border border-teal-500/10 p-6 rounded-3xl shadow-xl">
        <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>📈</span> {title}
        </h4>
        
        <div className="w-full overflow-x-auto no-scrollbar">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto overflow-visible">
            <defs>
              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0D9488" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
              const y = paddingTop + p * chartHeight;
              const val = maxVal - p * range;
              return (
                <g key={i}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={paddingLeft - 10} y={y + 4} textAnchor="end" className="text-[10px] font-bold fill-slate-500 font-mono">
                    {val.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Shaded Area */}
            <path d={fillPathData} fill="url(#chartGlow)" />

            {/* Value Line */}
            <path d={pathData} fill="none" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Nodes and X labels */}
            {points.map((p, idx) => {
              const x = getX(idx);
              const y = getY(p.value);
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="4" className="fill-teal-400 stroke-slate-950 stroke-2" />
                  {/* Tooltip text on top of dots if small array */}
                  {points.length <= 10 && (
                    <text x={x} y={y - 8} textAnchor="middle" className="text-[9px] font-black fill-teal-300 font-mono">
                      {p.value}
                    </text>
                  )}
                  {/* Date/X Label */}
                  <text x={x} y={height - 8} textAnchor="middle" className="text-[9px] font-bold fill-slate-550 font-mono">
                    {p.date}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // --- Circular Gauge for Survival Rate ---
  const renderSVGGauge = (srPct: number, mati: number, total: number) => {
    const size = 150;
    const strokeWidth = 12;
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const fillValue = (srPct / 100) * circ;
    
    let colorClass = 'stroke-teal-500';
    if (srPct < 90) colorClass = 'stroke-amber-500';
    if (srPct < 80) colorClass = 'stroke-rose-500';

    return (
      <div className="bg-slate-900/40 border border-teal-500/10 p-6 rounded-3xl shadow-xl flex flex-col items-center text-center justify-center">
        <h4 className="text-sm font-bold text-slate-200 mb-4 self-start flex items-center gap-2">
          <span>🩺</span> Tingkat Kelangsungan Hidup (SR)
        </h4>

        <div className="relative w-[150px] h-[150px] mb-3">
          <svg className="w-full h-full -rotate-90">
            {/* Background Track */}
            <circle cx={size / 2} cy={size / 2} r={r} className="stroke-slate-800 fill-none" strokeWidth={strokeWidth} />
            {/* Filled Progress arc */}
            <circle 
              cx={size / 2} 
              cy={size / 2} 
              r={r} 
              className={`fill-none transition-all duration-1000 ${colorClass}`} 
              strokeWidth={strokeWidth} 
              strokeDasharray={circ} 
              strokeDashoffset={circ - fillValue} 
              strokeLinecap="round"
            />
          </svg>
          {/* Inner Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white font-mono">{srPct.toFixed(1)}%</span>
            <span className="text-[9px] text-slate-550 font-bold tracking-wider uppercase">Survival Rate</span>
          </div>
        </div>
        
        <p className="text-xs font-semibold text-slate-400">
          Kematian: <strong className="text-rose-400 font-mono">{mati}</strong> / {total} ekor
        </p>
      </div>
    );
  };

  // --- Modal Forms Renderer ---
  const openModalForm = (type: string) => {
    const cycle = getActiveCycle();
    if (!cycle) return;

    setActiveModal(type);
    const todayStr = new Date().toISOString().slice(0, 10);

    if (type === 'modal_pakan') {
      setModalTitle('🌾 Tambah Pakan');
      setFormFields({ tgl: todayStr, jenis: 'Pakan Utama', sak: '', kg_sak: '50', harga_sak: '' });
      setPreviewVal('Rp 0');
    } else if (type === 'modal_obat') {
      setModalTitle('💊 Tambah Obat/Vaksin');
      setFormFields({ tgl: todayStr, nama: '', ket: '', total: '' });
    } else if (type === 'modal_lain') {
      setModalTitle('📦 Tambah Biaya Lain');
      setFormFields({ tgl: todayStr, nama: '', ket: '', total: '' });
    } else if (type === 'modal_panen_broiler') {
      setModalTitle('🎯 Catat Panen');
      setFormFields({ tgl: todayStr, kg: '', harga_kg: '', jml_mati: '0' });
    } else if (type === 'modal_harian_petelur') {
      setModalTitle('🥚 Produksi Harian');
      setFormFields({ tgl: todayStr, butir: '', kg: '', retak: '0' });
    } else if (type === 'modal_jual_petelur') {
      setModalTitle('💰 Catat Penjualan Telur');
      setFormFields({ tgl: todayStr, kg: '', harga_kg: '' });
    } else if (type === 'modal_telur_pembibitan') {
      setModalTitle('🥚 Catat Telur');
      setFormFields({ periode: `Minggu ke-${(cycle.data?.produksi?.length || 0) + 1}`, dikumpulkan: '', masuk_tetas: '' });
    } else if (type === 'modal_penetasan') {
      setModalTitle('🐣 Catat Penetasan');
      setFormFields({ tgl: todayStr, berhasil: '', gagal: '0' });
    } else if (type === 'modal_jual_doc') {
      setModalTitle('💰 Catat Penjualan');
      setFormFields({ tgl: todayStr, tipe: 'DOC', jml: '', harga_ekor: '' });
      setPreviewVal('Rp 0');
    } else if (type === 'modal_biaya_ruminansia' || type === 'modal_biaya_susu') {
      setModalTitle('🌿 Tambah Biaya Operasional');
      setFormFields({ tgl: todayStr, type: 'pakan', nama: '', kg: '0', total: '' });
    } else if (type === 'modal_panen_penggemukan') {
      setModalTitle('🎯 Catat Penjualan/Panen');
      setFormFields({ tgl: todayStr, jml_jual: '', bb_akhir: '', harga_kg: '', jml_mati: '0' });
    } else if (type === 'modal_harian_susu') {
      setModalTitle('🥛 Produksi Susu Harian');
      setFormFields({ tgl: todayStr, liter: '' });
    } else if (type === 'modal_jual_susu') {
      setModalTitle('💰 Catat Setoran Susu');
      setFormFields({ tgl: todayStr, liter: '', harga_liter: '' });
      setPreviewVal('Rp 0');
    } else if (type === 'modal_kelahiran') {
      setModalTitle('🐣 Catat Kelahiran');
      setFormFields({ tgl: todayStr, id_induk: '', jantan: '0', betina: '0' });
    } else if (type === 'modal_jual_breeding') {
      setModalTitle('💰 Catat Penjualan');
      setFormFields({ tgl: todayStr, kategori: 'Bakalan', jenis: 'jantan', jml: '', harga_ekor: '' });
      setPreviewVal('Rp 0');
    }
  };

  const handleModalFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cycle = getActiveCycle();
    if (!cycle) return;

    const data = { ...cycle.data };

    if (activeModal === 'modal_pakan') {
      const { tgl, jenis, sak, kg_sak, harga_sak } = formFields;
      if (!sak || !harga_sak) return;
      const total = (parseFloat(sak) || 0) * (parseFloat(harga_sak) || 0);
      data.biaya = [...(data.biaya || []), { type: 'pakan', tgl, jenis, sak, kg_sak, harga_sak, total }];
      showToast('✅ Pakan tersimpan!');
    } else if (activeModal === 'modal_obat') {
      const { tgl, nama, ket, total } = formFields;
      if (!total) return;
      data.biaya = [...(data.biaya || []), { type: 'obat', tgl, nama, keterangan: ket, total: parseFloat(total) }];
      showToast('✅ Obat tersimpan!');
    } else if (activeModal === 'modal_lain') {
      const { tgl, nama, ket, total } = formFields;
      if (!total) return;
      data.biaya = [...(data.biaya || []), { type: 'lain', tgl, nama, keterangan: ket, total: parseFloat(total) }];
      showToast('✅ Biaya tersimpan!');
    } else if (activeModal === 'modal_panen_broiler') {
      const { tgl, kg, harga_kg, jml_mati } = formFields;
      if (!kg || !harga_kg) return;
      data.panen = [...(data.panen || []), { tgl, kg: parseFloat(kg), harga_kg: parseFloat(harga_kg), jml_mati: parseInt(jml_mati) }];
      showToast('✅ Panen tersimpan!');
    } else if (activeModal === 'modal_harian_petelur') {
      const { tgl, butir, kg, retak } = formFields;
      if (!butir) return;
      data.harian = [...(data.harian || []), { tgl, butir: parseInt(butir), kg: parseFloat(kg || 0), retak: parseInt(retak) }];
      showToast('✅ Produksi harian disimpan!');
    } else if (activeModal === 'modal_jual_petelur') {
      const { tgl, kg, harga_kg } = formFields;
      if (!kg || !harga_kg) return;
      const total = (parseFloat(kg) || 0) * (parseFloat(harga_kg) || 0);
      data.penjualan = [...(data.penjualan || []), { tgl, kg: parseFloat(kg), harga_kg: parseFloat(harga_kg), total }];
      showToast('✅ Penjualan tersimpan!');
    } else if (activeModal === 'modal_telur_pembibitan') {
      const { periode, dikumpulkan, masuk_tetas } = formFields;
      if (!dikumpulkan) return;
      data.produksi = [...(data.produksi || []), { periode, dikumpulkan: parseInt(dikumpulkan), masuk_tetas: parseInt(masuk_tetas || 0) }];
      showToast('✅ Data telur tersimpan!');
    } else if (activeModal === 'modal_penetasan') {
      const { tgl, berhasil, gagal } = formFields;
      if (!berhasil) return;
      data.penetasan = [...(data.penetasan || []), { tgl, berhasil: parseInt(berhasil), gagal: parseInt(gagal) }];
      showToast('✅ Data penetasan tersimpan!');
    } else if (activeModal === 'modal_jual_doc') {
      const { tgl, tipe, jml, harga_ekor } = formFields;
      if (!jml || !harga_ekor) return;
      const total = (parseInt(jml) || 0) * (parseFloat(harga_ekor) || 0);
      data.penjualan = [...(data.penjualan || []), { tgl, tipe, jml: parseInt(jml), harga_ekor: parseFloat(harga_ekor), total }];
      showToast('✅ Penjualan tersimpan!');
    } else if (activeModal === 'modal_biaya_ruminansia' || activeModal === 'modal_biaya_susu') {
      const { tgl, type, nama, kg, total } = formFields;
      if (!total) return;
      data.biaya = [...(data.biaya || []), { type, tgl, nama, kg: parseFloat(kg), total: parseFloat(total), keterangan: nama }];
      showToast('✅ Biaya tersimpan!');
    } else if (activeModal === 'modal_panen_penggemukan') {
      const { tgl, jml_jual, bb_akhir, harga_kg, jml_mati } = formFields;
      if (!jml_jual || !bb_akhir || !harga_kg) return;
      data.panen = [...(data.panen || []), { tgl, jml_jual: parseInt(jml_jual), bb_akhir: parseFloat(bb_akhir), harga_kg: parseFloat(harga_kg), jml_mati: parseInt(jml_mati) }];
      showToast('✅ Data panen tersimpan!');
    } else if (activeModal === 'modal_harian_susu') {
      const { tgl, liter } = formFields;
      if (!liter) return;
      data.harian = [...(data.harian || []), { tgl, liter: parseFloat(liter) }];
      showToast('✅ Produksi susu tersimpan!');
    } else if (activeModal === 'modal_jual_susu') {
      const { tgl, liter, harga_liter } = formFields;
      if (!liter || !harga_liter) return;
      const total = (parseFloat(liter) || 0) * (parseFloat(harga_liter) || 0);
      data.penjualan = [...(data.penjualan || []), { tgl, liter: parseFloat(liter), harga_liter: parseFloat(harga_liter), total }];
      showToast('✅ Setoran susu tersimpan!');
    } else if (activeModal === 'modal_kelahiran') {
      const { tgl, id_induk, jantan, betina } = formFields;
      data.kelahiran = [...(data.kelahiran || []), { tgl, id_induk, jantan: parseInt(jantan), betina: parseInt(betina) }];
      showToast('🐣 Kelahiran tercatat!');
    } else if (activeModal === 'modal_jual_breeding') {
      const { tgl, kategori, jenis, jml, harga_ekor } = formFields;
      if (!jml || !harga_ekor) return;
      const total = (parseInt(jml) || 0) * (parseFloat(harga_ekor) || 0);
      data.penjualan = [...(data.penjualan || []), { tgl, kategori, jenis, jml: parseInt(jml), harga_ekor: parseFloat(harga_ekor), total }];
      showToast('✅ Penjualan tersimpan!');
    }

    await handleSaveCycleData(data);
    setActiveModal(null);
  };

  const handleDeleteListItem = async (collection: string, index: number) => {
    const cycle = getActiveCycle();
    if (!cycle) return;

    setConfirmModal({
      show: true,
      title: 'Hapus data ini?',
      msg: 'Data tidak bisa dikembalikan setelah dihapus.',
      btnText: 'Hapus',
      btnColor: 'bg-rose-600 hover:bg-rose-700',
      action: async () => {
        const data = { ...cycle.data };
        if (data[collection as keyof typeof data]) {
          const arr = [...(data[collection as keyof typeof data] as any[])];
          arr.splice(index, 1);
          (data as any)[collection] = arr;
          await handleSaveCycleData(data);
          showToast('🗑️ Data berhasil dihapus.');
        }
        setConfirmModal((prev) => ({ ...prev, show: false }));
      }
    });
  };

  const handleAddNewCyclePrompt = () => {
    const plan = profile?.organization?.plan || 'FREE';
    const limit = plan === 'ENTERPRISE' ? 100 : plan === 'PRO' ? 10 : 3;
    if (cycles.length >= limit) {
      showToast(`⚠️ Limit paket ${plan} tercapai (${limit} siklus). Silakan upgrade plan Anda.`);
      return;
    }
    setSelectedAnimal(activeCycle?.animal || 'ayam_pedaging');
    setSelectedScale(intToScale(activeCycle?.scale || 0) || 'kecil');
    setObStep(1);
    setActiveModal('new_cycle_wizard');
  };

  const handleResetSetupPrompt = () => {
    setConfirmModal({
      show: true,
      title: 'Ganti Ternak/Skala?',
      msg: 'Kamu akan kembali ke halaman awal. Semua data siklus saat ini akan tetap tersimpan aman di database cloud.',
      btnText: 'Ganti Ternak',
      btnColor: 'bg-teal-600 hover:bg-teal-700',
      action: () => {
        setIsOnboarding(true);
        setObStep(1);
        setConfirmModal((prev) => ({ ...prev, show: false }));
      }
    });
  };

  const handleConfirmDeleteCycle = () => {
    const cycle = getActiveCycle();
    if (!cycle) return;

    setConfirmModal({
      show: true,
      title: 'Hapus siklus ini?',
      msg: `Semua data "${cycle.name}" akan dihapus permanen dari database cloud dan tidak bisa dikembalikan!`,
      btnText: 'Hapus Permanen',
      btnColor: 'bg-rose-600 hover:bg-rose-700',
      action: async () => {
        await handleDeleteCycle();
        setConfirmModal((prev) => ({ ...prev, show: false }));
      }
    });
  };

  const handleCSVExport = () => {
    const cycle = getActiveCycle();
    if (!cycle) return;

    let csv = `RADEYA - ${ANIMAL_LABELS[cycle.animal] || cycle.animal} - ${cycle.name}\n\n`;
    csv += `MODAL AWAL\n`;
    Object.entries(cycle.data?.modal || {}).forEach(([k, v]) => {
      csv += `${k},${v}\n`;
    });
    csv += `\nBIAYA OPERASIONAL\n`;
    csv += `Tanggal,Jenis,Nama,Total\n`;
    (cycle.data?.biaya || []).forEach((b: any) => {
      csv += `${b.tgl || ''},${b.type || ''},${b.nama || b.jenis || ''},${b.total || 0}\n`;
    });
    csv += `\nPANEN/PENJUALAN\n`;
    csv += `Tanggal,Qty,Total\n`;
    (cycle.data?.panen || []).forEach((p: any) => {
      csv += `${p.tgl || ''},${p.kg || p.jml_jual || ''},${(parseFloat(p.kg || p.jml_jual || 0)) * (parseFloat(p.harga_kg || 0))}\n`;
    });
    (cycle.data?.penjualan || []).forEach((p: any) => {
      csv += `${p.tgl || ''},${p.kg || p.jml || p.liter || ''},${p.total || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radeya_${cycle.animal}_${cycle.name.replace(/\s/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('📥 CSV berhasil diunduh!');
  };

  const updateFormField = (key: string, value: string) => {
    setFormFields((prev: any) => {
      const next = { ...prev, [key]: value };
      
      if (activeModal === 'modal_pakan') {
        const sak = parseFloat(next.sak) || 0;
        const harga = parseFloat(next.harga_sak) || 0;
        setPreviewVal(formatRp(sak * harga));
      } else if (activeModal === 'modal_jual_doc') {
        const jml = parseFloat(next.jml) || 0;
        const harga = parseFloat(next.harga_ekor) || 0;
        setPreviewVal(formatRp(jml * harga));
      } else if (activeModal === 'modal_jual_susu') {
        const liter = parseFloat(next.liter) || 0;
        const harga = parseFloat(next.harga_liter) || 0;
        setPreviewVal(formatRp(liter * harga));
      } else if (activeModal === 'modal_jual_breeding') {
        const jml = parseFloat(next.jml) || 0;
        const harga = parseFloat(next.harga_ekor) || 0;
        setPreviewVal(formatRp(jml * harga));
      }

      return next;
    });
  };

  // --- AI Vet Messages Send ---
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    const newMsgList = [...chatMessages, { role: 'user' as const, text: userText }];
    setChatMessages(newMsgList);
    setIsChatLoading(true);

    try {
      const activeCycle = getActiveCycle();
      const response = await apiPost('/api/v1/ai', {
        message: userText,
        animal: activeCycle?.animal || 'umum'
      });

      if (response && response.reply) {
        setChatMessages([...newMsgList, { role: 'ai', text: response.reply }]);
      } else {
        setChatMessages([...newMsgList, { role: 'ai', text: 'Maaf, saya tidak menerima respon dari server AI. Silakan coba kembali.' }]);
      }
    } catch (err: any) {
      setChatMessages([...newMsgList, { role: 'ai', text: '⚠️ Gagal terhubung ke asisten AI: ' + err.message }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Vaccine task toggle handler ---
  const handleToggleTask = async (taskId: string) => {
    const cycle = getActiveCycle();
    if (!cycle) return;

    const currentChecked = cycle.data?.checkedTasks || [];
    let nextChecked = [];

    if (currentChecked.includes(taskId)) {
      nextChecked = currentChecked.filter((id) => id !== taskId);
    } else {
      nextChecked = [...currentChecked, taskId];
    }

    const updatedData = {
      ...cycle.data,
      checkedTasks: nextChecked
    };

    await handleSaveCycleData(updatedData);
    showToast('💾 Perubahan jadwal disimpan!');
  };

  // --- Render Onboarding & Loading Layouts ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060D0F] flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-teal-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-teal-400 animate-spin" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-400">Menghubungkan ke database Radeya...</p>
      </div>
    );
  }

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-[#070E10] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto w-full bg-slate-900/40 backdrop-blur-xl border border-teal-500/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
          <NewCycleWizard 
            profile={profile} 
            onSubmit={async (name, animal, scaleStr, modalData) => {
              await handleCreateCycle(name, animal, scaleStr, modalData);
            }} 
          />
        </div>
      </div>
    );
  }

  const renderUpgradeGate = (targetPlan: 'PRO' | 'ENTERPRISE', featureTitle: string, featureDesc: string) => {
    return (
      <div className="bg-slate-900/40 backdrop-blur-xl border border-teal-500/10 p-12 rounded-3xl text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden animate-fadeIn my-12">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        
        <div className="w-20 h-20 bg-teal-500/10 border border-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-400">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-black text-slate-100 mb-4">{featureTitle}</h2>
        <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">{featureDesc}</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => setBillingModalOpen(true)}
            className="px-8 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-teal-955/40 flex items-center gap-2 text-xs"
          >
            ⭐ Upgrade ke {targetPlan} Sekarang
          </button>
        </div>
      </div>
    );
  };

  const activeCycle = getActiveCycle();
  if (!activeCycle) return null;

  const tabs = getTabsForMode(activeCycle.mode);
  const stats = calculateStats();

  // Get Calendar list based on active conditions
  const startDayTime = activeCycle.data?.modal?.tgl_doc || activeCycle.data?.modal?.tgl_pullet || activeCycle.data?.modal?.tgl_beli || activeCycle.createdAt;
  const parsedStartDate = new Date(startDayTime);
  const calendarTasks = getCalendarTasks(activeCycle.animal, intToScale(activeCycle.scale), parsedStartDate);

  // Initialize Chat Vet defaults on tab switch
  const openChatTab = () => {
    if (chatMessages.length === 0) {
      setChatMessages([
        { role: 'ai', text: `Halo! Saya **Radeya AI Vet**. Saya siap membantu menjawab pertanyaan Anda mengenai penyakit ternak, pencegahan infeksi, serta solusi pakan untuk jenis **${ANIMAL_LABELS[activeCycle.animal] || activeCycle.animal}** Anda.` }
      ]);
    }
    setActiveTab('ai_vet');
  };

  return (
    <div className="min-h-screen bg-[#070E10] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <header className="border-b border-slate-900/60 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center font-black text-xl text-slate-950 shadow-lg shadow-teal-500/20">
              R
            </div>
            <div>
              <span className="font-extrabold tracking-tight bg-gradient-to-r from-teal-400 via-teal-200 to-emerald-400 bg-clip-text text-transparent text-lg">
                RADEYA
              </span>
              <span className="text-[10px] block text-slate-500 -mt-1 font-bold uppercase tracking-wider">Smart Farm Planner</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profile?.user?.role === 'OWNER' && (
              <button
                onClick={() => setBillingModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-all flex items-center gap-1.5 shadow-md shadow-amber-950/20"
              >
                Plan: {profile?.organization?.plan || 'FREE'} ⭐
              </button>
            )}
            {/* Notification Bell Icon & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-800 transition-all flex items-center justify-center relative w-9 h-9"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-slate-950 border border-slate-850 rounded-2xl shadow-2xl p-4 z-50 space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                    <span className="text-xs font-black text-slate-200">🔔 Pusat Notifikasi</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-[10px] text-slate-500 hover:text-slate-300 font-bold"
                    >
                      Tutup
                    </button>
                  </div>

                  {/* Browser Permission Prompt */}
                  {notificationPermission !== 'granted' && (
                    <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-2">
                      <span className="text-[10px] text-teal-300 font-bold block leading-tight">Aktifkan Notifikasi Desktop/HP</span>
                      <p className="text-[9px] text-slate-400 leading-normal">Terima pengingat pakan secara otomatis tanpa perlu membuka aplikasi.</p>
                      <button
                        onClick={requestNotificationPermission}
                        className="w-full py-1.5 bg-teal-650 hover:bg-teal-600 text-white font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all"
                      >
                        Izinkan Notifikasi
                      </button>
                    </div>
                  )}

                  {/* Simulation Widgets */}
                  <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Simulator Pengujian</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={simulateFeedingNotification}
                        className="py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-extrabold rounded-lg text-[9px] transition-all"
                      >
                        ⏰ Tes Pakan
                      </button>
                      <button
                        onClick={simulateSaleNotification}
                        className="py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-extrabold rounded-lg text-[9px] transition-all"
                      >
                        📈 Tes Penjualan
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-48 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-[10px] text-slate-500 font-bold">
                        Tidak ada notifikasi aktif saat ini.
                      </div>
                    ) : (
                      notifications.map((noti) => (
                        <div 
                          key={noti.id} 
                          className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all text-left ${
                            noti.type === 'sale' 
                              ? 'bg-amber-500/10 border-amber-500/20' 
                              : noti.type === 'feeding' 
                              ? 'bg-teal-500/5 border-teal-500/10'
                              : 'bg-slate-900/60 border-slate-850'
                          }`}
                        >
                          <span className="text-sm mt-0.5 shrink-0">
                            {noti.type === 'sale' ? '⏳' : noti.type === 'feeding' ? '🥣' : 'ℹ️'}
                          </span>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-slate-200 block">{noti.title}</span>
                            <p className="text-[9px] text-slate-400 leading-normal font-medium">{noti.desc}</p>
                            <span className="text-[8px] font-mono text-slate-500 block pt-1">{noti.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleResetSetupPrompt}
              className="px-3.5 py-2 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition-all flex items-center gap-1.5"
            >
              Ganti Ternak
            </button>
            <button
              onClick={handleSignOut}
              className="px-3.5 py-2 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 text-xs font-bold rounded-xl border border-rose-900/30 transition-all"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Cycle Selector Bar */}
      <section className="bg-slate-950/30 border-b border-slate-900/40 py-6 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{ANIMAL_LABELS[activeCycle.animal]?.split(' ')[0]}</span>
                {ANIMAL_LABELS[activeCycle.animal]?.split(' ').slice(1).join(' ') || activeCycle.animal}
              </h2>
              <span className="text-[10px] px-2.5 py-1 bg-teal-950/70 text-teal-400 rounded-lg font-bold border border-teal-500/20 uppercase tracking-wider">
                {SCALE_LABELS[intToScale(activeCycle.scale)] || intToScale(activeCycle.scale)}
              </span>

              {/* Kategori Badge */}
              <span className="text-[10px] px-2.5 py-1 bg-slate-900 text-slate-300 rounded-lg font-bold border border-slate-800 uppercase tracking-wider">
                🏷️ {ANIMAL_CATEGORIES[activeCycle.animal] || 'Lainnya'}
              </span>

              {/* Tanggal Mulai Badge */}
              <span className="text-[10px] px-2.5 py-1 bg-slate-900 text-slate-300 rounded-lg font-bold border border-slate-800 font-mono">
                📅 Mulai: {parsedStartDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>

              {/* Umur Siklus Badge */}
              <span className="text-[10px] px-2.5 py-1 bg-teal-500/10 text-teal-400 rounded-lg font-bold border border-teal-500/20 font-mono">
                ⏳ Umur: {Math.max(0, Math.floor((new Date().getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24)))} Hari
              </span>
            </div>
            
            <div className="flex items-center gap-2.5 mt-3">
              <span className="text-xs text-slate-450 font-bold">Pilih Siklus:</span>
              <select
                value={activeCycleIndex}
                onChange={(e) => {
                  setActiveCycleIndex(parseInt(e.target.value));
                  setActiveTab('dashboard');
                }}
                className="bg-slate-900/80 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-teal-500 transition-all"
              >
                {cycles.map((c, i) => (
                  <option key={c.id} value={i} className="text-slate-800">
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddNewCyclePrompt}
                className="px-3 py-1.5 bg-teal-650 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-950/20"
              >
                + Baru
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-850 p-3 rounded-2xl self-start sm:self-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-bold">Usaha: <strong className="text-teal-400">{farmName}</strong></span>
          </div>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="bg-slate-950/40 border-b border-slate-900/50 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto py-3 px-4 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'ai_vet') {
                  openChatTab();
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 border ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-950/30 border-teal-500/20 scale-[1.02]'
                  : 'bg-slate-900/40 text-slate-400 border-slate-900/50 hover:bg-slate-900/80 hover:text-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Contents */}
      <main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1 pb-28">
        
        {/* --- TAB: DASHBOARD SUMMARY --- */}
        {stats && activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Laba Bersih Card */}
            <div className={`p-8 rounded-3xl relative overflow-hidden shadow-2xl border ${
              stats.laba >= 0 
                ? 'bg-gradient-to-br from-emerald-600/90 to-teal-700/95 text-white border-emerald-500/20' 
                : 'bg-gradient-to-br from-rose-700/90 to-red-800/95 text-white border-rose-500/20'
            }`}>
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">Laba Bersih Siklus Ini</span>
              <h3 className="text-5xl font-black mt-2 tracking-tight">{formatRp(stats.laba)}</h3>
              <p className="text-xs mt-3 opacity-90 font-bold flex items-center gap-1.5">
                {stats.laba >= 0 ? '🎉 Selamat! Hasil panen menghasilkan profit.' : '⚠️ Evaluasi pengeluaran Anda untuk menekan kerugian.'}
              </p>
            </div>

            {/* Visual Charts Layout (Responsive Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Stat Cards */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl hover:border-slate-800 transition-colors">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Total Modal</span>
                  <span className="text-xl font-extrabold text-rose-400 mt-2 block font-mono">{formatRp(stats.totalModal)}</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl hover:border-slate-800 transition-colors">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Total Pendapatan</span>
                  <span className="text-xl font-extrabold text-emerald-400 mt-2 block font-mono">{formatRp(stats.totalPendapatan)}</span>
                </div>

                {/* Dynamic Stats Based on Mode */}
                {activeCycle.mode === 'broiler' && (
                  <>
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">HPP / kg</span>
                      <span className="text-xl font-extrabold text-slate-200 mt-2 block font-mono">{formatRp(stats.hpp)}</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">FCR Pakan</span>
                      <span className="text-xl font-extrabold text-teal-400 mt-2 block font-mono">{(stats.fcr || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}

                {activeCycle.mode === 'petelur' && (
                  <>
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Hen Day %</span>
                      <span className="text-xl font-extrabold text-teal-400 mt-2 block font-mono">{(stats.henDay || 0).toFixed(1)}%</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">HPP / Butir</span>
                      <span className="text-xl font-extrabold text-slate-200 mt-2 block font-mono">{formatRp(stats.hppButir)}</span>
                    </div>
                  </>
                )}

                {activeCycle.mode === 'pembibitan_unggas' && (
                  <>
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Daya Tetas</span>
                      <span className="text-xl font-extrabold text-teal-400 mt-2 block font-mono">{(stats.dayaTetas || 0).toFixed(1)}%</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Populasi Aktif</span>
                      <span className="text-xl font-extrabold text-slate-200 mt-2 block font-mono">{stats.populasi} ekor</span>
                    </div>
                  </>
                )}

                {activeCycle.mode === 'penggemukan' && (
                  <>
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">ADG (g/hari)</span>
                      <span className="text-xl font-extrabold text-teal-400 mt-2 block font-mono">{(stats.adg || 0).toFixed(0)} g</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Lama Penggemukan</span>
                      <span className="text-xl font-extrabold text-slate-200 mt-2 block font-mono">{stats.lamaHari} Hari</span>
                    </div>
                  </>
                )}

                {activeCycle.mode === 'susu' && (
                  <>
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Produksi Rata-rata</span>
                      <span className="text-xl font-extrabold text-teal-400 mt-2 block font-mono">{(stats.produksiRata || 0).toFixed(1)} L/hari</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">HPP / Liter</span>
                      <span className="text-xl font-extrabold text-slate-200 mt-2 block font-mono">{formatRp(stats.hppLiter)}</span>
                    </div>
                  </>
                )}

                {activeCycle.mode === 'breeding_ruminansia' && (
                  <>
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Populasi Total</span>
                      <span className="text-xl font-extrabold text-teal-400 mt-2 block font-mono">{stats.populasiTotal} ekor</span>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Total Kelahiran</span>
                      <span className="text-xl font-extrabold text-slate-200 mt-2 block font-mono">{stats.totalLahir} ekor</span>
                    </div>
                  </>
                )}
              </div>

              {/* Dynamic Chart (Line or Circular Gauge) */}
              <div className="w-full">
                {['broiler', 'penggemukan'].includes(activeCycle.mode) ? (
                  renderSVGGauge(stats.srPct || 100, stats.mati || 0, stats.jmlDoc || 0)
                ) : (
                  renderSVGLineChart()
                )}
              </div>
            </div>

            {/* Extra Assets Card for Ruminansia Breeding */}
            {activeCycle.mode === 'breeding_ruminansia' && (
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Estimasi Nilai Aset Peternakan</span>
                  <span className="text-2xl font-black text-white mt-1 block font-mono">{formatRp(stats.nilaiAset)}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">*Formula: Populasi × Taksiran Berat (30kg) × Harga Pasar</span>
                </div>
                <div className="flex gap-4">
                  <div className="bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-850">
                    <span className="text-[9px] text-slate-500 block font-bold">BETINA</span>
                    <span className="text-sm font-black text-pink-400 font-mono">{stats.populasiBetina} ekor</span>
                  </div>
                  <div className="bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-850">
                    <span className="text-[9px] text-slate-500 block font-bold">JANTAN</span>
                    <span className="text-sm font-black text-blue-400 font-mono">{stats.populasiJantan} ekor</span>
                  </div>
                </div>
              </div>
            )}

            {/* Budget Breakdown */}
            {stats.breakdown && (
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl">
                <h3 className="font-bold text-slate-200 mb-5 text-sm flex items-center gap-2">
                  <span>📊</span> Rincian Anggaran & Pengeluaran
                </h3>
                <div className="space-y-4">
                  {stats.breakdown.map((item: any, i: number) => {
                    const pct = stats.totalModal > 0 ? (item.val / stats.totalModal) * 100 : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-450">{item.label}</span>
                          <span className="text-slate-200 font-mono">
                            {formatRp(item.val)} <span className="text-slate-500 font-medium">({pct.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EBITDA & Depreciation Analysis Card */}
            <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <span>📊</span> Analisis EBITDA & Penyusutan Kandang (CapEx)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">EBITDA</span>
                  <span className="text-xl font-extrabold text-teal-400 mt-1.5 block font-mono">{formatRp(stats.ebitda)}</span>
                  <span className="text-[9px] text-slate-500 mt-1 block leading-normal">Laba operasional sebelum bunga, pajak, dan penyusutan.</span>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Penyusutan Kandang (Siklus)</span>
                  <span className="text-xl font-extrabold text-rose-400 mt-1.5 block font-mono">{formatRp(stats.depresiasi)}</span>
                  <span className="text-[9px] text-slate-500 mt-1 block leading-normal">
                    Penyusutan kandang selama {stats.umur || 0} hari (dari masa manfaat {activeCycle.data?.modal?.kandang_manfaat_tahun || 5} tahun).
                  </span>
                </div>
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Laba Bersih (Net Profit)</span>
                  <span className="text-xl font-extrabold text-emerald-400 mt-1.5 block font-mono">{formatRp(stats.laba)}</span>
                  <span className="text-[9px] text-slate-500 mt-1 block leading-normal">Laba bersih setelah dikurangi akumulasi penyusutan kandang.</span>
                </div>
              </div>

              {/* Rincian Pembangunan Kandang jika menggunakan rincian manual */}
              {activeCycle.data?.modal?.kandang_detail_aktif === 'true' && (
                <div className="p-5 bg-slate-950/40 rounded-2xl border border-slate-850 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    🏗️ Rincian Pembangunan Kandang Baru (Investasi Awal)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Bahan & Material</span>
                      <span className="text-slate-200 font-mono mt-0.5 block">
                        {formatRp(parseFloat(activeCycle.data?.modal?.kandang_material) || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-550 block text-[9px] uppercase">Tenaga Kerja / Tukang</span>
                      <span className="text-slate-200 font-mono mt-0.5 block">
                        {formatRp(parseFloat(activeCycle.data?.modal?.kandang_pekerja) || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-550 block text-[9px] uppercase">Biaya Lain-lain</span>
                      <span className="text-slate-200 font-mono mt-0.5 block">
                        {formatRp(parseFloat(activeCycle.data?.modal?.kandang_lain) || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-550 block text-[9px] uppercase">Total Biaya Kandang</span>
                      <span className="text-teal-400 font-mono mt-0.5 block font-bold">
                        {formatRp(parseFloat(activeCycle.data?.modal?.kandang_total) || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleCSVExport}
                className="flex-1 py-3.5 px-4 bg-slate-900/70 hover:bg-slate-800 text-slate-200 border border-slate-850 hover:border-slate-700 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                {Icons.export("w-4 h-4 text-teal-400")}
                Ekspor Laporan (CSV)
              </button>
              {profile?.user?.role === 'OWNER' && (
                <button
                  onClick={handleConfirmDeleteCycle}
                  className="flex-1 py-3.5 px-4 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-900/20 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                >
                  {Icons.trash("w-4 h-4 text-rose-400")}
                  Hapus Siklus Ini
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: MODAL AWAL FORM --- */}
        {activeTab === 'modal_awal' && (
          <div className="max-w-xl mx-auto bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-250 flex items-center gap-2">
              <span>ðŸ“‹</span> Data Modal Awal Siklus
            </h3>

            {activeCycle.mode === 'broiler' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Tanggal Masuk DOC</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_doc || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_doc: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-255 font-semibold transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Jumlah DOC (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 1000"
                    value={activeCycle.data?.modal?.jml_doc || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_doc: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Harga per Ekor (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 8000"
                    value={activeCycle.data?.modal?.harga_doc || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_doc: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'petelur' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Tanggal Masuk Pullet</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_pullet || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_pullet: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-220 font-semibold transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Jumlah Ayam Pullet (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 500"
                    value={activeCycle.data?.modal?.jml_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Harga per Ekor (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 80000"
                    value={activeCycle.data?.modal?.harga_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'pembibitan_unggas' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Jumlah Betina (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 50"
                    value={activeCycle.data?.modal?.jml_betina || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_betina: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Jumlah Pejantan (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 5"
                    value={activeCycle.data?.modal?.jml_jantan || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_jantan: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Harga per Ekor Indukan (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 150000"
                    value={activeCycle.data?.modal?.harga_indukan || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_indukan: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'penggemukan' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Tanggal Beli Bakalan</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_beli || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_beli: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-220 font-semibold transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Jumlah Ekor</label>
                  <input
                    type="number"
                    placeholder="Contoh: 10"
                    value={activeCycle.data?.modal?.jml_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-550 block uppercase tracking-wider">BB Awal Rata2 (kg)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 150"
                    value={activeCycle.data?.modal?.bb_awal || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), bb_awal: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Harga per kg (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 55000"
                    value={activeCycle.data?.modal?.harga_kg_bakalan || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_kg_bakalan: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'susu' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Tanggal Beli Induk</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_beli || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_beli: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-220 font-semibold transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Jumlah Ekor Indukan</label>
                  <input
                    type="number"
                    placeholder="Contoh: 5"
                    value={activeCycle.data?.modal?.jml_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Harga per Induk (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 15000000"
                    value={activeCycle.data?.modal?.harga_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'breeding_ruminansia' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Jumlah Induk Betina</label>
                  <input
                    type="number"
                    placeholder="Contoh: 10"
                    value={activeCycle.data?.modal?.jml_betina || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_betina: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Jumlah Pejantan</label>
                  <input
                    type="number"
                    placeholder="Contoh: 2"
                    value={activeCycle.data?.modal?.jml_jantan || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_jantan: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Harga per Ekor (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 3000000"
                    value={activeCycle.data?.modal?.harga_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Harga Pasar / kg Hidup (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 60000"
                    value={activeCycle.data?.modal?.harga_pasar || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_pasar: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Taksiran Berat Anak (kg)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 30"
                    value={activeCycle.data?.modal?.bobot_taksiran || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), bobot_taksiran: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Unified cage section in Modal Awal form */}
            <div className="mt-4 pt-4 border-t border-slate-850 space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ðŸ¢ Investasi Kandang & Aset (CapEx)</span>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDetailedCageInput_modal"
                  checked={activeCycle.data?.modal?.kandang_detail_aktif === 'true'}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    const modal = { 
                      ...(activeCycle.data?.modal || {}), 
                      kandang_detail_aktif: isChecked ? 'true' : 'false'
                    };
                    handleSaveCycleData({ ...activeCycle.data, modal });
                  }}
                  className="w-4 h-4 rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-950 cursor-pointer"
                />
                <label htmlFor="isDetailedCageInput_modal" className="text-xs font-bold text-slate-350 cursor-pointer">
                  Input Rincian Biaya Pembangunan Kandang Baru
                </label>
              </div>

              {activeCycle.data?.modal?.kandang_detail_aktif === 'true' ? (
                <div className="space-y-3.5 pl-2 border-l-2 border-teal-500/20">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1. Biaya Bahan & Material</label>
                    <input
                      type="number"
                      value={activeCycle.data?.modal?.kandang_material || '0'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const mat = parseFloat(val) || 0;
                        const lab = parseFloat(activeCycle.data?.modal?.kandang_pekerja) || 0;
                        const oth = parseFloat(activeCycle.data?.modal?.kandang_lain) || 0;
                        const total = mat + lab + oth;
                        const modal = { 
                          ...(activeCycle.data?.modal || {}), 
                          kandang_material: val,
                          biaya_kandang: total.toString(),
                          kandang_total: total.toString()
                        };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">2. Biaya Tenaga Kerja (Labor)</label>
                    <input
                      type="number"
                      value={activeCycle.data?.modal?.kandang_pekerja || '0'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const mat = parseFloat(activeCycle.data?.modal?.kandang_material) || 0;
                        const lab = parseFloat(val) || 0;
                        const oth = parseFloat(activeCycle.data?.modal?.kandang_lain) || 0;
                        const total = mat + lab + oth;
                        const modal = { 
                          ...(activeCycle.data?.modal || {}), 
                          kandang_pekerja: val,
                          biaya_kandang: total.toString(),
                          kandang_total: total.toString()
                        };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">3. Biaya Lain-lain</label>
                    <input
                      type="number"
                      value={activeCycle.data?.modal?.kandang_lain || '0'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const mat = parseFloat(activeCycle.data?.modal?.kandang_material) || 0;
                        const lab = parseFloat(activeCycle.data?.modal?.kandang_pekerja) || 0;
                        const oth = parseFloat(val) || 0;
                        const total = mat + lab + oth;
                        const modal = { 
                          ...(activeCycle.data?.modal || {}), 
                          kandang_lain: val,
                          biaya_kandang: total.toString(),
                          kandang_total: total.toString()
                        };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                  <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/10 text-xs text-teal-400 font-bold flex justify-between font-mono">
                    <span>Total Biaya Kandang:</span>
                    <span>Rp {(parseFloat(activeCycle.data?.modal?.biaya_kandang) || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Investasi Kandang / Aset Awal (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 1500000"
                    value={activeCycle.data?.modal?.biaya_kandang || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const modal = { 
                        ...(activeCycle.data?.modal || {}), 
                        biaya_kandang: val,
                        kandang_total: val
                      };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold transition-colors"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-550 block uppercase tracking-wider">Masa Manfaat Kandang (Tahun)</label>
                <select
                  value={activeCycle.data?.modal?.kandang_manfaat_tahun || '5'}
                  onChange={(e) => {
                    const modal = { ...(activeCycle.data?.modal || {}), kandang_manfaat_tahun: e.target.value };
                    handleSaveCycleData({ ...activeCycle.data, modal });
                  }}
                  className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-250 font-semibold font-mono cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 8, 10, 15, 20].map((yr) => (
                    <option key={yr} value={yr} className="bg-slate-900 text-slate-100">
                      {yr} Tahun ({yr * 12} Bulan)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-[#0c1a1f] border border-teal-500/10 p-5 rounded-2xl text-xs font-semibold text-slate-400">
              <div className="text-[10px] font-bold block uppercase opacity-70 mb-2">Rincian Nilai Modal Awal:</div>
              <div className="text-xl font-black text-teal-400 font-mono">
                {formatRp(
                  activeCycle.mode === 'broiler'
                    ? (parseFloat(activeCycle.data?.modal?.jml_doc) || 0) * (parseFloat(activeCycle.data?.modal?.harga_doc) || 0) + (parseFloat(activeCycle.data?.modal?.biaya_kandang) || 0)
                    : activeCycle.mode === 'petelur'
                    ? (parseFloat(activeCycle.data?.modal?.jml_ekor) || 0) * (parseFloat(activeCycle.data?.modal?.harga_ekor) || 0) + (parseFloat(activeCycle.data?.modal?.biaya_kandang) || 0)
                    : activeCycle.mode === 'pembibitan_unggas'
                    ? ((parseFloat(activeCycle.data?.modal?.jml_betina) || 0) + (parseFloat(activeCycle.data?.modal?.jml_jantan) || 0)) * (parseFloat(activeCycle.data?.modal?.harga_indukan) || 0)
                    : activeCycle.mode === 'penggemukan'
                    ? (parseFloat(activeCycle.data?.modal?.jml_ekor) || 0) * (parseFloat(activeCycle.data?.modal?.bb_awal) || 0) * (parseFloat(activeCycle.data?.modal?.harga_kg_bakalan) || 0) + (parseFloat(activeCycle.data?.modal?.biaya_kandang) || 0)
                    : activeCycle.mode === 'susu'
                    ? (parseFloat(activeCycle.data?.modal?.jml_ekor) || 0) * (parseFloat(activeCycle.data?.modal?.harga_ekor) || 0) + (parseFloat(activeCycle.data?.modal?.biaya_kandang) || 0)
                    : activeCycle.mode === 'breeding_ruminansia'
                    ? ((parseFloat(activeCycle.data?.modal?.jml_betina) || 0) + (parseFloat(activeCycle.data?.modal?.jml_jantan) || 0)) * (parseFloat(activeCycle.data?.modal?.harga_ekor) || 0)
                    : 0
                )}
              </div>
            </div>
          </div>
        )}        {/* --- TAB: BIAYA OPERASIONAL --- */}
        {activeTab === 'biaya' && (
          <div className="space-y-6 animate-fadeIn">
            {(activeCycle.mode === 'broiler' || activeCycle.mode === 'petelur') ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Pakan */}
                <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between hover:border-slate-800 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-200 mb-4 flex items-center justify-between">
                      <span>🌾 Biaya Pakan</span>
                      <span className="text-[10px] px-2 py-0.5 bg-teal-950/45 text-teal-400 rounded-md font-mono">
                        {((activeCycle.data?.biaya || []).filter((b: any) => b.type === 'pakan').length)} Catatan
                      </span>
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                      {(activeCycle.data?.biaya || []).filter((b: any) => b.type === 'pakan').length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-650 font-bold">Belum ada catatan pakan.</div>
                      ) : (
                        (activeCycle.data?.biaya || []).filter((b: any) => b.type === 'pakan').map((b: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-slate-950/50 p-3.5 rounded-xl border border-slate-850/80">
                            <div>
                              <div className="text-xs font-bold text-slate-350">{b.jenis || 'Pakan'}</div>
                              <div className="text-[9px] text-slate-500 mt-0.5 font-bold font-mono">{b.sak} sak × {b.kg_sak}kg/sak · {b.tgl}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-teal-450 font-mono">{formatRp(b.total)}</span>
                              <button onClick={() => handleDeleteListItem('biaya', (activeCycle.data?.biaya || []).indexOf(b))} className="text-rose-500 hover:text-rose-400 font-bold p-1">✕</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openModalForm('modal_pakan')}
                    className="w-full mt-6 py-2.5 bg-slate-950/40 hover:bg-slate-800 text-teal-400 text-xs font-bold rounded-xl border border-slate-800 transition-all"
                  >
                    + Tambah Pakan
                  </button>
                </div>

                {/* Obat */}
                <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between hover:border-slate-800 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-200 mb-4 flex items-center justify-between">
                      <span>💊 Obat & Vaksin</span>
                      <span className="text-[10px] px-2 py-0.5 bg-teal-950/45 text-teal-400 rounded-md font-mono">
                        {((activeCycle.data?.biaya || []).filter((b: any) => b.type === 'obat').length)} Catatan
                      </span>
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                      {(activeCycle.data?.biaya || []).filter((b: any) => b.type === 'obat').length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-650 font-bold">Belum ada catatan obat.</div>
                      ) : (
                        (activeCycle.data?.biaya || []).filter((b: any) => b.type === 'obat').map((b: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-slate-950/50 p-3.5 rounded-xl border border-slate-850/80">
                            <div>
                              <div className="text-xs font-bold text-slate-350">{b.nama || 'Obat/Vaksin'}</div>
                              <div className="text-[9px] text-slate-500 mt-0.5 font-bold font-mono">{b.keterangan || 'Tanpa Keterangan'} · {b.tgl}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-teal-450 font-mono">{formatRp(b.total)}</span>
                              <button onClick={() => handleDeleteListItem('biaya', (activeCycle.data?.biaya || []).indexOf(b))} className="text-rose-500 hover:text-rose-400 font-bold p-1">✕</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openModalForm('modal_obat')}
                    className="w-full mt-6 py-2.5 bg-slate-950/40 hover:bg-slate-800 text-teal-400 text-xs font-bold rounded-xl border border-slate-800 transition-all"
                  >
                    + Tambah Obat
                  </button>
                </div>

                {/* Lain */}
                <div className="bg-slate-900/20 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between hover:border-slate-800 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-200 mb-4 flex items-center justify-between">
                      <span>📦 Biaya Lain</span>
                      <span className="text-[10px] px-2 py-0.5 bg-teal-950/45 text-teal-400 rounded-md font-mono">
                        {((activeCycle.data?.biaya || []).filter((b: any) => b.type === 'lain').length)} Catatan
                      </span>
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                      {(activeCycle.data?.biaya || []).filter((b: any) => b.type === 'lain').length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-650 font-bold">Belum ada catatan biaya lain.</div>
                      ) : (
                        (activeCycle.data?.biaya || []).filter((b: any) => b.type === 'lain').map((b: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-slate-950/50 p-3.5 rounded-xl border border-slate-850/80">
                            <div>
                              <div className="text-xs font-bold text-slate-350">{b.nama || 'Biaya Lain'}</div>
                              <div className="text-[9px] text-slate-500 mt-0.5 font-bold font-mono">{b.keterangan || 'Tanpa Keterangan'} · {b.tgl}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-teal-455 font-mono">{formatRp(b.total)}</span>
                              <button onClick={() => handleDeleteListItem('biaya', (activeCycle.data?.biaya || []).indexOf(b))} className="text-rose-500 hover:text-rose-400 font-bold p-1">✕</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openModalForm('modal_lain')}
                    className="w-full mt-6 py-2.5 bg-slate-950/40 hover:bg-slate-800 text-teal-400 text-xs font-bold rounded-xl border border-slate-800 transition-all"
                  >
                    + Tambah Biaya
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl max-w-xl mx-auto">
                <h4 className="font-bold text-slate-200 mb-4 flex items-center justify-between">
                  <span>🌿 Biaya Operasional</span>
                  <span className="text-[10px] px-2 py-0.5 bg-teal-950/40 text-teal-400 rounded-md font-mono">
                    {(activeCycle.data?.biaya || []).length} Catatan
                  </span>
                </h4>
                <div className="space-y-3">
                  {(activeCycle.data?.biaya || []).length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">Belum ada biaya operasional dicatat.</div>
                  ) : (
                    (activeCycle.data?.biaya || []).map((b: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-850/80 font-mono">
                        <div>
                          <div className="text-xs font-bold text-slate-200 font-sans">{b.nama || b.type}</div>
                          <div className="text-[10px] text-slate-500 mt-1 font-bold">Jenis: <strong className="uppercase text-teal-450">{b.type}</strong> · Vol: {b.kg || 0} kg · {b.tgl}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-teal-450">{formatRp(b.total)}</span>
                          <button onClick={() => handleDeleteListItem('biaya', i)} className="text-rose-500 hover:text-rose-400 font-bold p-2">✕</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => openModalForm(activeCycle.mode === 'susu' ? 'modal_biaya_susu' : 'modal_biaya_ruminansia')}
                  className="w-full mt-6 py-3 bg-slate-950/40 hover:bg-slate-800 text-teal-400 text-xs font-bold rounded-xl border border-slate-800 transition-all"
                >
                  + Tambah Biaya Operasional
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: PANEN / PRODUKSI --- */}
        {activeTab === 'panen' && (
          <div className="max-w-xl mx-auto bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-250 flex items-center justify-between font-sans">
              <span>{activeCycle.mode === 'susu' ? '🥛 Produksi Susu Harian' : activeCycle.mode === 'petelur' ? '🥚 Produksi Telur Harian' : '🎯 Data Panen/Jual'}</span>
              <span className="text-[10px] px-2.5 py-0.5 bg-teal-950/40 text-teal-400 rounded-md font-mono font-bold">
                {(activeCycle.mode === 'susu' || activeCycle.mode === 'petelur' ? (activeCycle.data?.harian || []).length : (activeCycle.data?.panen || []).length)} Catatan
              </span>
            </h3>

            <div className="space-y-3">
              {activeCycle.mode === 'broiler' && (
                <>
                  {(activeCycle.data?.panen || []).length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">Belum ada data panen broiler dicatat.</div>
                  ) : (
                    (activeCycle.data?.panen || []).map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-850/80 font-mono">
                        <div>
                          <div className="text-xs font-bold text-slate-200 font-sans">{p.tgl} — {p.kg.toLocaleString('id-ID')} kg</div>
                          <div className="text-[10px] text-slate-550 mt-1 font-bold">Harga: {formatRp(p.harga_kg)}/kg · Mati: {p.jml_mati || 0} ekor</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-450">{formatRp(p.kg * p.harga_kg)}</span>
                          <button onClick={() => handleDeleteListItem('panen', i)} className="text-rose-500 hover:text-rose-400 font-bold p-2">✕</button>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_panen_broiler')}
                    className="w-full mt-6 py-3 bg-slate-950/40 hover:bg-slate-800 text-teal-400 font-bold rounded-xl border border-slate-800 transition-all text-xs"
                  >
                    + Catat Panen Broiler
                  </button>
                </>
              )}

              {activeCycle.mode === 'petelur' && (
                <>
                  {(activeCycle.data?.harian || []).length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">Belum ada data harian produksi telur.</div>
                  ) : (
                    (activeCycle.data?.harian || []).map((h: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-850/80 font-mono">
                        <div>
                          <div className="text-xs font-bold text-slate-200 font-sans">{h.tgl}</div>
                          <div className="text-[10px] text-slate-500 mt-1 font-bold">Telur: {h.butir} butir · Berat: {h.kg || 0} kg · Retak: {h.retak || 0} butir</div>
                        </div>
                        <button onClick={() => handleDeleteListItem('harian', i)} className="text-rose-500 hover:text-rose-400 font-bold p-2">✕</button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_harian_petelur')}
                    className="w-full mt-6 py-3 bg-slate-955/40 hover:bg-slate-800 text-teal-400 font-bold rounded-xl border border-slate-800 transition-all text-xs"
                  >
                    + Catat Produksi Harian
                  </button>
                </>
              )}

              {activeCycle.mode === 'pembibitan_unggas' && (
                <>
                  {(activeCycle.data?.penetasan || []).length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">Belum ada data penetasan.</div>
                  ) : (
                    (activeCycle.data?.penetasan || []).map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-850/80 font-mono">
                        <div>
                          <div className="text-xs font-bold text-slate-200 font-sans">Menetas: {p.tgl}</div>
                          <div className="text-[10px] text-slate-550 mt-1 font-bold">Berhasil: <strong className="text-emerald-450">{p.berhasil} DOC</strong> · Gagal: {p.gagal} butir</div>
                        </div>
                        <button onClick={() => handleDeleteListItem('penetasan', i)} className="text-rose-500 hover:text-rose-400 font-bold p-2">✕</button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_penetasan')}
                    className="w-full mt-6 py-3 bg-slate-955/40 hover:bg-slate-800 text-teal-400 font-bold rounded-xl border border-slate-800 transition-all text-xs"
                  >
                    + Catat Penetasan Telur
                  </button>
                </>
              )}

              {activeCycle.mode === 'penggemukan' && (
                <>
                  {(activeCycle.data?.panen || []).length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">Belum ada penjualan penggemukan.</div>
                  ) : (
                    (activeCycle.data?.panen || []).map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-850/80 font-mono">
                        <div>
                          <div className="text-xs font-bold text-slate-200 font-sans">{p.tgl} — {p.jml_jual} Ekor</div>
                          <div className="text-[10px] text-slate-500 mt-1 font-bold">BB Rata: {p.bb_akhir} kg · Harga: {formatRp(p.harga_kg)}/kg · Kematian: {p.jml_mati || 0}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-450">{formatRp(p.jml_jual * p.bb_akhir * p.harga_kg)}</span>
                          <button onClick={() => handleDeleteListItem('panen', i)} className="text-rose-500 hover:text-rose-400 font-bold p-2">✕</button>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_panen_penggemukan')}
                    className="w-full mt-6 py-3 bg-slate-955/40 hover:bg-slate-800 text-teal-400 font-bold rounded-xl border border-slate-800 transition-all text-xs"
                  >
                    + Catat Penjualan Penggemukan
                  </button>
                </>
              )}

              {activeCycle.mode === 'susu' && (
                <>
                  {(activeCycle.data?.harian || []).length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">Belum ada data produksi susu.</div>
                  ) : (
                    (activeCycle.data?.harian || []).map((h: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-850/80 font-mono">
                        <div>
                          <div className="text-xs font-bold text-slate-200 font-sans">{h.tgl}</div>
                          <div className="text-[10px] text-slate-500 mt-1 font-bold">Total Produksi Susu: <strong className="text-teal-400">{h.liter} L</strong></div>
                        </div>
                        <button onClick={() => handleDeleteListItem('harian', i)} className="text-rose-500 hover:text-rose-400 font-bold p-2">✕</button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_harian_susu')}
                    className="w-full mt-6 py-3 bg-slate-955/40 hover:bg-slate-800 text-teal-400 font-bold rounded-xl border border-slate-800 transition-all text-xs"
                  >
                    + Catat Produksi Harian Susu
                  </button>
                </>
              )}

              {activeCycle.mode === 'breeding_ruminansia' && (
                <>
                  {(activeCycle.data?.kelahiran || []).length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">Belum ada kelahiran tercatat.</div>
                  ) : (
                    (activeCycle.data?.kelahiran || []).map((k: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-850/80 font-mono">
                        <div>
                          <div className="text-xs font-bold text-slate-200 font-sans">{k.tgl} — ID Induk: {k.id_induk || '-'}</div>
                          <div className="text-[10px] text-slate-500 mt-1 font-bold">Anak Jantan: {k.jantan} ekor · Anak Betina: {k.betina} ekor</div>
                        </div>
                        <button onClick={() => handleDeleteListItem('kelahiran', i)} className="text-rose-500 hover:text-rose-400 font-bold p-2">✕</button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_kelahiran')}
                    className="w-full mt-6 py-3 bg-slate-955/40 hover:bg-slate-800 text-teal-400 font-bold rounded-xl border border-slate-800 transition-all text-xs"
                  >
                    + Catat Kelahiran Baru
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: PENJUALAN --- */}
        {activeTab === 'penjualan' && (
          <div className="max-w-xl mx-auto bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-250 flex items-center justify-between">
              <span>💰 Catat Penjualan Hasil Produksi</span>
              <span className="text-[10px] px-2.5 py-0.5 bg-teal-950/40 text-teal-400 rounded-md font-mono font-bold">
                {(activeCycle.data?.penjualan || []).length} Transaksi
              </span>
            </h3>

            <div className="space-y-3 font-mono">
              {(activeCycle.data?.penjualan || []).length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs font-sans">Belum ada transaksi penjualan dicatat.</div>
              ) : (
                (activeCycle.data?.penjualan || []).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-850/80">
                    <div>
                      <div className="text-xs font-bold text-slate-200 font-sans">{p.tgl} {p.tipe || p.kategori ? `— ${p.tipe || p.kategori}` : ''}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-bold">
                        {p.kg ? `Vol: ${p.kg} kg · Harga: ${formatRp(p.harga_kg)}/kg` : p.liter ? `Vol: ${p.liter} L · Harga: ${formatRp(p.harga_liter)}/L` : `Qty: ${p.jml} ekor · Harga: ${formatRp(p.harga_ekor)}/ekor`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-450">{formatRp(p.total)}</span>
                      <button onClick={() => handleDeleteListItem('penjualan', i)} className="text-rose-500 hover:text-rose-400 font-bold p-2">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => openModalForm(
                activeCycle.mode === 'petelur' 
                  ? 'modal_jual_petelur' 
: activeCycle.mode === 'pembibitan_unggas'
                  ? 'modal_jual_doc'
                  : 'modal_jual_breeding'
              )}
              className="w-full mt-6 py-3 bg-slate-955/40 hover:bg-slate-800 text-teal-400 font-bold rounded-xl border border-slate-800 transition-all text-xs"
            >
              + Catat Penjualan Baru
            </button>
          </div>
        )}

        {/* --- TAB: SIMULASI & FORMULASI PAKAN --- */}
        {activeTab === 'simulasi' && (
          profile?.organization?.plan === 'FREE' ? (
            renderUpgradeGate(
              'PRO',
              'Kalkulator & Formulasi Terkunci',
              'Kalkulator simulasi harga jual dan formulasi pakan Pearson Square hanya tersedia pada paket PRO dan ENTERPRISE. Tingkatkan bisnis peternakan Anda sekarang!'
            )
          ) : (
            <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
              
              {/* Simulasi Harga */}
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6">
                <h3 className="text-lg font-bold text-slate-250 flex items-center gap-2">
                  <span>📈</span> Simulasi Laba Berdasarkan Harga Jual
                </h3>
                <p className="text-xs text-slate-400">Geser slider di bawah ini untuk melihat perkiraan laba jika terjadi perubahan harga pasar.</p>
                
                {(() => {
                  const currentHarga = simHarga || (activeCycle.mode === 'broiler' ? 22000 : activeCycle.mode === 'petelur' ? 28000 : activeCycle.mode === 'susu' ? 7000 : 55000);
                  const minVal = activeCycle.mode === 'broiler' ? 10000 : activeCycle.mode === 'petelur' ? 15000 : activeCycle.mode === 'susu' ? 3000 : 20000;
                  const maxVal = activeCycle.mode === 'broiler' ? 60000 : activeCycle.mode === 'petelur' ? 50000 : activeCycle.mode === 'susu' ? 20000 : 150000;
                  const stepVal = activeCycle.mode === 'susu' ? 200 : activeCycle.mode === 'penggemukan' ? 1000 : 500;

                  let qty = 0;
                  if (activeCycle.mode === 'broiler') {
                    qty = (activeCycle.data?.panen || []).reduce((s, p) => s + (parseFloat(p.kg) || 0), 0);
                  } else if (activeCycle.mode === 'petelur') {
                    qty = (activeCycle.data?.harian || []).reduce((s, h) => s + (parseFloat(h.kg) || 0), 0);
                  } else if (activeCycle.mode === 'susu') {
                    qty = (activeCycle.data?.harian || []).reduce((s, h) => s + (parseFloat(h.liter) || 0), 0);
                  } else if (activeCycle.mode === 'penggemukan') {
                    qty = (activeCycle.data?.panen || []).reduce((s, p) => s + (parseFloat(p.bb_akhir) || 0) * (parseFloat(p.jml_jual) || 0), 0);
                  }

                  const totalModal = stats?.totalModal || 0;
                  const totalPendapatan = qty * currentHarga;
                  const labaSim = totalPendapatan - totalModal;

                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-350">
                        <span>Harga Simulasi:</span>
                        <span className="text-teal-400 font-extrabold text-sm">Rp {currentHarga.toLocaleString('id-ID')} / {activeCycle.mode === 'susu' ? 'Liter' : activeCycle.mode === 'petelur' ? 'Kg' : 'Kg BB'}</span>
                      </div>
                      <input
                        type="range"
                        min={minVal}
                        max={maxVal}
                        step={stepVal}
                        value={currentHarga}
                        onChange={(e) => setSimHarga(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                      />
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Pendapatan (Simulasi)</span>
                          <span className="text-sm font-black text-slate-200">Rp {totalPendapatan.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Laba Bersih (Simulasi)</span>
                          <span className={`text-sm font-black ${labaSim >= 0 ? 'text-teal-450' : 'text-rose-500'}`}>Rp {labaSim.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Pearson Square Feed Formulation */}
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-250 flex items-center gap-2">
                    <span>🌾</span> Formulasi Pakan Pearson Square
                  </h3>
                  <span className="px-2.5 py-1 bg-emerald-950/70 text-emerald-450 text-[10px] rounded-lg font-bold border border-emerald-500/20 uppercase tracking-wider">
                    Premium Feature
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Formulasikan pencampuran dua bahan baku pakan untuk mencapai target persentase protein kasar secara tepat.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Target Protein (%)</label>
                    <input
                      type="number"
                      value={pearsonTarget}
                      onChange={(e) => setPearsonTarget(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Hasil Pakan (kg)</label>
                    <input
                      type="number"
                      value={pearsonTotalKg}
                      onChange={(e) => setPearsonTotalKg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bahan A */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-3">
                    <h4 className="text-xs font-black text-teal-400 uppercase tracking-widest font-sans">Bahan Baku A (Protein Rendah)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Nama Bahan A</label>
                        <input
                          type="text"
                          value={pearsonIngA}
                          onChange={(e) => setPearsonIngA(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-250 focus:outline-none focus:border-teal-500 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Kadar Protein (%)</label>
                        <input
                          type="number"
                          value={pearsonProtA}
                          onChange={(e) => setPearsonProtA(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-250 focus:outline-none focus:border-teal-500 font-semibold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bahan B */}
                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-3">
                    <h4 className="text-xs font-black text-emerald-450 uppercase tracking-widest font-sans">Bahan Baku B (Protein Tinggi)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Nama Bahan B</label>
                        <input
                          type="text"
                          value={pearsonIngB}
                          onChange={(e) => setPearsonIngB(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-250 focus:outline-none focus:border-teal-500 font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Kadar Protein (%)</label>
                        <input
                          type="number"
                          value={pearsonProtB}
                          onChange={(e) => setPearsonProtB(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-250 focus:outline-none focus:border-teal-500 font-semibold font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {(() => {
                  const pTarget = pearsonTarget;
                  const pA = pearsonProtA;
                  const pB = pearsonProtB;
                  const diffA = Math.abs(pTarget - pB);
                  const diffB = Math.abs(pTarget - pA);
                  const totalParts = diffA + diffB;
                  const isFeasible = pTarget > Math.min(pA, pB) && pTarget < Math.max(pA, pB);

                  if (!isFeasible) {
                    return (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-455 p-4 rounded-2xl text-xs font-bold">
                        ⚠️ Target protein ({pTarget}%) harus bernilai di antara kadar protein {pearsonIngA} ({pA}%) dan {pearsonIngB} ({pB}%). Silakan sesuaikan target atau kadar protein bahan baku.
                      </div>
                    );
                  }

                  const pctA = (diffA / totalParts) * 100;
                  const pctB = (diffB / totalParts) * 100;
                  const kgA = (pctA / 100) * pearsonTotalKg;
                  const kgB = (pctB / 100) * pearsonTotalKg;

                  return (
                    <div className="space-y-6">
                      {/* Diagram Visual Square */}
                      <div className="bg-slate-950/45 p-6 rounded-2xl border border-slate-850 flex flex-col items-center justify-center relative overflow-hidden font-mono text-xs">
                        <div className="grid grid-cols-3 gap-y-8 gap-x-2 w-full max-w-md items-center text-center relative z-10">
                          {/* Row 1 */}
                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                            <span className="block text-[9px] text-slate-500 font-sans uppercase font-bold">{pearsonIngA}</span>
                            <strong className="text-teal-400 text-sm">{pA}%</strong>
                          </div>
                          <div className="text-slate-650 text-xl font-bold flex items-center justify-center h-full">↘</div>
                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                            <span className="block text-[9px] text-slate-500 font-sans uppercase font-bold">Bagian {pearsonIngA}</span>
                            <strong className="text-slate-200 text-sm">{diffA.toFixed(1)} bag</strong>
                          </div>

                          {/* Row 2 (Center) */}
                          <div />
                          <div className="bg-gradient-to-tr from-teal-905/60 to-emerald-905/60 border border-teal-500/30 p-3 rounded-2xl flex flex-col items-center justify-center aspect-square w-16 mx-auto -my-2 relative shadow-lg shadow-teal-950/40">
                            <span className="text-[8px] text-teal-400 uppercase tracking-widest font-sans font-black">Target</span>
                            <strong className="text-white text-base font-bold">{pTarget}%</strong>
                          </div>
                          <div />

                          {/* Row 3 */}
                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                            <span className="block text-[9px] text-slate-500 font-sans uppercase font-bold">{pearsonIngB}</span>
                            <strong className="text-emerald-450 text-sm">{pB}%</strong>
                          </div>
                          <div className="text-slate-650 text-xl font-bold flex items-center justify-center h-full">↗</div>
                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                            <span className="block text-[9px] text-slate-500 font-sans uppercase font-bold">Bagian {pearsonIngB}</span>
                            <strong className="text-slate-200 text-sm">{diffB.toFixed(1)} bag</strong>
                          </div>
                        </div>
                      </div>

                      {/* Recipe Table Card */}
                      <div className="bg-gradient-to-r from-teal-950/20 to-emerald-950/20 p-5 rounded-2xl border border-teal-500/10">
                        <h4 className="text-xs font-bold text-slate-200 mb-4 uppercase tracking-wider font-sans">Hasil Formulasi Pakan</h4>
                        <div className="space-y-3.5 font-mono">
                          <div className="flex justify-between items-center text-xs border-b border-slate-850 pb-2">
                            <span className="text-slate-450 font-semibold font-sans">{pearsonIngA} ({pA}% Protein)</span>
                            <span className="text-teal-450 font-black">{pctA.toFixed(1)}% <span className="text-slate-400 font-medium">({kgA.toFixed(2)} kg)</span></span>
                          </div>
                          <div className="flex justify-between items-center text-xs border-b border-slate-850 pb-2">
                            <span className="text-slate-450 font-semibold font-sans">{pearsonIngB} ({pB}% Protein)</span>
                            <span className="text-emerald-400 font-black">{pctB.toFixed(1)}% <span className="text-slate-400 font-medium">({kgB.toFixed(2)} kg)</span></span>
                          </div>
                          <div className="flex justify-between items-center text-xs pt-1">
                            <span className="text-slate-200 font-extrabold uppercase font-sans">Total Target Campuran</span>
                            <strong className="text-white font-black text-sm">100% ({pearsonTotalKg.toFixed(0)} kg) @ {pTarget}% Protein</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Standalone manual FCR Calculator */}
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-250 flex items-center gap-2">
                    <span>⚖️</span> Kalkulator FCR Manual (Feed Conversion Ratio)
                  </h3>
                  <span className="px-2.5 py-1 bg-emerald-950/70 text-emerald-450 text-[10px] rounded-lg font-bold border border-emerald-500/20 uppercase tracking-wider">
                    Premium Feature
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Hitung nilai konversi pakan secara cepat untuk mengukur tingkat efisiensi serapan pakan ternak Anda.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Konsumsi Pakan (kg)</label>
                    <input
                      type="number"
                      value={manualFcrFeed}
                      onChange={(e) => setManualFcrFeed(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Bobot Hasil Panen (kg)</label>
                    <input
                      type="number"
                      value={manualFcrWeight}
                      onChange={(e) => setManualFcrWeight(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold font-mono text-sm"
                    />
                  </div>
                </div>

                {(() => {
                  const feed = manualFcrFeed;
                  const weight = manualFcrWeight;
                  if (weight <= 0) {
                    return (
                      <div className="bg-slate-955/40 text-center py-6 text-xs text-slate-550 font-bold border border-slate-850 rounded-2xl">
                        Awaiting weight entry...
                      </div>
                    );
                  }

                  const fcrVal = feed / weight;
                  let fcrStatus = '';
                  let fcrBg = '';
                  let fcrText = '';

                  if (fcrVal <= 1.5) {
                    fcrStatus = 'Sangat Efisien (Bagus Sekali) 🌟';
                    fcrBg = 'bg-emerald-500/10 border-emerald-500/20';
                    fcrText = 'text-emerald-400';
                  } else if (fcrVal <= 1.8) {
                    fcrStatus = 'Efisien (Standar) 👍';
                    fcrBg = 'bg-teal-500/10 border-teal-500/20';
                    fcrText = 'text-teal-400';
                  } else {
                    fcrStatus = 'Kurang Efisien (Butuh Evaluasi Pakan/Kandang) ⚠️';
                    fcrBg = 'bg-rose-500/10 border-rose-500/20';
                    fcrText = 'text-rose-450';
                  }

                  return (
                    <div className={`p-5 rounded-2xl border ${fcrBg} space-y-2`}>
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Hasil Rasio Konversi Pakan</span>
                      <div className="flex justify-between items-baseline flex-wrap gap-2">
                        <strong className={`text-3xl font-black font-mono ${fcrText}`}>{fcrVal.toFixed(2)}</strong>
                        <span className={`text-xs font-extrabold ${fcrText}`}>{fcrStatus}</span>
                      </div>
                      <p className="text-[10px] text-slate-550 leading-relaxed font-semibold font-sans">
                        *Artinya, untuk memproduksi 1 kg berat badan hewan ternak, dibutuhkan pasokan pakan sebanyak {fcrVal.toFixed(2)} kg. Semakin kecil angka FCR, semakin tinggi profit yang dihasilkan.
                      </p>
                    </div>
                  );
                })()}
              </div>

            </div>
          )
        )}

        {/* --- TAB: KALENDER OPERASIONAL & VAKSINASI --- */}
        {activeTab === 'jadwal_kerja' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                  <span>📅</span> Kalender Kegiatan & Vaksinasi
                </h3>
                <p className="text-xs text-slate-450 mt-1">
                  Jadwal rutin harian ini dihitung otomatis dari tanggal mulai siklus: <strong className="text-teal-400 font-mono">{parsedStartDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </p>
              </div>
              <div className="bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-xl text-center self-start">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Pencapaian Tugas</span>
                <span className="text-sm font-black text-teal-450 font-mono">
                  {calendarTasks.filter((t) => (activeCycle.data?.checkedTasks || []).includes(t.id)).length} / {calendarTasks.length} Selesai
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {calendarTasks.map((task) => {
                const isChecked = (activeCycle.data?.checkedTasks || []).includes(task.id);
                return (
                  <div 
                    key={task.id} 
                    onClick={() => handleToggleTask(task.id)}
                    className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer select-none ${
                      isChecked 
                        ? 'bg-slate-900/10 border-teal-500/15 opacity-60' 
                        : 'bg-slate-900/30 border-slate-850 hover:border-teal-500/30 hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Checkbox circle/box */}
                    <div className="mt-1 flex-shrink-0">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-teal-500 border-teal-500 text-slate-950 font-bold' : 'border-slate-800'}`}>
                        {isChecked && '✓'}
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-extrabold text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded-lg border border-teal-500/10 font-mono">
                          Hari ke-{task.day}
                        </span>
                        <span className="text-xs font-bold text-slate-500 font-mono">
                          {task.date}
                        </span>
                      </div>
                      
                      <h4 className={`text-sm font-black ${isChecked ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {task.title}
                      </h4>
                      <p className={`text-xs mt-1 leading-relaxed ${isChecked ? 'line-through text-slate-500' : 'text-slate-400 font-medium'}`}>
                        {task.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
            {/* --- TAB: AI VET CHAT SCREEN --- */}
        {activeTab === 'ai_vet' && (
          profile?.organization?.plan === 'FREE' ? (
            renderUpgradeGate(
              'PRO',
              'Radeya AI Vet Terkunci',
              'Konsultasikan kesehatan ternak Anda secara cerdas bersama Radeya AI Vet. Fitur ini hanya tersedia pada paket PRO dan ENTERPRISE.'
            )
          ) : (
            <div className="max-w-3xl mx-auto h-[600px] bg-slate-900/20 border border-teal-500/10 rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
              
              {/* Header info */}
              <div className="bg-slate-950/80 border-b border-slate-900 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-xl">
                    👨‍⚕️
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">Radeya AI Vet</h4>
                    <span className="text-[10px] font-bold text-emerald-450 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Asisten Konsultasi Aktif
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setChatMessages([])} 
                  className="text-[10px] bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl font-bold transition-all"
                >
                  Clear Chat
                </button>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    Ketik pertanyaan Anda di bawah untuk memulai sesi tanya-jawab dengan AI Vet.
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed font-semibold ${
                        msg.role === 'user'
                          ? 'bg-teal-650 text-white rounded-br-none'
                          : 'bg-slate-950/80 text-slate-200 border border-slate-850 rounded-bl-none'
                      }`}>
                        {/* Simple custom formatter for bold and bullets */}
                        {msg.text.split('\n').map((line, idx) => {
                          let content: React.ReactNode = line;
                          // Replace **bold**
                          if (line.includes('**')) {
                            const parts = line.split('**');
                            content = parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-teal-300 font-extrabold">{part}</strong> : part);
                          }
                          // Bullet point indentation helper
                          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim());
                          return (
                            <p key={idx} className={`${isBullet ? 'pl-2 py-0.5' : ''} ${idx > 0 ? 'mt-1' : ''}`}>
                              {content}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
                {isChatLoading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-slate-950/80 text-slate-350 p-4 rounded-2xl rounded-bl-none border border-slate-850 text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span>Dokter mengetik respon...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSendChatMessage} className="bg-slate-955/90 border-t border-slate-900 p-4 flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tanyakan keluhan ternak Anda di sini (misal: ayam lemas berak kapur)..."
                  className="flex-1 bg-slate-900/60 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-3 text-slate-200 text-xs font-semibold outline-none transition-colors"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-gradient-to-tr from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold px-5 py-3 rounded-xl transition-all disabled:opacity-50 text-xs uppercase tracking-wider"
                >
                  Kirim
                </button>
              </form>
            </div>
          )
        )}

        {/* --- TAB: TEAM MANAGEMENT --- */}
        {activeTab === 'team_management' && (
          profile?.organization?.plan !== 'ENTERPRISE' ? (
            renderUpgradeGate(
              'ENTERPRISE',
              'Kelola Anggota Tim Terkunci',
              'Kelola peternakan Anda bersama tim secara kolaboratif (Boss & Pekerja). Fitur multi-user ini hanya tersedia pada paket ENTERPRISE.'
            )
          ) : (
            <div className="max-w-3xl mx-auto bg-slate-900/30 border border-slate-850 p-8 rounded-3xl space-y-8 animate-fadeIn">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>👥</span> Kelola Anggota Tim (Pekerja)
              </h3>
              <p className="text-sm text-slate-450 leading-relaxed font-semibold">
                Sebagai pemilik (Boss), Anda dapat mendaftarkan akun pekerja untuk mencatat data harian peternakan. Pekerja hanya dapat menginput data dan tidak diizinkan untuk menghapus data.
              </p>

              {/* Form Tambah Anggota */}
              <form onSubmit={handleAddTeamMember} className="space-y-4 bg-slate-955/20 p-6 rounded-2xl border border-slate-850">
                <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest">Tambah Pekerja Baru</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-semibold"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email Pekerja"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-semibold"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Password Akun"
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAddingMember}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isAddingMember ? 'Menyimpan...' : '+ Daftarkan Pekerja'}
                </button>
              </form>

              {/* Daftar Anggota */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest">Daftar Tim Aktif</h4>
                <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/20">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Nama</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Peran</th>
                        <th className="px-6 py-3">Tanggal Dibuat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300 font-medium">
                      {teamMembers.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4">{member.name}</td>
                          <td className="px-6 py-4">{member.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              member.role === 'OWNER' 
                                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                                : 'bg-slate-800 text-slate-400 border border-slate-700/30'
                            }`}>
                              {member.role === 'OWNER' ? 'BOSS (Owner)' : 'PEKERJA (Member)'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {new Date(member.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}

      </main>

      {/* FAB Floating Action Button (Only visible on input tabs) */}
      {['biaya', 'panen', 'penjualan'].includes(activeTab) && (
        <button
          onClick={() => {
            if (activeTab === 'biaya') {
              openModalForm((activeCycle.mode === 'broiler' || activeCycle.mode === 'petelur') ? 'modal_pakan' : activeCycle.mode === 'susu' ? 'modal_biaya_susu' : 'modal_biaya_ruminansia');
            } else if (activeTab === 'panen') {
              openModalForm(
                activeCycle.mode === 'broiler' 
                  ? 'modal_panen_broiler' 
                  : activeCycle.mode === 'petelur' 
                  ? 'modal_harian_petelur' 
                  : activeCycle.mode === 'pembibitan_unggas'
                  ? 'modal_penetasan' 
                  : activeCycle.mode === 'penggemukan'
                  ? 'modal_panen_penggemukan'
                  : activeCycle.mode === 'susu'
                  ? 'modal_harian_susu'
                  : 'modal_kelahiran'
              );
            } else if (activeTab === 'penjualan') {
              openModalForm(
                activeCycle.mode === 'petelur' 
                  ? 'modal_jual_petelur' 
                  : activeCycle.mode === 'susu'
                  ? 'modal_jual_susu'
                  : activeCycle.mode === 'pembibitan_unggas'
                  ? 'modal_jual_doc'
                  : 'modal_jual_breeding'
              );
            }
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-xl shadow-teal-500/25 hover:scale-105 active:scale-95 transition-all z-45"
        >
          {Icons.plus("w-6 h-6 text-white")}
        </button>
      )}

      {/* --- DYNAMIC INPUT MODAL --- */}
      {activeModal && activeModal !== 'new_cycle_wizard' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md relative shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-slate-100 mb-6">{modalTitle}</h3>

            <form onSubmit={handleModalFormSubmit} className="space-y-4">
              
              {formFields.tgl !== undefined && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formFields.tgl}
                    onChange={(e) => updateFormField('tgl', e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                  />
                </div>
              )}

              {/* Feed Fields */}
              {activeModal === 'modal_pakan' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Jenis Pakan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pakan Broiler Starter"
                      value={formFields.jenis}
                      onChange={(e) => updateFormField('jenis', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Jumlah Sak</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 10"
                        value={formFields.sak}
                        onChange={(e) => updateFormField('sak', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Berat per Sak (kg)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 50"
                        value={formFields.kg_sak}
                        onChange={(e) => updateFormField('kg_sak', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Harga per Sak (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 350000"
                      value={formFields.harga_sak}
                      onChange={(e) => updateFormField('harga_sak', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Medicine/Obat Fields */}
              {activeModal === 'modal_obat' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Nama Obat/Vaksin</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Vitamin A, Vaksin Gumboro"
                      value={formFields.nama}
                      onChange={(e) => updateFormField('nama', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Keterangan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Dosis 5ml per ekor"
                      value={formFields.ket}
                      onChange={(e) => updateFormField('ket', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Biaya Obat (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 150000"
                      value={formFields.total}
                      onChange={(e) => updateFormField('total', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Other Expenses Fields */}
              {activeModal === 'modal_lain' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Nama Pengeluaran</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Sekam Kandang, Gaji Pekerja"
                      value={formFields.nama}
                      onChange={(e) => updateFormField('nama', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Keterangan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Tambahan sekam 10 karung"
                      value={formFields.ket}
                      onChange={(e) => updateFormField('ket', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Biaya (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 200000"
                      value={formFields.total}
                      onChange={(e) => updateFormField('total', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Broiler Harvest Fields */}
              {activeModal === 'modal_panen_broiler' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Panen (kg)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      placeholder="Contoh: 1200"
                      value={formFields.kg}
                      onChange={(e) => updateFormField('kg', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Harga Jual per kg (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 22000"
                      value={formFields.harga_kg}
                      onChange={(e) => updateFormField('harga_kg', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Jumlah Ayam Kematian (Ekor)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 10"
                      value={formFields.jml_mati}
                      onChange={(e) => updateFormField('jml_mati', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Egg Layer Daily Yield Fields */}
              {activeModal === 'modal_harian_petelur' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Jumlah Telur (Butir)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 350"
                      value={formFields.butir}
                      onChange={(e) => updateFormField('butir', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Berat Telur (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Contoh: 20"
                      value={formFields.kg}
                      onChange={(e) => updateFormField('kg', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Telur Retak / BS (Butir)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 5"
                      value={formFields.retak}
                      onChange={(e) => updateFormField('retak', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Egg Layer Sales Fields */}
              {activeModal === 'modal_jual_petelur' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Jumlah Jual (kg)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      placeholder="Contoh: 50"
                      value={formFields.kg}
                      onChange={(e) => updateFormField('kg', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Harga per kg (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 28000"
                      value={formFields.harga_kg}
                      onChange={(e) => updateFormField('harga_kg', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Ruminant Cost Fields */}
              {(activeModal === 'modal_biaya_ruminansia' || activeModal === 'modal_biaya_susu') && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Jenis Pengeluaran</label>
                    <select
                      value={formFields.type}
                      onChange={(e) => updateFormField('type', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none text-xs font-bold"
                    >
                      <option value="pakan">Pakan / Hijauan / Konsentrat</option>
                      <option value="obat">Kesehatan / Obat / Hormon / IB</option>
                      <option value="lain">Lain-lain (TK, Listrik, dll)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Detail Nama Pengeluaran</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Jerami Fermentasi, Vitamin ADE"
                      value={formFields.nama}
                      onChange={(e) => updateFormField('nama', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Volume Berat (kg)</label>
                      <input
                        type="number"
                        placeholder="Contoh: 100"
                        value={formFields.kg}
                        onChange={(e) => updateFormField('kg', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Biaya (Rp)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 250000"
                        value={formFields.total}
                        onChange={(e) => updateFormField('total', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Ruminant Fattening Harvest Fields */}
              {activeModal === 'modal_panen_penggemukan' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Jumlah Ekor Dijual</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 5"
                        value={formFields.jml_jual}
                        onChange={(e) => updateFormField('jml_jual', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">BB Akhir Rata2 (kg)</label>
                      <input
                        type="number"
                        required
                        step="0.1"
                        placeholder="Contoh: 400"
                        value={formFields.bb_akhir}
                        onChange={(e) => updateFormField('bb_akhir', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Harga Jual per kg (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 55000"
                      value={formFields.harga_kg}
                      onChange={(e) => updateFormField('harga_kg', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Kematian (Ekor)</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={formFields.jml_mati}
                      onChange={(e) => updateFormField('jml_mati', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Milk Yield Fields */}
              {activeModal === 'modal_harian_susu' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Total Produksi Susu (Liter)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    placeholder="Contoh: 50"
                    value={formFields.liter}
                    onChange={(e) => updateFormField('liter', e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                  />
                </div>
              )}

              {/* Milk Sales Fields */}
              {activeModal === 'modal_jual_susu' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Volume Disetor (Liter)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      placeholder="Contoh: 150"
                      value={formFields.liter}
                      onChange={(e) => updateFormField('liter', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Harga per Liter (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 7000"
                      value={formFields.harga_liter}
                      onChange={(e) => updateFormField('harga_liter', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Breeding Birth Fields */}
              {activeModal === 'modal_kelahiran' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">ID / Tag Indukan Betina</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: A-01, B-03"
                      value={formFields.id_induk}
                      onChange={(e) => updateFormField('id_induk', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Anak Jantan</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 1"
                        value={formFields.jantan}
                        onChange={(e) => updateFormField('jantan', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Anak Betina</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 1"
                        value={formFields.betina}
                        onChange={(e) => updateFormField('betina', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Breeding Sales Fields */}
              {activeModal === 'modal_jual_breeding' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Kategori</label>
                      <select
                        value={formFields.kategori}
                        onChange={(e) => updateFormField('kategori', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none text-xs font-bold"
                      >
                        <option>Bakalan</option>
                        <option>Afkir Betina</option>
                        <option>Afkir Jantan</option>
                        <option>Indukan</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Jenis Kelamin</label>
                      <select
                        value={formFields.jenis}
                        onChange={(e) => updateFormField('jenis', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none text-xs font-bold"
                      >
                        <option value="jantan">Jantan</option>
                        <option value="betina">Betina</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Jumlah (Ekor)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 2"
                        value={formFields.jml}
                        onChange={(e) => updateFormField('jml', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Harga per Ekor (Rp)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 3500000"
                        value={formFields.harga_ekor}
                        onChange={(e) => updateFormField('harga_ekor', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Egg Incubator / Pembibitan Yield Fields */}
              {activeModal === 'modal_telur_pembibitan' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Periode</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Minggu ke-1"
                      value={formFields.periode}
                      onChange={(e) => updateFormField('periode', e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">T. Dikumpulkan (Butir)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 200"
                        value={formFields.dikumpulkan}
                        onChange={(e) => updateFormField('dikumpulkan', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Masuk Tetas (Butir)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 180"
                        value={formFields.masuk_tetas}
                        onChange={(e) => updateFormField('masuk_tetas', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Egg Incubator / Pembibitan Sales Fields */}
              {activeModal === 'modal_jual_doc' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Tipe Penjualan</label>
                    <select
                      value={formFields.tipe}
                      onChange={(e) => updateFormField('tipe', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none text-xs font-bold"
                    >
                      <option>DOC</option>
                      <option>Ayam Remaja</option>
                      <option>Afkir</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Jumlah Ekor</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 100"
                        value={formFields.jml}
                        onChange={(e) => updateFormField('jml', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Harga per Ekor (Rp)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 8000"
                        value={formFields.harga_ekor}
                        onChange={(e) => updateFormField('harga_ekor', e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 transition-all font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              {previewVal && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-2xl flex justify-between items-center text-xs font-bold font-mono">
                  <span className="font-sans">Estimasi Total Biaya/Penjualan:</span>
                  <span className="text-sm font-black">{previewVal}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20 text-xs uppercase tracking-wider"
              >
                Simpan Catatan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- NEW CYCLE WIZARD OVERLAY --- */}
      {activeModal === 'new_cycle_wizard' && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-[#070e10] border border-teal-500/10 rounded-3xl p-6 w-full max-w-4xl relative shadow-2xl my-8">
            <NewCycleWizard
              profile={profile}
              onClose={() => setActiveModal(null)}
              onSubmit={async (name, animal, scaleStr, modalData) => {
                await handleCreateCycle(name, animal, scaleStr, modalData);
                setActiveModal(null);
              }}
              isModal={true}
            />
          </div>
        </div>
      )}

      {/* --- CONFIRMATION DIALOG MODAL --- */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <span className="text-5xl block mb-4">⚠️</span>
            <h3 className="text-lg font-bold text-slate-100 mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed font-semibold">{confirmModal.msg}</p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                className="flex-1 py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmModal.action}
                className={`flex-1 py-2.5 text-white font-bold rounded-xl text-xs transition-colors ${confirmModal.btnColor}`}
              >
                {confirmModal.btnText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BILLING / UPGRADE MODAL --- */}
      {billingModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-[#0b1f22] border border-teal-500/20 rounded-3xl p-8 w-full max-w-4xl shadow-2xl relative my-8">
            <button
              onClick={() => setBillingModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-full flex items-center justify-center transition-all border border-slate-800"
            >
              &times;
            </button>

            <div className="text-center mb-8">
              <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                Radeya Premium
              </span>
              <h3 className="text-2xl font-black text-slate-100 mt-3">Pilih Paket Langganan Peternakan Anda</h3>
              <p className="text-xs text-slate-450 mt-1 max-w-md mx-auto">
                Buka seluruh potensi otomatisasi Radeya SaaS untuk meningkatkan efisiensi dan laba peternakan Anda harian.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card FREE */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <h4 className="text-sm font-black text-slate-300">FREE TIER</h4>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-200">Rp 0</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">/ Selamanya</span>
                  </div>
                  <p className="text-[11px] text-slate-450 mt-3 leading-relaxed">
                    Sangat cocok untuk peternak pemula skala kecil rumahan.
                  </p>
                  <ul className="mt-6 space-y-3.5 text-[11px] text-slate-400 font-bold">
                    <li className="flex items-center gap-2">
                      <span className="text-teal-400">✓</span> 3 Siklus Ternak Aktif
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-teal-400">✓</span> Kalender Kerja Harian
                    </li>
                    <li className="flex items-center gap-2 text-slate-550 line-through">
                      <span>✗</span> Skala Besar / Komersil
                    </li>
                    <li className="flex items-center gap-2 text-slate-550 line-through">
                      <span>✗</span> Radeya AI Vet Chat
                    </li>
                    <li className="flex items-center gap-2 text-slate-550 line-through">
                      <span>✗</span> Pearson Square & FCR
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <button
                    disabled
                    className="w-full py-3 bg-slate-900 border border-slate-800 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                  >
                    {profile?.organization?.plan === 'FREE' ? 'Paket Aktif Saat Ini' : 'Bawaan'}
                  </button>
                </div>
              </div>

              {/* Card PRO */}
              <div className="bg-[#082a2e]/30 border-2 border-teal-500/30 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-lg shadow-teal-955/10">
                <div className="absolute top-0 right-0 bg-teal-500 text-[#070e10] text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest">
                  Terpopuler
                </div>
                <div>
                  <h4 className="text-sm font-black text-teal-400">PRO PLAN</h4>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-200">Rp 50.000</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">/ Bulan</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                    Membuka analisis medis dan pakan cerdas untuk efisiensi penuh.
                  </p>
                  <ul className="mt-6 space-y-3.5 text-[11px] text-slate-350 font-bold">
                    <li className="flex items-center gap-2">
                      <span className="text-teal-450">✓</span> 10 Siklus Ternak Aktif
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-teal-450">✓</span> **Buka Skala Besar / Komersil**
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-teal-450">✓</span> **Radeya AI Vet Chat Tanpa Batas**
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-teal-450">✓</span> **Kalkulator Pearson & Rumus FCR**
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => handleCheckoutMidtrans('PRO')}
                    disabled={billingLoading}
                    className="w-full py-3 bg-gradient-to-r from-teal-650 to-emerald-650 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {profile?.organization?.plan === 'PRO' ? 'Perpanjang Langganan' : billingLoading ? 'Memproses...' : 'Pilih Paket PRO'}
                  </button>
                </div>
              </div>

              {/* Card ENTERPRISE */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <h4 className="text-sm font-black text-emerald-450">ENTERPRISE</h4>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-200">Rp 150.000</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">/ Bulan</span>
                  </div>
                  <p className="text-[11px] text-slate-450 mt-3 leading-relaxed">
                    Sangat pas untuk peternakan modern komersil dengan banyak pekerja.
                  </p>
                  <ul className="mt-6 space-y-3.5 text-[11px] text-slate-400 font-bold">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-450">✓</span> 100 Siklus Ternak Aktif
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-450">✓</span> **Kolaborasi Multi-user (Tim)**
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-450">✓</span> **1 Akun Boss + Banyak Pekerja**
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-450">✓</span> Hak akses input terkendali
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => handleCheckoutMidtrans('ENTERPRISE')}
                    disabled={billingLoading}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {profile?.organization?.plan === 'ENTERPRISE' ? 'Perpanjang Langganan' : billingLoading ? 'Memproses...' : 'Pilih Paket ENTERPRISE'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* --- FLOATING TOAST --- */}
      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-850 text-slate-200 px-6 py-3.5 rounded-full text-xs font-extrabold shadow-2xl z-55 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          {toastMsg}
        </div>
      )}

    </div>
  );
}
