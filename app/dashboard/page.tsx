'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import NewCycleWizard from '@/components/NewCycleWizard';
import FeedFormulator from '@/components/FeedFormulator';
import { COBB500_STANDARD, LOHMANN_STANDARD, KEPADATAN_STANDAR } from '@/constants/strainStandards';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
    resep_pakan?: any[];
    sampling?: any[];
    kualitas_air?: any[];
    pemijahan?: any[];
    perkawinan?: any[];
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
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-4 3-5 8-2 13 2 3 5 5 5 5s3-2 5-5c3-5 2-10-2-13m-6 20V12m0 0c-1-1-3-1.5-4-1m4 1c1-1 3-1.5 4-1m-4 5c-1-1-2.5-1.5-3.5-1m3.5 1c1-1 2.5-1.5 3.5-1" />
    </svg>
  ),
  modalAwal: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20v-8m0 0c0-3-1.5-6-4.5-7m4.5 7c0-3 1.5-6 4.5-7m-4.5 7c0-2-2-4-5-3.5m5 3.5c0-2 2-4 5-3.5M6 20h12" />
    </svg>
  ),
  biaya: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18c-1 1-2.5 2-3 3.5m3-3.5c1 1 2.5 2 3 3.5M12 8c-1.5 1-3 2.5-3.5 4.5m3.5-4.5c1.5 1 3 2.5 3.5 4.5M12 13c-1.5 1-3.5 3-4 5m4-5c1.5 1 3.5 3 4 5" />
    </svg>
  ),
  panen: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16m-2 0l-1.5 9A2 2 0 0114.5 21h-5a2 2 0 01-2-1.8L6 10m12 0C18 6.5 15.3 4 12 4S6 6.5 6 10m3 0v11m6-11v11m-9-6h12m-12 5h12" />
    </svg>
  ),
  simulasi: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17m0-17H6m6 0h6M6 7l-2 5h4l-2-5zm12 0l-2 5h4l-2-5zm-6 13h-4m4 0h4m-4-10h.01" />
    </svg>
  ),
  plus: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
    </svg>
  ),
  trash: (className = "w-4 h-4") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  export: (className = "w-4 h-4") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  calendar: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  aiVet: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-5-4.5-8-7.5-8-10.5 0-3 2.5-5.5 5.5-5.5 1.5 0 3 1 3.5 2.5.5-1.5 2-2.5 3.5-2.5 3 0 5.5 2.5 5.5 5.5 0 3-3 6-8 10.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7c-1.5 2-3 2.5-3 4.5s1.5 3 3 5c1.5-2 3-3 3-5s-1.5-2.5-3-4.5z" />
    </svg>
  ),
  team: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  ventilasi: (className = "w-5 h-5") => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0M12 2v10m0 0l7.07 7.07M12 12l-7.07 7.07M12 12H2m10 0h10m-10 0L4.93 4.93m7.07 7.07l7.07-7.07" />
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
  if (animal === 'bebek_pedaging') return 'bebek_pedaging';
  if (animal === 'bebek_petelur') return 'bebek_petelur';
  if (animal === 'ikan_pembesaran') return 'ikan_pembesaran';
  if (animal === 'ikan_pembibitan') return 'ikan_pembibitan';

  const isPerah = ['sapi_perah', 'kambing_perah'].includes(animal);
  const isAyamPetelur = ['ayam_petelur'].includes(animal);
  const isRuminanPedaging = ['sapi_pedaging', 'kambing_pedaging'].includes(animal);
  const isUnggasPedaging = ['ayam_pedaging', 'enthok_pedaging'].includes(animal);

  if (isPerah) return 'susu';
  if (isAyamPetelur) return 'petelur';
  if (isRuminanPedaging) return 'penggemukan';
  if (isUnggasPedaging) return 'broiler';
  return 'broiler';
};

const normalizeCycle = (c: any): any => {
  if (!c) return c;
  let mode = c.mode;
  if (c.animal === 'bebek_pedaging' && mode === 'broiler') mode = 'bebek_pedaging';
  if (c.animal === 'bebek_petelur' && mode === 'petelur') mode = 'bebek_petelur';
  if (c.animal === 'ikan_pembesaran' && mode === 'broiler') mode = 'ikan_pembesaran';
  if (c.animal === 'ikan_pembibitan' && mode === 'pembibitan_unggas') mode = 'ikan_pembibitan';
  return { ...c, mode };
};

const getKepadatanKey = (cycle: any): string => {
  if (!cycle) return '';
  const animal = cycle.animal || '';
  const mode = cycle.mode || '';
  const m = cycle.data?.modal || {};
  
  if (mode === 'broiler') {
    return m.kepadatan_system === 'welfare' ? 'broiler_welfare' : 'broiler_komersil';
  }
  if (mode === 'bebek_pedaging') return 'bebek_pedaging';
  if (mode === 'bebek_petelur') return 'bebek_petelur';
  if (mode === 'petelur') {
    return m.kepadatan_system === 'baterai' ? 'petelur_baterai' : 'petelur_lantai';
  }
  if (mode === 'penggemukan' || mode === 'susu' || mode === 'breeding_ruminansia') {
    return animal.startsWith('sapi') ? 'sapi' : 'kambing';
  }
  if (mode === 'ikan_pembesaran' || mode === 'ikan_pembibitan') {
    const jenis = m.jenis_ikan || 'nila';
    const sistem = m.sistem_kolam || 'konvensional';
    if (jenis === 'lele') {
      return sistem === 'bioflok' ? 'lele_bioflok' : 'lele_konvensional';
    } else {
      return sistem === 'bioflok' ? 'nila_bioflok' : 'nila_konvensional';
    }
  }
  return 'broiler_komersil';
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
      { id: 'ly_d60', day: 60, date: formatTaskDate(59), title: animal === 'bebek_petelur' ? 'Evaluasi Duck-Day %' : 'Evaluasi Hen Day (HD %)', desc: animal === 'bebek_petelur' ? 'Hitung persentase produktivitas telur bebek harian.' : 'Hitung persentase produktivitas telur harian. Target Hen Day minggu ke-8 di atas 50%.' }
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

const checkWaterParam = (paramName: string, val: number) => {
  if (val === undefined || isNaN(val)) return { status: '-', color: 'text-[#3C3530]/60 bg-[#FCFAF6] border-[#EADDC9]' };
  
  switch (paramName) {
    case 'suhu':
      if (val < 24 || val > 32) return { status: '🔴 Kritis', color: 'text-[#A76A57] bg-[#A76A57]/15 border-[#A76A57]/20' };
      if (val < 26 || val > 30) return { status: '🟡 Waspada', color: 'text-[#3C3530]/90 bg-[#EADDC9]/35 border-[#EADDC9]/50' };
      return { status: '🟢 Aman', color: 'text-[#4D5D4A] bg-[#859681]/15 border-emerald-500/20' };
    case 'ph':
      if (val < 6.5 || val > 9.0) return { status: '🔴 Kritis', color: 'text-[#A76A57] bg-[#A76A57]/15 border-[#A76A57]/20' };
      if (val < 7.0 || val > 8.5) return { status: '🟡 Waspada', color: 'text-[#3C3530]/90 bg-[#EADDC9]/35 border-[#EADDC9]/50' };
      return { status: '🟢 Aman', color: 'text-[#4D5D4A] bg-[#859681]/15 border-emerald-500/20' };
    case 'do':
      if (val < 3.0) return { status: '🔴 Bahaya', color: 'text-[#A76A57] bg-[#A76A57]/15 border-[#A76A57]/20 animate-pulse' };
      if (val < 4.0) return { status: '🟡 Kurang', color: 'text-[#3C3530]/90 bg-[#EADDC9]/35 border-[#EADDC9]/50' };
      return { status: '🟢 Aman', color: 'text-[#4D5D4A] bg-[#859681]/15 border-emerald-500/20' };
    case 'amonia':
      if (val > 0.1) return { status: '🔴 Kritis', color: 'text-[#A76A57] bg-[#A76A57]/15 border-[#A76A57]/20' };
      if (val > 0.02) return { status: '🟡 Tinggi', color: 'text-[#3C3530]/90 bg-[#EADDC9]/35 border-[#EADDC9]/50' };
      return { status: '🟢 Aman', color: 'text-[#4D5D4A] bg-[#859681]/15 border-emerald-500/20' };
    case 'nitrit':
      if (val > 0.5) return { status: '🔴 Kritis', color: 'text-[#A76A57] bg-[#A76A57]/15 border-[#A76A57]/20' };
      if (val > 0.1) return { status: '🟡 Tinggi', color: 'text-[#3C3530]/90 bg-[#EADDC9]/35 border-[#EADDC9]/50' };
      return { status: '🟢 Aman', color: 'text-[#4D5D4A] bg-[#859681]/15 border-emerald-500/20' };
    case 'kecerahan':
      if (val < 20 || val > 50) return { status: '🔴 Kritis', color: 'text-[#A76A57] bg-[#A76A57]/15 border-[#A76A57]/20' };
      if (val < 30 || val > 40) return { status: '🟡 Waspada', color: 'text-[#3C3530]/90 bg-[#EADDC9]/35 border-[#EADDC9]/50' };
      return { status: '🟢 Aman', color: 'text-[#4D5D4A] bg-[#859681]/15 border-emerald-500/20' };
    case 'volume_flok':
      if (val > 60) return { status: '🔴 Siphon!', color: 'text-[#A76A57] bg-[#A76A57]/15 border-[#A76A57]/20' };
      if (val < 30 || val > 50) return { status: '🟡 Waspada', color: 'text-[#3C3530]/90 bg-[#EADDC9]/35 border-[#EADDC9]/50' };
      return { status: '🟢 Aman', color: 'text-[#4D5D4A] bg-[#859681]/15 border-emerald-500/20' };
    case 'cn_ratio':
      if (val < 10) return { status: '🔴 Molase!', color: 'text-[#A76A57] bg-[#A76A57]/15 border-[#A76A57]/20' };
      if (val < 15 || val > 20) return { status: '🟡 Waspada', color: 'text-[#3C3530]/90 bg-[#EADDC9]/35 border-[#EADDC9]/50' };
      return { status: '🟢 Aman', color: 'text-[#4D5D4A] bg-[#859681]/15 border-emerald-500/20' };
    default:
      return { status: '🟢 Aman', color: 'text-[#4D5D4A] bg-[#859681]/15 border-emerald-500/20' };
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();

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

    const startDayTime = activeCycle.data?.modal?.tgl_doc || activeCycle.data?.modal?.tgl_pullet || activeCycle.data?.modal?.tgl_beli || activeCycle.data?.modal?.tgl_indukan || activeCycle.data?.modal?.tgl_tebar || activeCycle.data?.modal?.tgl_mulai || activeCycle.createdAt;
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
  const [overrideKepadatanKey, setOverrideKepadatanKey] = useState<string>('');

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
        setCycles(data.map(normalizeCycle));
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

  const handleSignOut = async () => {
    try {
      await apiPost('/api/v1/auth/logout', {});
    } catch {}
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
  const saveTimerRef = useRef<any>(null);
  const pendingSaveRef = useRef<any>(null);

  const flushSave = useCallback(async () => {
    const pending = pendingSaveRef.current;
    if (!pending) return;
    pendingSaveRef.current = null;
    try {
      const result = await apiPatch(`/api/v1/cycles/${pending.cycleId}`, {
        data: pending.data
      });
      setCycles((prev) =>
        prev.map((c) => (c.id === pending.cycleId ? normalizeCycle(result) : c))
      );
    } catch (err: any) {
      showToast('❌ Gagal menyimpan ke cloud: ' + err.message);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleSaveCycleData = useCallback((updatedData: any) => {
    if (activeCycleIndex < 0 || !cycles[activeCycleIndex]) return;
    const activeCycle = cycles[activeCycleIndex];

    setCycles((prev) => {
      const next = [...prev];
      next[activeCycleIndex] = { ...next[activeCycleIndex], data: updatedData };
      return next;
    });

    pendingSaveRef.current = { cycleId: activeCycle.id, data: updatedData };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushSave, 500);
  }, [activeCycleIndex, cycles, flushSave]);

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

      setCycles((prev) => [normalizeCycle(newCycle), ...prev]);
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
          { id: 'simulasi', icon: Icons.simulasi(), label: 'Simulasi' },
          { id: 'ventilasi', icon: Icons.ventilasi(), label: '💨 Ventilasi' }
        ];
        break;
      case 'bebek_pedaging':
        baseTabs = [
          { id: 'dashboard', icon: Icons.dashboard(), label: 'Dashboard' },
          { id: 'modal_awal', icon: Icons.modalAwal(), label: 'Modal Awal' },
          { id: 'biaya', icon: Icons.biaya(), label: 'Biaya' },
          { id: 'harian_log', icon: Icons.panen(), label: 'Log Harian' },
          { id: 'panen', icon: Icons.panen(), label: 'Panen' },
          { id: 'simulasi', icon: Icons.simulasi(), label: 'Simulasi' }
        ];
        break;
      case 'petelur':
      case 'bebek_petelur':
        baseTabs = [
          { id: 'dashboard', icon: Icons.dashboard(), label: 'Dashboard' },
          { id: 'modal_awal', icon: Icons.modalAwal(), label: 'Modal Awal' },
          { id: 'biaya', icon: Icons.biaya(), label: 'Biaya' },
          { id: 'panen', icon: Icons.panen(), label: activeCycle?.mode === 'bebek_petelur' ? 'Produksi Bebek' : 'Produksi' },
          { id: 'penjualan', icon: Icons.modalAwal(), label: 'Penjualan' },
          { id: 'simulasi', icon: Icons.simulasi(), label: 'Simulasi' }
        ];
        break;
      case 'ikan_pembesaran':
        baseTabs = [
          { id: 'dashboard', icon: Icons.dashboard(), label: 'Dashboard' },
          { id: 'modal_awal', icon: Icons.modalAwal(), label: 'Modal Awal' },
          { id: 'biaya', icon: Icons.biaya(), label: 'Biaya' },
          { id: 'sampling', icon: Icons.panen(), label: 'Sampling' },
          { id: 'kualitas_air', icon: Icons.panen(), label: 'Kualitas Air' },
          { id: 'panen', icon: Icons.panen(), label: 'Panen / Jual' },
          { id: 'simulasi', icon: Icons.simulasi(), label: 'Simulasi' }
        ];
        break;
      case 'ikan_pembibitan':
        baseTabs = [
          { id: 'dashboard', icon: Icons.dashboard(), label: 'Dashboard' },
          { id: 'modal_awal', icon: Icons.modalAwal(), label: 'Modal Awal' },
          { id: 'biaya', icon: Icons.biaya(), label: 'Biaya' },
          { id: 'pemijahan', icon: Icons.panen(), label: '💓 Pemijahan' },
          { id: 'penetasan', icon: Icons.panen(), label: '🐣 Penetasan' },
          { id: 'pendederan', icon: Icons.panen(), label: '🌿 Pendederan' },
          { id: 'penjualan', icon: Icons.modalAwal(), label: '💰 Jual Benih' },
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
    finalTabs.push({ id: 'feed_formulator', icon: Icons.simulasi(), label: '🌾 Racik Pakan' });
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
  const _calculateStats = () => {
    const cycle = (activeCycleIndex >= 0 && cycles[activeCycleIndex]) ? cycles[activeCycleIndex] : null;
    if (!cycle) return null;

    const data = cycle.data || {};
    const mode = cycle.mode;
    const m = data.modal || {};

    const startDayTime = m.tgl_doc || m.tgl_pullet || m.tgl_beli || m.tgl_indukan || m.tgl_tebar || m.tgl_mulai || cycle.createdAt;
    const tglStart = startDayTime ? new Date(startDayTime) : null;
    const umur = tglStart ? Math.max(0, Math.floor((new Date().getTime() - tglStart.getTime()) / 86400000)) : 0;

    const biayaKandang = parseFloat(m.kandang_total) || parseFloat(m.biaya_kandang) || 0;
    const manfaatTahun = parseFloat(m.kandang_manfaat_tahun) || 10;
    
    // HPP Akurat & Depreciation helpers
    const calcPenyusutan = (nilaiKandang: number, umurEconomis: number, siklusPerThn: number) => {
      return nilaiKandang / Math.max(1, umurEconomis * siklusPerThn);
    };

    const getHDPMingguan = (harian: any[], totalAyam: number) => {
      if (!harian || harian.length === 0) return [];
      const sorted = [...harian].sort((a, b) => new Date(a.tgl).getTime() - new Date(b.tgl).getTime());
      const weeks: Array<{ weekNum: number; hdp: number; label: string }> = [];
      let currentWeekButir = 0;
      let currentWeekDays = 0;
      let currentWeekMati = 0;
      let currentPop = totalAyam;

      for (let i = 0; i < sorted.length; i++) {
        const log = sorted[i];
        currentWeekButir += parseFloat(log.butir) || 0;
        currentWeekDays++;
        currentWeekMati += parseFloat(log.mati) || 0;

        if (currentWeekDays === 7 || i === sorted.length - 1) {
          const weekNum = Math.floor(i / 7) + 1;
          const hdp = currentPop > 0 ? (currentWeekButir / (currentWeekDays * currentPop)) * 100 : 0;
          weeks.push({
            weekNum,
            hdp,
            label: `Mgg ${weekNum}`
          });
          currentPop = Math.max(0, currentPop - currentWeekMati);
          currentWeekButir = 0;
          currentWeekDays = 0;
          currentWeekMati = 0;
        }
      }
      return weeks;
    };

    const calcAvgInterval = (kelahiranList: any[]) => {
      if (!kelahiranList || kelahiranList.length < 2) return 0;
      const groups: Record<string, number[]> = {};
      kelahiranList.forEach((k: any) => {
        if (k.id_induk && k.tgl) {
          const t = new Date(k.tgl).getTime();
          if (!isNaN(t)) {
            if (!groups[k.id_induk]) groups[k.id_induk] = [];
            groups[k.id_induk].push(t);
          }
        }
      });

      let totalDiffDays = 0;
      let countDiffs = 0;

      Object.values(groups).forEach((dates: number[]) => {
        if (dates.length >= 2) {
          dates.sort((a, b) => a - b);
          for (let i = 1; i < dates.length; i++) {
            const diffDays = (dates[i] - dates[i - 1]) / (24 * 60 * 60 * 1000);
            totalDiffDays += diffDays;
            countDiffs++;
          }
        }
      });

      return countDiffs > 0 ? Math.round(totalDiffDays / countDiffs) : 0;
    };

    const DEFAULT_SIKLUS_PER_THN: Record<string, number> = {
      broiler: 6,
      petelur: 1,
      bebek_pedaging: 5,
      bebek_petelur: 1,
      penggemukan: 2,
      susu: 1,
      breeding_ruminansia: 1,
      ikan_pembesaran: 4,
      ikan_pembibitan: 4
    };

    const siklusPerThn = parseFloat(m.siklus_per_thn) || DEFAULT_SIKLUS_PER_THN[mode] || 6;
    const penyusutanSiklus = calcPenyusutan(biayaKandang, manfaatTahun, siklusPerThn);
    const depresiasiKandang = Math.round(penyusutanSiklus);

    // Operational costs
    const totalTK = (parseFloat(m.biaya_tk_harian) || 0) * umur;
    const totalAir = parseFloat(m.biaya_air) || 0;
    let totalListrik = parseFloat(m.biaya_listrik) || 0;

    // Fish specific utility costs
    if (mode === 'ikan_pembesaran' || mode === 'ikan_pembibitan') {
      const sistem = m.sistem_kolam || 'konvensional';
      if (sistem === 'bioflok' || sistem === 'RAS') {
        const watt = parseFloat(m.aerasi_watt) || 100;
        const jam = parseFloat(m.aerasi_jam) || 24;
        const tarif = parseFloat(m.aerasi_tarif) || 1450;
        totalListrik += (watt / 1000) * jam * tarif * umur;
      }
      if (sistem === 'bioflok') {
        totalListrik += parseFloat(m.biaya_molase_probiotik) || 0;
      }
      if (sistem === 'RAS') {
        totalListrik += parseFloat(m.biaya_filter_media) || 0;
      }
    }

    if (mode === 'broiler' || mode === 'bebek_pedaging') {
      const totalDOC = (parseFloat(m.jml_doc) || 0) * (parseFloat(m.harga_doc) || 0);
      let totalPakan = 0, totalObat = 0, totalLain = 0;
      (data.biaya || []).forEach((b: any) => {
        if (b.type === 'pakan') totalPakan += parseFloat(b.total) || 0;
        else if (b.type === 'obat') totalObat += parseFloat(b.total) || 0;
        else totalLain += parseFloat(b.total) || 0;
      });

      // Total Modal calculations
      const totalModal = totalDOC + biayaKandang + totalPakan + totalObat + totalLain;
      const totalModalCash = totalDOC + totalPakan + totalObat + totalLain + totalTK + totalListrik + totalAir;
      const totalModalAkurat = totalModalCash + penyusutanSiklus;

      let totalPendapatan = 0, totalKgPanen = 0;
      const panen = data.panen || [];
      panen.forEach((p: any) => {
        totalPendapatan += (parseFloat(p.kg) || 0) * (parseFloat(p.harga_kg) || 0);
        totalKgPanen += parseFloat(p.kg) || 0;
      });

      const ebitda = totalPendapatan - (totalDOC + totalPakan + totalObat + totalLain + totalTK + totalListrik + totalAir);
      const laba = ebitda - depresiasiKandang;
      const labaCash = totalPendapatan - totalModalCash;

      const matiDariPanen = panen.reduce((s: number, p: any) => s + (parseFloat(p.jml_mati) || 0), 0);
      const matiDariHarian = (data.harian || []).reduce((s: number, h: any) => s + (parseFloat(h.mati) || 0), 0);
      const mati = matiDariPanen + matiDariHarian;
      const jmlDoc = parseFloat(m.jml_doc) || 1;
      const srPct = ((jmlDoc - mati) / jmlDoc) * 100;
      
      const hpp = totalKgPanen > 0 ? totalModalCash / totalKgPanen : 0;
      const hppAkurat = totalKgPanen > 0 ? totalModalAkurat / totalKgPanen : 0;

      const totalKgPakan = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => {
        const sak = parseFloat(b.sak) || 0;
        const kgSak = parseFloat(b.kg_sak) || 0;
        return s + sak * kgSak;
      }, 0);
      const fcr = totalKgPanen > 0 ? totalKgPakan / totalKgPanen : 0;
      const bbRata = (jmlDoc - mati) > 0 ? totalKgPanen / (jmlDoc - mati) : 0;
      const ip = (fcr > 0 && umur > 0) ? (srPct / 100 * bbRata) / (fcr * umur) * 100 : 0;

      // New broiler indicators
      const adg = umur > 0 ? (bbRata * 1000) / umur : 0;
      const epef = ip;
      const prediksiPanen = tglStart ? new Date(tglStart.getTime() + 35 * 24 * 60 * 60 * 1000) : null;
      
      const lightingProgram = mode === 'bebek_pedaging'
        ? 'N/A'
        : (umur <= 7 ? '23L : 1D (Stimulasi makan, adaptasi DOC)' : (umur <= 21 ? '21L : 3D (Pertumbuhan normal)' : '16L : 8D (Efisiensi pakan, finishing)'));
      
      const siklusLitterKe = parseInt(m.siklus_litter_ke) || 1;
      const downTimeHari = parseInt(m.down_time_hari) || 14;
      const alertLitterKuning = mode === 'broiler' && siklusLitterKe >= 5;
      const alertDowntimeMerah = mode === 'broiler' && downTimeHari < 14;

      // Bebek pedaging targets & metrics
      const isBebek = mode === 'bebek_pedaging';
      const fcrTarget = isBebek ? { min: 2.5, max: 3.5 } : { min: 1.4, max: 1.6 };
      const srTarget = isBebek ? 92 : 95;
      const airEstimasi = isBebek ? totalKgPakan * 2 : 0;
      const airAktual = (data.harian || []).reduce((s: number, h: any) => s + (parseFloat(h.air) || 0), 0);
      let waterAlert = false;
      const lastHarian = (data.harian || []).slice().sort((a: any, b: any) => new Date(a.tgl).getTime() - new Date(b.tgl).getTime()).pop();
      if (lastHarian) {
        const actualAir = parseFloat(lastHarian.air) || 0;
        const estPakan = parseFloat(lastHarian.pakan_kg) || 0;
        const estAir = isBebek ? estPakan * 2.0 : 0;
        if (estAir > 0 && actualAir < estAir * 0.7) {
          waterAlert = true;
        }
      }

      const pakanPct = totalModalCash > 0 ? (totalPakan / totalModalCash) * 100 : 0;
      const tkPct = totalModalCash > 0 ? (totalTK / totalModalCash) * 100 : 0;
      const iofc = totalPendapatan - totalPakan;
      const bepHarga = hppAkurat;

      // Ventilation calculations (Modul 08)
      const panjang_m = parseFloat(m.panjang_m) || 0;
      const lebar_m = parseFloat(m.lebar_m) || 0;
      const luas_m2 = panjang_m * lebar_m;
      
      const watt_kipas = parseFloat(m.vent_watt_kipas) || 375;
      const jml_kipas = parseFloat(m.vent_jml_kipas) || 2;
      
      const CFM_kebutuhan = jmlDoc * 0.5;
      const CFM_kapasitas = (watt_kipas * jml_kipas * 0.85) / 0.472;
      const timer_cap_m3 = luas_m2 * 0.3;
      
      const duty_cycle = CFM_kapasitas > 0 ? Math.min(1.0, CFM_kebutuhan / CFM_kapasitas) : 0;
      const runtime_detik = Math.round(duty_cycle * 300);
      
      const suhu_target = Math.max(24, 33 - Math.floor(umur / 7) * 3);
      const fase = umur < 14 ? 'minimum' : (umur < 21 ? 'transitional' : 'tunnel');
      const alertKipasKurang = mode === 'broiler' && CFM_kapasitas < CFM_kebutuhan;

      // Cobb Standard comparisons (Modul 09)
      const standardCobb = COBB500_STANDARD.reduce((prev, curr) => {
        return Math.abs(curr.hari - umur) < Math.abs(prev.hari - umur) ? curr : prev;
      });
      const targetBB = standardCobb.bb_g / 1000;
      const targetFCR = standardCobb.fcr;
      const targetADG = standardCobb.adg_g;
      
      const gapBB = bbRata - targetBB;
      const gapBBPct = targetBB > 0 ? (gapBB / targetBB) * 100 : 0;
      const gapFCR = fcr - targetFCR;
      const gapFCRPct = targetFCR > 0 ? (gapFCR / targetFCR) * 100 : 0;
      const gapADG = adg - targetADG;
      const gapADGPct = targetADG > 0 ? (gapADG / targetADG) * 100 : 0;

      return {
        totalModal, totalModalCash, totalModalAkurat, totalPendapatan, laba, labaCash, ebitda, depresiasi: depresiasiKandang, totalKgPanen, hpp, hppAkurat, fcr, srPct, umur, ip, mati, jmlDoc,
        fcrTarget, srTarget, airEstimasi, airAktual, waterAlert, isBebek, strainBebek: m.strain_bebek,
        pakanPct, tkPct, iofc, bepHarga,
        adg, bbRata, epef, prediksiPanen, lightingProgram, alertLitterKuning, alertDowntimeMerah,
        luas_m2, panjang_m, lebar_m, watt_kipas, jml_kipas, CFM_kebutuhan, CFM_kapasitas, timer_cap_m3, duty_cycle, runtime_detik, suhu_target, fase, alertKipasKurang,
        standardCobb, targetBB, targetFCR, targetADG, gapBB, gapBBPct, gapFCR, gapFCRPct, gapADG, gapADGPct,
        breakdown: [
          { label: 'Ternak / Bibit', val: totalDOC },
          { label: 'Kandang (Penyusutan)', val: depresiasiKandang },
          { label: 'Pakan', val: totalPakan },
          { label: 'Obat/Vaksin', val: totalObat },
          { label: 'Tenaga Kerja', val: totalTK },
          { label: 'Listrik & Air', val: totalListrik + totalAir },
          { label: 'Lain-lain', val: totalLain }
        ]
      };
    }

    if (mode === 'petelur' || mode === 'bebek_petelur') {
      const totalIndukan = (parseFloat(m.jml_ekor) || 0) * (parseFloat(m.harga_ekor) || 0);
      let totalPakan = 0, totalObat = 0, totalLain = 0;
      (data.biaya || []).forEach((b: any) => {
        if (b.type === 'pakan') totalPakan += parseFloat(b.total) || 0;
        else if (b.type === 'obat') totalObat += parseFloat(b.total) || 0;
        else totalLain += parseFloat(b.total) || 0;
      });
      const totalBiaya = totalPakan + totalObat + totalLain;

      const totalModal = totalIndukan + biayaKandang + totalBiaya;
      const totalModalCash = totalIndukan + totalBiaya + totalTK + totalListrik + totalAir;
      const totalModalAkurat = totalModalCash + penyusutanSiklus;

      let totalButir = 0, totalKgTelur = 0, totalRetak = 0;
      (data.harian || []).forEach((h: any) => {
        totalButir += parseFloat(h.butir) || 0;
        totalKgTelur += parseFloat(h.kg) || 0;
        totalRetak += parseFloat(h.retak) || 0;
      });

      let totalPendapatan = 0;
      (data.penjualan || []).forEach((p: any) => totalPendapatan += (parseFloat(p.kg) || 0) * (parseFloat(p.harga_kg) || 0));
      
      const ebitda = totalPendapatan - (totalIndukan + totalBiaya + totalTK + totalListrik + totalAir);
      const laba = ebitda - depresiasiKandang;
      const labaCash = totalPendapatan - totalModalCash;

      const jmlAyam = parseFloat(m.jml_ekor) || 1;
      const henDay = (data.harian || []).length > 0 ? (totalButir / (data.harian || []).length / jmlAyam) * 100 : 0;

      const totalKgPakan = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => {
        return s + (parseFloat(b.sak) || 0) * (parseFloat(b.kg_sak) || 0);
      }, 0);
      const fcrTelur = totalKgTelur > 0 ? totalKgPakan / totalKgTelur : 0;
      const hppButir = totalButir > 0 ? totalModalCash / totalButir : 0;
      const hppButirAkurat = totalButir > 0 ? totalModalAkurat / totalButir : 0;
      const hppKg = totalKgTelur > 0 ? totalModalCash / totalKgTelur : 0;
      const hppKgAkurat = totalKgTelur > 0 ? totalModalAkurat / totalKgTelur : 0;

      const isBebek = mode === 'bebek_petelur';
      const fcrTarget = isBebek ? { min: 2.8, max: 3.5 } : { min: 2.1, max: 2.3 };
      const srTarget = isBebek ? 90 : 95;
      const airEstimasi = isBebek ? totalKgPakan * 2.2 : 0;
      const airAktual = (data.harian || []).reduce((s: number, h: any) => s + (parseFloat(h.air) || 0), 0);
      let waterAlert = false;
      const lastHarian = (data.harian || []).slice().sort((a: any, b: any) => new Date(a.tgl).getTime() - new Date(b.tgl).getTime()).pop();
      if (lastHarian) {
        const actualAir = parseFloat(lastHarian.air) || 0;
        const scaleQty = parseFloat(m.jml_ekor) || 1;
        const estPakan = scaleQty * 0.15;
        const estAir = isBebek ? estPakan * 2.2 : 0;
        if (estAir > 0 && actualAir < estAir * 0.7) {
          waterAlert = true;
        }
      }

      const pakanPct = totalModalCash > 0 ? (totalPakan / totalModalCash) * 100 : 0;
      const tkPct = totalModalCash > 0 ? (totalTK / totalModalCash) * 100 : 0;
      const iofc = totalPendapatan - totalPakan;
      const bepHarga = hppButirAkurat;

      // New Layer indicators
      const beratRataTelur = totalButir > 0 ? (totalKgTelur / totalButir) * 1000 : 0;
      const biayaPakanPerButir = totalButir > 0 ? totalPakan / totalButir : 0;
      const hdpMingguan = getHDPMingguan(data.harian || [], jmlAyam);
      
      const hdpMingguIni = hdpMingguan.length > 0 ? hdpMingguan[hdpMingguan.length - 1].hdp : 0;
      const hdpMingguLalu = hdpMingguan.length > 1 ? hdpMingguan[hdpMingguan.length - 2].hdp : 0;
      const alertDrop = hdpMingguLalu > 0 && (hdpMingguLalu - hdpMingguIni) > 5;
      const dropPct = hdpMingguLalu - hdpMingguIni;

      const lightingProgram = '16L : 8D (Standard Stimulasi Hormon Peletakan Telur)';

      // Lohmann target comparisons (Modul 09)
      const targetHDP = LOHMANN_STANDARD.puncak_hdp;
      const targetFCRTelur = LOHMANN_STANDARD.fcr_produksi;
      const targetBeratTelur = LOHMANN_STANDARD.berat_telur_g;
      
      const gapHDP = henDay - targetHDP;
      const gapFCRTelur = fcrTelur - targetFCRTelur;
      const gapBeratTelur = beratRataTelur - targetBeratTelur;

      return {
        totalModal, totalModalCash, totalModalAkurat, totalPendapatan, laba, labaCash, ebitda, depresiasi: depresiasiKandang, umur, totalButir, totalKgTelur, totalRetak, henDay, fcrTelur, hppButir, hppButirAkurat, hppKg, hppKgAkurat,
        fcrTarget, srTarget, airEstimasi, airAktual, waterAlert, isBebek, strainBebek: m.strain_bebek,
        pakanPct, tkPct, iofc, bepHarga,
        beratRataTelur, biayaPakanPerButir, hdpMingguan, alertDrop, dropPct, lightingProgram,
        targetHDP, targetFCRTelur, targetBeratTelur, gapHDP, gapFCRTelur, gapBeratTelur,
        breakdown: [
          { label: 'Indukan', val: totalIndukan },
          { label: 'Kandang (Penyusutan)', val: depresiasiKandang },
          { label: 'Pakan', val: totalPakan },
          { label: 'Obat/Vaksin', val: totalObat },
          { label: 'Tenaga Kerja', val: totalTK },
          { label: 'Listrik & Air', val: totalListrik + totalAir },
          { label: 'Lain-lain', val: totalLain }
        ]
      };
    }

    if (mode === 'ikan_pembesaran' || mode === 'ikan_pembibitan') {
      const qtyTebar = parseFloat(m.jml_tebar) || 0;
      const priceBenih = parseFloat(m.harga_benih) || 0;
      const totalBenih = qtyTebar * priceBenih + (parseFloat(m.biaya_persiapan_air) || 0) + (parseFloat(m.biaya_aerasi_pompa) || 0);

      let totalPakan = 0, totalObat = 0, totalLain = 0;
      (data.biaya || []).forEach((b: any) => {
        if (b.type === 'pakan') totalPakan += parseFloat(b.total) || 0;
        else if (b.type === 'obat') totalObat += parseFloat(b.total) || 0;
        else totalLain += parseFloat(b.total) || 0;
      });
      const totalBiaya = totalPakan + totalObat + totalLain;

      const totalModal = totalBenih + biayaKandang + totalBiaya;
      const totalModalCash = totalBenih + totalBiaya + totalTK + totalListrik + totalAir;
      const totalModalAkurat = totalModalCash + penyusutanSiklus;

      let totalPendapatan = 0, totalKgPanen = 0, totalEkorPanen = 0;
      const panen = data.panen || [];
      panen.forEach((p: any) => {
        totalPendapatan += (parseFloat(p.kg) || 0) * (parseFloat(p.harga_kg) || 0);
        totalKgPanen += parseFloat(p.kg) || 0;
        totalEkorPanen += parseFloat(p.jml_hidup) || ((parseFloat(p.kg) || 0) * (parseFloat(p.size_sortir) || 10));
      });

      const penjualan = data.penjualan || [];
      if (mode === 'ikan_pembibitan') {
        penjualan.forEach((p: any) => {
          totalPendapatan += parseFloat(p.total) || 0;
          totalEkorPanen += parseFloat(p.jml) || 0;
        });
      }

      const ebitda = totalPendapatan - (totalBenih + totalBiaya + totalTK + totalListrik + totalAir);
      const laba = ebitda - depresiasiKandang;
      const labaCash = totalPendapatan - totalModalCash;

      const mati = (data.sampling || []).reduce((s: number, sm: any) => s + (parseFloat(sm.jml_mati) || 0), 0) + panen.reduce((s: number, p: any) => s + (parseFloat(p.jml_mati) || 0), 0);
      const srPct = qtyTebar > 0 ? Math.max(0, Math.min(100, ((qtyTebar - mati) / qtyTebar) * 100)) : 100;

      const sampling = data.sampling || [];
      const bobotRataTerakhir = sampling.length > 0 ? (parseFloat(sampling[sampling.length - 1].bobot_total_g) / Math.max(1, parseFloat(sampling[sampling.length - 1].jml_sampel) || 1)) : (parseFloat(m.bobot_awal_g) || 5);
      const biomassaSaatIni = Math.max(0, qtyTebar - mati) * bobotRataTerakhir / 1000;
      
      const totalKgPakan = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => {
        return s + (parseFloat(b.kg) || 0);
      }, 0);

      const bobotAwalTotal = qtyTebar * (parseFloat(m.bobot_awal_g) || 5) / 1000;
      const biomassaAkhir = totalKgPanen > 0 ? totalKgPanen : biomassaSaatIni;
      const pertambahanBiomassa = biomassaAkhir - bobotAwalTotal;
      const fcr = pertambahanBiomassa > 0 ? totalKgPakan / pertambahanBiomassa : 0;

      const adg = umur > 0 ? (bobotRataTerakhir - (parseFloat(m.bobot_awal_g) || 5)) / umur : 0;
      const sgr = (umur > 0 && bobotRataTerakhir > 0) ? (Math.log(bobotRataTerakhir) - Math.log(parseFloat(m.bobot_awal_g) || 5)) / umur * 100 : 0;

      const hpp = mode === 'ikan_pembesaran'
        ? (totalKgPanen > 0 ? totalModalCash / totalKgPanen : 0)
        : (totalEkorPanen > 0 ? totalModalCash / totalEkorPanen : 0);
      const hppAkurat = mode === 'ikan_pembesaran'
        ? (totalKgPanen > 0 ? totalModalAkurat / totalKgPanen : 0)
        : (totalEkorPanen > 0 ? totalModalAkurat / totalEkorPanen : 0);

      const sistem = m.sistem_kolam || 'konvensional';
      const fcrTarget = sistem === 'RAS' ? { min: 0.7, max: 0.9 } : sistem === 'bioflok' ? { min: 0.8, max: 1.0 } : { min: 1.1, max: 1.3 };
      const srTarget = sistem === 'RAS' ? 92 : sistem === 'bioflok' ? 85 : 70;
      const airEstimasi = 0;

      const pakanPct = totalModalCash > 0 ? (totalPakan / totalModalCash) * 100 : 0;
      const tkPct = totalModalCash > 0 ? (totalTK / totalModalCash) * 100 : 0;
      const iofc = totalPendapatan - totalPakan;
      const bepHarga = hppAkurat;

      const isPembibitan = mode === 'ikan_pembibitan';

      // For hatchery (pembibitan)
      const telurDibuahi = isPembibitan ? (data.pemijahan || []).reduce((s: number, p: any) => s + (parseFloat(p.est_telur) || 0), 0) : 0;
      const telurMenetas = isPembibitan ? (data.penetasan || []).reduce((s: number, p: any) => s + (parseFloat(p.berhasil_larva) || 0), 0) : 0;
      const dayaTetas = telurDibuahi > 0 ? (telurMenetas / telurDibuahi) * 100 : 0;
      const srPendederan = qtyTebar > 0 ? (totalEkorPanen / qtyTebar) * 100 : 0;

      // FCR Pendederan vs FCR Pembesaran
      const biomassaBenihTerjual = totalEkorPanen * bobotRataTerakhir / 1000;
      const fcrPendederan = biomassaBenihTerjual > 0 ? totalKgPakan / biomassaBenihTerjual : 0;

      let cv = 0;
      let needGrading = false;
      if (sampling.length > 0) {
        const lastSm = sampling[sampling.length - 1];
        const bobotRata = (parseFloat(lastSm.bobot_total_g) / Math.max(1, parseFloat(lastSm.jml_sampel) || 1));
        const stdev = parseFloat(lastSm.stdev_g) || 0;
        if (stdev > 0 && bobotRata > 0) {
          cv = (stdev / bobotRata) * 100;
          if (cv > 20) {
            needGrading = true;
          }
        }
      }

      return {
        totalModal, totalModalCash, totalModalAkurat, totalPendapatan, laba, labaCash, ebitda, depresiasi: depresiasiKandang, umur, hpp, hppAkurat, fcr, srPct, mati,
        fcrTarget, srTarget, airEstimasi, biomassaSaatIni, adg, sgr, bobotRataTerakhir, qtyTebar,
        pakanPct, tkPct, iofc, bepHarga,
        dayaTetas, srPendederan, fcrPendederan, telurDibuahi, telurMenetas, isPembibitan, cv, needGrading,
        breakdown: [
          { label: 'Benih & Persiapan Air', val: totalBenih },
          { label: 'Kandang (Penyusutan)', val: depresiasiKandang },
          { label: 'Pakan', val: totalPakan },
          { label: 'Obat/Vaksin', val: totalObat },
          { label: 'Tenaga Kerja', val: totalTK },
          { label: 'Listrik & Air', val: totalListrik + totalAir },
          { label: 'Lain-lain', val: totalLain }
        ]
      };
    }

    if (mode === 'pembibitan_unggas') {
      const totalIndukan = ((parseFloat(m.jml_betina) || 0) + (parseFloat(m.jml_jantan) || 0)) * (parseFloat(m.harga_indukan) || 0);
      const totalBiaya = (data.biaya || []).reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      const totalModal = totalIndukan + biayaKandang + totalBiaya;
      const totalModalCash = totalIndukan + totalBiaya + totalTK + totalListrik + totalAir;
      const totalModalAkurat = totalModalCash + penyusutanSiklus;

      const telurMasukTetas = (data.produksi || []).reduce((s: number, p: any) => s + (parseFloat(p.masuk_tetas) || 0), 0);
      const docMenetas = (data.penetasan || []).reduce((s: number, p: any) => s + (parseFloat(p.berhasil) || 0), 0);
      const gagalTetas = (data.penetasan || []).reduce((s: number, p: any) => s + (parseFloat(p.gagal) || 0), 0);
      const dayaTetas = telurMasukTetas > 0 ? (docMenetas / telurMasukTetas) * 100 : 0;

      const totalTerjual = (data.penjualan || []).reduce((s: number, p: any) => s + (parseFloat(p.jml) || 0), 0);
      const totalPendapatan = (data.penjualan || []).reduce((s: number, p: any) => s + (parseFloat(p.total) || 0), 0);

      const jmlBetina = parseFloat(m.jml_betina) || 0;
      const jmlJantan = parseFloat(m.jml_jantan) || 0;
      const populasi = jmlBetina + jmlJantan + docMenetas - totalTerjual;
      
      const ebitda = totalPendapatan - (totalIndukan + totalBiaya + totalTK + totalListrik + totalAir);
      const laba = ebitda - depresiasiKandang;
      const labaCash = totalPendapatan - totalModalCash;
      const margin = totalModalAkurat > 0 ? (laba / totalModalAkurat) * 100 : 0;

      const totalPakan = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      const pakanPct = totalModalCash > 0 ? (totalPakan / totalModalCash) * 100 : 0;
      const tkPct = totalModalCash > 0 ? (totalTK / totalModalCash) * 100 : 0;
      const iofc = totalPendapatan - totalPakan;
      const bepHarga = docMenetas > 0 ? totalModalAkurat / docMenetas : 0;

      return { totalModal, totalModalCash, totalModalAkurat, totalPendapatan, laba, labaCash, ebitda, depresiasi: depresiasiKandang, umur, margin, dayaTetas, docMenetas, populasi, telurMasukTetas, gagalTetas, pakanPct, tkPct, iofc, bepHarga };
    }

    if (mode === 'penggemukan') {
      const jmlEkor = parseFloat(m.jml_ekor) || 0;
      const bbAwal = parseFloat(m.bb_awal) || 0;
      const hargaBakalan = parseFloat(m.harga_kg_bakalan) || 0;
      const totalBakalan = jmlEkor * bbAwal * hargaBakalan;
      const totalBiaya = (data.biaya || []).reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      
      const totalModal = totalBakalan + biayaKandang + totalBiaya;
      const totalModalCash = totalBakalan + totalBiaya + totalTK + totalListrik + totalAir;
      const totalModalAkurat = totalModalCash + penyusutanSiklus;

      let totalPendapatan = 0, totalKgPanen = 0, totalEkorPanen = 0;
      const panen = data.panen || [];
      panen.forEach((p: any) => {
        const bbAkhir = parseFloat(p.bb_akhir) || 0;
        const jmlJual = parseFloat(p.jml_jual) || jmlEkor;
        const harga = parseFloat(p.harga_kg) || 0;
        const kg = bbAkhir * jmlJual;
        totalPendapatan += kg * harga;
        totalKgPanen += kg;
        totalEkorPanen += jmlJual;
      });

      const ebitda = totalPendapatan - (totalBakalan + totalBiaya + totalTK + totalListrik + totalAir);
      const laba = ebitda - depresiasiKandang;
      const labaCash = totalPendapatan - totalModalCash;
      
      const hpp = totalKgPanen > 0 ? totalModalCash / totalKgPanen : 0;
      const hppAkurat = totalKgPanen > 0 ? totalModalAkurat / totalKgPanen : 0;
      
      const totalKgPakan = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => s + (parseFloat(b.kg) || 0), 0);
      const fcr = totalKgPanen > 0 ? totalKgPakan / totalKgPanen : 0;

      const bbAkhirRata = panen.length > 0 ? parseFloat(panen[panen.length - 1].bb_akhir) || 0 : 0;
      const adg = umur > 0 ? (bbAkhirRata - bbAwal) / umur * 1000 : 0;
      const mati = panen.reduce((s: number, p: any) => s + (parseFloat(p.jml_mati) || 0), 0);
      const srPct = jmlEkor > 0 ? ((jmlEkor - mati) / jmlEkor) * 100 : 100;

      const totalPakan = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      const pakanPct = totalModalCash > 0 ? (totalPakan / totalModalCash) * 100 : 0;
      const tkPct = totalModalCash > 0 ? (totalTK / totalModalCash) * 100 : 0;
      const iofc = totalPendapatan - totalPakan;
      const bepHarga = hppAkurat;

      // New Penggemukan indicators
      const BK_kebutuhan = jmlEkor * bbAwal * 0.035; // kg BK/hari
      const biayaPakanPerEkorPerHari = totalPakan / Math.max(1, jmlEkor) / Math.max(1, umur);
      const hariTargetPanen = parseFloat(m.hari_target_panen) || 120;
      const prediksiPanen_BB = bbAwal + ((adg || 0) / 1000 * hariTargetPanen);
      const marginPerEkor = totalEkorPanen > 0 ? (totalPendapatan - totalModalAkurat) / totalEkorPanen : 0;

      return { totalModal, totalModalCash, totalModalAkurat, totalPendapatan, laba, labaCash, ebitda, depresiasi: depresiasiKandang, umur, hpp, hppAkurat, fcr, adg, lamaHari: umur, totalKgPanen, srPct, mati, jmlDoc: jmlEkor, pakanPct, tkPct, iofc, bepHarga, BK_kebutuhan, biayaPakanPerEkorPerHari, prediksiPanen_BB, marginPerEkor };
    }

    if (mode === 'susu') {
      const totalIndukan = (parseFloat(m.jml_ekor) || 0) * (parseFloat(m.harga_ekor) || 0);
      const totalBiaya = (data.biaya || []).reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      const totalModal = totalIndukan + biayaKandang + totalBiaya;
      const totalModalCash = totalIndukan + totalBiaya + totalTK + totalListrik + totalAir;
      const totalModalAkurat = totalModalCash + penyusutanSiklus;

      const totalLiter = (data.harian || []).reduce((s: number, h: any) => s + (parseFloat(h.liter) || 0), 0);
      const totalPendapatan = (data.penjualan || []).reduce((s: number, p: any) => s + (parseFloat(p.total) || 0), 0);
      
      const ebitda = totalPendapatan - (totalIndukan + totalBiaya + totalTK + totalListrik + totalAir);
      const laba = ebitda - depresiasiKandang;
      const labaCash = totalPendapatan - totalModalCash;

      const jmlEkor = parseFloat(m.jml_ekor) || 1;
      const hariProduksi = (data.harian || []).length;
      const produksiRata = hariProduksi > 0 ? totalLiter / hariProduksi / jmlEkor : 0;

      const totalKgPakanKering = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => s + (parseFloat(b.kg) || 0), 0);
      const fcrSusu = totalLiter > 0 ? totalKgPakanKering / totalLiter : 0;
      
      const hppLiter = totalLiter > 0 ? totalModalCash / totalLiter : 0;
      const hppLiterAkurat = totalLiter > 0 ? totalModalAkurat / totalLiter : 0;

      const totalPakan = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      const pakanPct = totalModalCash > 0 ? (totalPakan / totalModalCash) * 100 : 0;
      const tkPct = totalModalCash > 0 ? (totalTK / totalModalCash) * 100 : 0;
      const iofc = totalPendapatan - totalPakan;
      const bepHarga = hppLiterAkurat;

      // New Milk indicators
      let totalKgLemak = 0;
      let countLemak = 0;
      (data.harian || []).forEach((h: any) => {
        if (h.kadar_lemak !== undefined && h.kadar_lemak !== null) {
          totalKgLemak += (parseFloat(h.liter) || 0) * ((parseFloat(h.kadar_lemak) || 0) / 100);
          countLemak++;
        }
      });
      const FCM = countLemak > 0 ? (0.4 * totalLiter + 15 * totalKgLemak) : null;
      const biayaPakanPerLiter = totalLiter > 0 ? totalPakan / totalLiter : 0;

      return { totalModal, totalModalCash, totalModalAkurat, totalPendapatan, laba, labaCash, ebitda, depresiasi: depresiasiKandang, umur, totalLiter, produksiRata, fcrSusu, hppLiter, hppLiterAkurat, pakanPct, tkPct, iofc, bepHarga, FCM, biayaPakanPerLiter };
    }

    if (mode === 'breeding_ruminansia') {
      const jmlBetina = parseFloat(m.jml_betina) || 0;
      const jmlJantan = parseFloat(m.jml_jantan) || 0;
      const hargaEkor = parseFloat(m.harga_ekor) || 0;
      const totalIndukan = (jmlBetina + jmlJantan) * hargaEkor;
      const totalBiaya = (data.biaya || []).reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      
      const totalModal = totalIndukan + biayaKandang + totalBiaya;
      const totalModalCash = totalIndukan + totalBiaya + totalTK + totalListrik + totalAir;
      const totalModalAkurat = totalModalCash + penyusutanSiklus;

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

      const ebitda = totalPendapatan - (totalIndukan + totalBiaya + totalTK + totalListrik + totalAir);
      const laba = ebitda - depresiasiKandang;
      const labaCash = totalPendapatan - totalModalCash;
      const keuntunganPct = totalModalAkurat > 0 ? (laba / totalModalAkurat) * 100 : 0;

      const totalPakan = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      const pakanPct = totalModalCash > 0 ? (totalPakan / totalModalCash) * 100 : 0;
      const tkPct = totalModalCash > 0 ? (totalTK / totalModalCash) * 100 : 0;
      const iofc = totalPendapatan - totalPakan;
      const bepHarga = totalLahir > 0 ? totalModalAkurat / totalLahir : 0;

      // New Breeding indicators
      const jmlKawin = (data.perkawinan || []).length;
      const jmlBunting = (data.perkawinan || []).filter((p: any) => p.status === 'bunting').length;
      const conceptionRate = jmlKawin > 0 ? (jmlBunting / jmlKawin) * 100 : 0;
      const spc = jmlBunting > 0 ? jmlKawin / jmlBunting : 0;
      const calvingInterval = calcAvgInterval(data.kelahiran || []);

      return { totalModal, totalModalCash, totalModalAkurat, totalPendapatan, laba, labaCash, ebitda, depresiasi: depresiasiKandang, umur, keuntunganPct, populasiTotal, populasiBetina, populasiJantan, totalLahir, nilaiAset, pakanPct, tkPct, iofc, bepHarga, conceptionRate, spc, calvingInterval };
    }

    return null;
  };
  const calculateStats = useMemo(() => _calculateStats(), [activeCycleIndex, cycles]);

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

    if (cycle.mode === 'petelur' || cycle.mode === 'bebek_petelur') {
      const hdpMingguan = stats?.hdpMingguan || [];
      points = hdpMingguan.map((w: any) => ({
        date: w.label,
        value: w.hdp
      }));
      title = `Tren Produksi Telur (${cycle.mode === 'bebek_petelur' ? 'Duck' : 'Hen'} Day % Harian/Mingguan)`;
      unit = '%';
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
        <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl text-center py-12 text-[#3C3530]/60 text-xs">
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

    const fillPathData = pathData + ` L ${getX(points.length - 1).toFixed(1)} ${(height - paddingBottom).toFixed(1)} L ${getX(0).toFixed(1)} ${(height - paddingBottom).toFixed(1)} Z`;

    // Path area for background gradient
    const lineStrokeColor = '#859681'; // Sage Green
    const gridLineColor = '#EADDC9'; // Oatmeal Beige

    return (
      <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl shadow-sm">
        <h4 className="text-sm font-bold text-[#3C3530] mb-4 flex items-center gap-2 font-sans">
          <span>📈</span> {title}
        </h4>
        
        <div className="w-full overflow-x-auto no-scrollbar">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto overflow-visible">
            <defs>
              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineStrokeColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={lineStrokeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>
 
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
              const y = paddingTop + p * chartHeight;
              const val = maxVal - p * range;
              return (
                <g key={i}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke={gridLineColor} strokeDasharray="3 3" />
                  <text x={paddingLeft - 10} y={y + 4} textAnchor="end" className="text-[10px] font-bold fill-[#3C3530]/60 font-mono">
                    {val.toFixed(0)}{unit}
                  </text>
                </g>
              );
            })}
 
            {/* Shaded Area */}
            <path d={fillPathData} fill="url(#chartGlow)" />
 
            {/* Value Line */}
            <path d={pathData} fill="none" stroke={lineStrokeColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
 
            {/* Nodes and X labels */}
            {points.map((p, idx) => {
              const x = getX(idx);
              const y = getY(p.value);
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="5" className="fill-[#859681] stroke-[#FCFAF6] stroke-2" />
                  {/* Tooltip text on top of dots if small array */}
                  {points.length <= 10 && (
                    <text x={x} y={y - 8} textAnchor="middle" className="text-[10px] font-black fill-[#3C3530] font-serif">
                      {unit === '%' ? p.value.toFixed(1) + '%' : p.value}
                    </text>
                  )}
                  {/* Date/X Label */}
                  <text x={x} y={height - 8} textAnchor="middle" className="text-[9px] font-bold fill-[#3C3530]/80 font-mono">
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
    
    let strokeColor = '#859681'; // Sage Green default
    if (srPct < 90) strokeColor = '#EADDC9'; // Oatmeal Beige warning
    if (srPct < 80) strokeColor = '#A76A57'; // Terracotta alert
 
    return (
      <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl shadow-sm flex flex-col items-center text-center justify-center">
        <h4 className="text-sm font-bold text-[#3C3530] mb-4 self-start flex items-center gap-2 font-sans">
          <span>🩺</span> Tingkat Kelangsungan Hidup (SR)
        </h4>
 
        <div className="relative w-[150px] h-[150px] mb-3">
          <svg className="w-full h-full -rotate-90">
            {/* Background Track */}
            <circle cx={size / 2} cy={size / 2} r={r} className="stroke-[#EADDC9]/50 fill-none" strokeWidth={strokeWidth} />
            {/* Filled Progress arc */}
            <circle 
              cx={size / 2} 
              cy={size / 2} 
              r={r} 
              className="fill-none transition-all duration-1000" 
              stroke={strokeColor}
              strokeWidth={strokeWidth} 
              strokeDasharray={circ} 
              strokeDashoffset={circ - fillValue} 
              strokeLinecap="round"
            />
          </svg>
          {/* Inner Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-[#3C3530] font-serif">{srPct.toFixed(1)}%</span>
            <span className="text-[9px] text-[#3C3530]/60 font-bold tracking-wider uppercase font-sans">Survival Rate</span>
          </div>
        </div>
        
        <p className="text-xs font-semibold text-[#3C3530]/80 font-sans">
          Kematian: <strong className="text-[#A76A57] font-mono">{mati}</strong> / {total} ekor
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
      setFormFields({ tgl: todayStr, butir: '', kg: '', retak: '0', air: '0' });
    } else if (type === 'modal_harian_pedaging') {
      setModalTitle('🦆 Log Harian Bebek Pedaging');
      setFormFields({ tgl: todayStr, air: '', pakan_kg: '', mati: '0' });
    } else if (type === 'modal_sampling_ikan') {
      setModalTitle('🔬 Catat Sampling Pertumbuhan');
      const qtyTebar = parseFloat(cycle.data?.modal?.jml_tebar) || 0;
      const estPop = qtyTebar - (cycle.data?.sampling || []).reduce((s: number, sm: any) => s + (parseFloat(sm.jml_mati) || 0), 0);
      setFormFields({ tgl: todayStr, jml_sampel: '50', bobot_total_g: '', jml_estimasi: estPop.toString(), jml_mati: '0', stdev_g: '0' });
    } else if (type === 'modal_air_ikan') {
      setModalTitle('💧 Monitor Kualitas Air');
      setFormFields({ tgl: todayStr, suhu: '28', ph: '7.5', do: '5.0', amonia: '0.01', nitrit: '0.01', kecerahan: '35', volume_flok: '30', cn_ratio: '15' });
    } else if (type === 'modal_pemijahan') {
      setModalTitle('💓 Catat Pemijahan Induk');
      setFormFields({ tgl: todayStr, jantan_ekor: '1', betina_ekor: '2', est_telur: '100000' });
    } else if (type === 'modal_penetasan_ikan') {
      setModalTitle('🐣 Catat Hasil Penetasan');
      setFormFields({ tgl: todayStr, berhasil_larva: '', gagal_butir: '0' });
    } else if (type === 'modal_jual_benih') {
      setModalTitle('💰 Penjualan Benih Ikan');
      setFormFields({ tgl: todayStr, jml: '', harga_ekor: '500', ukuran_cm: '5-7' });
      setPreviewVal('Rp 0');
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
      setFormFields({ tgl: todayStr, liter: '', kadar_lemak: '' });
    } else if (type === 'modal_jual_susu') {
      setModalTitle('💰 Catat Setoran Susu');
      setFormFields({ tgl: todayStr, liter: '', harga_liter: '' });
      setPreviewVal('Rp 0');
    } else if (type === 'modal_kelahiran') {
      setModalTitle('🐣 Catat Kelahiran');
      setFormFields({ tgl: todayStr, id_induk: '', jantan: '0', betina: '0', tgl_kawin: '', id_pejantan: '' });
    } else if (type === 'modal_perkawinan') {
      setModalTitle('💖 Catat Perkawinan');
      setFormFields({ tgl: todayStr, id_induk: '', id_pejantan: '', status: 'menunggu' });
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
      const { tgl, butir, kg, retak, air } = formFields;
      if (!butir) return;
      data.harian = [
        ...(data.harian || []),
        {
          tgl,
          butir: parseInt(butir),
          kg: parseFloat(kg || 0),
          retak: parseInt(retak || 0),
          air: parseFloat(air || 0)
        }
      ];
      showToast('✅ Produksi harian disimpan!');
    } else if (activeModal === 'modal_harian_pedaging') {
      const { tgl, air, pakan_kg, mati } = formFields;
      if (!air || !pakan_kg) return;
      data.harian = [
        ...(data.harian || []),
        {
          tgl,
          air: parseFloat(air),
          pakan_kg: parseFloat(pakan_kg),
          mati: parseInt(mati || 0)
        }
      ];
      showToast('✅ Log harian disimpan!');
    } else if (activeModal === 'modal_sampling_ikan') {
      const { tgl, jml_sampel, bobot_total_g, jml_estimasi, jml_mati, stdev_g } = formFields;
      if (!jml_sampel || !bobot_total_g) return;
      data.sampling = [
        ...(data.sampling || []),
        {
          tgl,
          jml_sampel: parseInt(jml_sampel),
          bobot_total_g: parseFloat(bobot_total_g),
          jml_estimasi: parseInt(jml_estimasi || 0),
          jml_mati: parseInt(jml_mati || 0),
          stdev_g: parseFloat(stdev_g || 0)
        }
      ];
      showToast('✅ Data sampling disimpan!');
    } else if (activeModal === 'modal_air_ikan') {
      const { tgl, suhu, ph, do: doVal, amonia, nitrit, kecerahan, volume_flok, cn_ratio } = formFields;
      data.kualitas_air = [
        ...(data.kualitas_air || []),
        {
          tgl,
          suhu: parseFloat(suhu || 0),
          ph: parseFloat(ph || 0),
          do: parseFloat(doVal || 0),
          amonia: parseFloat(amonia || 0),
          nitrit: parseFloat(nitrit || 0),
          kecerahan: parseFloat(kecerahan || 0),
          volume_flok: parseFloat(volume_flok || 0),
          cn_ratio: parseFloat(cn_ratio || 0)
        }
      ];
      showToast('✅ Data kualitas air disimpan!');
    } else if (activeModal === 'modal_pemijahan') {
      const { tgl, jantan_ekor, betina_ekor, est_telur } = formFields;
      if (!est_telur) return;
      data.pemijahan = [
        ...(data.pemijahan || []),
        {
          tgl,
          jantan_ekor: parseInt(jantan_ekor || 0),
          betina_ekor: parseInt(betina_ekor || 0),
          est_telur: parseInt(est_telur)
        }
      ];
      showToast('✅ Log pemijahan disimpan!');
    } else if (activeModal === 'modal_penetasan_ikan') {
      const { tgl, berhasil_larva, gagal_butir } = formFields;
      if (!berhasil_larva) return;
      data.penetasan = [
        ...(data.penetasan || []),
        {
          tgl,
          berhasil_larva: parseInt(berhasil_larva),
          gagal_butir: parseInt(gagal_butir || 0)
        }
      ];
      showToast('✅ Log penetasan disimpan!');
    } else if (activeModal === 'modal_jual_benih') {
      const { tgl, jml, harga_ekor, ukuran_cm } = formFields;
      if (!jml || !harga_ekor) return;
      const total = (parseInt(jml) || 0) * (parseFloat(harga_ekor) || 0);
      data.penjualan = [
        ...(data.penjualan || []),
        {
          tgl,
          jml: parseInt(jml),
          harga_ekor: parseFloat(harga_ekor),
          ukuran_cm,
          total
        }
      ];
      showToast('✅ Penjualan benih disimpan!');
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
      const { tgl, liter, kadar_lemak } = formFields;
      if (!liter) return;
      data.harian = [...(data.harian || []), { tgl, liter: parseFloat(liter), kadar_lemak: kadar_lemak ? parseFloat(kadar_lemak) : null }];
      showToast('✅ Produksi susu tersimpan!');
    } else if (activeModal === 'modal_jual_susu') {
      const { tgl, liter, harga_liter } = formFields;
      if (!liter || !harga_liter) return;
      const total = (parseFloat(liter) || 0) * (parseFloat(harga_liter) || 0);
      data.penjualan = [...(data.penjualan || []), { tgl, liter: parseFloat(liter), harga_liter: parseFloat(harga_liter), total }];
      showToast('✅ Setoran susu tersimpan!');
    } else if (activeModal === 'modal_kelahiran') {
      const { tgl, id_induk, jantan, betina, tgl_kawin, id_pejantan } = formFields;
      data.kelahiran = [...(data.kelahiran || []), { tgl, id_induk, jantan: parseInt(jantan), betina: parseInt(betina), tgl_kawin, id_pejantan }];
      showToast('🐣 Kelahiran tercatat!');
    } else if (activeModal === 'modal_perkawinan') {
      const { tgl, id_induk, id_pejantan, status } = formFields;
      data.perkawinan = [...(data.perkawinan || []), { tgl, id_induk, id_pejantan, status }];
      showToast('💖 Perkawinan tercatat!');
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
      btnColor: 'bg-[#859681] hover:bg-[#748570]',
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

    if (cycle.mode === 'ikan_pembesaran' || cycle.mode === 'ikan_pembibitan') {
      csv += `\nSAMPLING PERTUMBUHAN\n`;
      csv += `Tanggal,Jumlah Sampel,Bobot Total (g),Estimasi Populasi,Mati,Stdev (g),CV (%)\n`;
      (cycle.data?.sampling || []).forEach((s: any) => {
        const rata = parseFloat(s.bobot_total_g) / Math.max(1, parseFloat(s.jml_sampel) || 1);
        const cvVal = s.stdev_g && rata > 0 ? (parseFloat(s.stdev_g) / rata) * 100 : 0;
        csv += `${s.tgl || ''},${s.jml_sampel || 0},${s.bobot_total_g || 0},${s.jml_estimasi || 0},${s.jml_mati || 0},${s.stdev_g || 0},${cvVal.toFixed(1)}%\n`;
      });
      csv += `\nMONITORING KUALITAS AIR\n`;
      csv += `Tanggal,Suhu,pH,DO,Amonia,Nitrit,Kecerahan,Volume Flok,C/N Ratio\n`;
      (cycle.data?.kualitas_air || []).forEach((w: any) => {
        csv += `${w.tgl || ''},${w.suhu || 0},${w.ph || 0},${w.do || 0},${w.amonia || 0},${w.nitrit || 0},${w.kecerahan || 0},${w.volume_flok || 0},${w.cn_ratio || 0}\n`;
      });
    }

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
      } else if (activeModal === 'modal_jual_benih') {
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
      <div className="min-h-screen bg-[#FAF7F0] flex flex-col items-center justify-center text-[#3C3530] p-4 font-sans">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-[#859681]/25" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#859681] animate-spin" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-[#3C3530]/75">{t.dashboard.connecting}</p>
      </div>
    );
  }

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-4xl mx-auto w-full bg-[#FCFAF6] border border-[#EADDC9] p-8 rounded-3xl shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#859681]/5 rounded-full blur-3xl" />
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
      <div className="bg-[#FCFAF6] backdrop-blur-xl border border-[#859681]/10 p-12 rounded-3xl text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden animate-fadeIn my-12">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#859681]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        
        <div className="w-20 h-20 bg-[#859681]/15 border border-[#859681]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#859681]">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-black text-[#3C3530] mb-4">{featureTitle}</h2>
        <p className="text-sm text-[#3C3530]/80 mb-8 max-w-md mx-auto leading-relaxed">{featureDesc}</p>
        
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
  const stats = calculateStats as any;

  // Get Calendar list based on active conditions
  const startDayTime = activeCycle.data?.modal?.tgl_doc || activeCycle.data?.modal?.tgl_pullet || activeCycle.data?.modal?.tgl_beli || activeCycle.data?.modal?.tgl_indukan || activeCycle.data?.modal?.tgl_tebar || activeCycle.data?.modal?.tgl_mulai || activeCycle.createdAt;
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
    <div className="min-h-screen bg-[#FAF7F0] text-[#3C3530] flex font-sans">
      
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#F3EFE3] border-r border-[#EADDC9] flex flex-col shrink-0 min-h-screen sticky top-0 z-40">
        {/* Logo Section */}
        <div className="p-6 flex items-center gap-3">
          <span className="text-2xl">🐔</span>
          <div>
            <span className="text-lg font-black font-serif tracking-tight text-[#3C3530] block">
              {farmName || 'Legok Farm'}
            </span>
            <span className="text-[9px] block text-[#3C3530]/50 uppercase tracking-widest font-bold font-sans">LokaTernak Hub</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'ai_vet') {
                    openChatTab();
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#859681] text-[#FCFAF6] shadow-sm'
                    : 'text-[#3C3530]/85 hover:bg-[#FAF7F0]/60 hover:text-[#3C3530]'
                }`}
              >
                <span className={`shrink-0 ${isActive ? 'text-[#FCFAF6]' : 'text-[#3C3530]/70'}`}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#EADDC9] space-y-2.5">
          <button
            onClick={handleResetSetupPrompt}
            className="w-full px-3 py-2 bg-[#FCFAF6] hover:bg-[#FAF7F0] text-[#3C3530] text-xs font-bold rounded-xl border border-[#EADDC9] transition-all flex items-center justify-center gap-1.5"
          >
            Ganti Ternak
          </button>
          <button
            onClick={handleSignOut}
            className="w-full px-3 py-2 bg-[#A76A57]/10 hover:bg-[#A76A57]/20 text-[#A76A57] text-xs font-bold rounded-xl border border-[#A76A57]/20 transition-all flex items-center justify-center"
          >
            {t.common.logout}
          </button>
          <div className="flex justify-between items-center text-[10px] text-[#3C3530]/50 px-1 pt-1 font-mono">
            <LanguageSwitcher />
            <span>v0.1.0</span>
          </div>
        </div>
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header / Cycle Selector Bar */}
        <header className="bg-[#FAF7F0] border-b border-[#EADDC9]/60 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-black text-[#3C3530] tracking-tight flex items-center gap-2">
              <span>{ANIMAL_LABELS[activeCycle.animal]?.split(' ')[0]}</span>
              {ANIMAL_LABELS[activeCycle.animal]?.split(' ').slice(1).join(' ') || activeCycle.animal}
            </h2>
            <span className="text-[10px] px-2.5 py-1 bg-[#EADDC9] text-[#3C3530] rounded-lg font-bold border border-[#EADDC9]/50 uppercase tracking-wider">
              {SCALE_LABELS[intToScale(activeCycle.scale)] || intToScale(activeCycle.scale)}
            </span>
            <span className="text-[10px] px-2.5 py-1 bg-[#FCFAF6] text-[#3C3530]/80 rounded-lg font-bold border border-[#EADDC9] uppercase tracking-wider">
              🏷️ {ANIMAL_CATEGORIES[activeCycle.animal] || 'Lainnya'}
            </span>
            <span className="text-[10px] px-2.5 py-1 bg-[#FCFAF6] text-[#3C3530]/80 rounded-lg font-bold border border-[#EADDC9] font-mono">
              📅 Mulai: {parsedStartDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[10px] px-2.5 py-1 bg-[#859681]/15 text-[#4D5D4A] rounded-lg font-bold border border-[#859681]/25 font-mono">
              ⏳ Umur: {Math.max(0, Math.floor((new Date().getTime() - parsedStartDate.getTime()) / (1000 * 60 * 60 * 24)))} Hari
            </span>
          </div>

          <div className="flex items-center gap-4">
            {profile?.user?.role === 'OWNER' && (
              <button
                onClick={() => setBillingModalOpen(true)}
                className="px-3 py-1.5 bg-[#FAF7F0] text-[#3C3530] text-xs font-bold rounded-xl border border-[#EADDC9] transition-all flex items-center gap-1.5 shadow-sm"
              >
                Plan: {profile?.organization?.plan || 'FREE'} ⭐
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#3C3530]/75 font-bold">Pilih Siklus:</span>
              <select
                value={activeCycleIndex}
                onChange={(e) => {
                  setActiveCycleIndex(parseInt(e.target.value));
                  setActiveTab('dashboard');
                }}
                className="bg-[#FCFAF6] text-[#3C3530] border border-[#EADDC9] rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-[#859681] transition-all"
              >
                {cycles.map((c, i) => (
                  <option key={c.id} value={i} className="text-slate-800">
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddNewCyclePrompt}
                className="px-3 py-1.5 bg-[#859681] hover:bg-[#748570] text-[#FCFAF6] text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                + Baru
              </button>
            </div>
            
            {/* Notification Bell Icon */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-[#FCFAF6] hover:bg-[#FAF7F0] text-[#3C3530]/75 hover:text-[#3C3530] text-xs font-bold rounded-xl border border-[#EADDC9] transition-all flex items-center justify-center relative w-9 h-9"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#A76A57] animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-[#FCFAF6] border border-[#EADDC9] rounded-2xl shadow-xl p-4 z-50 space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-[#EADDC9]/60">
                    <span className="text-xs font-black text-[#3C3530]">🔔 Pusat Notifikasi</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-[10px] text-[#3C3530]/60 hover:text-[#3C3530] font-bold"
                    >
                      Tutup
                    </button>
                  </div>

                  {notificationPermission !== 'granted' && (
                    <div className="p-3 bg-[#859681]/10 border border-[#859681]/20 rounded-xl space-y-2">
                      <span className="text-[10px] text-[#4D5D4A] font-bold block leading-tight">Aktifkan Notifikasi Desktop/HP</span>
                      <p className="text-[9px] text-[#3C3530]/70 leading-normal">Terima pengingat pakan secara otomatis tanpa perlu membuka aplikasi.</p>
                      <button
                        onClick={requestNotificationPermission}
                        className="w-full py-1.5 bg-[#859681] hover:bg-[#748570] text-[#FCFAF6] font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all"
                      >
                        Izinkan Notifikasi
                      </button>
                    </div>
                  )}

                  {/* Simulator Pengujian */}
                  <div className="p-3 bg-[#F3EFE3] border border-[#EADDC9]/80 rounded-xl space-y-2">
                    <span className="text-[9px] text-[#3C3530]/65 font-bold uppercase tracking-wider block">Simulator Pengujian</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={simulateFeedingNotification}
                        className="py-1.5 bg-[#FCFAF6] hover:bg-[#FAF7F0] text-[#3C3530] font-extrabold rounded-lg text-[9px] transition-all border border-[#EADDC9]"
                      >
                        ⏰ Tes Pakan
                      </button>
                      <button
                        onClick={simulateSaleNotification}
                        className="py-1.5 bg-[#FCFAF6] hover:bg-[#FAF7F0] text-[#3C3530] font-extrabold rounded-lg text-[9px] transition-all border border-[#EADDC9]"
                      >
                        📈 Tes Penjualan
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-48 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-[10px] text-[#3C3530]/60 font-bold">
                        Tidak ada notifikasi aktif saat ini.
                      </div>
                    ) : (
                      notifications.map((noti) => (
                        <div 
                          key={noti.id} 
                          className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all text-left ${
                            noti.type === 'sale' 
                              ? 'bg-[#A76A57]/10 border-[#A76A57]/20 text-[#A76A57]' 
                              : noti.type === 'feeding' 
                              ? 'bg-[#859681]/10 border-[#859681]/25 text-[#4D5D4A]'
                              : 'bg-[#FCFAF6] border-[#EADDC9] text-[#3C3530]'
                          }`}
                        >
                          <span className="text-sm mt-0.5 shrink-0">
                            {noti.type === 'sale' ? '⏳' : noti.type === 'feeding' ? '🥣' : 'ℹ️'}
                          </span>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black block">{noti.title}</span>
                            <p className="text-[9px] opacity-80 leading-normal font-medium">{noti.desc}</p>
                            <span className="text-[8px] font-mono opacity-50 block pt-1">{noti.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

      {/* Main Tab Contents */}
      <main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1 pb-28">
        
        {/* --- TAB: DASHBOARD SUMMARY --- */}
        {stats && activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Laba Bersih Card (Dual: Akuntansi vs Cashflow) */}
            <div className="bg-[#859681] text-[#FCFAF6] p-8 rounded-3xl relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 divide-y md:divide-y-0 md:divide-x divide-[#FCFAF6]/20">
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FCFAF6]/75 block">📊 Laba Akuntansi (Accounting Profit)</span>
                  <h3 className="text-4xl font-serif tracking-tight text-[#FCFAF6]">
                    {formatRp(stats.laba)}
                  </h3>
                  <div className="text-[10px] text-[#FCFAF6]/90 font-semibold space-y-1">
                    <div className="flex justify-between">
                      <span>Total Modal (Akurat):</span>
                      <span>{formatRp(stats.totalModalAkurat)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Penyusutan Kandang:</span>
                      <span className="text-[#FCFAF6]/70">-{formatRp(stats.depresiasi)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 md:pt-0 md:pl-8 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FCFAF6]/75 block">💵 Laba Cashflow (Aliran Kas)</span>
                  <h3 className="text-4xl font-serif tracking-tight text-[#FCFAF6]">
                    {formatRp(stats.labaCash)}
                  </h3>
                  <div className="text-[10px] text-[#FCFAF6]/90 font-semibold space-y-1">
                    <div className="flex justify-between">
                      <span>Total Pengeluaran Kas:</span>
                      <span>{formatRp(stats.totalModalCash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>EBITDA Operasional:</span>
                      <span className="text-[#FCFAF6] font-bold">{formatRp(stats.ebitda)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#FCFAF6]/15 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold text-[#FCFAF6]/80 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#FCFAF6]"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FCFAF6]"></span>
                  </span>
                  <span>{stats.laba >= 0 ? '🐓 Selamat! Kinerja keuangan profitabel secara akuntansi.' : '⚠️ Kinerja keuangan mengalami defisit.'}</span>
                </div>
                {stats.depresiasi > 0 && (
                  <span className="text-[10px] text-[#FCFAF6]/60 font-mono">
                    *Penyusutan dihitung per siklus (umur kandang {activeCycle.data?.modal?.kandang_manfaat_tahun || '10'} thn)
                  </span>
                )}
              </div>
            </div>

            {/* Sprint 3 Dashboard Banners */}
            {activeCycle.mode === 'broiler' && (
              <div className="space-y-3">
                {stats.totalKgPanen === 0 && stats.prediksiPanen && (
                  <div className="bg-[#859681]/15 border border-[#859681]/20 text-[#859681] p-4 rounded-2xl flex items-center justify-between font-semibold text-xs animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span>🗓️</span>
                      <span>
                        Estimasi Panen Siklus ini: <strong className="text-white">{new Date(stats.prediksiPanen).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong> (Pada umur hari ke-35)
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#859681]/25 px-2.5 py-0.5 rounded-lg text-white font-mono uppercase tracking-wider font-bold">Broiler</span>
                  </div>
                )}

                {stats.alertLitterKuning && (
                  <div className="bg-[#EADDC9]/35 border border-[#EADDC9]/50 text-[#3C3530]/90 p-4 rounded-2xl flex items-center gap-2 font-semibold text-xs animate-pulse">
                    <span>🟡</span>
                    <span><strong>Peringatan Litter (Sekam):</strong> Litter sudah memasuki siklus ke-<strong>{activeCycle.data?.modal?.siklus_litter_ke}</strong>. Pertimbangkan untuk mengganti litter sekam sepenuhnya untuk menjaga kualitas udara dan mencegah penyebaran bakteri jahat.</span>
                  </div>
                )}

                {stats.alertDowntimeMerah && (
                  <div className="bg-[#A76A57]/15 border border-[#A76A57]/20 text-[#A76A57] p-4 rounded-2xl flex items-center gap-2 font-semibold text-xs">
                    <span>🔴</span>
                    <span><strong>Kritis (Down-time Kandang):</strong> Waktu kosong kandang (downtime) hanya <strong>{activeCycle.data?.modal?.down_time_hari} hari</strong> (Target standar industri: minimal 14 hari). Risiko tinggi penularan penyakit sisa siklus sebelumnya!</span>
                  </div>
                )}
              </div>
            )}

            {/* HDP Drop Alert for Layer */}
            {(activeCycle.mode === 'petelur' || activeCycle.mode === 'bebek_petelur') && stats.alertDrop && (
              <div className="bg-[#A76A57]/15 border border-[#A76A57]/20 text-[#A76A57] p-4 rounded-2xl flex items-center gap-2 font-semibold text-xs animate-pulse">
                <span>⚠️</span>
                <span><strong>Peringatan Produksi Telur Drop:</strong> Produksi telur menurun dibanding rata-rata sebelumnya!</span>
              </div>
            )}

            {/* Visual Charts Layout (Responsive Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Stat Cards */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-[#EADDC9] p-5 rounded-2xl transition-colors">
                  <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Total Modal (Akurat vs Cash)</span>
                  <span className="text-xl font-serif font-extrabold text-[#A76A57] mt-2 block">{formatRp(stats.totalModalAkurat)}</span>
                  <span className="text-[10px] text-[#3C3530]/60 block mt-1.5 font-semibold font-mono">Cashflow: {formatRp(stats.totalModalCash)}</span>
                </div>
                <div className="bg-[#EADDC9] p-5 rounded-2xl transition-colors">
                  <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Total Pendapatan</span>
                  <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">{formatRp(stats.totalPendapatan)}</span>
                </div>

                {/* Dynamic Stats Based on Mode */}
                {activeCycle.mode === 'broiler' && (
                  <>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">HPP / kg (Akurat vs Cash)</span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">{formatRp(stats.hppAkurat)}</span>
                      <span className="text-[10px] text-[#3C3530]/70 block mt-1.5 font-medium font-mono flex justify-between">
                        <span>HPP Cashflow:</span>
                        <span>{formatRp(stats.hpp)}</span>
                      </span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl font-semibold">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">FCR Pakan (Target)</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">
                        {(stats.fcr || 0).toFixed(2)}{' '}
                        <span className="text-xs text-[#3C3530]/60 font-semibold font-sans">
                          ({stats.fcrTarget.min}-{stats.fcrTarget.max})
                        </span>
                      </span>
                      <span className="text-[10px] block mt-1.5 font-semibold font-sans">
                        {stats.fcr >= stats.fcrTarget.min && stats.fcr <= stats.fcrTarget.max ? (
                          <span className="text-[#4D5D4A]">Target Tercapai</span>
                        ) : stats.fcr < stats.fcrTarget.min && stats.fcr > 0 ? (
                          <span className="text-[#4D5D4A] font-bold">Sangat Efisien</span>
                        ) : stats.fcr === 0 ? (
                          <span className="text-[#3C3530]/40">Belum Ada Data</span>
                        ) : (
                          <span className="text-[#A76A57]">Tidak Efisien</span>
                        )}
                      </span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl font-semibold">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">ADG (Rata-rata Gain)</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">
                        {(stats.adg || 0).toFixed(1)} <span className="text-xs text-[#3C3530]/60 font-sans">g/hari</span>
                      </span>
                      <span className="text-[10px] block mt-1.5 font-semibold font-sans">
                        {stats.adg >= 50 && stats.adg <= 60 ? (
                          <span className="text-[#4D5D4A]">Target Ideal (50-60g)</span>
                        ) : stats.adg > 60 ? (
                          <span className="text-[#4D5D4A] font-bold">Sangat Cepat</span>
                        ) : stats.adg === 0 ? (
                          <span className="text-[#3C3530]/40">Belum Ada Data</span>
                        ) : (
                          <span className="text-[#A76A57]">Kurang Optimal (&lt;50g)</span>
                        )}
                      </span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Berat Rata / Ekor</span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">
                        {(stats.bbRata || 0).toFixed(2)} <span className="text-xs text-[#3C3530]/60 font-sans">kg</span>
                      </span>
                      <span className="text-[10px] text-[#3C3530]/60 block mt-1.5 font-semibold font-sans">
                        Target panen: 1.4 - 2.0 kg
                      </span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl font-semibold" title="European Poultry Efficiency Factor">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider flex items-center gap-1 font-sans">
                        EPEF (IP)
                        <span className="cursor-help text-[#3C3530]/60 bg-[#FCFAF6]/70 px-1 rounded text-[8px]" title="European Poultry Efficiency Factor, setara Indeks Performa">?</span>
                      </span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">
                        {(stats.epef || 0).toFixed(0)}
                      </span>
                      <span className="text-[10px] block mt-1.5 font-semibold font-sans">
                        {stats.epef >= 300 ? (
                          <span className="text-[#4D5D4A] font-bold">Sangat Baik (&gt;300)</span>
                        ) : stats.epef > 0 ? (
                          <span className="text-[#A76A57]">Cukup (Target &gt;300)</span>
                        ) : (
                          <span className="text-[#3C3530]/40">Belum Ada Data</span>
                        )}
                      </span>
                    </div>
                  </>
                )}

                {activeCycle.mode === 'bebek_pedaging' && (
                  <>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">HPP / kg (Akurat vs Cash)</span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">{formatRp(stats.hppAkurat)}</span>
                      <span className="text-[10px] text-[#3C3530]/70 block mt-1.5 font-medium font-mono flex justify-between">
                        <span>HPP Cashflow:</span>
                        <span>{formatRp(stats.hpp)}</span>
                      </span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl font-semibold">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">FCR Pakan (Target)</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">
                        {(stats.fcr || 0).toFixed(2)}{' '}
                        <span className="text-xs text-[#3C3530]/60 font-semibold font-sans">
                          ({stats.fcrTarget.min}-{stats.fcrTarget.max})
                        </span>
                      </span>
                      <span className="text-[10px] block mt-1.5 font-semibold font-sans">
                        {stats.fcr >= stats.fcrTarget.min && stats.fcr <= stats.fcrTarget.max ? (
                          <span className="text-[#4D5D4A]">Target Tercapai</span>
                        ) : stats.fcr < stats.fcrTarget.min && stats.fcr > 0 ? (
                          <span className="text-[#4D5D4A] font-bold">Sangat Efisien</span>
                        ) : stats.fcr === 0 ? (
                          <span className="text-[#3C3530]/40">Belum Ada Data</span>
                        ) : (
                          <span className="text-[#A76A57]">Tidak Efisien</span>
                        )}
                      </span>
                    </div>
                  </>
                )}

                {(activeCycle.mode === 'petelur' || activeCycle.mode === 'bebek_petelur') && (
                  <>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">
                        {activeCycle.mode === 'bebek_petelur' ? 'Duck Day %' : 'Hen Day %'}
                      </span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">{(stats.henDay || 0).toFixed(1)}%</span>
                      <span className="text-[10px] text-[#3C3530]/60 block mt-1.5 font-semibold font-sans">
                        Kualitas produksi telur harian
                      </span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">HPP / Butir (Akurat vs Cash)</span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">{formatRp(stats.hppButirAkurat)}</span>
                      <span className="text-[10px] text-[#3C3530]/70 block mt-1.5 font-medium font-mono flex justify-between">
                        <span>HPP Cashflow:</span>
                        <span>{formatRp(stats.hppButir)}</span>
                      </span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl font-semibold">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Berat Rata Telur</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">
                        {(stats.beratRataTelur || 0).toFixed(1)} <span className="text-xs text-[#3C3530]/60 font-sans">g</span>
                      </span>
                      <span className="text-[10px] block mt-1.5 font-semibold font-sans">
                        {stats.beratRataTelur >= 60 && stats.beratRataTelur <= 65 ? (
                          <span className="text-[#4D5D4A]">Target Ideal (60-65g)</span>
                        ) : stats.beratRataTelur > 0 && stats.beratRataTelur < 60 ? (
                          <span className="text-[#A76A57]">Ukuran Kecil (&lt;60g)</span>
                        ) : stats.beratRataTelur > 65 ? (
                          <span className="text-[#4D5D4A] font-bold">Ukuran Jumbo (&gt;65g)</span>
                        ) : (
                          <span className="text-[#3C3530]/40">Belum Ada Data</span>
                        )}
                      </span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Biaya Pakan / Butir</span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">
                        {formatRp(stats.biayaPakanPerButir)}
                      </span>
                      <span className="text-[10px] text-[#3C3530]/60 block mt-1.5 font-semibold font-sans">
                        Efisiensi konversi pakan harian
                      </span>
                    </div>
                  </>
                )}

                {activeCycle.mode === 'pembibitan_unggas' && (
                  <>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Daya Tetas</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">{(stats.dayaTetas || 0).toFixed(1)}%</span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Populasi Aktif</span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">{stats.populasi} ekor</span>
                    </div>
                  </>
                )}

                {activeCycle.mode === 'penggemukan' && (
                  <>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">ADG (g/hari)</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">{(stats.adg || 0).toFixed(0)} g</span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Lama Penggemukan</span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">{stats.lamaHari} Hari</span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Kebutuhan BK / Hari</span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">{(stats.BK_kebutuhan || 0).toFixed(1)} <span className="text-xs text-[#3C3530]/60 font-sans">kg/hari</span></span>
                      <span className="text-[10px] text-[#3C3530]/60 block mt-1.5 font-semibold font-sans">*3.5% dari Bobot Awal</span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">IOFC (Income over Feed Cost)</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">{formatRp(stats.iofc)}</span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Margin per Ekor</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">{formatRp(stats.marginPerEkor)}</span>
                    </div>
                    {stats.totalKgPanen === 0 && (
                      <div className="bg-[#EADDC9] p-5 rounded-2xl">
                        <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Prediksi BB Panen</span>
                        <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">{(stats.prediksiPanen_BB || 0).toFixed(1)} kg</span>
                        <span className="text-[10px] text-[#3C3530]/60 block mt-1.5 font-semibold font-sans">Target: {activeCycle.data?.modal?.hari_target_panen || 120} hari</span>
                      </div>
                    )}
                  </>
                )}

                {activeCycle.mode === 'susu' && (
                  <>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Produksi Rata-rata</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">{(stats.produksiRata || 0).toFixed(1)} L/hari</span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">HPP / Liter (Akurat vs Cash)</span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">{formatRp(stats.hppLiterAkurat)}</span>
                      <span className="text-[10px] text-[#3C3530]/70 block mt-1.5 font-semibold font-mono">Cashflow HPP: {formatRp(stats.hppLiter)}</span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">FCM 4% (Fat Corrected)</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">{stats.FCM !== null ? stats.FCM.toFixed(1) + ' L' : 'N/A'}</span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Biaya Pakan / Liter</span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">{formatRp(stats.biayaPakanPerLiter)}</span>
                    </div>
                  </>
                )}

                {activeCycle.mode === 'breeding_ruminansia' && (
                  <>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Populasi Total</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">{stats.populasiTotal} ekor</span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Total Kelahiran</span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">{stats.totalLahir} ekor</span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Conception Rate (CR)</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">{(stats.conceptionRate || 0).toFixed(1)}%</span>
                      <span className="text-[10px] text-[#3C3530]/50 block mt-1.5 font-semibold font-sans">Target: &gt;80%</span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Calving Interval</span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">{stats.calvingInterval > 0 ? stats.calvingInterval + ' Hari' : '-'}</span>
                      <span className="text-[10px] text-[#3C3530]/60 block mt-1.5 font-semibold font-sans">Target: &lt;365 Hari</span>
                    </div>
                  </>
                )}

                {(activeCycle.mode === 'ikan_pembesaran' || activeCycle.mode === 'ikan_pembibitan') && (
                  <>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">
                        {activeCycle.mode === 'ikan_pembesaran' ? 'HPP / kg (Akurat vs Cash)' : 'HPP / Ekor (Akurat vs Cash)'}
                      </span>
                      <span className="text-xl font-serif font-extrabold text-[#3C3530] mt-2 block">{formatRp(stats.hppAkurat)}</span>
                      <span className="text-[10px] text-[#3C3530]/70 block mt-1.5 font-medium font-mono flex justify-between">
                        <span>HPP Cashflow:</span>
                        <span>{formatRp(stats.hpp)}</span>
                      </span>
                    </div>
                    <div className="bg-[#EADDC9] p-5 rounded-2xl">
                      <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">FCR Ikan (Target)</span>
                      <span className="text-xl font-serif font-extrabold text-[#4D5D4A] mt-2 block">
                        {(stats.fcr || 0).toFixed(2)}{' '}
                        <span className="text-xs text-[#3C3530]/60 font-semibold font-sans">
                          ({stats.fcrTarget.min}-{stats.fcrTarget.max})
                        </span>
                      </span>
                    </div>
                  </>
                )}

                {/* Water tracker card for duck modes */}
                {stats.isBebek && (
                  <div className="bg-[#FCFAF6] border border-[#EADDC9] p-5 rounded-2xl col-span-2 font-semibold">
                    <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider font-sans">Pelacakan Konsumsi Air (Aktual vs Estimasi)</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-xl font-serif font-extrabold text-[#3C3530]">
                        {stats.airAktual || 0} L / {Math.round(stats.airEstimasi || 0)} L
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase ${stats.waterAlert ? 'bg-[#A76A57]/15 text-[#A76A57] border border-[#A76A57]/20 animate-pulse' : 'bg-[#859681]/15 text-[#4D5D4A]'}`}>
                        {stats.waterAlert ? '🚨 DROP >30%' : '✅ NORMAL'}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#3C3530]/60 mt-1.5 block leading-normal font-sans">
                      *Estimasi pakan bebek dikali {activeCycle.mode === 'bebek_petelur' ? '2.2' : '2.0'}. Jika konsumsi drop, segera cek kesehatan bebek!
                    </span>
                  </div>
                )}

                {/* Lighting Program Card for Broiler/Layer */}
                {(activeCycle.mode === 'broiler' || activeCycle.mode === 'petelur' || activeCycle.mode === 'bebek_petelur') && (
                  <div className="bg-[#FCFAF6] border border-[#EADDC9] p-5 rounded-2xl col-span-2 font-semibold">
                    <span className="text-[10px] font-bold text-[#3C3530]/70 uppercase block tracking-wider flex items-center gap-1.5 font-sans">
                      💡 Program Pencahayaan Otomatis (Lighting Program)
                    </span>
                    <div className="mt-2 text-sm font-bold text-[#3C3530]">
                      Program Aktif (Umur {stats.umur} Hari):{' '}
                      <span className="text-[#4D5D4A]">{stats.lightingProgram}</span>
                    </div>
                    <span className="text-[10px] text-[#3C3530]/60 mt-1.5 block leading-normal font-sans">
                      *Manajemen cahaya optimal membantu menyeimbangkan asupan pakan harian dan waktu istirahat organ pencernaan.
                    </span>
                  </div>
                )}
              </div>

              {/* Dynamic Chart (Line or Circular Gauge) */}
              <div className="w-full">
                {['broiler', 'bebek_pedaging', 'ikan_pembesaran', 'ikan_pembibitan', 'penggemukan'].includes(activeCycle.mode) ? (
                  renderSVGGauge(stats.srPct || 100, stats.mati || 0, stats.jmlDoc || 0)
                ) : (
                  renderSVGLineChart()
                )}
              </div>
            </div>

            {/* Extra Assets Card for Ruminansia Breeding */}
            {activeCycle.mode === 'breeding_ruminansia' && (
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#3C3530]/75 uppercase tracking-wider block">Estimasi Nilai Aset Peternakan</span>
                  <span className="text-2xl font-black text-white mt-1 block font-mono">{formatRp(stats.nilaiAset)}</span>
                  <span className="text-[10px] text-[#3C3530]/60 block mt-1">*Formula: Populasi × Taksiran Berat (30kg) × Harga Pasar</span>
                </div>
                <div className="flex gap-4">
                  <div className="bg-[#FAF7F0] px-4 py-3 rounded-2xl border border-[#EADDC9]">
                    <span className="text-[9px] text-[#3C3530]/60 block font-bold">BETINA</span>
                    <span className="text-sm font-black text-pink-400 font-mono">{stats.populasiBetina} ekor</span>
                  </div>
                  <div className="bg-[#FAF7F0] px-4 py-3 rounded-2xl border border-[#EADDC9]">
                    <span className="text-[9px] text-[#3C3530]/60 block font-bold">JANTAN</span>
                    <span className="text-sm font-black text-blue-400 font-mono">{stats.populasiJantan} ekor</span>
                  </div>
                </div>
              </div>
            )}

            {/* Budget Breakdown */}
            {stats.breakdown && (
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl">
                <h3 className="font-bold text-[#3C3530] mb-5 text-sm flex items-center gap-2">
                  <span>📊</span> Rincian Anggaran & Pengeluaran
                </h3>
                <div className="space-y-4">
                  {stats.breakdown.map((item: any, i: number) => {
                    const pct = stats.totalModal > 0 ? (item.val / stats.totalModal) * 100 : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-[#3C3530]/75">{item.label}</span>
                          <span className="text-[#3C3530] font-mono">
                            {formatRp(item.val)} <span className="text-[#3C3530]/60 font-medium">({pct.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-[#FAF7F0] h-2.5 rounded-full overflow-hidden border border-[#EADDC9]">
                          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EBITDA & Depreciation Analysis Card */}
            <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6">
              <h3 className="font-bold text-[#3C3530] text-sm flex items-center gap-2">
                <span>📊</span> Analisis EBITDA & Penyusutan Kandang (CapEx)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9]">
                  <span className="text-[10px] font-bold text-[#3C3530]/60 uppercase block tracking-wider">EBITDA</span>
                  <span className="text-xl font-extrabold text-[#859681] mt-1.5 block font-mono">{formatRp(stats.ebitda)}</span>
                  <span className="text-[9px] text-[#3C3530]/60 mt-1 block leading-normal">Laba operasional sebelum bunga, pajak, dan penyusutan.</span>
                </div>
                <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9]">
                  <span className="text-[10px] font-bold text-[#3C3530]/60 uppercase block tracking-wider">Penyusutan Kandang (Siklus)</span>
                  <span className="text-xl font-extrabold text-[#A76A57] mt-1.5 block font-mono">{formatRp(stats.depresiasi)}</span>
                  <span className="text-[9px] text-[#3C3530]/60 mt-1 block leading-normal">
                    Penyusutan kandang selama {stats.umur || 0} hari (dari masa manfaat {activeCycle.data?.modal?.kandang_manfaat_tahun || 5} tahun).
                  </span>
                </div>
                <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9]">
                  <span className="text-[10px] font-bold text-[#3C3530]/60 uppercase block tracking-wider">Laba Bersih (Net Profit)</span>
                  <span className="text-xl font-extrabold text-[#4D5D4A] mt-1.5 block font-mono">{formatRp(stats.laba)}</span>
                  <span className="text-[9px] text-[#3C3530]/60 mt-1 block leading-normal">Laba bersih setelah dikurangi akumulasi penyusutan kandang.</span>
                </div>
              </div>

              {/* Indikator Kelayakan Finansial Lanjutan */}
              <div className="border-t border-[#EADDC9] pt-5 space-y-3">
                <span className="text-[10px] font-black text-[#859681] uppercase tracking-widest block font-sans">
                  📈 Indikator Kelayakan Finansial Lanjutan
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                  <div className="bg-[#FAF7F0] p-3.5 rounded-xl border border-[#EADDC9] flex flex-col justify-between">
                    <div>
                      <span className="text-[#3C3530]/65 block text-[9px] uppercase tracking-wider">% Pakan dari Modal</span>
                      <span className="text-[#3C3530] font-mono mt-1.5 block font-bold text-sm">
                        {stats.pakanPct?.toFixed(1) || '0.0'}%
                      </span>
                    </div>
                    <span className="text-[8.5px] text-[#3C3530]/60 mt-1 block leading-tight font-normal">
                      Porsi biaya pakan terhadap total modal operasional.
                    </span>
                  </div>
                  <div className="bg-[#FAF7F0] p-3.5 rounded-xl border border-[#EADDC9] flex flex-col justify-between">
                    <div>
                      <span className="text-[#3C3530]/65 block text-[9px] uppercase tracking-wider">% TK dari Modal</span>
                      <span className="text-[#3C3530] font-mono mt-1.5 block font-bold text-sm">
                        {stats.tkPct?.toFixed(1) || '0.0'}%
                      </span>
                    </div>
                    <span className="text-[8.5px] text-[#3C3530]/60 mt-1 block leading-tight font-normal">
                      Porsi biaya tenaga kerja terhadap total modal operasional.
                    </span>
                  </div>
                  <div className="bg-[#FAF7F0] p-3.5 rounded-xl border border-[#EADDC9] flex flex-col justify-between">
                    <div>
                      <span className="text-[#3C3530]/65 block text-[9px] uppercase tracking-wider">IOFC (Income Over Feed Cost)</span>
                      <span className="text-[#859681] font-mono mt-1.5 block font-bold text-sm">
                        {formatRp(stats.iofc)}
                      </span>
                    </div>
                    <span className="text-[8.5px] text-[#3C3530]/60 mt-1 block leading-tight font-normal">
                      Pendapatan kotor dikurangi total pengeluaran biaya pakan.
                    </span>
                  </div>
                  <div className="bg-[#FAF7F0] p-3.5 rounded-xl border border-[#EADDC9] flex flex-col justify-between">
                    <div>
                      <span className="text-[#3C3530]/65 block text-[9px] uppercase tracking-wider">BEP Harga Jual</span>
                      <span className="text-[#859681] font-mono mt-1.5 block font-bold text-sm">
                        {formatRp(stats.bepHarga)}
                      </span>
                    </div>
                    <span className="text-[8.5px] text-[#3C3530]/60 mt-1 block leading-tight font-normal">
                      Titik impas harga jual minimum per kg/butir/liter/ekor.
                    </span>
                  </div>
                </div>
              </div>

              {/* Rincian Pembangunan Kandang jika menggunakan rincian manual */}
              {activeCycle.data?.modal?.kandang_detail_aktif === 'true' && (
                <div className="p-5 bg-[#FAF7F0] rounded-2xl border border-[#EADDC9] space-y-3">
                  <span className="text-[10px] font-black text-[#3C3530]/80 uppercase tracking-wider block">
                    🏗️ Rincian Pembangunan Kandang Baru (Investasi Awal)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-[#3C3530]/60 block text-[9px] uppercase">Bahan & Material</span>
                      <span className="text-[#3C3530] font-mono mt-0.5 block">
                        {formatRp(parseFloat(activeCycle.data?.modal?.kandang_material) || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#3C3530]/65 block text-[9px] uppercase">Tenaga Kerja / Tukang</span>
                      <span className="text-[#3C3530] font-mono mt-0.5 block">
                        {formatRp(parseFloat(activeCycle.data?.modal?.kandang_pekerja) || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#3C3530]/65 block text-[9px] uppercase">Biaya Lain-lain</span>
                      <span className="text-[#3C3530] font-mono mt-0.5 block">
                        {formatRp(parseFloat(activeCycle.data?.modal?.kandang_lain) || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#3C3530]/65 block text-[9px] uppercase">Total Biaya Kandang</span>
                      <span className="text-[#859681] font-mono mt-0.5 block font-bold">
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
                className="flex-1 py-3.5 px-4 bg-[#FAF7F0] hover:bg-[#EADDC9] text-[#3C3530] border border-[#EADDC9] hover:border-[#859681] font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                {Icons.export("w-4 h-4 text-[#859681]")}
                Ekspor Laporan (CSV)
              </button>
              {profile?.user?.role === 'OWNER' && (
                <button
                  onClick={handleConfirmDeleteCycle}
                  className="flex-1 py-3.5 px-4 bg-[#A76A57]/15 hover:bg-[#A76A57]/35 text-[#A76A57] border border-[#A76A57]/20 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                >
                  {Icons.trash("w-4 h-4 text-[#A76A57]")}
                  Hapus Siklus Ini
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: MODAL AWAL FORM --- */}
        {activeTab === 'modal_awal' && (
          <div className="max-w-xl mx-auto bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-[#3C3530] flex items-center gap-2">
              <span>ðŸ“‹</span> Data Modal Awal Siklus
            </h3>

            {activeCycle.mode === 'broiler' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Tanggal Masuk DOC</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_doc || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_doc: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah DOC (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 1000"
                    value={activeCycle.data?.modal?.jml_doc || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_doc: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per Ekor (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 8000"
                    value={activeCycle.data?.modal?.harga_doc || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_doc: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Siklus Litter (Sekam) Ke</label>
                    <input
                      type="number"
                      placeholder="Contoh: 1"
                      value={activeCycle.data?.modal?.siklus_litter_ke || '1'}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), siklus_litter_ke: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Down-time Kandang (Hari)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 14"
                      value={activeCycle.data?.modal?.down_time_hari || '14'}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), down_time_hari: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeCycle.mode === 'bebek_pedaging' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Tanggal Masuk DOD</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_doc || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_doc: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah DOD (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 500"
                    value={activeCycle.data?.modal?.jml_doc || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_doc: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per Ekor (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 10000"
                    value={activeCycle.data?.modal?.harga_doc || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_doc: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Strain Bebek</label>
                  <select
                    value={activeCycle.data?.modal?.strain_bebek || 'Serati'}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), strain_bebek: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-xs text-[#3C3530] font-semibold cursor-pointer"
                  >
                    {['Serati', 'Raja', 'Ratu', 'Mojosari', 'Alabio', 'Tegal', 'Lainnya'].map((st) => (
                      <option key={st} value={st} className="bg-[#FCFAF6] text-[#3C3530]">{st}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Umur Bibit saat Masuk (Hari)</label>
                  <input
                    type="number"
                    value={activeCycle.data?.modal?.umur_bibit || '1'}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), umur_bibit: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'bebek_petelur' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Tanggal Masuk Bayah</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_pullet || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_pullet: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Bebek Petelur (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 500"
                    value={activeCycle.data?.modal?.jml_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per Ekor (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 12000"
                    value={activeCycle.data?.modal?.harga_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Strain Bebek</label>
                  <select
                    value={activeCycle.data?.modal?.strain_bebek || 'Mojosari'}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), strain_bebek: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-xs text-[#3C3530] font-semibold cursor-pointer"
                  >
                    {['Serati', 'Raja', 'Ratu', 'Mojosari', 'Alabio', 'Tegal', 'Lainnya'].map((st) => (
                      <option key={st} value={st} className="bg-[#FCFAF6] text-[#3C3530]">{st}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Umur Bayah saat Masuk (Hari)</label>
                  <input
                    type="number"
                    value={activeCycle.data?.modal?.umur_bibit || '150'}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), umur_bibit: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                  />
                </div>
              </div>
            )}

            {(activeCycle.mode === 'ikan_pembesaran' || activeCycle.mode === 'ikan_pembibitan') && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Tanggal Tebar Benih</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_tebar || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_tebar: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3C3530]/65 block uppercase tracking-wider">Jenis Ikan</label>
                    <select
                      value={activeCycle.data?.modal?.jenis_ikan || 'lele'}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), jenis_ikan: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-xs text-[#3C3530] font-semibold cursor-pointer"
                    >
                      {['lele', 'nila', 'gurame', 'mas', 'patin', 'lainnya'].map((ik) => (
                        <option key={ik} value={ik} className="bg-[#FCFAF6] text-[#3C3530]">{ik.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3C3530]/65 block uppercase tracking-wider">Sistem Kolam</label>
                    <select
                      value={activeCycle.data?.modal?.sistem_kolam || 'bioflok'}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), sistem_kolam: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-xs text-[#3C3530] font-semibold cursor-pointer"
                    >
                      {['konvensional', 'bioflok', 'RAS'].map((sys) => (
                        <option key={sys} value={sys} className="bg-[#FCFAF6] text-[#3C3530]">{sys.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/65 block uppercase tracking-wider">Tipe Wadah/Kolam</label>
                  <select
                    value={activeCycle.data?.modal?.tipe_kolam || 'terpal'}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tipe_kolam: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-xs text-[#3C3530] font-semibold cursor-pointer"
                  >
                    {['tanah', 'terpal', 'beton', 'bioflok', 'RAS', 'keramba', 'air_deras'].map((t) => (
                      <option key={t} value={t} className="bg-[#FCFAF6] text-[#3C3530]">{t.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/65 block uppercase">Panjang (m)</label>
                    <input
                      type="number"
                      value={activeCycle.data?.modal?.panjang_m || ''}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), panjang_m: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-3 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/65 block uppercase">Lebar (m)</label>
                    <input
                      type="number"
                      value={activeCycle.data?.modal?.lebar_m || ''}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), lebar_m: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-3 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/65 block uppercase">Tinggi Air (m)</label>
                    <input
                      type="number"
                      value={activeCycle.data?.modal?.tinggi_air_m || ''}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), tinggi_air_m: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-3 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Tebar Benih (Ekor)</label>
                  <input
                    type="number"
                    value={activeCycle.data?.modal?.jml_tebar || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_tebar: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3C3530]/65 block uppercase tracking-wider">Bobot Awal (g/ekor)</label>
                    <input
                      type="number"
                      value={activeCycle.data?.modal?.bobot_awal_g || ''}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), bobot_awal_g: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3C3530]/65 block uppercase tracking-wider">Harga per Benih (Rp)</label>
                    <input
                      type="number"
                      value={activeCycle.data?.modal?.harga_benih || ''}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), harga_benih: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Biaya Persiapan Air (Rp)</label>
                    <input
                      type="number"
                      value={activeCycle.data?.modal?.biaya_persiapan_air || ''}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), biaya_persiapan_air: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Biaya Aerasi / Pompa (Rp)</label>
                    <input
                      type="number"
                      value={activeCycle.data?.modal?.biaya_aerasi_pompa || ''}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), biaya_aerasi_pompa: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeCycle.mode === 'petelur' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Tanggal Masuk Pullet</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_pullet || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_pullet: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Ayam Pullet (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 500"
                    value={activeCycle.data?.modal?.jml_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per Ekor (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 80000"
                    value={activeCycle.data?.modal?.harga_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'pembibitan_unggas' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Betina (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 50"
                    value={activeCycle.data?.modal?.jml_betina || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_betina: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Pejantan (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 5"
                    value={activeCycle.data?.modal?.jml_jantan || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_jantan: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per Ekor Indukan (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 150000"
                    value={activeCycle.data?.modal?.harga_indukan || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_indukan: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'penggemukan' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Tanggal Beli Bakalan</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_beli || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_beli: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Ekor</label>
                  <input
                    type="number"
                    placeholder="Contoh: 10"
                    value={activeCycle.data?.modal?.jml_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/65 block uppercase tracking-wider">BB Awal Rata2 (kg)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 150"
                    value={activeCycle.data?.modal?.bb_awal || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), bb_awal: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per kg (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 55000"
                    value={activeCycle.data?.modal?.harga_kg_bakalan || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_kg_bakalan: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Target Hari Panen</label>
                  <input
                    type="number"
                    placeholder="Contoh: 120"
                    value={activeCycle.data?.modal?.hari_target_panen || '120'}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), hari_target_panen: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'susu' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Tanggal Beli Induk</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_beli || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_beli: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Ekor Indukan</label>
                  <input
                    type="number"
                    placeholder="Contoh: 5"
                    value={activeCycle.data?.modal?.jml_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per Induk (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 15000000"
                    value={activeCycle.data?.modal?.harga_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'breeding_ruminansia' && (
              <div className="space-y-4 font-semibold">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Induk Betina</label>
                  <input
                    type="number"
                    placeholder="Contoh: 10"
                    value={activeCycle.data?.modal?.jml_betina || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_betina: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Pejantan</label>
                  <input
                    type="number"
                    placeholder="Contoh: 2"
                    value={activeCycle.data?.modal?.jml_jantan || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_jantan: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per Ekor (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 3000000"
                    value={activeCycle.data?.modal?.harga_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga Pasar / kg Hidup (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 60000"
                    value={activeCycle.data?.modal?.harga_pasar || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_pasar: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Taksiran Berat Anak (kg)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 30"
                    value={activeCycle.data?.modal?.bobot_taksiran || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), bobot_taksiran: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Unified cage section in Modal Awal form */}
            <div className="mt-4 pt-4 border-t border-[#EADDC9] space-y-4">
              <span className="text-[10px] font-black text-[#3C3530]/80 uppercase tracking-widest block">ðŸ¢ Investasi Kandang & Aset (CapEx)</span>
              
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
                  className="w-4 h-4 rounded border-[#EADDC9] text-[#859681] focus:ring-[#859681]/30 bg-[#FAF7F0] cursor-pointer"
                />
                <label htmlFor="isDetailedCageInput_modal" className="text-xs font-bold text-[#3C3530]/90 cursor-pointer">
                  Input Rincian Biaya Pembangunan Kandang Baru
                </label>
              </div>

              {activeCycle.data?.modal?.kandang_detail_aktif === 'true' ? (
                <div className="space-y-3.5 pl-2 border-l-2 border-[#859681]/20">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 uppercase tracking-wider block">1. Biaya Bahan & Material</label>
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
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 uppercase tracking-wider block">2. Biaya Tenaga Kerja (Labor)</label>
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
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 uppercase tracking-wider block">3. Biaya Lain-lain</label>
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
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold"
                    />
                  </div>
                  <div className="p-3 bg-[#859681]/5 rounded-xl border border-[#859681]/10 text-xs text-[#859681] font-bold flex justify-between font-mono">
                    <span>Total Biaya Kandang:</span>
                    <span>Rp {(parseFloat(activeCycle.data?.modal?.biaya_kandang) || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Investasi Kandang / Aset Awal (Rp)</label>
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
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-3 text-[#3C3530] font-semibold transition-colors"
                  />
                </div>
              )}

              {!(activeCycle.mode === 'ikan_pembesaran' || activeCycle.mode === 'ikan_pembibitan') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#3C3530]/80 block uppercase tracking-wider">Panjang Kandang (Meter)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 10"
                      value={activeCycle.data?.modal?.panjang_m || ''}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), panjang_m: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#3C3530]/80 block uppercase tracking-wider">Lebar Kandang (Meter)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 8"
                      value={activeCycle.data?.modal?.lebar_m || ''}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), lebar_m: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#3C3530]/65 block uppercase tracking-wider">Masa Manfaat Kandang (Tahun)</label>
                <select
                  value={activeCycle.data?.modal?.kandang_manfaat_tahun || '10'}
                  onChange={(e) => {
                    const modal = { ...(activeCycle.data?.modal || {}), kandang_manfaat_tahun: e.target.value };
                    handleSaveCycleData({ ...activeCycle.data, modal });
                  }}
                  className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold font-mono cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 8, 10, 15, 20].map((yr) => (
                    <option key={yr} value={yr} className="bg-[#FCFAF6] text-[#3C3530]">
                      {yr} Tahun ({yr * 12} Bulan)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#3C3530]/65 block uppercase tracking-wider">Perkiraan Siklus per Tahun</label>
                <input
                  type="number"
                  value={activeCycle.data?.modal?.siklus_per_thn || '6'}
                  onChange={(e) => {
                    const modal = { ...(activeCycle.data?.modal || {}), siklus_per_thn: e.target.value };
                    handleSaveCycleData({ ...activeCycle.data, modal });
                  }}
                  className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                />
              </div>
            </div>

            <div className="bg-[#0c1a1f] border border-[#859681]/10 p-5 rounded-2xl text-xs font-semibold text-[#3C3530]/80">
              <div className="text-[10px] font-bold block uppercase opacity-70 mb-2">Rincian Nilai Modal Awal:</div>
              <div className="text-xl font-black text-[#859681] font-mono">
                {formatRp(
                  activeCycle.mode === 'broiler' || activeCycle.mode === 'bebek_pedaging'
                    ? (parseFloat(activeCycle.data?.modal?.jml_doc) || 0) * (parseFloat(activeCycle.data?.modal?.harga_doc) || 0) + (parseFloat(activeCycle.data?.modal?.biaya_kandang) || 0)
                    : activeCycle.mode === 'petelur' || activeCycle.mode === 'bebek_petelur'
                    ? (parseFloat(activeCycle.data?.modal?.jml_ekor) || 0) * (parseFloat(activeCycle.data?.modal?.harga_ekor) || 0) + (parseFloat(activeCycle.data?.modal?.biaya_kandang) || 0)
                    : (activeCycle.mode === 'ikan_pembesaran' || activeCycle.mode === 'ikan_pembibitan')
                    ? (parseFloat(activeCycle.data?.modal?.jml_tebar) || 0) * (parseFloat(activeCycle.data?.modal?.harga_benih) || 0) + (parseFloat(activeCycle.data?.modal?.biaya_kandang) || 0) + (parseFloat(activeCycle.data?.modal?.biaya_persiapan_air) || 0) + (parseFloat(activeCycle.data?.modal?.biaya_aerasi_pompa) || 0)
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
            {(['broiler', 'petelur', 'bebek_pedaging', 'bebek_petelur', 'ikan_pembesaran', 'ikan_pembibitan'].includes(activeCycle.mode)) ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Pakan */}
                <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl flex flex-col justify-between hover:border-[#EADDC9] transition-colors">
                  <div>
                    <h4 className="font-bold text-[#3C3530] mb-4 flex items-center justify-between">
                      <span>🌾 Biaya Pakan</span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#859681]/15 text-[#859681] rounded-md font-mono">
                        {((activeCycle.data?.biaya || []).filter((b: any) => b.type === 'pakan').length)} Catatan
                      </span>
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                      {(activeCycle.data?.biaya || []).filter((b: any) => b.type === 'pakan').length === 0 ? (
                        <div className="text-center py-10 text-xs text-[#3C3530]/50 font-bold">Belum ada catatan pakan.</div>
                      ) : (
                        (activeCycle.data?.biaya || []).filter((b: any) => b.type === 'pakan').map((b: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-3.5 rounded-xl border border-[#EADDC9]">
                            <div>
                              <div className="text-xs font-bold text-[#3C3530]/90">{b.jenis || 'Pakan'}</div>
                              <div className="text-[9px] text-[#3C3530]/60 mt-0.5 font-bold font-mono">{b.sak} sak × {b.kg_sak}kg/sak · {b.tgl}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#859681] font-mono">{formatRp(b.total)}</span>
                              <button onClick={() => handleDeleteListItem('biaya', (activeCycle.data?.biaya || []).indexOf(b))} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-1">✕</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openModalForm('modal_pakan')}
                    className="w-full mt-6 py-2.5 bg-[#FAF7F0] hover:bg-[#EADDC9] text-[#859681] text-xs font-bold rounded-xl border border-[#EADDC9] transition-all"
                  >
                    + Tambah Pakan
                  </button>
                </div>

                {/* Obat */}
                <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl flex flex-col justify-between hover:border-[#EADDC9] transition-colors">
                  <div>
                    <h4 className="font-bold text-[#3C3530] mb-4 flex items-center justify-between">
                      <span>💊 Obat & Vaksin</span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#859681]/15 text-[#859681] rounded-md font-mono">
                        {((activeCycle.data?.biaya || []).filter((b: any) => b.type === 'obat').length)} Catatan
                      </span>
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                      {(activeCycle.data?.biaya || []).filter((b: any) => b.type === 'obat').length === 0 ? (
                        <div className="text-center py-10 text-xs text-[#3C3530]/50 font-bold">Belum ada catatan obat.</div>
                      ) : (
                        (activeCycle.data?.biaya || []).filter((b: any) => b.type === 'obat').map((b: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-3.5 rounded-xl border border-[#EADDC9]">
                            <div>
                              <div className="text-xs font-bold text-[#3C3530]/90">{b.nama || 'Obat/Vaksin'}</div>
                              <div className="text-[9px] text-[#3C3530]/60 mt-0.5 font-bold font-mono">{b.keterangan || 'Tanpa Keterangan'} · {b.tgl}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#859681] font-mono">{formatRp(b.total)}</span>
                              <button onClick={() => handleDeleteListItem('biaya', (activeCycle.data?.biaya || []).indexOf(b))} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-1">✕</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openModalForm('modal_obat')}
                    className="w-full mt-6 py-2.5 bg-[#FAF7F0] hover:bg-[#EADDC9] text-[#859681] text-xs font-bold rounded-xl border border-[#EADDC9] transition-all"
                  >
                    + Tambah Obat
                  </button>
                </div>

                {/* Lain */}
                <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl flex flex-col justify-between hover:border-[#EADDC9] transition-colors">
                  <div>
                    <h4 className="font-bold text-[#3C3530] mb-4 flex items-center justify-between">
                      <span>📦 Biaya Lain</span>
                      <span className="text-[10px] px-2 py-0.5 bg-[#859681]/15 text-[#859681] rounded-md font-mono">
                        {((activeCycle.data?.biaya || []).filter((b: any) => b.type === 'lain').length)} Catatan
                      </span>
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                      {(activeCycle.data?.biaya || []).filter((b: any) => b.type === 'lain').length === 0 ? (
                        <div className="text-center py-10 text-xs text-[#3C3530]/50 font-bold">Belum ada catatan biaya lain.</div>
                      ) : (
                        (activeCycle.data?.biaya || []).filter((b: any) => b.type === 'lain').map((b: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-3.5 rounded-xl border border-[#EADDC9]">
                            <div>
                              <div className="text-xs font-bold text-[#3C3530]/90">{b.nama || 'Biaya Lain'}</div>
                              <div className="text-[9px] text-[#3C3530]/60 mt-0.5 font-bold font-mono">{b.keterangan || 'Tanpa Keterangan'} · {b.tgl}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#859681] font-mono">{formatRp(b.total)}</span>
                              <button onClick={() => handleDeleteListItem('biaya', (activeCycle.data?.biaya || []).indexOf(b))} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-1">✕</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openModalForm('modal_lain')}
                    className="w-full mt-6 py-2.5 bg-[#FAF7F0] hover:bg-[#EADDC9] text-[#859681] text-xs font-bold rounded-xl border border-[#EADDC9] transition-all"
                  >
                    + Tambah Biaya
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl max-w-xl mx-auto">
                <h4 className="font-bold text-[#3C3530] mb-4 flex items-center justify-between">
                  <span>🌿 Biaya Operasional</span>
                  <span className="text-[10px] px-2 py-0.5 bg-[#859681]/15 text-[#859681] rounded-md font-mono">
                    {(activeCycle.data?.biaya || []).length} Catatan
                  </span>
                </h4>
                <div className="space-y-3">
                  {(activeCycle.data?.biaya || []).length === 0 ? (
                    <div className="text-center py-10 text-[#3C3530]/60 text-sm">Belum ada biaya operasional dicatat.</div>
                  ) : (
                    (activeCycle.data?.biaya || []).map((b: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] font-mono">
                        <div>
                          <div className="text-xs font-bold text-[#3C3530] font-sans">{b.nama || b.type}</div>
                          <div className="text-[10px] text-[#3C3530]/60 mt-1 font-bold">Jenis: <strong className="uppercase text-[#859681]">{b.type}</strong> · Vol: {b.kg || 0} kg · {b.tgl}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#859681]">{formatRp(b.total)}</span>
                          <button onClick={() => handleDeleteListItem('biaya', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-2">✕</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => openModalForm(activeCycle.mode === 'susu' ? 'modal_biaya_susu' : 'modal_biaya_ruminansia')}
                  className="w-full mt-6 py-3 bg-[#FAF7F0] hover:bg-[#EADDC9] text-[#859681] text-xs font-bold rounded-xl border border-[#EADDC9] transition-all"
                >
                  + Tambah Biaya Operasional
                </button>
              </div>
            )}

            {/* Kategori SDM & Utilitas */}
            <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl mt-6">
              <h4 className="font-bold text-[#3C3530] mb-4 flex items-center gap-2">
                <span>⚡ SDM & Utilitas</span>
                <span className="text-[10px] text-[#3C3530]/65 font-normal font-sans">Biaya operasional siklus</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#3C3530]/80 block uppercase tracking-wider">Biaya Tenaga Kerja (Rp/Hari)</label>
                  <input
                    type="number"
                    value={activeCycle.data?.modal?.biaya_tk_harian || '0'}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), biaya_tk_harian: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                  />
                </div>
                
                {/* Listrik Input */}
                {!(activeCycle.mode === 'ikan_pembesaran' || activeCycle.mode === 'ikan_pembibitan') ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#3C3530]/80 block uppercase tracking-wider">Biaya Listrik (Rp/Siklus)</label>
                    <input
                      type="number"
                      value={activeCycle.data?.modal?.biaya_listrik || '0'}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), biaya_listrik: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#3C3530]/80 block uppercase tracking-wider">Tarif Listrik (Rp/kWh)</label>
                    <input
                      type="number"
                      value={activeCycle.data?.modal?.aerasi_tarif || '1450'}
                      onChange={(e) => {
                        const modal = { ...(activeCycle.data?.modal || {}), aerasi_tarif: e.target.value };
                        handleSaveCycleData({ ...activeCycle.data, modal });
                      }}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                    />
                  </div>
                )}

                {/* Air Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#3C3530]/80 block uppercase tracking-wider">Biaya Air (Rp/Siklus)</label>
                  <input
                    type="number"
                    value={activeCycle.data?.modal?.biaya_air || '0'}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), biaya_air: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                  />
                </div>
              </div>

              {/* Khusus Bioflok / RAS Ikan */}
              {(activeCycle.mode === 'ikan_pembesaran' || activeCycle.mode === 'ikan_pembibitan') && (
                <div className="mt-4 pt-4 border-t border-[#EADDC9] space-y-4">
                  <span className="text-[10px] font-black text-[#859681] uppercase tracking-widest block">🔧 Input Tambahan Sistem {(activeCycle.data?.modal?.sistem_kolam || 'konvensional').toUpperCase()}</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {((activeCycle.data?.modal?.sistem_kolam === 'bioflok' || activeCycle.data?.modal?.sistem_kolam === 'RAS')) && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-[#3C3530]/80 block uppercase tracking-wider">Daya Kipas/Aerasi (Watt)</label>
                          <input
                            type="number"
                            value={activeCycle.data?.modal?.aerasi_watt || '100'}
                            onChange={(e) => {
                              const modal = { ...(activeCycle.data?.modal || {}), aerasi_watt: e.target.value };
                              handleSaveCycleData({ ...activeCycle.data, modal });
                            }}
                            className="w-full bg-[#FAF7F0]/80 border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-[#3C3530]/80 block uppercase tracking-wider">Durasi Aerasi (Jam/Hari)</label>
                          <input
                            type="number"
                            value={activeCycle.data?.modal?.aerasi_jam || '24'}
                            onChange={(e) => {
                              const modal = { ...(activeCycle.data?.modal || {}), aerasi_jam: e.target.value };
                              handleSaveCycleData({ ...activeCycle.data, modal });
                            }}
                            className="w-full bg-[#FAF7F0]/80 border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold font-mono"
                          />
                        </div>
                        <div className="p-3.5 bg-[#859681]/5 rounded-xl border border-[#859681]/10 text-[10px] text-[#859681] font-bold flex flex-col justify-center font-mono">
                          <div className="flex justify-between">
                            <span>Estimasi Listrik:</span>
                            <span>
                              {formatRp(
                                ((parseFloat(activeCycle.data?.modal?.aerasi_watt) || 100) / 1000) *
                                  (parseFloat(activeCycle.data?.modal?.aerasi_jam) || 24) *
                                  (parseFloat(activeCycle.data?.modal?.aerasi_tarif) || 1450)
                              )} / hari
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {activeCycle.data?.modal?.sistem_kolam === 'bioflok' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[#3C3530]/80 block uppercase tracking-wider">Biaya Molase & Probiotik Rutin (Rp)</label>
                        <input
                          type="number"
                          value={activeCycle.data?.modal?.biaya_molase_probiotik || '0'}
                          onChange={(e) => {
                            const modal = { ...(activeCycle.data?.modal || {}), biaya_molase_probiotik: e.target.value };
                            handleSaveCycleData({ ...activeCycle.data, modal });
                          }}
                          className="w-full bg-[#FAF7F0]/80 border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold"
                        />
                      </div>
                    )}

                    {activeCycle.data?.modal?.sistem_kolam === 'RAS' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-[#3C3530]/80 block uppercase tracking-wider">Biaya Filter & Media Biofilter (Rp)</label>
                        <input
                          type="number"
                          value={activeCycle.data?.modal?.biaya_filter_media || '0'}
                          onChange={(e) => {
                            const modal = { ...(activeCycle.data?.modal || {}), biaya_filter_media: e.target.value };
                            handleSaveCycleData({ ...activeCycle.data, modal });
                          }}
                          className="w-full bg-[#FAF7F0]/80 border border-[#EADDC9] focus:border-teal-555 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: PANEN / PRODUKSI --- */}
        {activeTab === 'panen' && (
          <div className="max-w-xl mx-auto bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-[#3C3530] flex items-center justify-between font-sans">
              <span>{activeCycle.mode === 'susu' ? '🥛 Produksi Susu Harian' : activeCycle.mode === 'petelur' ? '🥚 Produksi Telur Harian' : '🎯 Data Panen/Jual'}</span>
              <span className="text-[10px] px-2.5 py-0.5 bg-[#859681]/15 text-[#859681] rounded-md font-mono font-bold">
                {(activeCycle.mode === 'susu' || activeCycle.mode === 'petelur' ? (activeCycle.data?.harian || []).length : (activeCycle.data?.panen || []).length)} Catatan
              </span>
            </h3>

            <div className="space-y-3">
              {activeCycle.mode === 'broiler' && (
                <>
                  {(activeCycle.data?.panen || []).length === 0 ? (
                    <div className="text-center py-10 text-[#3C3530]/60 text-xs">Belum ada data panen broiler dicatat.</div>
                  ) : (
                    (activeCycle.data?.panen || []).map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] font-mono">
                        <div>
                          <div className="text-xs font-bold text-[#3C3530] font-sans">{p.tgl} — {p.kg.toLocaleString('id-ID')} kg</div>
                          <div className="text-[10px] text-[#3C3530]/65 mt-1 font-bold">Harga: {formatRp(p.harga_kg)}/kg · Mati: {p.jml_mati || 0} ekor</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#859681]">{formatRp(p.kg * p.harga_kg)}</span>
                          <button onClick={() => handleDeleteListItem('panen', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-2">✕</button>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_panen_broiler')}
                    className="w-full mt-6 py-3 bg-[#FAF7F0] hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
                  >
                    + Catat Panen Broiler
                  </button>
                </>
              )}

              {activeCycle.mode === 'petelur' && (
                <>
                  {(activeCycle.data?.harian || []).length === 0 ? (
                    <div className="text-center py-10 text-[#3C3530]/60 text-xs">Belum ada data harian produksi telur.</div>
                  ) : (
                    (activeCycle.data?.harian || []).map((h: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] font-mono">
                        <div>
                          <div className="text-xs font-bold text-[#3C3530] font-sans">{h.tgl}</div>
                          <div className="text-[10px] text-[#3C3530]/60 mt-1 font-bold">Telur: {h.butir} butir · Berat: {h.kg || 0} kg · Retak: {h.retak || 0} butir</div>
                        </div>
                        <button onClick={() => handleDeleteListItem('harian', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-2">✕</button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_harian_petelur')}
                    className="w-full mt-6 py-3 bg-[#FAF7F0]/40 hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
                  >
                    + Catat Produksi Harian
                  </button>
                </>
              )}

              {activeCycle.mode === 'pembibitan_unggas' && (
                <>
                  {(activeCycle.data?.penetasan || []).length === 0 ? (
                    <div className="text-center py-10 text-[#3C3530]/60 text-xs">Belum ada data penetasan.</div>
                  ) : (
                    (activeCycle.data?.penetasan || []).map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] font-mono">
                        <div>
                          <div className="text-xs font-bold text-[#3C3530] font-sans">Menetas: {p.tgl}</div>
                          <div className="text-[10px] text-[#3C3530]/65 mt-1 font-bold">Berhasil: <strong className="text-[#859681]">{p.berhasil} DOC</strong> · Gagal: {p.gagal} butir</div>
                        </div>
                        <button onClick={() => handleDeleteListItem('penetasan', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-2">✕</button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_penetasan')}
                    className="w-full mt-6 py-3 bg-[#FAF7F0]/40 hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
                  >
                    + Catat Penetasan Telur
                  </button>
                </>
              )}

              {activeCycle.mode === 'penggemukan' && (
                <>
                  {(activeCycle.data?.panen || []).length === 0 ? (
                    <div className="text-center py-10 text-[#3C3530]/60 text-xs">Belum ada penjualan penggemukan.</div>
                  ) : (
                    (activeCycle.data?.panen || []).map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] font-mono">
                        <div>
                          <div className="text-xs font-bold text-[#3C3530] font-sans">{p.tgl} — {p.jml_jual} Ekor</div>
                          <div className="text-[10px] text-[#3C3530]/60 mt-1 font-bold">BB Rata: {p.bb_akhir} kg · Harga: {formatRp(p.harga_kg)}/kg · Kematian: {p.jml_mati || 0}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#859681]">{formatRp(p.jml_jual * p.bb_akhir * p.harga_kg)}</span>
                          <button onClick={() => handleDeleteListItem('panen', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-2">✕</button>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_panen_penggemukan')}
                    className="w-full mt-6 py-3 bg-[#FAF7F0]/40 hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
                  >
                    + Catat Penjualan Penggemukan
                  </button>
                </>
              )}

              {activeCycle.mode === 'susu' && (
                <>
                  {(activeCycle.data?.harian || []).length === 0 ? (
                    <div className="text-center py-10 text-[#3C3530]/60 text-xs">Belum ada data produksi susu.</div>
                  ) : (
                    (activeCycle.data?.harian || []).map((h: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] font-mono">
                        <div>
                          <div className="text-xs font-bold text-[#3C3530] font-sans">{h.tgl}</div>
                          <div className="text-[10px] text-[#3C3530]/60 mt-1 font-bold">Total Produksi Susu: <strong className="text-[#859681]">{h.liter} L</strong></div>
                        </div>
                        <button onClick={() => handleDeleteListItem('harian', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-2">✕</button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_harian_susu')}
                    className="w-full mt-6 py-3 bg-[#FAF7F0]/40 hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
                  >
                    + Catat Produksi Harian Susu
                  </button>
                </>
              )}

              {activeCycle.mode === 'breeding_ruminansia' && (
                <>
                  <button
                    onClick={() => openModalForm('modal_harian_breeding')}
                    className="w-full mt-6 py-3 bg-[#FAF7F0]/40 hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
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
          <div className="max-w-xl mx-auto bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-[#3C3530] flex items-center justify-between">
              <span>💰 Catat Penjualan Hasil Produksi</span>
              <span className="text-[10px] px-2.5 py-0.5 bg-[#859681]/15 text-[#859681] rounded-md font-mono font-bold">
                {(activeCycle.data?.penjualan || []).length} Transaksi
              </span>
            </h3>

            <div className="space-y-3 font-mono">
              {(activeCycle.data?.penjualan || []).length === 0 ? (
                <div className="text-center py-10 text-[#3C3530]/60 text-xs font-sans">Belum ada transaksi penjualan dicatat.</div>
              ) : (
                (activeCycle.data?.penjualan || []).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9]">
                    <div>
                      <div className="text-xs font-bold text-[#3C3530] font-sans">{p.tgl} {p.tipe || p.kategori ? `— ${p.tipe || p.kategori}` : ''}</div>
                      <div className="text-[10px] text-[#3C3530]/60 mt-1 font-bold">
                        {p.kg ? `Vol: ${p.kg} kg · Harga: ${formatRp(p.harga_kg)}/kg` : p.liter ? `Vol: ${p.liter} L · Harga: ${formatRp(p.harga_liter)}/L` : `Qty: ${p.jml} ekor · Harga: ${formatRp(p.harga_ekor)}/ekor`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#859681]">{formatRp(p.total)}</span>
                      <button onClick={() => handleDeleteListItem('penjualan', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-2">✕</button>
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
              className="w-full mt-6 py-3 bg-[#FAF7F0]/40 hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
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
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6">
                <h3 className="text-lg font-bold text-[#3C3530] flex items-center gap-2">
                  <span>📈</span> Simulasi Laba Berdasarkan Harga Jual
                </h3>
                <p className="text-xs text-[#3C3530]/80">Geser slider di bawah ini untuk melihat perkiraan laba jika terjadi perubahan harga pasar.</p>
                
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
                      <div className="flex justify-between items-center text-xs font-bold text-[#3C3530]/90">
                        <span>Harga Simulasi:</span>
                        <span className="text-[#859681] font-extrabold text-sm">Rp {currentHarga.toLocaleString('id-ID')} / {activeCycle.mode === 'susu' ? 'Liter' : activeCycle.mode === 'petelur' ? 'Kg' : 'Kg BB'}</span>
                      </div>
                      <input
                        type="range"
                        min={minVal}
                        max={maxVal}
                        step={stepVal}
                        value={currentHarga}
                        onChange={(e) => setSimHarga(parseInt(e.target.value))}
                        className="w-full h-1 bg-[#EADDC9] rounded-lg appearance-none cursor-pointer accent-[#859681]"
                      />
                      {/* BEP / HPP Info Reference */}
                      {stats && (
                        <div className="bg-[#FAF7F0] border border-[#EADDC9] p-4 rounded-2xl text-xs font-semibold text-[#3C3530]/90 font-mono space-y-1.5 mt-2">
                          <div className="flex justify-between">
                            <span className="text-[#3C3530]/80">Harga Simulasi:</span>
                            <span className="text-[#3C3530] font-bold">Rp {currentHarga.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between border-b border-[#EADDC9] pb-1.5">
                            <span className="text-[#3C3530]/80">HPP / Titik BEP (Akurat):</span>
                            <span className="text-[#859681] font-bold">Rp {Math.round(stats.bepHarga || stats.hppAkurat || 0).toLocaleString('id-ID')}</span>
                          </div>
                          {(() => {
                            const bepHarga = stats.bepHarga || stats.hppAkurat || 0;
                            const margin = currentHarga - bepHarga;
                            const marginPct = bepHarga > 0 ? (margin / bepHarga) * 100 : 0;
                            return (
                              <div className="flex justify-between pt-0.5">
                                <span className="text-[#3C3530]/80">Estimasi Margin:</span>
                                <span className={margin >= 0 ? 'text-[#4D5D4A] font-bold' : 'text-[#A76A57] font-bold'}>
                                  Rp {Math.round(margin).toLocaleString('id-ID')} ({marginPct.toFixed(1)}%)
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9]">
                          <span className="text-[10px] font-bold text-[#3C3530]/60 uppercase tracking-wider block mb-1">Total Pendapatan (Simulasi)</span>
                          <span className="text-sm font-black text-[#3C3530]">Rp {totalPendapatan.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9]">
                          <span className="text-[10px] font-bold text-[#3C3530]/60 uppercase tracking-wider block mb-1">Laba Bersih (Simulasi)</span>
                          <span className={`text-sm font-black ${labaSim >= 0 ? 'text-[#859681]' : 'text-[#A76A57]'}`}>Rp {labaSim.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Benchmark Standar Strain (Modul 09) */}
              {(activeCycle.mode === 'broiler' || activeCycle.mode === 'petelur' || activeCycle.mode === 'bebek_petelur') && stats && (
                <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6">
                  <h3 className="text-lg font-bold text-[#3C3530] flex items-center gap-2">
                    <span>📊</span> Perbandingan Standar Performa ({activeCycle.mode === 'broiler' ? 'Cobb 500' : 'Lohmann Brown'})
                  </h3>
                  <p className="text-xs text-[#3C3530]/80">
                    Bandingkan pencapaian performa aktual peternakan Anda dengan standar genetik global pada umur saat ini (<strong className="text-white">{stats.umur} hari</strong>).
                  </p>

                  <div className="space-y-4">
                    {activeCycle.mode === 'broiler' ? (
                      <>
                        {/* BB Rata */}
                        <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#3C3530]/80 font-bold">Bobot Badan (BB) Rata-rata</span>
                            <span className="font-mono text-[#3C3530]/90 text-[10px]">
                              Target Cobb: <strong className="text-white">{(stats.targetBB || 0).toFixed(3)} kg</strong>
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline flex-wrap gap-2 pt-1 border-t border-[#EADDC9]/60">
                            <strong className="text-2xl font-black font-mono text-[#3C3530]">{(stats.bbRata || 0).toFixed(3)} kg</strong>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg font-mono ${
                              stats.gapBBPct >= -5 ? 'bg-[#859681]/15 text-[#4D5D4A] border-[#859681]/20' : stats.gapBBPct >= -15 ? 'bg-[#EADDC9]/35 text-[#3C3530]/90 border border-[#EADDC9]/50' : 'bg-[#A76A57]/15 text-[#A76A57] border border-[#A76A57]/20'
                            }`}>
                              {stats.gapBB >= 0 ? '+' : ''}{(stats.gapBB || 0).toFixed(3)} kg ({stats.gapBBPct >= 0 ? '+' : ''}{(stats.gapBBPct || 0).toFixed(1)}%)
                            </span>
                          </div>
                          <span className="text-[9px] text-[#3C3530]/60 block leading-relaxed font-semibold">
                            *Status: {stats.gapBBPct >= -5 ? '🟢 Optimal (Sesuai/Melebihi standar)' : stats.gapBBPct >= -15 ? '🟡 Deviasi Ringan (Cek kecukupan pakan & suhu)' : '🔴 Deviasi Kritis (Evaluasi gejala penyakit atau stres)'}
                          </span>
                        </div>

                        {/* FCR */}
                        <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#3C3530]/80 font-bold">Rasio Konversi Pakan (FCR)</span>
                            <span className="font-mono text-[#3C3530]/90 text-[10px]">
                              Target Cobb: <strong className="text-white">{(stats.targetFCR || 0).toFixed(2)}</strong>
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline flex-wrap gap-2 pt-1 border-t border-[#EADDC9]/60">
                            <strong className="text-2xl font-black font-mono text-[#3C3530]">{(stats.fcr || 0).toFixed(2)}</strong>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg font-mono ${
                              stats.gapFCRPct <= 5 ? 'bg-[#859681]/15 text-[#4D5D4A] border-[#859681]/20' : stats.gapFCRPct <= 15 ? 'bg-[#EADDC9]/35 text-[#3C3530]/90 border border-[#EADDC9]/50' : 'bg-[#A76A57]/15 text-[#A76A57] border border-[#A76A57]/20'
                            }`}>
                              {stats.gapFCR >= 0 ? '+' : ''}{(stats.gapFCR || 0).toFixed(2)} ({stats.gapFCRPct >= 0 ? '+' : ''}{(stats.gapFCRPct || 0).toFixed(1)}%)
                            </span>
                          </div>
                          <span className="text-[9px] text-[#3C3530]/65 block leading-relaxed font-semibold">
                            *Catatan FCR: Semakin kecil angka FCR, semakin baik dan efisien penggunaan pakan.
                          </span>
                        </div>

                        {/* ADG */}
                        <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#3C3530]/80 font-bold">Average Daily Gain (ADG)</span>
                            <span className="font-mono text-[#3C3530]/80 text-[10px]">
                              Target Cobb: <strong className="text-white">{(stats.targetADG || 0).toFixed(0)} g/hari</strong>
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline flex-wrap gap-2 pt-1 border-t border-[#EADDC9]/60">
                            <strong className="text-2xl font-black font-mono text-[#3C3530]">{(stats.adg || 0).toFixed(1)} g/hari</strong>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg font-mono ${
                              stats.gapADGPct >= -5 ? 'bg-[#859681]/15 text-[#4D5D4A] border-[#859681]/20' : stats.gapADGPct >= -15 ? 'bg-[#EADDC9]/35 text-[#3C3530]/90 border border-[#EADDC9]/50' : 'bg-[#A76A57]/15 text-[#A76A57] border border-[#A76A57]/20'
                            }`}>
                              {stats.gapADG >= 0 ? '+' : ''}{(stats.gapADG || 0).toFixed(1)} g ({stats.gapADGPct >= 0 ? '+' : ''}{(stats.gapADGPct || 0).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* HDP */}
                        <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#3C3530]/80 font-bold">{activeCycle.mode === 'bebek_petelur' ? 'Duck-Day' : 'Hen-Day'} Production (HDP)</span>
                            <span className="font-mono text-[#3C3530]/80 text-[10px]">
                              Target Lohmann: <strong className="text-white">{stats.targetHDP}%</strong>
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline flex-wrap gap-2 pt-1 border-t border-[#EADDC9]/60">
                            <strong className="text-2xl font-black font-mono text-[#3C3530]">{(stats.henDay || 0).toFixed(1)}%</strong>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg font-mono ${
                              stats.gapHDP >= -5 ? 'bg-[#859681]/15 text-[#4D5D4A] border-[#859681]/20' : stats.gapHDP >= -15 ? 'bg-[#EADDC9]/35 text-[#3C3530]/90 border border-[#EADDC9]/50' : 'bg-[#A76A57]/15 text-[#A76A57] border border-[#A76A57]/20'
                            }`}>
                              {stats.gapHDP >= 0 ? '+' : ''}{(stats.gapHDP || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* FCR */}
                        <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#3C3530]/80 font-bold">FCR Telur</span>
                            <span className="font-mono text-[#3C3530]/80 text-[10px]">
                              Target Lohmann: <strong className="text-white">{stats.targetFCRTelur}</strong>
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline flex-wrap gap-2 pt-1 border-t border-[#EADDC9]/60">
                            <strong className="text-2xl font-black font-mono text-[#3C3530]">{(stats.fcrTelur || 0).toFixed(2)}</strong>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg font-mono ${
                              stats.gapFCRTelur <= 0.1 ? 'bg-[#859681]/15 text-[#4D5D4A] border-[#859681]/20' : stats.gapFCRTelur <= 0.3 ? 'bg-[#EADDC9]/35 text-[#3C3530]/90 border border-[#EADDC9]/50' : 'bg-[#A76A57]/15 text-[#A76A57] border border-[#A76A57]/20'
                            }`}>
                              {stats.gapFCRTelur >= 0 ? '+' : ''}{(stats.gapFCRTelur || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Berat Rata Telur */}
                        <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#3C3530]/80 font-bold">Berat Rata-rata Telur</span>
                            <span className="font-mono text-[#3C3530]/80 text-[10px]">
                              Target Lohmann: <strong className="text-white">{stats.targetBeratTelur} g</strong>
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline flex-wrap gap-2 pt-1 border-t border-[#EADDC9]/60">
                            <strong className="text-2xl font-black font-mono text-[#3C3530]">{(stats.beratRataTelur || 0).toFixed(1)} g</strong>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg font-mono ${
                              stats.gapBeratTelur >= -2 ? 'bg-[#859681]/15 text-[#4D5D4A] border-[#859681]/20' : stats.gapBeratTelur >= -5 ? 'bg-[#EADDC9]/35 text-[#3C3530]/90 border border-[#EADDC9]/50' : 'bg-[#A76A57]/15 text-[#A76A57] border border-[#A76A57]/20'
                            }`}>
                              {stats.gapBeratTelur >= 0 ? '+' : ''}{(stats.gapBeratTelur || 0).toFixed(1)} g
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <span className="text-[9px] text-[#3C3530]/60 block leading-relaxed font-semibold">
                    *Disclaimer: Standar rujukan performa didasarkan pada Cobb 500 Performance Guide & Lohmann Brown Layer Management Guide.
                  </span>
                </div>
              )}

              {/* Kalkulator Kapasitas Kandang / Kolam (Modul 10) */}
              {stats && (
                <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6">
                  <h3 className="text-lg font-bold text-[#3C3530] flex items-center gap-2">
                    <span>🏠</span> Kalkulator Kapasitas Kandang & Kolam
                  </h3>
                  <p className="text-xs text-[#3C3530]/80">
                    Analisis kepadatan populasi ternak aktual vs kapasitas ideal berdasarkan prinsip animal welfare standar industri.
                  </p>

                  {(() => {
                    const m = activeCycle.data?.modal || {};
                    const panjang = parseFloat(m.panjang_m) || 0;
                    const lebar = parseFloat(m.lebar_m) || 0;
                    const tinggiAir = parseFloat(m.tinggi_air_m) || 1.0;
                    const luas_m2 = panjang * lebar;
                    const volume_m3 = luas_m2 * tinggiAir;
                    
                    const isFish = activeCycle.mode === 'ikan_pembesaran' || activeCycle.mode === 'ikan_pembibitan';
                    const autoKey = getKepadatanKey(activeCycle);
                    const kKey = overrideKepadatanKey || autoKey || 'broiler_komersil';
                    const std = KEPADATAN_STANDAR[kKey];

                    const currentPop = isFish
                      ? (parseFloat(m.jml_tebar) || 0) - (stats.mati || 0)
                      : (activeCycle.mode === 'breeding_ruminansia')
                      ? (parseFloat(m.jml_betina) || 0) + (parseFloat(m.jml_jantan) || 0) + (stats.totalLahir || 0)
                      : (parseFloat(m.jml_doc) || parseFloat(m.jml_ekor) || 0) - (stats.mati || 0);

                    const isBaterai = kKey === 'petelur_baterai';
                    
                    let kapasitasIdeal = 0;
                    let kapasitasWelfare = 0;
                    let densitasAktual = 0;
                    let densitasIdeal = 0;
                    let densitasWelfare = 0;
                    let rasio = 0;

                    if (!isBaterai && std) {
                      if (std.per_m3 !== undefined && std.per_m3 !== null) {
                        kapasitasIdeal = Math.round(volume_m3 * (std.per_m3 || 0));
                        kapasitasWelfare = Math.round(volume_m3 * (std.welfare || 0));
                        densitasAktual = volume_m3 > 0 ? currentPop / volume_m3 : 0;
                        densitasIdeal = std.per_m3 || 0;
                        densitasWelfare = std.welfare || 0;
                      } else {
                        kapasitasIdeal = Math.round(luas_m2 * (std.per_m2 || 0));
                        kapasitasWelfare = Math.round(luas_m2 * (std.welfare || 0));
                        densitasAktual = luas_m2 > 0 ? currentPop / luas_m2 : 0;
                        densitasIdeal = std.per_m2 || 0;
                        densitasWelfare = std.welfare || 0;
                      }
                      rasio = kapasitasIdeal > 0 ? currentPop / kapasitasIdeal : 0;
                    }

                    let statusLabel = 'Optimal';
                    let statusColor = 'text-[#4D5D4A] bg-[#859681]/15 border-emerald-500/20';
                    let statusIcon = '🟢';
                    
                    if (rasio <= 0.85) {
                      statusLabel = 'Under-stocked';
                      statusColor = 'text-sky-400 bg-sky-500/10 border-sky-500/20';
                      statusIcon = '🔵';
                    } else if (rasio <= 1.0) {
                      statusLabel = 'Optimal';
                      statusColor = 'text-[#4D5D4A] bg-[#859681]/15 border-emerald-500/20';
                      statusIcon = '🟢';
                    } else if (rasio <= 1.15) {
                      statusLabel = 'Sedikit Padat';
                      statusColor = 'text-[#3C3530]/90 bg-[#EADDC9]/35 border-[#EADDC9]/50';
                      statusIcon = '🟡';
                    } else {
                      statusLabel = 'Over-stocked ⚠️';
                      statusColor = 'text-[#A76A57] bg-[#A76A57]/15 border-[#A76A57]/20 animate-pulse';
                      statusIcon = '🔴';
                    }

                    return (
                      <div className="space-y-4">
                        {/* Dimensi Alert if length/width is 0 */}
                        {(panjang <= 0 || lebar <= 0) && (
                          <div className="bg-[#EADDC9]/35 border border-[#EADDC9]/50 text-[#3C3530]/90 p-4 rounded-2xl text-xs font-semibold">
                            ⚠️ <strong>Dimensi Belum Diisi:</strong> Panjang atau Lebar kandang masih bernilai 0. Silakan isi dimensi kandang Anda di tab <strong>Modal Awal</strong> agar kalkulator kapasitas dapat menghitung secara akurat.
                          </div>
                        )}

                        {/* Over-stocked warning */}
                        {!isBaterai && rasio > 1.15 && (
                          <div className="bg-rose-500/15 border border-rose-500/30 text-[#A76A57] p-4 rounded-2xl text-xs font-semibold leading-relaxed space-y-1">
                            <span className="font-bold text-sm block">⚠️ Bahaya Kepadatan Tinggi (Over-stocked):</span>
                            <span>Kepadatan aktual kandang Anda melebihi batas toleransi ideal sebesar <strong className="text-white">{(rasio * 100 - 100).toFixed(0)}%</strong>. Kepadatan yang terlalu tinggi dapat memicu:</span>
                            <ul className="list-disc pl-4 space-y-0.5 mt-1 text-[#3C3530]/90">
                              <li>Stress panas (heat stress) dan peningkatan kanibalisme.</li>
                              <li>Penurunan efisiensi penyerapan pakan (FCR membengkak).</li>
                              <li>Sirkulasi udara memburuk, amonia naik, dan mempermudah penularan penyakit.</li>
                            </ul>
                          </div>
                        )}

                        {/* Dropdown System Selector */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Tipe Sistem Kepadatan</label>
                            <select
                              value={kKey}
                              onChange={(e) => setOverrideKepadatanKey(e.target.value)}
                              className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-[#3C3530] font-semibold cursor-pointer font-sans"
                            >
                              <optgroup label="Unggas (Poultry)" className="bg-[#FCFAF6] text-[#3C3530]/75 font-sans">
                                <option value="broiler_komersil" className="text-[#3C3530] bg-[#FCFAF6]">Broiler Skala Komersil</option>
                                <option value="broiler_welfare" className="text-[#3C3530] bg-[#FCFAF6]">Broiler Skala Welfare</option>
                                <option value="petelur_lantai" className="text-[#3C3530] bg-[#FCFAF6]">Ayam Petelur Lantai (Free-range/Postal)</option>
                                <option value="petelur_baterai" className="text-[#3C3530] bg-[#FCFAF6]">Ayam Petelur Baterai (Kandang Sekat)</option>
                                <option value="bebek_pedaging" className="text-[#3C3530] bg-[#FCFAF6]">Bebek Pedaging</option>
                                <option value="bebek_petelur" className="text-[#3C3530] bg-[#FCFAF6]">Bebek Petelur</option>
                              </optgroup>
                              <optgroup label="Ruminansia" className="bg-[#FCFAF6] text-[#3C3530]/75 font-sans">
                                <option value="kambing" className="text-[#3C3530] bg-[#FCFAF6]">Kambing / Domba</option>
                                <option value="sapi" className="text-[#3C3530] bg-[#FCFAF6]">Sapi Potong / Perah</option>
                              </optgroup>
                              <optgroup label="Perikanan" className="bg-[#FCFAF6] text-[#3C3530]/75 font-sans">
                                <option value="lele_konvensional" className="text-[#3C3530] bg-[#FCFAF6]">Lele Konvensional</option>
                                <option value="lele_bioflok" className="text-[#3C3530] bg-[#FCFAF6]">Lele Bioflok</option>
                                <option value="nila_konvensional" className="text-[#3C3530] bg-[#FCFAF6]">Nila Konvensional</option>
                                <option value="nila_bioflok" className="text-[#3C3530] bg-[#FCFAF6]">Nila Bioflok</option>
                              </optgroup>
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Status Kepadatan Aktual</label>
                            <div className={`w-full border rounded-xl px-4 py-2.5 text-xs font-black flex items-center justify-between font-sans ${statusColor}`}>
                              <span>Status: {statusLabel}</span>
                              <span className="text-sm">{statusIcon}</span>
                            </div>
                          </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#EADDC9]">
                            <span className="text-[9px] font-bold text-[#3C3530]/60 uppercase tracking-wider block mb-1">Dimensi Luas</span>
                            <span className="text-xs font-black text-[#3C3530] font-mono">{panjang.toFixed(1)}m × {lebar.toFixed(1)}m = <strong className="text-white">{luas_m2.toFixed(1)} m²</strong></span>
                          </div>
                          <div className="bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#EADDC9]">
                            <span className="text-[9px] font-bold text-[#3C3530]/60 uppercase tracking-wider block mb-1">Dimensi Volume</span>
                            <span className="text-xs font-black text-[#3C3530] font-mono">{luas_m2.toFixed(1)}m² × {tinggiAir.toFixed(1)}m = <strong className="text-white">{volume_m3.toFixed(1)} m³</strong></span>
                          </div>
                          <div className="bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#EADDC9]">
                            <span className="text-[9px] font-bold text-[#3C3530]/60 uppercase tracking-wider block mb-1">Populasi Saat Ini</span>
                            <span className="text-xs font-black text-[#3C3530] font-mono"><strong className="text-white">{currentPop.toLocaleString('id-ID')}</strong> ekor</span>
                          </div>
                        </div>

                        {/* Analysis Box */}
                        {!isBaterai && std ? (
                          <div className="bg-[#0c1a1f] border border-[#859681]/10 p-5 rounded-2xl text-xs space-y-2">
                            <span className="text-[10px] font-black text-[#859681] uppercase tracking-widest block mb-2">📋 Hasil Analisis Kepadatan</span>
                            <div className="flex justify-between items-center text-[#3C3530]/90 font-semibold py-1 border-b border-[#EADDC9] font-sans">
                              <span>Kapasitas Ideal ({std.per_m3 !== undefined && std.per_m3 !== null ? `${std.per_m3} ekor/m³` : `${std.per_m2} ekor/m²`}):</span>
                              <span className="text-white font-extrabold font-mono text-sm">{kapasitasIdeal.toLocaleString('id-ID')} ekor</span>
                            </div>
                            <div className="flex justify-between items-center text-[#3C3530]/90 font-semibold py-1 border-b border-[#EADDC9] font-sans">
                              <span>Kapasitas Welfare ({std.welfare ? `${std.welfare} ekor/${std.satuan.includes('m³') ? 'm³' : 'm²'}` : 'N/A'}):</span>
                              <span className="text-[#859681] font-extrabold font-mono text-sm">{kapasitasWelfare.toLocaleString('id-ID')} ekor</span>
                            </div>
                            <div className="flex justify-between items-center text-[#3C3530]/90 font-semibold py-1 font-sans">
                              <span>Kepadatan Aktual Sekarang:</span>
                              <span className={`font-extrabold font-mono text-sm ${rasio > 1.15 ? 'text-[#A76A57]' : 'text-[#3C3530]'}`}>
                                {densitasAktual.toFixed(2)} {std.satuan}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#FAF7F0] p-5 rounded-2xl border border-[#EADDC9] text-xs text-[#3C3530]/80 leading-relaxed font-semibold font-sans">
                            ℹ️ <strong>Kepadatan Baterai (Sekat):</strong> Budidaya menggunakan kandang baterai (individual sekat) tidak dibatasi oleh dimensi meter persegi kandang global, melainkan ditentukan langsung oleh jumlah slot pintu kandang baterai fisik yang Anda pasang.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Pearson Square Feed Formulation */}
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-[#3C3530] flex items-center gap-2">
                    <span>🌾</span> Formulasi Pakan Pearson Square
                  </h3>
                  <span className="px-2.5 py-1 bg-emerald-950/70 text-[#859681] text-[10px] rounded-lg font-bold border-[#859681]/20 uppercase tracking-wider">
                    Premium Feature
                  </span>
                </div>
                <p className="text-xs text-[#3C3530]/80">
                  Formulasikan pencampuran dua bahan baku pakan untuk mencapai target persentase protein kasar secara tepat.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Target Protein (%)</label>
                    <input
                      type="number"
                      value={pearsonTarget}
                      onChange={(e) => setPearsonTarget(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Total Hasil Pakan (kg)</label>
                    <input
                      type="number"
                      value={pearsonTotalKg}
                      onChange={(e) => setPearsonTotalKg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bahan A */}
                  <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] space-y-3">
                    <h4 className="text-xs font-black text-[#859681] uppercase tracking-widest font-sans">Bahan Baku A (Protein Rendah)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Nama Bahan A</label>
                        <input
                          type="text"
                          value={pearsonIngA}
                          onChange={(e) => setPearsonIngA(e.target.value)}
                          className="w-full bg-[#FCFAF6] border border-[#EADDC9] rounded-xl px-3 py-1.5 text-xs text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Kadar Protein (%)</label>
                        <input
                          type="number"
                          value={pearsonProtA}
                          onChange={(e) => setPearsonProtA(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#FCFAF6] border border-[#EADDC9] rounded-xl px-3 py-1.5 text-xs text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] font-semibold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bahan B */}
                  <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] space-y-3">
                    <h4 className="text-xs font-black text-[#859681] uppercase tracking-widest font-sans">Bahan Baku B (Protein Tinggi)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Nama Bahan B</label>
                        <input
                          type="text"
                          value={pearsonIngB}
                          onChange={(e) => setPearsonIngB(e.target.value)}
                          className="w-full bg-[#FCFAF6] border border-[#EADDC9] rounded-xl px-3 py-1.5 text-xs text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Kadar Protein (%)</label>
                        <input
                          type="number"
                          value={pearsonProtB}
                          onChange={(e) => setPearsonProtB(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#FCFAF6] border border-[#EADDC9] rounded-xl px-3 py-1.5 text-xs text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] font-semibold font-mono"
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
                      <div className="bg-[#A76A57]/15 border border-[#A76A57]/20 text-[#A76A57] p-4 rounded-2xl text-xs font-bold">
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
                      <div className="bg-[#FAF7F0]/45 p-6 rounded-2xl border border-[#EADDC9] flex flex-col items-center justify-center relative overflow-hidden font-mono text-xs">
                        <div className="grid grid-cols-3 gap-y-8 gap-x-2 w-full max-w-md items-center text-center relative z-10">
                          {/* Row 1 */}
                          <div className="bg-[#FCFAF6] border border-[#EADDC9] p-2.5 rounded-xl">
                            <span className="block text-[9px] text-[#3C3530]/60 font-sans uppercase font-bold">{pearsonIngA}</span>
                            <strong className="text-[#859681] text-sm">{pA}%</strong>
                          </div>
                          <div className="text-[#3C3530]/50 text-xl font-bold flex items-center justify-center h-full">↘</div>
                          <div className="bg-[#FCFAF6] border border-[#EADDC9] p-2.5 rounded-xl">
                            <span className="block text-[9px] text-[#3C3530]/60 font-sans uppercase font-bold">Bagian {pearsonIngA}</span>
                            <strong className="text-[#3C3530] text-sm">{diffA.toFixed(1)} bag</strong>
                          </div>

                          {/* Row 2 (Center) */}
                          <div />
                          <div className="bg-gradient-to-tr from-teal-905/60 to-emerald-905/60 border border-teal-500/30 p-3 rounded-2xl flex flex-col items-center justify-center aspect-square w-16 mx-auto -my-2 relative shadow-lg shadow-teal-950/40">
                            <span className="text-[8px] text-[#859681] uppercase tracking-widest font-sans font-black">Target</span>
                            <strong className="text-white text-base font-bold">{pTarget}%</strong>
                          </div>
                          <div />

                          {/* Row 3 */}
                          <div className="bg-[#FCFAF6] border border-[#EADDC9] p-2.5 rounded-xl">
                            <span className="block text-[9px] text-[#3C3530]/60 font-sans uppercase font-bold">{pearsonIngB}</span>
                            <strong className="text-[#859681] text-sm">{pB}%</strong>
                          </div>
                          <div className="text-[#3C3530]/50 text-xl font-bold flex items-center justify-center h-full">↗</div>
                          <div className="bg-[#FCFAF6] border border-[#EADDC9] p-2.5 rounded-xl">
                            <span className="block text-[9px] text-[#3C3530]/60 font-sans uppercase font-bold">Bagian {pearsonIngB}</span>
                            <strong className="text-[#3C3530] text-sm">{diffB.toFixed(1)} bag</strong>
                          </div>
                        </div>
                      </div>

                      {/* Recipe Table Card */}
                      <div className="bg-gradient-to-r from-teal-950/20 to-emerald-950/20 p-5 rounded-2xl border border-[#859681]/10">
                        <h4 className="text-xs font-bold text-[#3C3530] mb-4 uppercase tracking-wider font-sans">Hasil Formulasi Pakan</h4>
                        <div className="space-y-3.5 font-mono">
                          <div className="flex justify-between items-center text-xs border-b border-[#EADDC9] pb-2">
                            <span className="text-[#3C3530]/75 font-semibold font-sans">{pearsonIngA} ({pA}% Protein)</span>
                            <span className="text-[#859681] font-black">{pctA.toFixed(1)}% <span className="text-[#3C3530]/80 font-medium">({kgA.toFixed(2)} kg)</span></span>
                          </div>
                          <div className="flex justify-between items-center text-xs border-b border-[#EADDC9] pb-2">
                            <span className="text-[#3C3530]/75 font-semibold font-sans">{pearsonIngB} ({pB}% Protein)</span>
                            <span className="text-[#4D5D4A] font-black">{pctB.toFixed(1)}% <span className="text-[#3C3530]/80 font-medium">({kgB.toFixed(2)} kg)</span></span>
                          </div>
                          <div className="flex justify-between items-center text-xs pt-1">
                            <span className="text-[#3C3530] font-extrabold uppercase font-sans">Total Target Campuran</span>
                            <strong className="text-white font-black text-sm">100% ({pearsonTotalKg.toFixed(0)} kg) @ {pTarget}% Protein</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Standalone manual FCR Calculator */}
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-[#3C3530] flex items-center gap-2">
                    <span>⚖️</span> Kalkulator FCR Manual (Feed Conversion Ratio)
                  </h3>
                  <span className="px-2.5 py-1 bg-emerald-950/70 text-[#859681] text-[10px] rounded-lg font-bold border-[#859681]/20 uppercase tracking-wider">
                    Premium Feature
                  </span>
                </div>
                <p className="text-xs text-[#3C3530]/80">
                  Hitung nilai konversi pakan secara cepat untuk mengukur tingkat efisiensi serapan pakan ternak Anda.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Total Konsumsi Pakan (kg)</label>
                    <input
                      type="number"
                      value={manualFcrFeed}
                      onChange={(e) => setManualFcrFeed(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Total Bobot Hasil Panen (kg)</label>
                    <input
                      type="number"
                      value={manualFcrWeight}
                      onChange={(e) => setManualFcrWeight(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold font-mono text-sm"
                    />
                  </div>
                </div>

                {(() => {
                  const feed = manualFcrFeed;
                  const weight = manualFcrWeight;
                  if (weight <= 0) {
                    return (
                      <div className="bg-[#FAF7F0]/40 text-center py-6 text-xs text-[#3C3530]/65 font-bold border border-[#EADDC9] rounded-2xl">
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
                    fcrBg = 'bg-[#859681]/15 border-emerald-500/20';
                    fcrText = 'text-[#4D5D4A]';
                  } else if (fcrVal <= 1.8) {
                    fcrStatus = 'Efisien (Standar) 👍';
                    fcrBg = 'bg-[#859681]/15 border-[#859681]/20';
                    fcrText = 'text-[#859681]';
                  } else {
                    fcrStatus = 'Kurang Efisien (Butuh Evaluasi Pakan/Kandang) ⚠️';
                    fcrBg = 'bg-[#A76A57]/15 border-[#A76A57]/20';
                    fcrText = 'text-[#A76A57]';
                  }

                  return (
                    <div className={`p-5 rounded-2xl border ${fcrBg} space-y-2`}>
                      <span className="text-[10px] font-bold text-[#3C3530]/75 uppercase tracking-wider block">Hasil Rasio Konversi Pakan</span>
                      <div className="flex justify-between items-baseline flex-wrap gap-2">
                        <strong className={`text-3xl font-black font-mono ${fcrText}`}>{fcrVal.toFixed(2)}</strong>
                        <span className={`text-xs font-extrabold ${fcrText}`}>{fcrStatus}</span>
                      </div>
                      <p className="text-[10px] text-[#3C3530]/65 leading-relaxed font-semibold font-sans">
                        *Artinya, untuk memproduksi 1 kg berat badan hewan ternak, dibutuhkan pasokan pakan sebanyak {fcrVal.toFixed(2)} kg. Semakin kecil angka FCR, semakin tinggi profit yang dihasilkan.
                      </p>
                    </div>
                  );
                })()}
              </div>

            </div>
          )
        )}

        {/* --- TAB: VENTILASI BROILER (Modul 08) --- */}
        {activeTab === 'ventilasi' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
            <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6">
              <h3 className="text-lg font-bold text-[#3C3530] flex items-center gap-2">
                <span>💨</span> Kalkulator Ventilasi Kandang Broiler
              </h3>
              <p className="text-xs text-[#3C3530]/80">
                Hitung kebutuhan udara kandang (CFM) dan status operasional kipas angin berdasarkan populasi saat ini.
              </p>

              {/* Fan specs input grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Daya Motor Kipas (Watt)</label>
                  <input
                    type="number"
                    value={activeCycle.data?.modal?.vent_watt_kipas || '375'}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), vent_watt_kipas: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#3C3530]/65 block mt-1">Standard: 375W (0.5 HP) atau 750W (1.0 HP)</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Kipas Aktif (Unit)</label>
                  <input
                    type="number"
                    value={activeCycle.data?.modal?.vent_jml_kipas || '2'}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), vent_jml_kipas: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold font-mono text-sm"
                  />
                  <span className="text-[10px] text-[#3C3530]/65 block mt-1">Jumlah blower yang dioperasikan</span>
                </div>
              </div>

              {/* Live calculations display */}
              {stats && (
                <div className="space-y-4">
                  {/* Alert if fans are insufficient */}
                  {stats.alertKipasKurang && (
                    <div className="bg-[#A76A57]/15 border border-[#A76A57]/20 text-[#A76A57] p-4 rounded-2xl flex items-center gap-2 font-semibold text-xs animate-pulse">
                      <span>⚠️</span>
                      <span><strong>Kritis (Kapasitas Kipas Kurang):</strong> Total kapasitas kipas ({Math.round(stats.CFM_kapasitas).toLocaleString('id-ID')} CFM) berada di bawah kebutuhan minimum ayam ({Math.round(stats.CFM_kebutuhan).toLocaleString('id-ID')} CFM). Tambahkan unit kipas atau tingkatkan dayanya untuk menghindari stress panas (heat stress) pada ayam!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9]">
                      <span className="text-[10px] font-bold text-[#3C3530]/60 uppercase tracking-wider block mb-1">Kebutuhan Udara (Tropis)</span>
                      <span className="text-sm font-black text-[#3C3530] font-mono">{Math.round(stats.CFM_kebutuhan).toLocaleString('id-ID')} CFM</span>
                    </div>
                    <div className="bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9]">
                      <span className="text-[10px] font-bold text-[#3C3530]/60 uppercase tracking-wider block mb-1">Total Kapasitas Kipas</span>
                      <span className="text-sm font-black text-[#3C3530] font-mono">{Math.round(stats.CFM_kapasitas).toLocaleString('id-ID')} CFM</span>
                    </div>
                  </div>

                  <div className="bg-[#0b1b1e] border border-[#859681]/10 p-5 rounded-2xl text-xs space-y-2">
                    <span className="text-[10px] font-black text-[#859681] uppercase tracking-widest block mb-2">📋 Hasil Analisis Ventilasi</span>
                    <div className="flex justify-between items-center text-[#3C3530]/90 font-semibold py-1 border-b border-[#EADDC9]">
                      <span>Fase Ventilasi:</span>
                      <span className="text-white font-extrabold uppercase bg-[#859681]/15 border border-[#859681]/20 px-2 py-0.5 rounded text-[10px] tracking-wider">
                        {stats.fase === 'minimum' ? '❄️ Minimum (Umur < 14 hr)' : stats.fase === 'transitional' ? '🌀 Transitional (Umur 14-20 hr)' : '🔥 Tunnel / Terowongan (Umur >= 21 hr)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#3C3530]/90 font-semibold py-1 border-b border-[#EADDC9]">
                      <span>Target Suhu Kandang:</span>
                      <span className="text-white font-extrabold font-mono text-sm">{stats.suhu_target} °C</span>
                    </div>
                    <div className="flex justify-between items-center text-[#3C3530]/90 font-semibold py-1 border-b border-[#EADDC9]">
                      <span>Rasio Kebutuhan (Duty Cycle):</span>
                      <span className="text-white font-extrabold font-mono">{(stats.duty_cycle * 100).toFixed(1)} %</span>
                    </div>
                    <div className="flex justify-between items-center text-[#3C3530]/80 font-semibold py-1">
                      <span>Rekomendasi Siklus Timer (5 Menit):</span>
                      <span className="text-[#859681] font-extrabold font-mono text-sm">
                        {stats.runtime_detik >= 300 ? 'ON TERUS (Kipas Jalan Non-stop)' : `ON: ${stats.runtime_detik} dtk | OFF: ${300 - stats.runtime_detik} dtk`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suhu Target Cobb 500 Guide */}
            <div className="bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-4">
              <h4 className="text-sm font-bold text-[#3C3530] flex items-center gap-2">
                <span>🌡️</span> Panduan Suhu Ideal Cobb 500 (As-Hatched)
              </h4>
              <p className="text-xs text-[#3C3530]/80">
                Suhu standar industri untuk meminimalkan FCR dan mengoptimalkan ADG berdasarkan kelompok umur ayam:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#EADDC9] text-[#3C3530]/60">
                      <th className="py-2 font-bold uppercase">Umur (Hari)</th>
                      <th className="py-2 font-bold uppercase">Target Suhu (°C)</th>
                      <th className="py-2 font-bold uppercase">Fase Ventilasi</th>
                      <th className="py-2 font-bold uppercase">Toleransi Kelembaban</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#3C3530]/90 divide-y divide-[#EADDC9]/40">
                    <tr>
                      <td className="py-2 font-mono">Hari 1–7</td>
                      <td className="py-2 font-mono text-white">32°C - 33°C</td>
                      <td className="py-2 text-[#859681] font-semibold">Minimum</td>
                      <td className="py-2">60% - 70%</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono">Hari 8–14</td>
                      <td className="py-2 font-mono text-white">29°C - 30°C</td>
                      <td className="py-2 text-[#859681] font-semibold">Minimum</td>
                      <td className="py-2">60% - 70%</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono">Hari 15–21</td>
                      <td className="py-2 font-mono text-white">26°C - 27°C</td>
                      <td className="py-2 text-yellow-450 font-semibold">Transitional</td>
                      <td className="py-2">60% - 70%</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono">Hari 22–35+</td>
                      <td className="py-2 font-mono text-white">21°C - 24°C</td>
                      <td className="py-2 text-[#A76A57] font-semibold">Tunnel</td>
                      <td className="py-2">60% - 70%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: KALENDER OPERASIONAL & VAKSINASI --- */}
        {activeTab === 'jadwal_kerja' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EADDC9] pb-4">
              <div>
                <h3 className="text-xl font-black text-[#3C3530] flex items-center gap-2">
                  <span>📅</span> Kalender Kegiatan & Vaksinasi
                </h3>
                <p className="text-xs text-[#3C3530]/75 mt-1">
                  Jadwal rutin harian ini dihitung otomatis dari tanggal mulai siklus: <strong className="text-[#859681] font-mono">{parsedStartDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </p>
              </div>
              <div className="bg-[#FCFAF6]/60 border border-[#EADDC9] px-4 py-2 rounded-xl text-center self-start">
                <span className="text-[10px] font-bold text-[#3C3530]/60 block uppercase">Pencapaian Tugas</span>
                <span className="text-sm font-black text-[#859681] font-mono">
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
                        ? 'bg-[#FCFAF6]/10 border-teal-500/15 opacity-60' 
                        : 'bg-[#FCFAF6] border-[#EADDC9] hover:border-teal-500/30 hover:bg-[#FCFAF6]/50'
                    }`}
                  >
                    {/* Checkbox circle/box */}
                    <div className="mt-1 flex-shrink-0">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-[#859681] border-teal-500 text-slate-950 font-bold' : 'border-[#EADDC9]'}`}>
                        {isChecked && '✓'}
                      </div>
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-extrabold text-[#859681] bg-[#859681]/15 px-2 py-0.5 rounded-lg border border-[#859681]/10 font-mono">
                          Hari ke-{task.day}
                        </span>
                        <span className="text-xs font-bold text-[#3C3530]/60 font-mono">
                          {task.date}
                        </span>
                      </div>
                      
                      <h4 className={`text-sm font-black ${isChecked ? 'line-through text-[#3C3530]/80' : 'text-[#3C3530]'}`}>
                        {task.title}
                      </h4>
                      <p className={`text-xs mt-1 leading-relaxed ${isChecked ? 'line-through text-[#3C3530]/60' : 'text-[#3C3530]/80 font-medium'}`}>
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
            <div className="max-w-3xl mx-auto h-[600px] bg-[#FCFAF6] border border-[#859681]/10 rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
              
              {/* Header info */}
              <div className="bg-[#FAF7F0] border-b border-[#EADDC9] p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#859681]/15 border border-[#859681]/20 flex items-center justify-center text-xl">
                    👨‍⚕️
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#3C3530] uppercase tracking-wider">Radeya AI Vet</h4>
                    <span className="text-[10px] font-bold text-[#859681] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Asisten Konsultasi Aktif
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setChatMessages([])} 
                  className="text-[10px] bg-[#FCFAF6] border border-[#EADDC9] hover:bg-[#EADDC9] text-[#3C3530]/80 hover:text-[#3C3530] px-3 py-1.5 rounded-xl font-bold transition-all"
                >
                  Clear Chat
                </button>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-16 text-[#3C3530]/60 text-xs">
                    Ketik pertanyaan Anda di bawah untuk memulai sesi tanya-jawab dengan AI Vet.
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed font-semibold ${
                        msg.role === 'user'
                          ? 'bg-[#859681] text-white rounded-br-none'
                          : 'bg-[#FAF7F0] text-[#3C3530] border border-[#EADDC9] rounded-bl-none'
                      }`}>
                        {/* Simple custom formatter for bold and bullets */}
                        {msg.text.split('\n').map((line, idx) => {
                          let content: React.ReactNode = line;
                          // Replace **bold**
                          if (line.includes('**')) {
                            const parts = line.split('**');
                            content = parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-[#859681]/90 font-extrabold">{part}</strong> : part);
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
                    <div className="bg-[#FAF7F0] text-[#3C3530]/90 p-4 rounded-2xl rounded-bl-none border border-[#EADDC9] text-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#859681] rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-[#859681] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-[#859681] rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span>Dokter mengetik respon...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSendChatMessage} className="bg-[#FAF7F0]/90 border-t border-[#EADDC9] p-4 flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tanyakan keluhan ternak Anda di sini (misal: ayam lemas berak kapur)..."
                  className="flex-1 bg-[#FCFAF6]/60 border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] rounded-xl px-4 py-3 text-[#3C3530] text-xs font-semibold outline-none transition-colors"
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

        {/* --- TAB: FEED FORMULATOR --- */}
        {activeTab === 'feed_formulator' && (
          <FeedFormulator
            activeCycle={activeCycle}
            savedRecipes={activeCycle?.data?.resep_pakan || []}
            onSaveRecipe={async (recipeData) => {
              const currentResep = activeCycle?.data?.resep_pakan || [];
              const updatedResep = [...currentResep, recipeData];
              await handleSaveCycleData({
                ...activeCycle.data,
                resep_pakan: updatedResep
              });
            }}
          />
        )}

        {/* --- TAB: HARIAN LOG (BEBEK PEDAGING) --- */}
        {activeTab === 'harian_log' && (
          <div className="max-w-xl mx-auto bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-[#3C3530] flex items-center justify-between font-sans">
              <span>🦆 Log Harian Bebek Pedaging</span>
              <span className="text-[10px] px-2.5 py-0.5 bg-[#859681]/15 text-[#859681] rounded-md font-mono font-bold">
                {(activeCycle.data?.harian || []).length} Catatan
              </span>
            </h3>

            <div className="space-y-3">
              {(activeCycle.data?.harian || []).length === 0 ? (
                <div className="text-center py-10 text-[#3C3530]/60 text-xs">Belum ada log harian dicatat.</div>
              ) : (
                (activeCycle.data?.harian || []).map((h: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] font-mono">
                    <div>
                      <div className="text-xs font-bold text-[#3C3530] font-sans">{h.tgl}</div>
                      <div className="text-[10px] text-[#3C3530]/60 mt-1 font-bold">
                        Pakan: {h.pakan_kg || 0} kg · Air: {h.air || 0} L · Kematian: {h.mati || 0} ekor
                      </div>
                    </div>
                    <button onClick={() => handleDeleteListItem('harian', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-2">✕</button>
                  </div>
                ))
              )}
              <button
                onClick={() => openModalForm('modal_harian_pedaging')}
                className="w-full mt-6 py-3 bg-[#FAF7F0]/40 hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
              >
                + Catat Log Harian Bebek
              </button>
            </div>
          </div>
        )}

        {/* --- TAB: SAMPLING (IKAN) --- */}
        {activeTab === 'sampling' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-4 rounded-2xl text-center">
                <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">Bobot Rata-rata</span>
                <span className="text-xl font-extrabold text-[#859681] mt-1 block font-mono">
                  {stats?.bobotRataTerakhir?.toFixed(1) || '0.0'} g
                </span>
              </div>
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-4 rounded-2xl text-center">
                <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">ADG</span>
                <span className="text-xl font-extrabold text-[#859681] mt-1 block font-mono">
                  {stats?.adg?.toFixed(2) || '0.00'} g/hari
                </span>
              </div>
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-4 rounded-2xl text-center">
                <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">SGR</span>
                <span className="text-xl font-extrabold text-[#859681] mt-1 block font-mono">
                  {stats?.sgr?.toFixed(2) || '0.00'} %/hari
                </span>
              </div>
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-4 rounded-2xl text-center">
                <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">Biomassa</span>
                <span className="text-xl font-extrabold text-[#859681] mt-1 block font-mono">
                  {stats?.biomassaSaatIni?.toFixed(1) || '0.0'} kg
                </span>
              </div>
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-4 rounded-2xl text-center col-span-2 md:col-span-1">
                <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">Keseragaman (CV)</span>
                <span className={`text-xl font-extrabold mt-1 block font-mono ${stats?.cv > 20 ? 'text-[#A76A57]' : 'text-[#4D5D4A]'}`}>
                  {stats?.cv ? `${stats.cv.toFixed(1)}%` : '-'}
                </span>
              </div>
            </div>

            {/* Grading Warning Alert */}
            {stats?.needGrading && (
              <div className="p-4 bg-[#A76A57]/15 border border-[#A76A57]/20 text-[#A76A57] text-xs rounded-2xl flex items-center gap-3 font-semibold font-sans">
                <span className="text-xl">⚠️</span>
                <div>
                  <strong>Peringatan Keseragaman (CV &gt; 20%):</strong> Pertumbuhan ukuran ikan tidak merata. Lakukan penyortiran (grading) wadah/kolam sesegera mungkin untuk mencegah kanibalisme dan memastikan kompetisi pakan yang merata.
                </div>
              </div>
            )}

            {/* Dosis Pakan Rekomendasi */}
            <div className="bg-gradient-to-tr from-teal-950/20 to-emerald-950/20 border border-[#859681]/10 p-5 rounded-3xl space-y-2">
              <h4 className="text-xs font-black text-[#859681] uppercase tracking-widest font-sans">🍽️ Rekomendasi Pemberian Pakan Harian</h4>
              <p className="text-xs text-[#3C3530]/80 font-semibold leading-relaxed">
                Berdasarkan biomassa saat ini ({stats?.biomassaSaatIni?.toFixed(1) || 0} kg), dosis pakan harian standar yang disarankan berkisar antara <strong>3% - 5%</strong> dari total biomassa:
              </p>
              <div className="flex items-baseline gap-2 pt-1 font-sans">
                <span className="text-2xl font-black text-white font-mono">
                  {((stats?.biomassaSaatIni || 0) * 0.03).toFixed(1)} - {((stats?.biomassaSaatIni || 0) * 0.05).toFixed(1)} kg / hari
                </span>
                <span className="text-[#3C3530]/60 text-[10px] font-bold">(*Sesuaikan dengan nafsu makan dan suhu air kolam)</span>
              </div>
            </div>

            {/* Table / List of Sampling */}
            <div className="bg-[#0B1416] border border-[#EADDC9] p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-[#3C3530]">Riwayat Sampling Pertumbuhan</h3>
              
              <div className="overflow-x-auto rounded-2xl border border-[#EADDC9] bg-[#FAF7F0]/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F0] text-[#3C3530]/80 font-bold uppercase tracking-wider border-b border-[#EADDC9]">
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3 text-center">Jml Sampel</th>
                      <th className="px-4 py-3 text-center">Bobot Sampel (g)</th>
                      <th className="px-4 py-3 text-center">Rata-rata (g)</th>
                      <th className="px-4 py-3 text-center">Stdev (g)</th>
                      <th className="px-4 py-3 text-center">CV (%)</th>
                      <th className="px-4 py-3 text-center">Populasi Est.</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADDC9] text-[#3C3530]/90 font-semibold">
                    {(activeCycle.data?.sampling || []).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-[#3C3530]/65">Belum ada data sampling pertumbuhan.</td>
                      </tr>
                    ) : (
                      (activeCycle.data?.sampling || []).map((sm: any, i: number) => {
                        const rata = parseFloat(sm.bobot_total_g) / Math.max(1, parseFloat(sm.jml_sampel) || 1);
                        const rowCv = sm.stdev_g && rata > 0 ? (parseFloat(sm.stdev_g) / rata) * 100 : 0;
                        return (
                          <tr key={i} className="hover:bg-[#FCFAF6]/10">
                            <td className="px-4 py-3.5 font-mono">{sm.tgl}</td>
                            <td className="px-4 py-3.5 text-center font-mono">{sm.jml_sampel}</td>
                            <td className="px-4 py-3.5 text-center font-mono">{sm.bobot_total_g} g</td>
                            <td className="px-4 py-3.5 text-center font-mono">{rata.toFixed(1)} g</td>
                            <td className="px-4 py-3.5 text-center font-mono">{sm.stdev_g || '-'}</td>
                            <td className={`px-4 py-3.5 text-center font-mono ${rowCv > 20 ? 'text-[#A76A57]' : 'text-[#3C3530]/80'}`}>
                              {rowCv > 0 ? `${rowCv.toFixed(1)}%` : '-'}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono">{sm.jml_estimasi?.toLocaleString('id-ID') || '-'}</td>
                            <td className="px-4 py-3.5 text-center font-sans">
                              <button onClick={() => handleDeleteListItem('sampling', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold px-2">✕</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => openModalForm('modal_sampling_ikan')}
                className="w-full py-3 bg-[#FAF7F0] hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
              >
                + Catat Sampling Pertumbuhan
              </button>
            </div>
          </div>
        )}

        {/* --- TAB: KUALITAS AIR (IKAN) --- */}
        {activeTab === 'kualitas_air' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            {/* Live Status Cards */}
            {(() => {
              const logs = activeCycle.data?.kualitas_air || [];
              const lastLog = logs[logs.length - 1] || {};
              const isBioflok = activeCycle.data?.modal?.sistem_kolam === 'bioflok';
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-semibold">
                  {/* Suhu */}
                  <div className="bg-[#0B1416] border border-[#EADDC9] p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">Suhu Air</span>
                      <span className="text-xl font-extrabold text-white mt-1 block font-mono">
                        {lastLog.suhu !== undefined ? `${lastLog.suhu}°C` : '-'}
                      </span>
                    </div>
                    {lastLog.suhu !== undefined && (
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase ${checkWaterParam('suhu', lastLog.suhu).color}`}>
                        {checkWaterParam('suhu', lastLog.suhu).status}
                      </span>
                    )}
                  </div>
                  {/* pH */}
                  <div className="bg-[#0B1416] border border-[#EADDC9] p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">pH Air</span>
                      <span className="text-xl font-extrabold text-white mt-1 block font-mono">
                        {lastLog.ph !== undefined ? lastLog.ph.toFixed(1) : '-'}
                      </span>
                    </div>
                    {lastLog.ph !== undefined && (
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase ${checkWaterParam('ph', lastLog.ph).color}`}>
                        {checkWaterParam('ph', lastLog.ph).status}
                      </span>
                    )}
                  </div>
                  {/* DO */}
                  <div className="bg-[#0B1416] border border-[#EADDC9] p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">Oksigen Terlarut (DO)</span>
                      <span className="text-xl font-extrabold text-white mt-1 block font-mono">
                        {lastLog.do !== undefined ? `${lastLog.do} mg/L` : '-'}
                      </span>
                    </div>
                    {lastLog.do !== undefined && (
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase ${checkWaterParam('do', lastLog.do).color}`}>
                        {checkWaterParam('do', lastLog.do).status}
                      </span>
                    )}
                  </div>
                  {/* Amonia */}
                  <div className="bg-[#0B1416] border border-[#EADDC9] p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">Amonia NH₃</span>
                      <span className="text-xl font-extrabold text-white mt-1 block font-mono">
                        {lastLog.amonia !== undefined ? `${lastLog.amonia} mg/L` : '-'}
                      </span>
                    </div>
                    {lastLog.amonia !== undefined && (
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase ${checkWaterParam('amonia', lastLog.amonia).color}`}>
                        {checkWaterParam('amonia', lastLog.amonia).status}
                      </span>
                    )}
                  </div>
                  {/* Nitrit */}
                  <div className="bg-[#0B1416] border border-[#EADDC9] p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">Nitrit NO₂</span>
                      <span className="text-xl font-extrabold text-white mt-1 block font-mono">
                        {lastLog.nitrit !== undefined ? `${lastLog.nitrit} mg/L` : '-'}
                      </span>
                    </div>
                    {lastLog.nitrit !== undefined && (
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase ${checkWaterParam('nitrit', lastLog.nitrit).color}`}>
                        {checkWaterParam('nitrit', lastLog.nitrit).status}
                      </span>
                    )}
                  </div>
                  {/* Kecerahan */}
                  <div className="bg-[#0B1416] border border-[#EADDC9] p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">Kecerahan Air</span>
                      <span className="text-xl font-extrabold text-white mt-1 block font-mono">
                        {lastLog.kecerahan !== undefined ? `${lastLog.kecerahan} cm` : '-'}
                      </span>
                    </div>
                    {lastLog.kecerahan !== undefined && (
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase ${checkWaterParam('kecerahan', lastLog.kecerahan).color}`}>
                        {checkWaterParam('kecerahan', lastLog.kecerahan).status}
                      </span>
                    )}
                  </div>

                  {/* Bioflok parameters */}
                  {isBioflok && (
                    <>
                      <div className="bg-[#0B1416] border border-[#EADDC9] p-4 rounded-2xl flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">Volume Flok</span>
                          <span className="text-xl font-extrabold text-white mt-1 block font-mono">
                            {lastLog.volume_flok !== undefined ? `${lastLog.volume_flok} ml/L` : '-'}
                          </span>
                        </div>
                        {lastLog.volume_flok !== undefined && (
                          <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase ${checkWaterParam('volume_flok', lastLog.volume_flok).color}`}>
                            {checkWaterParam('volume_flok', lastLog.volume_flok).status}
                          </span>
                        )}
                      </div>
                      <div className="bg-[#0B1416] border border-[#EADDC9] p-4 rounded-2xl flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-[#3C3530]/65 block uppercase font-black">C/N Ratio</span>
                          <span className="text-xl font-extrabold text-white mt-1 block font-mono">
                            {lastLog.cn_ratio !== undefined ? `${lastLog.cn_ratio}:1` : '-'}
                          </span>
                        </div>
                        {lastLog.cn_ratio !== undefined && (
                          <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase ${checkWaterParam('cn_ratio', lastLog.cn_ratio).color}`}>
                            {checkWaterParam('cn_ratio', lastLog.cn_ratio).status}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Riwayat Data Kualitas Air */}
            <div className="bg-[#0B1416] border border-[#EADDC9] p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-[#3C3530]">Riwayat Parameter Kualitas Air</h3>
              
              <div className="overflow-x-auto rounded-2xl border border-[#EADDC9] bg-[#FAF7F0]/40 font-semibold">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F0] text-[#3C3530]/80 font-bold uppercase tracking-wider border-b border-[#EADDC9]">
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3 text-center">Suhu (°C)</th>
                      <th className="px-4 py-3 text-center">pH</th>
                      <th className="px-4 py-3 text-center">DO (mg/L)</th>
                      <th className="px-4 py-3 text-center">Amonia (mg/L)</th>
                      <th className="px-4 py-3 text-center">Nitrit (mg/L)</th>
                      <th className="px-4 py-3 text-center">Kecerahan (cm)</th>
                      {activeCycle.data?.modal?.sistem_kolam === 'bioflok' && (
                        <>
                          <th className="px-4 py-3 text-center">Flok (ml/L)</th>
                          <th className="px-4 py-3 text-center">C/N Ratio</th>
                        </>
                      )}
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADDC9] text-[#3C3530]/90 font-semibold font-mono">
                    {(activeCycle.data?.kualitas_air || []).length === 0 ? (
                      <tr>
                        <td colSpan={activeCycle.data?.modal?.sistem_kolam === 'bioflok' ? 9 : 7} className="text-center py-8 text-[#3C3530]/65 font-sans">
                          Belum ada data monitoring kualitas air.
                        </td>
                      </tr>
                    ) : (
                      (activeCycle.data?.kualitas_air || []).map((w: any, i: number) => (
                        <tr key={i} className="hover:bg-[#FCFAF6]/10">
                          <td className="px-4 py-3.5">{w.tgl}</td>
                          <td className="px-4 py-3.5 text-center">{w.suhu}°C</td>
                          <td className="px-4 py-3.5 text-center">{w.ph}</td>
                          <td className="px-4 py-3.5 text-center">{w.do}</td>
                          <td className="px-4 py-3.5 text-center">{w.amonia}</td>
                          <td className="px-4 py-3.5 text-center">{w.nitrit}</td>
                          <td className="px-4 py-3.5 text-center">{w.kecerahan} cm</td>
                          {activeCycle.data?.modal?.sistem_kolam === 'bioflok' && (
                            <>
                              <td className="px-4 py-3.5 text-center">{w.volume_flok}</td>
                              <td className="px-4 py-3.5 text-center">{w.cn_ratio}</td>
                            </>
                          )}
                          <td className="px-4 py-3.5 text-center font-sans">
                            <button onClick={() => handleDeleteListItem('kualitas_air', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold px-2">✕</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => openModalForm('modal_air_ikan')}
                className="w-full py-3 bg-[#FAF7F0] hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
              >
                + Catat Kualitas Air
              </button>
            </div>
          </div>
        )}

        {/* --- TAB: PEMIJAHAN (IKAN PEMBIBITAN) --- */}
        {activeTab === 'pemijahan' && (
          <div className="max-w-xl mx-auto bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-[#3C3530] flex items-center justify-between font-sans">
              <span>💓 Log Pemijahan Induk</span>
              <span className="text-[10px] px-2.5 py-0.5 bg-[#859681]/15 text-[#859681] rounded-md font-mono font-bold">
                {(activeCycle.data?.pemijahan || []).length} Catatan
              </span>
            </h3>

            <div className="space-y-3">
              {(activeCycle.data?.pemijahan || []).length === 0 ? (
                <div className="text-center py-10 text-[#3C3530]/60 text-xs">Belum ada data pemijahan dicatat.</div>
              ) : (
                (activeCycle.data?.pemijahan || []).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] font-mono">
                    <div>
                      <div className="text-xs font-bold text-[#3C3530] font-sans">{p.tgl}</div>
                      <div className="text-[10px] text-[#3C3530]/60 mt-1 font-bold">
                        Jantan: {p.jantan_ekor || 0} ekor · Betina: {p.betina_ekor || 0} ekor · Est. Telur: {p.est_telur?.toLocaleString('id-ID')} butir
                      </div>
                    </div>
                    <button onClick={() => handleDeleteListItem('pemijahan', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-2">✕</button>
                  </div>
                ))
              )}
              <button
                onClick={() => openModalForm('modal_pemijahan')}
                className="w-full mt-6 py-3 bg-[#FAF7F0]/40 hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
              >
                + Catat Pemijahan Baru
              </button>
            </div>
          </div>
        )}

        {/* --- TAB: PENETASAN (IKAN PEMBIBITAN) --- */}
        {activeTab === 'penetasan' && (
          <div className="max-w-xl mx-auto space-y-6 animate-fadeIn font-semibold">
            {/* Summary statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-4 rounded-2xl text-center">
                <span className="text-[9px] text-[#3C3530]/60 block uppercase font-black">Telur Dibuahi</span>
                <span className="text-sm font-extrabold text-white mt-1 block font-mono">
                  {stats?.telurDibuahi?.toLocaleString('id-ID') || '0'}
                </span>
              </div>
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-4 rounded-2xl text-center">
                <span className="text-[9px] text-[#3C3530]/60 block uppercase font-black">Larva Menetas</span>
                <span className="text-sm font-extrabold text-white mt-1 block font-mono">
                  {stats?.telurMenetas?.toLocaleString('id-ID') || '0'}
                </span>
              </div>
              <div className="bg-[#FCFAF6] border border-[#EADDC9] p-4 rounded-2xl text-center">
                <span className="text-[9px] text-[#3C3530]/60 block uppercase font-black">Daya Tetas</span>
                <span className="text-sm font-extrabold text-[#859681] mt-1 block font-mono">
                  {stats?.dayaTetas?.toFixed(1) || '0.0'}%
                </span>
              </div>
            </div>

            <div className="bg-[#0B1416] border border-[#EADDC9] p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-[#3C3530] flex justify-between font-sans">
                <span>🐣 Catatan Hasil Penetasan</span>
                <span className="text-[10px] px-2 bg-[#FAF7F0] text-[#3C3530]/80 rounded font-mono font-normal">
                  {(activeCycle.data?.penetasan || []).length} Log
                </span>
              </h3>

              <div className="space-y-3">
                {(activeCycle.data?.penetasan || []).length === 0 ? (
                  <div className="text-center py-10 text-[#3C3530]/60 text-xs font-sans">Belum ada data penetasan dicatat.</div>
                ) : (
                  (activeCycle.data?.penetasan || []).map((p: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] font-mono">
                      <div>
                        <div className="text-xs font-bold text-[#3C3530] font-sans">{p.tgl}</div>
                        <div className="text-[10px] text-[#3C3530]/60 mt-1 font-bold">
                          Berhasil (Larva): <strong className="text-[#859681]">{p.berhasil_larva?.toLocaleString('id-ID')} ekor</strong> · Gagal: {p.gagal_butir?.toLocaleString('id-ID')} butir
                        </div>
                      </div>
                      <button onClick={() => handleDeleteListItem('penetasan', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-2 font-sans">✕</button>
                    </div>
                  ))
                )}
                <button
                  onClick={() => openModalForm('modal_penetasan_ikan')}
                  className="w-full mt-6 py-3 bg-[#FAF7F0]/40 hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
                >
                  + Catat Hasil Penetasan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: PENDEDERAN LOG (IKAN PEMBIBITAN) --- */}
        {activeTab === 'pendederan' && (
          <div className="max-w-xl mx-auto bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-[#3C3530] flex items-center justify-between font-sans">
              <span>🌿 Log Harian Pendederan</span>
              <span className="text-[10px] px-2.5 py-0.5 bg-[#859681]/15 text-[#859681] rounded-md font-mono font-bold">
                {(activeCycle.data?.harian || []).length} Catatan
              </span>
            </h3>

            <div className="space-y-3">
              {(activeCycle.data?.harian || []).length === 0 ? (
                <div className="text-center py-10 text-[#3C3530]/60 text-xs">Belum ada log pendederan dicatat.</div>
              ) : (
                (activeCycle.data?.harian || []).map((h: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] font-mono">
                    <div>
                      <div className="text-xs font-bold text-[#3C3530] font-sans">{h.tgl}</div>
                      <div className="text-[10px] text-[#3C3530]/60 mt-1 font-bold">
                        Pakan: {h.pakan_kg || 0} kg · Air: {h.air || 0} L · Kematian: {h.mati || 0} ekor
                      </div>
                    </div>
                    <button onClick={() => handleDeleteListItem('harian', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-2">✕</button>
                  </div>
                ))
              )}
              <button
                onClick={() => openModalForm('modal_harian_pedaging')}
                className="w-full mt-6 py-3 bg-[#FAF7F0]/40 hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
              >
                + Catat Log Harian Pendederan
              </button>
            </div>
          </div>
        )}

        {/* --- TAB: PENJUALAN BENIH (IKAN PEMBIBITAN) --- */}
        {activeTab === 'penjualan' && activeCycle.mode === 'ikan_pembibitan' && (
          <div className="max-w-xl mx-auto bg-[#FCFAF6] border border-[#EADDC9] p-6 rounded-3xl space-y-6 animate-fadeIn font-semibold">
            <h3 className="text-lg font-bold text-[#3C3530] flex items-center justify-between font-sans">
              <span>💰 Data Penjualan Benih</span>
              <span className="text-[10px] px-2.5 py-0.5 bg-[#859681]/15 text-[#859681] rounded-md font-mono font-bold">
                {(activeCycle.data?.penjualan || []).length} Transaksi
              </span>
            </h3>

            <div className="space-y-3">
              {(activeCycle.data?.penjualan || []).length === 0 ? (
                <div className="text-center py-10 text-[#3C3530]/60 text-xs font-sans">Belum ada penjualan benih dicatat.</div>
              ) : (
                (activeCycle.data?.penjualan || []).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-[#FAF7F0] p-4 rounded-2xl border border-[#EADDC9] font-mono">
                    <div>
                      <div className="text-xs font-bold text-[#3C3530] font-sans">{p.tgl} — {p.jml?.toLocaleString('id-ID')} Ekor</div>
                      <div className="text-[10px] text-[#3C3530]/65 mt-1 font-bold">
                        Harga: {formatRp(p.harga_ekor)}/ekor · Ukuran: {p.ukuran_cm || '-'} cm
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#859681]">{formatRp(p.total)}</span>
                      <button onClick={() => handleDeleteListItem('penjualan', i)} className="text-[#A76A57] hover:text-[#A76A57] font-bold p-2 font-sans">✕</button>
                    </div>
                  </div>
                ))
              )}
              <button
                onClick={() => openModalForm('modal_jual_benih')}
                className="w-full mt-6 py-3 bg-[#FAF7F0]/40 hover:bg-[#EADDC9] text-[#859681] font-bold rounded-xl border border-[#EADDC9] transition-all text-xs"
              >
                + Catat Penjualan Benih Baru
              </button>
            </div>
          </div>
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
            <div className="max-w-3xl mx-auto bg-[#FCFAF6] border border-[#EADDC9] p-8 rounded-3xl space-y-8 animate-fadeIn">
              <h3 className="text-xl font-bold text-[#3C3530] flex items-center gap-2">
                <span>👥</span> Kelola Anggota Tim (Pekerja)
              </h3>
              <p className="text-sm text-[#3C3530]/75 leading-relaxed font-semibold">
                Sebagai pemilik (Boss), Anda dapat mendaftarkan akun pekerja untuk mencatat data harian peternakan. Pekerja hanya dapat menginput data dan tidak diizinkan untuk menghapus data.
              </p>

              {/* Form Tambah Anggota */}
              <form onSubmit={handleAddTeamMember} className="space-y-4 bg-[#FAF7F0]/20 p-6 rounded-2xl border border-[#EADDC9]">
                <h4 className="text-xs font-black text-[#3C3530] uppercase tracking-widest">Tambah Pekerja Baru</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bg-[#FCFAF6]/60 border border-[#EADDC9] rounded-xl px-4 py-2.5 text-xs text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] font-semibold"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email Pekerja"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="bg-[#FCFAF6]/60 border border-[#EADDC9] rounded-xl px-4 py-2.5 text-xs text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] font-semibold"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Password Akun"
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    className="bg-[#FCFAF6]/60 border border-[#EADDC9] rounded-xl px-4 py-2.5 text-xs text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] font-semibold"
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
                <h4 className="text-xs font-black text-[#3C3530] uppercase tracking-widest">Daftar Tim Aktif</h4>
                <div className="border border-[#EADDC9] rounded-2xl overflow-hidden bg-[#FAF7F0]/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FCFAF6] text-[#3C3530]/80 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Nama</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Peran</th>
                        <th className="px-6 py-3">Tanggal Dibuat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADDC9] text-[#3C3530]/90 font-medium">
                      {teamMembers.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4">{member.name}</td>
                          <td className="px-6 py-4">{member.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              member.role === 'OWNER' 
                                ? 'bg-[#859681]/15 text-[#859681] border border-[#859681]/20' 
                                : 'bg-[#EADDC9]/35 text-[#3C3530]/80 border border-[#EADDC9]/30'
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
      {['biaya', 'panen', 'penjualan', 'harian_log'].includes(activeTab) && (
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
            } else if (activeTab === 'harian_log') {
              openModalForm('modal_harian_pedaging');
            }
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-xl shadow-teal-500/25 hover:scale-105 active:scale-95 transition-all z-45"
        >
          {Icons.plus("w-6 h-6 text-white")}
        </button>
      )}

      {/* --- DYNAMIC INPUT MODAL --- */}
      {activeModal && activeModal !== 'new_cycle_wizard' && (
        <div className="fixed inset-0 bg-[#3C3530]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#FCFAF6] border border-[#EADDC9] rounded-3xl p-6 w-full max-w-md relative shadow-2xl text-[#3C3530]">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 w-7 h-7 bg-[#FAF7F0] hover:bg-[#EADDC9] text-[#3C3530]/70 hover:text-[#3C3530] rounded-full flex items-center justify-center border border-[#EADDC9] transition-colors"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-[#3C3530] mb-6 font-serif">{modalTitle}</h3>

            <form onSubmit={handleModalFormSubmit} className="space-y-4">
              
              {formFields.tgl !== undefined && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formFields.tgl}
                    onChange={(e) => updateFormField('tgl', e.target.value)}
                    className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                  />
                </div>
              )}

              {/* Feed Fields */}
              {activeModal === 'modal_pakan' && (
                <>
                  {activeCycle?.data?.resep_pakan && activeCycle.data.resep_pakan.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Gunakan Resep Formulator</label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'manual') {
                            setFormFields((prev: any) => ({
                              ...prev,
                              jenis: '',
                              kg_sak: '50',
                              harga_sak: ''
                            }));
                          } else {
                            const recipe = activeCycle?.data?.resep_pakan?.find((r: any) => r.id === val);
                            if (recipe) {
                              setFormFields((prev: any) => {
                                const next = {
                                  ...prev,
                                  jenis: `Resep: ${recipe.nama}`,
                                  kg_sak: '50',
                                  harga_sak: (recipe.result.biaya_kg * 50).toString()
                                };
                                const sak = parseFloat(next.sak) || 0;
                                const harga = parseFloat(next.harga_sak) || 0;
                                setPreviewVal(formatRp(sak * harga));
                                return next;
                              });
                            }
                          }
                        }}
                        defaultValue="manual"
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold cursor-pointer"
                      >
                        <option value="manual">-- Input Manual (Bukan Formulasi) --</option>
                        {activeCycle.data.resep_pakan.map((r: any) => (
                          <option key={r.id} value={r.id} className="bg-[#FCFAF6]">
                            {r.nama} ({r.result.pk}% PK · Rp {r.result.biaya_kg.toLocaleString('id-ID')}/kg)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jenis Pakan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pakan Broiler Starter"
                      value={formFields.jenis}
                      onChange={(e) => updateFormField('jenis', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Sak</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 10"
                        value={formFields.sak}
                        onChange={(e) => updateFormField('sak', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Berat per Sak (kg)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 50"
                        value={formFields.kg_sak}
                        onChange={(e) => updateFormField('kg_sak', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per Sak (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 350000"
                      value={formFields.harga_sak}
                      onChange={(e) => updateFormField('harga_sak', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Medicine/Obat Fields */}
              {activeModal === 'modal_obat' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Nama Obat/Vaksin</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Vitamin A, Vaksin Gumboro"
                      value={formFields.nama}
                      onChange={(e) => updateFormField('nama', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Keterangan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Dosis 5ml per ekor"
                      value={formFields.ket}
                      onChange={(e) => updateFormField('ket', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Total Biaya Obat (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 150000"
                      value={formFields.total}
                      onChange={(e) => updateFormField('total', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Other Expenses Fields */}
              {activeModal === 'modal_lain' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Nama Pengeluaran</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Sekam Kandang, Gaji Pekerja"
                      value={formFields.nama}
                      onChange={(e) => updateFormField('nama', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Keterangan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Tambahan sekam 10 karung"
                      value={formFields.ket}
                      onChange={(e) => updateFormField('ket', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Total Biaya (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 200000"
                      value={formFields.total}
                      onChange={(e) => updateFormField('total', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Broiler Harvest Fields */}
              {activeModal === 'modal_panen_broiler' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Total Panen (kg)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      placeholder="Contoh: 1200"
                      value={formFields.kg}
                      onChange={(e) => updateFormField('kg', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga Jual per kg (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 22000"
                      value={formFields.harga_kg}
                      onChange={(e) => updateFormField('harga_kg', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Ayam Kematian (Ekor)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 10"
                      value={formFields.jml_mati}
                      onChange={(e) => updateFormField('jml_mati', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Egg Layer Daily Yield Fields */}
              {activeModal === 'modal_harian_petelur' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Telur (Butir)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 350"
                      value={formFields.butir}
                      onChange={(e) => updateFormField('butir', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Berat Telur (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Contoh: 20"
                      value={formFields.kg}
                      onChange={(e) => updateFormField('kg', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Telur Retak / BS (Butir)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 5"
                      value={formFields.retak}
                      onChange={(e) => updateFormField('retak', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  {activeCycle?.mode === 'bebek_petelur' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Konsumsi Air Aktual (Liter)</label>
                      <input
                        type="number"
                        placeholder="Contoh: 150"
                        value={formFields.air}
                        onChange={(e) => updateFormField('air', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Bebek Pedaging Daily Log Fields */}
              {activeModal === 'modal_harian_pedaging' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Konsumsi Air Harian (Liter)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 120"
                      value={formFields.air}
                      onChange={(e) => updateFormField('air', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Konsumsi Pakan Harian (kg)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 60"
                      value={formFields.pakan_kg}
                      onChange={(e) => updateFormField('pakan_kg', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Kematian Harian (Ekor)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 2"
                      value={formFields.mati}
                      onChange={(e) => updateFormField('mati', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Egg Layer Sales Fields */}
              {activeModal === 'modal_jual_petelur' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Jual (kg)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      placeholder="Contoh: 50"
                      value={formFields.kg}
                      onChange={(e) => updateFormField('kg', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per kg (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 28000"
                      value={formFields.harga_kg}
                      onChange={(e) => updateFormField('harga_kg', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Ruminant Cost Fields */}
              {(activeModal === 'modal_biaya_ruminansia' || activeModal === 'modal_biaya_susu') && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jenis Pengeluaran</label>
                    <select
                      value={formFields.type}
                      onChange={(e) => updateFormField('type', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-3 py-2.5 text-[#3C3530] text-xs font-semibold"
                    >
                      <option value="pakan">Pakan / Hijauan / Konsentrat</option>
                      <option value="obat">Kesehatan / Obat / Hormon / IB</option>
                      <option value="lain">Lain-lain (TK, Listrik, dll)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Detail Nama Pengeluaran</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Jerami Fermentasi, Vitamin ADE"
                      value={formFields.nama}
                      onChange={(e) => updateFormField('nama', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Volume Berat (kg)</label>
                      <input
                        type="number"
                        placeholder="Contoh: 100"
                        value={formFields.kg}
                        onChange={(e) => updateFormField('kg', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Total Biaya (Rp)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 250000"
                        value={formFields.total}
                        onChange={(e) => updateFormField('total', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
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
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Ekor Dijual</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 5"
                        value={formFields.jml_jual}
                        onChange={(e) => updateFormField('jml_jual', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">BB Akhir Rata2 (kg)</label>
                      <input
                        type="number"
                        required
                        step="0.1"
                        placeholder="Contoh: 400"
                        value={formFields.bb_akhir}
                        onChange={(e) => updateFormField('bb_akhir', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga Jual per kg (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 55000"
                      value={formFields.harga_kg}
                      onChange={(e) => updateFormField('harga_kg', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Kematian (Ekor)</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={formFields.jml_mati}
                      onChange={(e) => updateFormField('jml_mati', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Milk Yield Fields */}
              {activeModal === 'modal_harian_susu' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Total Produksi Susu (Liter)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      placeholder="Contoh: 50"
                      value={formFields.liter}
                      onChange={(e) => updateFormField('liter', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Kadar Lemak Susu % (Opsional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Contoh: 4.2"
                      value={formFields.kadar_lemak || ''}
                      onChange={(e) => updateFormField('kadar_lemak', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold font-mono"
                    />
                  </div>
                </>
              )}

              {/* Milk Sales Fields */}
              {activeModal === 'modal_jual_susu' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Volume Disetor (Liter)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      placeholder="Contoh: 150"
                      value={formFields.liter}
                      onChange={(e) => updateFormField('liter', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per Liter (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 7000"
                      value={formFields.harga_liter}
                      onChange={(e) => updateFormField('harga_liter', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Breeding Birth Fields */}
              {activeModal === 'modal_kelahiran' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">ID / Tag Indukan Betina</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: A-01, B-03"
                      value={formFields.id_induk}
                      onChange={(e) => updateFormField('id_induk', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Anak Jantan</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 1"
                        value={formFields.jantan}
                        onChange={(e) => updateFormField('jantan', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Anak Betina</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 1"
                        value={formFields.betina}
                        onChange={(e) => updateFormField('betina', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Tanggal Kawin (Mulai Kebuntingan - Opsional)</label>
                    <input
                      type="date"
                      value={formFields.tgl_kawin || ''}
                      onChange={(e) => updateFormField('tgl_kawin', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">ID / Tag Pejantan (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: P-99"
                      value={formFields.id_pejantan || ''}
                      onChange={(e) => updateFormField('id_pejantan', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Breeding Mating Fields */}
              {activeModal === 'modal_perkawinan' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">ID / Tag Indukan Betina</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: A-01, B-03"
                      value={formFields.id_induk}
                      onChange={(e) => updateFormField('id_induk', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">ID / Tag Pejantan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: P-02, P-05"
                      value={formFields.id_pejantan}
                      onChange={(e) => updateFormField('id_pejantan', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Status Hasil Perkawinan</label>
                    <select
                      value={formFields.status}
                      onChange={(e) => updateFormField('status', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-3 py-2.5 text-[#3C3530] text-xs font-semibold cursor-pointer"
                    >
                      <option value="menunggu">Menunggu Konfirmasi / Cek Bunting</option>
                      <option value="bunting">Berhasil (Bunting)</option>
                      <option value="gagal">Gagal Kawin (Kawin Ulang)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Breeding Sales Fields */}
              {activeModal === 'modal_jual_breeding' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Kategori</label>
                      <select
                        value={formFields.kategori}
                        onChange={(e) => updateFormField('kategori', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-3 py-2.5 text-[#3C3530] text-xs font-semibold"
                      >
                        <option>Bakalan</option>
                        <option>Afkir Betina</option>
                        <option>Afkir Jantan</option>
                        <option>Indukan</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jenis Kelamin</label>
                      <select
                        value={formFields.jenis}
                        onChange={(e) => updateFormField('jenis', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-3 py-2.5 text-[#3C3530] text-xs font-semibold"
                      >
                        <option value="jantan">Jantan</option>
                        <option value="betina">Betina</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah (Ekor)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 2"
                        value={formFields.jml}
                        onChange={(e) => updateFormField('jml', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per Ekor (Rp)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 3500000"
                        value={formFields.harga_ekor}
                        onChange={(e) => updateFormField('harga_ekor', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Egg Incubator / Pembibitan Yield Fields */}
              {activeModal === 'modal_telur_pembibitan' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Periode</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Minggu ke-1"
                      value={formFields.periode}
                      onChange={(e) => updateFormField('periode', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">T. Dikumpulkan (Butir)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 200"
                        value={formFields.dikumpulkan}
                        onChange={(e) => updateFormField('dikumpulkan', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Masuk Tetas (Butir)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 180"
                        value={formFields.masuk_tetas}
                        onChange={(e) => updateFormField('masuk_tetas', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Egg Incubator / Pembibitan Sales Fields */}
              {activeModal === 'modal_jual_doc' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Tipe Penjualan</label>
                    <select
                      value={formFields.tipe}
                      onChange={(e) => updateFormField('tipe', e.target.value)}
                      className="w-full bg-[#FAF7F0] border border-[#EADDC9] focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] focus:outline-none rounded-xl px-3 py-2.5 text-[#3C3530] text-xs font-semibold"
                    >
                      <option>DOC</option>
                      <option>Ayam Remaja</option>
                      <option>Afkir</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Jumlah Ekor</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 100"
                        value={formFields.jml}
                        onChange={(e) => updateFormField('jml', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#3C3530]/60 block uppercase tracking-wider">Harga per Ekor (Rp)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 8000"
                        value={formFields.harga_ekor}
                        onChange={(e) => updateFormField('harga_ekor', e.target.value)}
                        className="w-full bg-[#FAF7F0] border border-[#EADDC9] rounded-xl px-4 py-2.5 text-[#3C3530] focus:outline-none focus:ring-2 focus:ring-[#859681]/30 focus:border-[#859681] transition-all font-semibold"
                      />
                    </div>
                  </div>
                </>
              )}

              {previewVal && (
                <div className="bg-[#859681]/15 border-[#859681]/20 text-[#4D5D4A] p-3.5 rounded-2xl flex justify-between items-center text-xs font-bold font-mono">
                  <span className="font-sans">Estimasi Total Biaya/Penjualan:</span>
                  <span className="text-sm font-black">{previewVal}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-6 py-3.5 bg-[#859681] hover:bg-[#748570] text-[#FCFAF6] font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm"
              >
                Simpan Catatan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- NEW CYCLE WIZARD OVERLAY --- */}
         {/* --- CONFIRMATION DIALOG MODAL --- */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-[#3C3530]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#FCFAF6] border border-[#EADDC9] rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl text-[#3C3530]">
            <span className="text-5xl block mb-4">⚠️</span>
            <h3 className="text-lg font-bold text-[#3C3530] mb-2 font-serif">{confirmModal.title}</h3>
            <p className="text-xs text-[#3C3530]/75 mb-6 leading-relaxed font-semibold">{confirmModal.msg}</p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                className="flex-1 py-2.5 border border-[#EADDC9] bg-[#FAF7F0] hover:bg-[#EADDC9] text-[#3C3530] font-bold rounded-xl text-xs transition-colors"
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
        <div className="fixed inset-0 bg-[#3C3530]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-[#FCFAF6] border border-[#EADDC9] rounded-3xl p-8 w-full max-w-4xl shadow-2xl relative my-8">
            <button
              onClick={() => setBillingModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-[#FCFAF6] hover:bg-[#EADDC9] text-[#3C3530]/80 hover:text-[#3C3530] rounded-full flex items-center justify-center transition-all border border-[#EADDC9]"
            >
              &times;
            </button>

            <div className="text-center mb-8">
              <span className="px-3 py-1 bg-[#859681]/15 border border-[#859681]/20 text-[#859681] rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                Radeya Premium
              </span>
              <h3 className="text-2xl font-black text-[#3C3530] mt-3">Pilih Paket Langganan Peternakan Anda</h3>
              <p className="text-xs text-[#3C3530]/75 mt-1 max-w-md mx-auto">
                Buka seluruh potensi otomatisasi Radeya SaaS untuk meningkatkan efisiensi dan laba peternakan Anda harian.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card FREE */}
              <div className="bg-[#FAF7F0] border border-[#EADDC9] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <h4 className="text-sm font-black text-[#3C3530]/90">FREE TIER</h4>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#3C3530]">Rp 0</span>
                    <span className="text-[10px] text-[#3C3530]/60 font-bold uppercase">/ Selamanya</span>
                  </div>
                  <p className="text-[11px] text-[#3C3530]/75 mt-3 leading-relaxed">
                    Sangat cocok untuk peternak pemula skala kecil rumahan.
                  </p>
                  <ul className="mt-6 space-y-3.5 text-[11px] text-[#3C3530]/80 font-bold">
                    <li className="flex items-center gap-2">
                      <span className="text-[#859681]">✓</span> 3 Siklus Ternak Aktif
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#859681]">✓</span> Kalender Kerja Harian
                    </li>
                    <li className="flex items-center gap-2 text-[#3C3530]/65 line-through">
                      <span>✗</span> Skala Besar / Komersil
                    </li>
                    <li className="flex items-center gap-2 text-[#3C3530]/65 line-through">
                      <span>✗</span> Radeya AI Vet Chat
                    </li>
                    <li className="flex items-center gap-2 text-[#3C3530]/65 line-through">
                      <span>✗</span> Pearson Square & FCR
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <button
                    disabled
                    className="w-full py-3 bg-[#FCFAF6] border border-[#EADDC9] text-[#3C3530]/60 rounded-xl text-xs font-bold uppercase tracking-wider cursor-not-allowed"
                  >
                    {profile?.organization?.plan === 'FREE' ? 'Paket Aktif Saat Ini' : 'Bawaan'}
                  </button>
                </div>
              </div>

              {/* Card PRO */}
              <div className="bg-[#FAF7F0] border-2 border-[#859681] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 bg-[#859681] text-[#FCFAF6] text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-widest">
                  Terpopuler
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#859681]">PRO PLAN</h4>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#3C3530]">Rp 50.000</span>
                    <span className="text-[10px] text-[#3C3530]/60 font-bold uppercase">/ Bulan</span>
                  </div>
                  <p className="text-[11px] text-[#3C3530]/80 mt-3 leading-relaxed">
                    Membuka analisis medis dan pakan cerdas untuk efisiensi penuh.
                  </p>
                  <ul className="mt-6 space-y-3.5 text-[11px] text-[#3C3530]/90 font-bold">
                    <li className="flex items-center gap-2">
                      <span className="text-[#859681]">✓</span> 10 Siklus Ternak Aktif
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#859681]">✓</span> **Buka Skala Besar / Komersil**
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#859681]">✓</span> **Radeya AI Vet Chat Tanpa Batas**
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#859681]">✓</span> **Kalkulator Pearson & Rumus FCR**
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => handleCheckoutMidtrans('PRO')}
                    disabled={billingLoading}
                    className="w-full py-3 bg-[#859681] hover:bg-[#748570] text-[#FCFAF6] rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {profile?.organization?.plan === 'PRO' ? 'Perpanjang Langganan' : billingLoading ? 'Memproses...' : 'Pilih Paket PRO'}
                  </button>
                </div>
              </div>

              {/* Card ENTERPRISE */}
              <div className="bg-[#FAF7F0] border border-[#EADDC9] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <h4 className="text-sm font-black text-[#859681]">ENTERPRISE</h4>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#3C3530]">Rp 150.000</span>
                    <span className="text-[10px] text-[#3C3530]/60 font-bold uppercase">/ Bulan</span>
                  </div>
                  <p className="text-[11px] text-[#3C3530]/75 mt-3 leading-relaxed">
                    Sangat pas untuk peternakan modern komersil dengan banyak pekerja.
                  </p>
                  <ul className="mt-6 space-y-3.5 text-[11px] text-[#3C3530]/80 font-bold">
                    <li className="flex items-center gap-2">
                      <span className="text-[#859681]">✓</span> 100 Siklus Ternak Aktif
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#859681]">✓</span> **Kolaborasi Multi-user (Tim)**
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#859681]">✓</span> **1 Akun Boss + Banyak Pekerja**
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#859681]">✓</span> Hak akses input terkendali
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => handleCheckoutMidtrans('ENTERPRISE')}
                    disabled={billingLoading}
                    className="w-full py-3 bg-[#FCFAF6] hover:bg-[#EADDC9] text-[#3C3530] border border-[#EADDC9] rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#FCFAF6] border border-[#EADDC9] text-[#3C3530] px-6 py-3.5 rounded-full text-xs font-extrabold shadow-2xl z-55 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#859681] animate-ping" />
          {toastMsg}
        </div>
      )}

      </div> {/* Right Content Area */}
    </div>
  );
}
