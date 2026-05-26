'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

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
  };
  createdAt: string;
}

// --- Constants ---
const ANIMAL_LABELS: Record<string, string> = {
  ayam_petelur: '🐔 Ayam Petelur',
  ayam_pedaging: '🍗 Ayam Pedaging',
  bebek: '🦆 Bebek',
  enthok: '🦢 Enthok',
  sapi_perah: '🥛 Sapi Perah',
  sapi_pedaging: '🥩 Sapi Pedaging',
  kambing: '🐐 Kambing',
  kambing_perah: '🥛 Kambing Perah'
};

const SCALE_LABELS: Record<string, string> = {
  besar: 'Skala Besar/Komersil',
  kecil: 'Skala Kecil/Pembibitan',
  breeding: 'Mode Breeding'
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
  const isUnggas = ['ayam_petelur', 'ayam_pedaging', 'bebek', 'enthok'].includes(animal);
  const isAyamPetelur = ['ayam_petelur', 'bebek'].includes(animal);
  const isPedaging = ['ayam_pedaging', 'enthok'].includes(animal);
  const isRuminansiaDaging = ['sapi_pedaging', 'kambing'].includes(animal);

  if (scaleStr === 'breeding') return 'breeding_ruminansia';
  if (isPerah && scaleStr === 'besar') return 'susu';
  if (isPedaging && scaleStr === 'besar') return 'broiler';
  if (isAyamPetelur && scaleStr === 'besar') return 'petelur';
  if (isUnggas && scaleStr === 'kecil') return 'pembibitan_unggas';
  if (isRuminansiaDaging && scaleStr === 'besar') return 'penggemukan';
  return 'broiler';
};

export default function DashboardPage() {
  const router = useRouter();

  // --- Core States ---
  const [farmName, setFarmName] = useState('');
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [activeCycleIndex, setActiveCycleIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // --- Onboarding Setup States (If user has 0 cycles) ---
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [obStep, setObStep] = useState(1); // 1: Animal, 2: Scale
  const [selectedAnimal, setSelectedAnimal] = useState('');
  const [selectedScale, setSelectedScale] = useState('');

  // --- Modal Form States ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  
  // Dynamic Form Fields
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

  // --- Simulation States ---
  const [simHarga, setSimHarga] = useState<number>(0);

  // --- Fetch Data on Mount ---
  useEffect(() => {
    const token = localStorage.getItem('radeya_token');
    if (!token) {
      router.push('/login');
      return;
    }
    const savedFarmName = localStorage.getItem('radeya_farm_name') || 'Peternakan Saya';
    setFarmName(savedFarmName);

    fetchCyclesData();
  }, [router]);

  const fetchCyclesData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiGet('/api/v1/cycles');
      if (data && data.length > 0) {
        setCycles(data);
        setActiveCycleIndex(0);
        setIsOnboarding(false);
      } else {
        // No cycles in DB -> trigger setup onboarding screen
        setIsOnboarding(true);
        setObStep(1);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data siklus.');
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

  const handleCreateCycle = async (name: string, animal: string, scaleStr: string) => {
    setIsLoading(true);
    try {
      const mode = determineMode(animal, scaleStr);
      const initialData = {
        scaleString: scaleStr,
        modal: {},
        biaya: [],
        panen: [],
        penjualan: [],
        produksi: [],
        penetasan: [],
        kelahiran: [],
        harian: []
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
      setActiveTab(0);
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
      fetchCyclesData();
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
    switch (mode) {
      case 'broiler':
        return [
          { icon: '📊', label: 'Dashboard' },
          { icon: '📋', label: 'Modal Awal' },
          { icon: '🛒', label: 'Biaya' },
          { icon: '🎯', label: 'Panen' },
          { icon: '📈', label: 'Simulasi' }
        ];
      case 'petelur':
        return [
          { icon: '📊', label: 'Dashboard' },
          { icon: '📋', label: 'Modal Awal' },
          { icon: '🛒', label: 'Biaya' },
          { icon: '🥚', label: 'Produksi' },
          { icon: '💰', label: 'Penjualan' },
          { icon: '📈', label: 'Simulasi' }
        ];
      case 'pembibitan_unggas':
        return [
          { icon: '📊', label: 'Dashboard' },
          { icon: '📋', label: 'Modal Awal' },
          { icon: '🥚', label: 'Telur' },
          { icon: '🐣', label: 'Penetasan' },
          { icon: '💰', label: 'Penjualan' }
        ];
      case 'penggemukan':
        return [
          { icon: '📊', label: 'Dashboard' },
          { icon: '📋', label: 'Modal Awal' },
          { icon: '🛒', label: 'Biaya' },
          { icon: '🎯', label: 'Panen' },
          { icon: '📈', label: 'Simulasi' }
        ];
      case 'susu':
        return [
          { icon: '📊', label: 'Dashboard' },
          { icon: '📋', label: 'Modal Awal' },
          { icon: '🛒', label: 'Biaya' },
          { icon: '🥛', label: 'Produksi' },
          { icon: '💰', label: 'Penjualan' },
          { icon: '📈', label: 'Simulasi' }
        ];
      case 'breeding_ruminansia':
        return [
          { icon: '📊', label: 'Dashboard' },
          { icon: '📋', label: 'Modal Awal' },
          { icon: '🐣', label: 'Kelahiran' },
          { icon: '💰', label: 'Penjualan' }
        ];
      default:
        return [{ icon: '📊', label: 'Dashboard' }];
    }
  };

  const getScaleOptions = (animal: string) => {
    const isUnggas = ['ayam_petelur', 'ayam_pedaging', 'bebek', 'enthok'].includes(animal);
    const isPerah = ['sapi_perah', 'kambing_perah'].includes(animal);

    if (isUnggas) {
      return [
        { val: 'besar', icon: '🏭', title: 'Skala Besar/Komersil', desc: 'DOC beli, kandang besar, jual bobot' },
        { val: 'kecil', icon: '🏡', title: 'Skala Kecil/Pembibitan', desc: 'Indukan sendiri, jual DOC & remaja' }
      ];
    } else if (isPerah) {
      return [
        { val: 'besar', icon: '🏭', title: 'Skala Besar/Komersil', desc: 'Produksi susu harian, setor ke koperasi' }
      ];
    } else {
      return [
        { val: 'besar', icon: '🏭', title: 'Skala Penggemukan', desc: 'Beli bakalan, jual setelah gemuk' },
        { val: 'breeding', icon: '🐣', title: 'Mode Breeding', desc: 'Ternak indukan, jual anak/bakalan' }
      ];
    }
  };

  // --- Business Logic Calculation Core ---
  const calculateStats = () => {
    const cycle = getActiveCycle();
    if (!cycle) return null;

    const data = cycle.data || {};
    const mode = cycle.mode;

    if (mode === 'broiler') {
      const m = data.modal || {};
      const totalDOC = (parseFloat(m.jml_doc) || 0) * (parseFloat(m.harga_doc) || 0);
      const biayaKandang = parseFloat(m.biaya_kandang) || 0;
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
      const laba = totalPendapatan - totalModal;
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
      const tglDoc = m.tgl_doc ? new Date(m.tgl_doc) : null;
      let umur = 0;
      if (tglDoc) umur = Math.floor((new Date().getTime() - tglDoc.getTime()) / 86400000);
      const bbRata = jmlDoc > 0 ? totalKgPanen / (jmlDoc - mati) || 0 : 0;
      const ip = (fcr > 0 && umur > 0) ? (srPct / 100 * bbRata) / (fcr * umur) * 100 : 0;

      return {
        totalModal, totalPendapatan, laba, totalKgPanen, hpp, fcr, srPct, umur, ip,
        breakdown: [
          { label: 'DOC', val: totalDOC },
          { label: 'Kandang', val: biayaKandang },
          { label: 'Pakan', val: totalPakan },
          { label: 'Obat/Vaksin', val: totalObat },
          { label: 'Lain-lain', val: totalLain }
        ]
      };
    }

    if (mode === 'petelur') {
      const m = data.modal || {};
      const totalIndukan = (parseFloat(m.jml_ekor) || 0) * (parseFloat(m.harga_ekor) || 0);
      const biayaKandang = parseFloat(m.biaya_kandang) || 0;
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
      const laba = totalPendapatan - totalModal;

      const jmlAyam = parseFloat(m.jml_ekor) || 1;
      const henDay = (data.harian || []).length > 0 ? (totalButir / (data.harian || []).length / jmlAyam) * 100 : 0;

      const totalKgPakan = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => {
        return s + (parseFloat(b.sak) || 0) * (parseFloat(b.kg_sak) || 0);
      }, 0);
      const fcrTelur = totalKgTelur > 0 ? totalKgPakan / totalKgTelur : 0;
      const hppButir = totalButir > 0 ? totalModal / totalButir : 0;
      const hppKg = totalKgTelur > 0 ? totalModal / totalKgTelur : 0;

      return { totalModal, totalPendapatan, laba, totalButir, totalKgTelur, totalRetak, henDay, fcrTelur, hppButir, hppKg };
    }

    if (mode === 'pembibitan_unggas') {
      const m = data.modal || {};
      const totalIndukan = ((parseFloat(m.jml_betina) || 0) + (parseFloat(m.jml_jantan) || 0)) * (parseFloat(m.harga_indukan) || 0);
      const totalBiaya = (data.biaya || []).reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      const totalModal = totalIndukan + totalBiaya;

      const telurMasukTetas = (data.produksi || []).reduce((s: number, p: any) => s + (parseFloat(p.masuk_tetas) || 0), 0);
      const docMenetas = (data.penetasan || []).reduce((s: number, p: any) => s + (parseFloat(p.berhasil) || 0), 0);
      const gagalTetas = (data.penetasan || []).reduce((s: number, p: any) => s + (parseFloat(p.gagal) || 0), 0);
      const dayaTetas = telurMasukTetas > 0 ? (docMenetas / telurMasukTetas) * 100 : 0;

      const totalTerjual = (data.penjualan || []).reduce((s: number, p: any) => s + (parseFloat(p.jml) || 0), 0);
      const totalPendapatan = (data.penjualan || []).reduce((s: number, p: any) => s + (parseFloat(p.total) || 0), 0);

      const jmlBetina = parseFloat(m.jml_betina) || 0;
      const jmlJantan = parseFloat(m.jml_jantan) || 0;
      const populasi = jmlBetina + jmlJantan + docMenetas - totalTerjual;
      const laba = totalPendapatan - totalModal;
      const margin = totalModal > 0 ? (laba / totalModal) * 100 : 0;

      return { totalModal, totalPendapatan, laba, margin, dayaTetas, docMenetas, populasi, telurMasukTetas, gagalTetas };
    }

    if (mode === 'penggemukan') {
      const m = data.modal || {};
      const jmlEkor = parseFloat(m.jml_ekor) || 0;
      const bbAwal = parseFloat(m.bb_awal) || 0;
      const hargaBakalan = parseFloat(m.harga_kg_bakalan) || 0;
      const biayaKandang = parseFloat(m.biaya_kandang) || 0;
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

      const laba = totalPendapatan - totalModal;
      const hpp = totalKgPanen > 0 ? totalModal / totalKgPanen : 0;
      const totalKgPakan = (data.biaya || []).reduce((s: number, b: any) => s + (parseFloat(b.kg) || 0), 0);
      const fcr = totalKgPanen > 0 ? totalKgPakan / totalKgPanen : 0;

      const tglBeli = m.tgl_beli ? new Date(m.tgl_beli) : null;
      let lamaHari = 0;
      if (tglBeli) lamaHari = Math.floor((new Date().getTime() - tglBeli.getTime()) / 86400000);
      const bbAkhirRata = panen.length > 0 ? parseFloat(panen[panen.length - 1].bb_akhir) || 0 : 0;
      const adg = lamaHari > 0 ? (bbAkhirRata - bbAwal) / lamaHari * 1000 : 0;

      return { totalModal, totalPendapatan, laba, hpp, fcr, adg, lamaHari, totalKgPanen };
    }

    if (mode === 'susu') {
      const m = data.modal || {};
      const totalIndukan = (parseFloat(m.jml_ekor) || 0) * (parseFloat(m.harga_ekor) || 0);
      const biayaKandang = parseFloat(m.biaya_kandang) || 0;
      const totalBiaya = (data.biaya || []).reduce((s: number, b: any) => s + (parseFloat(b.total) || 0), 0);
      const totalModal = totalIndukan + biayaKandang + totalBiaya;

      const totalLiter = (data.harian || []).reduce((s: number, h: any) => s + (parseFloat(h.liter) || 0), 0);
      const totalPendapatan = (data.penjualan || []).reduce((s: number, p: any) => s + (parseFloat(p.total) || 0), 0);
      const laba = totalPendapatan - totalModal;

      const jmlEkor = parseFloat(m.jml_ekor) || 1;
      const hariProduksi = (data.harian || []).length;
      const produksiRata = hariProduksi > 0 ? totalLiter / hariProduksi / jmlEkor : 0;

      const totalKgPakanKering = (data.biaya || []).filter((b: any) => b.type === 'pakan').reduce((s: number, b: any) => s + (parseFloat(b.kg) || 0), 0);
      const fcrSusu = totalLiter > 0 ? totalKgPakanKering / totalLiter : 0;
      const hppLiter = totalLiter > 0 ? totalModal / totalLiter : 0;

      return { totalModal, totalPendapatan, laba, totalLiter, produksiRata, fcrSusu, hppLiter };
    }

    if (mode === 'breeding_ruminansia') {
      const m = data.modal || {};
      const jmlBetina = parseFloat(m.jml_betina) || 0;
      const jmlJantan = parseFloat(m.jml_jantan) || 0;
      const hargaEkor = parseFloat(m.harga_ekor) || 0;
      const totalModal = (jmlBetina + jmlJantan) * hargaEkor;

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

      const laba = totalPendapatan - totalModal;
      const keuntunganPct = totalModal > 0 ? (laba / totalModal) * 100 : 0;

      return { totalModal, totalPendapatan, laba, keuntunganPct, populasiTotal, populasiBetina, populasiJantan, totalLahir, nilaiAset };
    }

    return null;
  };

  // --- Currency Formatter ---
  const formatRp = (val: any) => {
    const n = parseFloat(val) || 0;
    if (Math.abs(n) >= 1000000) return (n < 0 ? '-' : '') + 'Rp' + (Math.abs(n) / 1000000).toFixed(1) + 'jt';
    if (Math.abs(n) >= 1000) return (n < 0 ? '-' : '') + 'Rp' + Math.abs(n).toLocaleString('id-ID');
    return (n < 0 ? '-' : '') + 'Rp' + Math.abs(n).toFixed(0);
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
    } else if (type === 'modal_biaya_ruminansia') {
      setModalTitle('🌿 Tambah Biaya Operasional');
      setFormFields({ tgl: todayStr, type: 'pakan', nama: '', kg: '0', total: '' });
    } else if (type === 'modal_biaya_susu') {
      setModalTitle('🌿 Tambah Biaya Produksi Susu');
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
    const name = prompt('Nama siklus baru? (contoh: Siklus 2, Periode Juni)');
    if (!name) return;
    const cycle = getActiveCycle();
    if (cycle) {
      handleCreateCycle(name, cycle.animal, intToScale(cycle.scale));
    }
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

  // --- Dynamic Previews on Input ---
  const updateFormField = (key: string, value: string) => {
    setFormFields((prev: any) => {
      const next = { ...prev, [key]: value };
      
      // Realtime calculations inside forms
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

  // --- Render Layouts ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Menghubungkan ke database Radeya...</p>
      </div>
    );
  }

  // --- onboarding wizard view ---
  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-900 via-slate-900 to-slate-950 flex flex-col font-sans">
        <div className="max-w-xl mx-auto w-full px-4 py-12 flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="text-4xl font-black tracking-tight text-white mb-2">
              RADE<span className="text-emerald-400">YA</span>
            </div>
            <div className="text-sm font-semibold text-slate-400">Catat, Jual, Untung 🌿</div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-teal-500/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />

            {obStep === 1 ? (
              <div className="relative">
                <h2 className="text-2xl font-black text-slate-100 mb-2">Ternakmu apa?</h2>
                <p className="text-sm text-slate-400 mb-6">Pilih jenis ternak agar formulir disesuaikan dengan kebutuhan Anda 👇</p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {Object.entries(ANIMAL_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedAnimal(key)}
                      className={`flex flex-col items-center justify-center bg-slate-800/40 border-2 py-5 px-3 rounded-2xl transition-all ${
                        selectedAnimal === key 
                          ? 'border-teal-500 bg-teal-950/20 text-teal-400 shadow-lg shadow-teal-500/10 scale-[1.02]' 
                          : 'border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-3xl mb-2">{label.split(' ')[0]}</span>
                      <span className="text-xs font-bold">{label.split(' ').slice(1).join(' ')}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setObStep(2)}
                  disabled={!selectedAnimal}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Lanjut Pilih Skala &rarr;
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setObStep(1)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-300 mb-4 inline-flex items-center gap-1"
                >
                  &larr; Kembali
                </button>
                <h2 className="text-2xl font-black text-slate-100 mb-2">Skala usahamu?</h2>
                <p className="text-sm text-slate-400 mb-6">Pengaturan skala ini krusial untuk mencocokkan formula performa ternak 💡</p>

                <div className="space-y-3 mb-8">
                  {getScaleOptions(selectedAnimal).map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setSelectedScale(opt.val)}
                      className={`w-full flex items-center gap-4 bg-slate-800/40 border-2 p-5 rounded-2xl text-left transition-all ${
                        selectedScale === opt.val
                          ? 'border-teal-500 bg-teal-950/20 text-teal-400 shadow-lg shadow-teal-500/10'
                          : 'border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-3xl">{opt.icon}</span>
                      <div>
                        <div className="font-bold text-slate-200">{opt.title}</div>
                        <div className="text-xs text-slate-550 mt-0.5">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleOnboardingSubmit}
                  disabled={!selectedScale}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Masuk ke Aplikasi &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Main Application View ---
  const activeCycle = getActiveCycle();
  if (!activeCycle) return null;

  const tabs = getTabsForMode(activeCycle.mode);
  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center font-black text-xl text-slate-950">
              R
            </div>
            <div>
              <span className="font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent text-lg">
                RADEYA
              </span>
              <span className="text-xs block text-slate-500 -mt-1">Peternakan Indonesia</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetSetupPrompt}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs font-semibold rounded-lg border border-slate-700/50 transition-colors"
            >
              Ganti Ternak
            </button>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 bg-slate-850 hover:bg-rose-900/20 text-rose-400 text-xs font-semibold rounded-lg border border-rose-900/20 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Cycle Selector Bar */}
      <section className="bg-gradient-to-r from-teal-900 to-cyan-900 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{ANIMAL_LABELS[activeCycle.animal]?.split(' ')[0]}</span>
              {ANIMAL_LABELS[activeCycle.animal]?.split(' ').slice(1).join(' ') || activeCycle.animal}
              <span className="text-xs px-2 py-0.5 bg-white/20 text-teal-200 rounded-md font-medium uppercase">
                {SCALE_LABELS[intToScale(activeCycle.scale)] || intToScale(activeCycle.scale)}
              </span>
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-300">Pilih Periode/Siklus:</span>
              <select
                value={activeCycleIndex}
                onChange={(e) => {
                  setActiveCycleIndex(parseInt(e.target.value));
                  setActiveTab(0);
                }}
                className="bg-white/10 text-white border-0 rounded-lg px-2.5 py-1 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-teal-400"
              >
                {cycles.map((c, i) => (
                  <option key={c.id} value={i} className="text-slate-800">
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddNewCyclePrompt}
                className="px-2 py-1 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold rounded-md transition-colors"
              >
                + Baru
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-200 font-semibold">{farmName} (Railway PostgreSQL Sync)</span>
          </div>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="bg-slate-900 border-b border-slate-850 px-4">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto py-3 no-scrollbar">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === i
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
                  : 'bg-slate-800/40 text-slate-450 hover:bg-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Contents */}
      <main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1 pb-24">
        {stats && activeTab === 0 && (
          // --- TAB 0: DASHBOARD SUMMARY ---
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl relative overflow-hidden shadow-xl ${
              stats.laba >= 0 
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white' 
                : 'bg-gradient-to-tr from-rose-700 to-pink-600 text-white'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <span className="text-xs font-bold uppercase tracking-wider opacity-75">Laba Bersih Siklus Ini</span>
              <h3 className="text-4xl font-black mt-2 tracking-tight">{formatRp(stats.laba)}</h3>
              <p className="text-xs mt-2 opacity-90 font-medium">
                {stats.laba >= 0 ? '🎉 Alhamdulillah, hasil panen menguntungkan!' : '⚠️ Pengeluaran masih lebih tinggi dari pendapatan.'}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Total Pengeluaran</span>
                <span className="text-lg font-extrabold text-rose-400 mt-2 block">{formatRp(stats.totalModal)}</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Total Pendapatan</span>
                <span className="text-lg font-extrabold text-emerald-400 mt-2 block">{formatRp(stats.totalPendapatan)}</span>
              </div>

              {/* Dynamic Stats Based on Mode */}
              {activeCycle.mode === 'broiler' && (
                <>
                  <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">HPP / kg</span>
                    <span className="text-lg font-extrabold text-slate-200 mt-2 block">{formatRp(stats.hpp)}</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">FCR Pakan</span>
                    <span className="text-lg font-extrabold text-teal-400 mt-2 block">{(stats.fcr || 0).toFixed(2)}</span>
                  </div>
                </>
              )}

              {activeCycle.mode === 'petelur' && (
                <>
                  <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Hen Day %</span>
                    <span className="text-lg font-extrabold text-teal-400 mt-2 block">{(stats.henDay || 0).toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">HPP / Butir</span>
                    <span className="text-lg font-extrabold text-slate-200 mt-2 block">{formatRp(stats.hppButir)}</span>
                  </div>
                </>
              )}

              {activeCycle.mode === 'pembibitan_unggas' && (
                <>
                  <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Daya Tetas</span>
                    <span className="text-lg font-extrabold text-teal-400 mt-2 block">{(stats.dayaTetas || 0).toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Populasi Aktif</span>
                    <span className="text-lg font-extrabold text-slate-200 mt-2 block">{stats.populasi} ekor</span>
                  </div>
                </>
              )}

              {activeCycle.mode === 'penggemukan' && (
                <>
                  <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">ADG (g/hari)</span>
                    <span className="text-lg font-extrabold text-teal-400 mt-2 block">{(stats.adg || 0).toFixed(0)}g</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Lama Penggemukan</span>
                    <span className="text-lg font-extrabold text-slate-200 mt-2 block">{stats.lamaHari} Hari</span>
                  </div>
                </>
              )}

              {activeCycle.mode === 'susu' && (
                <>
                  <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Rata-rata/ekor/hari</span>
                    <span className="text-lg font-extrabold text-teal-400 mt-2 block">{(stats.produksiRata || 0).toFixed(1)} L</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">HPP / Liter</span>
                    <span className="text-lg font-extrabold text-slate-200 mt-2 block">{formatRp(stats.hppLiter)}</span>
                  </div>
                </>
              )}

              {activeCycle.mode === 'breeding_ruminansia' && (
                <>
                  <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Populasi Total</span>
                    <span className="text-lg font-extrabold text-teal-400 mt-2 block">{stats.populasiTotal} ekor</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Total Kelahiran</span>
                    <span className="text-lg font-extrabold text-slate-200 mt-2 block">{stats.totalLahir} ekor</span>
                  </div>
                </>
              )}
            </div>

            {/* Aset Card for Breeding */}
            {activeCycle.mode === 'breeding_ruminansia' && (
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-3xl border border-blue-700/30">
                <span className="text-xs font-bold text-blue-200 block uppercase">Estimasi Nilai Aset Peternakan</span>
                <span className="text-3xl font-black text-white mt-1 block">{formatRp(stats.nilaiAset)}</span>
                <span className="text-[10px] text-blue-300 block mt-2">*Taksiran berdasarkan Jumlah Populasi × Bobot Rata-rata (30kg) × Harga Pasar</span>
              </div>
            )}

            {/* Cost Breakdown Progress Bars */}
            {stats.breakdown && (
              <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl">
                <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <span>📊</span> Rincian Anggaran & Pengeluaran
                </h3>
                <div className="space-y-4">
                  {stats.breakdown.map((item: any, i: number) => {
                    const pct = stats.totalModal > 0 ? (item.val / stats.totalModal) * 100 : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="text-slate-200">
                            {formatRp(item.val)} <span className="text-slate-500 font-medium">({pct.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                          <div className="bg-teal-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleCSVExport}
                className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                📥 Ekspor Data (CSV)
              </button>
              <button
                onClick={handleConfirmDeleteCycle}
                className="flex-1 py-3 px-4 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/25 font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                🗑️ Hapus Siklus Ini
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 1: MODAL AWAL FORM --- */}
        {activeTab === 1 && (
          <div className="max-w-2xl mx-auto bg-slate-900/40 border border-slate-850 p-6 rounded-3xl space-y-6">
            <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <span>📋</span> Data Modal Awal Siklus
            </h3>

            {activeCycle.mode === 'broiler' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Tanggal Masuk DOC</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_doc || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_doc: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Jumlah DOC (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 1000"
                    value={activeCycle.data?.modal?.jml_doc || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_doc: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Harga per Ekor (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 8000"
                    value={activeCycle.data?.modal?.harga_doc || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_doc: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Biaya Penyusutan Kandang per Siklus (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 500000"
                    value={activeCycle.data?.modal?.biaya_kandang || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), biaya_kandang: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'petelur' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Tanggal Masuk Pullet</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_pullet || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_pullet: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Jumlah Ayam Pullet (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 500"
                    value={activeCycle.data?.modal?.jml_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Harga Beli per Ekor (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 80000"
                    value={activeCycle.data?.modal?.harga_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Biaya Penyusutan Kandang per Siklus (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 1000000"
                    value={activeCycle.data?.modal?.biaya_kandang || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), biaya_kandang: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'pembibitan_unggas' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Jumlah Betina (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 50"
                    value={activeCycle.data?.modal?.jml_betina || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_betina: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Jumlah Jantan (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 5"
                    value={activeCycle.data?.modal?.jml_jantan || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_jantan: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Harga Indukan per Ekor (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 150000"
                    value={activeCycle.data?.modal?.harga_indukan || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_indukan: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'penggemukan' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Tanggal Beli Bakalan</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_beli || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_beli: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Jumlah Ekor Bakalan</label>
                  <input
                    type="number"
                    placeholder="Contoh: 10"
                    value={activeCycle.data?.modal?.jml_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">BB Awal Rata-rata (kg/ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 150"
                    value={activeCycle.data?.modal?.bb_awal || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), bb_awal: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Harga Bakalan per kg (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 55000"
                    value={activeCycle.data?.modal?.harga_kg_bakalan || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_kg_bakalan: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Biaya Kandang/Siklus (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 500000"
                    value={activeCycle.data?.modal?.biaya_kandang || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), biaya_kandang: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'susu' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Tanggal Beli Induk</label>
                  <input
                    type="date"
                    value={activeCycle.data?.modal?.tgl_beli || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), tgl_beli: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Jumlah Induk (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 5"
                    value={activeCycle.data?.modal?.jml_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Harga Beli per Induk (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 15000000"
                    value={activeCycle.data?.modal?.harga_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Biaya Kandang/Siklus (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 2000000"
                    value={activeCycle.data?.modal?.biaya_kandang || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), biaya_kandang: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
              </div>
            )}

            {activeCycle.mode === 'breeding_ruminansia' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Jumlah Induk Betina (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 10"
                    value={activeCycle.data?.modal?.jml_betina || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_betina: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Jumlah Pejantan (Ekor)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 2"
                    value={activeCycle.data?.modal?.jml_jantan || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), jml_jantan: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Harga Beli per Ekor (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 3000000"
                    value={activeCycle.data?.modal?.harga_ekor || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_ekor: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block uppercase">Harga Pasar per kg Hidup saat ini (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 60000"
                    value={activeCycle.data?.modal?.harga_pasar || ''}
                    onChange={(e) => {
                      const modal = { ...(activeCycle.data?.modal || {}), harga_pasar: e.target.value };
                      handleSaveCycleData({ ...activeCycle.data, modal });
                    }}
                    className="w-full bg-slate-850/50 border border-slate-750 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-slate-200 font-semibold"
                  />
                </div>
              </div>
            )}

            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl">
              <div className="text-xs font-bold block uppercase opacity-75">Preview Total Modal Awal:</div>
              <div className="text-xl font-black mt-1">
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
        )}

        {/* --- TAB 2: BIAYA OPERASIONAL --- */}
        {activeTab === 2 && (
          <div className="space-y-6">
            {/* Split view for Pakan, Obat, Lain-lain */}
            {(activeCycle.mode === 'broiler' || activeCycle.mode === 'petelur') ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Pakan */}
                <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-200 mb-4 flex items-center justify-between">
                      <span>🌾 Biaya Pakan</span>
                      <span className="text-[10px] px-2 py-0.5 bg-teal-950/40 text-teal-400 rounded-md">
                        {((activeCycle.data?.biaya || []).filter((b: any) => b.type === 'pakan').length)} Catatan
                      </span>
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {(activeCycle.data?.biaya || []).filter((b: any) => b.type === 'pakan').length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-550">Belum ada catatan pakan.</div>
                      ) : (
                        (activeCycle.data?.biaya || []).filter((b: any) => b.type === 'pakan').map((b: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-slate-900/80 p-3.5 rounded-xl border border-slate-850">
                            <div>
                              <div className="text-xs font-bold text-slate-300">{b.jenis || 'Pakan'}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{b.sak} sak × {b.kg_sak}kg/sak · {b.tgl}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-teal-400">{formatRp(b.total)}</span>
                              <button onClick={() => handleDeleteListItem('biaya', (activeCycle.data?.biaya || []).indexOf(b))} className="text-rose-500 hover:text-rose-400 font-black text-xs px-1">✕</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openModalForm('modal_pakan')}
                    className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-350 text-xs font-bold rounded-xl border border-slate-700/50 transition-all"
                  >
                    + Tambah Pakan
                  </button>
                </div>

                {/* Obat */}
                <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-200 mb-4 flex items-center justify-between">
                      <span>💊 Obat & Vaksin</span>
                      <span className="text-[10px] px-2 py-0.5 bg-teal-950/40 text-teal-400 rounded-md">
                        {((activeCycle.data?.biaya || []).filter((b: any) => b.type === 'obat').length)} Catatan
                      </span>
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {(activeCycle.data?.biaya || []).filter((b: any) => b.type === 'obat').length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-550">Belum ada catatan obat.</div>
                      ) : (
                        (activeCycle.data?.biaya || []).filter((b: any) => b.type === 'obat').map((b: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-slate-900/80 p-3.5 rounded-xl border border-slate-850">
                            <div>
                              <div className="text-xs font-bold text-slate-300">{b.nama || 'Obat/Vaksin'}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{b.keterangan || 'Tanpa Keterangan'} · {b.tgl}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-teal-400">{formatRp(b.total)}</span>
                              <button onClick={() => handleDeleteListItem('biaya', (activeCycle.data?.biaya || []).indexOf(b))} className="text-rose-500 hover:text-rose-400 font-black text-xs px-1">✕</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openModalForm('modal_obat')}
                    className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-350 text-xs font-bold rounded-xl border border-slate-700/50 transition-all"
                  >
                    + Tambah Obat
                  </button>
                </div>

                {/* Lain */}
                <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-200 mb-4 flex items-center justify-between">
                      <span>📦 Biaya Lain</span>
                      <span className="text-[10px] px-2 py-0.5 bg-teal-950/40 text-teal-400 rounded-md">
                        {((activeCycle.data?.biaya || []).filter((b: any) => b.type === 'lain').length)} Catatan
                      </span>
                    </h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {(activeCycle.data?.biaya || []).filter((b: any) => b.type === 'lain').length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-550">Belum ada catatan biaya lain.</div>
                      ) : (
                        (activeCycle.data?.biaya || []).filter((b: any) => b.type === 'lain').map((b: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-slate-900/80 p-3.5 rounded-xl border border-slate-850">
                            <div>
                              <div className="text-xs font-bold text-slate-300">{b.nama || 'Biaya Lain'}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{b.keterangan || 'Tanpa Keterangan'} · {b.tgl}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-teal-400">{formatRp(b.total)}</span>
                              <button onClick={() => handleDeleteListItem('biaya', (activeCycle.data?.biaya || []).indexOf(b))} className="text-rose-500 hover:text-rose-400 font-black text-xs px-1">✕</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openModalForm('modal_lain')}
                    className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-350 text-xs font-bold rounded-xl border border-slate-700/50 transition-all"
                  >
                    + Tambah Biaya
                  </button>
                </div>

              </div>
            ) : (
              // Ruminansia/Susu/Breeding mode: single list for operasional
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl max-w-2xl mx-auto">
                <h4 className="font-bold text-slate-200 mb-4 flex items-center justify-between">
                  <span>🌿 Biaya Operasional</span>
                  <span className="text-[10px] px-2 py-0.5 bg-teal-950/40 text-teal-400 rounded-md">
                    {(activeCycle.data?.biaya || []).length} Catatan
                  </span>
                </h4>
                <div className="space-y-3">
                  {(activeCycle.data?.biaya || []).length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">Belum ada biaya operasional dicatat.</div>
                  ) : (
                    (activeCycle.data?.biaya || []).map((b: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-850">
                        <div>
                          <div className="text-sm font-bold text-slate-200">{b.nama || b.type}</div>
                          <div className="text-xs text-slate-500 mt-1">Jenis: <strong className="uppercase">{b.type}</strong> · Volume: {b.kg || 0} kg · {b.tgl}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-teal-400">{formatRp(b.total)}</span>
                          <button onClick={() => handleDeleteListItem('biaya', i)} className="text-rose-500 hover:text-rose-400 font-bold px-2 py-1">✕</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => openModalForm(activeCycle.mode === 'susu' ? 'modal_biaya_susu' : 'modal_biaya_ruminansia')}
                  className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-350 text-sm font-bold rounded-xl border border-slate-700/50 transition-all"
                >
                  + Tambah Biaya Operasional
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: PANEN / PRODUKSI --- */}
        {activeTab === 3 && (
          <div className="max-w-2xl mx-auto bg-slate-900/40 border border-slate-850 p-6 rounded-3xl space-y-6">
            <h3 className="text-xl font-bold text-slate-200 flex items-center justify-between">
              <span>{activeCycle.mode === 'susu' ? '🥛 Produksi Susu Harian' : activeCycle.mode === 'petelur' ? '🥚 Produksi Telur Harian' : '🎯 Data Panen/Jual'}</span>
              <span className="text-[10px] px-2 py-0.5 bg-teal-950/40 text-teal-400 rounded-md">
                {(activeCycle.mode === 'susu' || activeCycle.mode === 'petelur' ? (activeCycle.data?.harian || []).length : (activeCycle.data?.panen || []).length)} Catatan
              </span>
            </h3>

            <div className="space-y-3">
              {activeCycle.mode === 'broiler' && (
                <>
                  {(activeCycle.data?.panen || []).length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Belum ada data panen broiler dicatat.</div>
                  ) : (
                    (activeCycle.data?.panen || []).map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-850">
                        <div>
                          <div className="text-sm font-bold text-slate-200">{p.tgl} — {p.kg.toLocaleString('id-ID')} kg</div>
                          <div className="text-xs text-slate-550 mt-1">Harga: {formatRp(p.harga_kg)}/kg · Kematian: {p.jml_mati || 0} ekor</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-emerald-400">{formatRp(p.kg * p.harga_kg)}</span>
                          <button onClick={() => handleDeleteListItem('panen', i)} className="text-rose-500 hover:text-rose-400 font-bold px-2">✕</button>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_panen_broiler')}
                    className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-xl border border-slate-700/50 transition-all text-sm"
                  >
                    + Catat Panen Broiler
                  </button>
                </>
              )}

              {activeCycle.mode === 'petelur' && (
                <>
                  {(activeCycle.data?.harian || []).length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Belum ada data harian produksi telur.</div>
                  ) : (
                    (activeCycle.data?.harian || []).map((h: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-850">
                        <div>
                          <div className="text-sm font-bold text-slate-200">{h.tgl}</div>
                          <div className="text-xs text-slate-550 mt-1">Telur: {h.butir} butir · Berat: {h.kg || 0} kg · Retak: {h.retak || 0} butir</div>
                        </div>
                        <button onClick={() => handleDeleteListItem('harian', i)} className="text-rose-500 hover:text-rose-400 font-bold px-2">✕</button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_harian_petelur')}
                    className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-xl border border-slate-700/50 transition-all text-sm"
                  >
                    + Catat Produksi Harian
                  </button>
                </>
              )}

              {activeCycle.mode === 'pembibitan_unggas' && (
                <>
                  {(activeCycle.data?.penetasan || []).length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Belum ada data penetasan.</div>
                  ) : (
                    (activeCycle.data?.penetasan || []).map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-850">
                        <div>
                          <div className="text-sm font-bold text-slate-200">Menetas: {p.tgl}</div>
                          <div className="text-xs text-slate-550 mt-1">Berhasil: <strong className="text-emerald-400">{p.berhasil} DOC</strong> · Gagal/Infertil: {p.gagal} butir</div>
                        </div>
                        <button onClick={() => handleDeleteListItem('penetasan', i)} className="text-rose-500 hover:text-rose-400 font-bold px-2">✕</button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_penetasan')}
                    className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-xl border border-slate-700/50 transition-all text-sm"
                  >
                    + Catat Penetasan Telur
                  </button>
                </>
              )}

              {activeCycle.mode === 'penggemukan' && (
                <>
                  {(activeCycle.data?.panen || []).length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Belum ada penjualan ruminansia.</div>
                  ) : (
                    (activeCycle.data?.panen || []).map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-850">
                        <div>
                          <div className="text-sm font-bold text-slate-200">{p.tgl} — {p.jml_jual} Ekor</div>
                          <div className="text-xs text-slate-550 mt-1">BB Rata: {p.bb_akhir} kg · Harga: {formatRp(p.harga_kg)}/kg · Mati: {p.jml_mati || 0}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-emerald-400">{formatRp(p.jml_jual * p.bb_akhir * p.harga_kg)}</span>
                          <button onClick={() => handleDeleteListItem('panen', i)} className="text-rose-500 hover:text-rose-400 font-bold px-2">✕</button>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_panen_penggemukan')}
                    className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-xl border border-slate-700/50 transition-all text-sm"
                  >
                    + Catat Penjualan Penggemukan
                  </button>
                </>
              )}

              {activeCycle.mode === 'susu' && (
                <>
                  {(activeCycle.data?.harian || []).length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Belum ada data produksi susu.</div>
                  ) : (
                    (activeCycle.data?.harian || []).map((h: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-850">
                        <div>
                          <div className="text-sm font-bold text-slate-200">{h.tgl}</div>
                          <div className="text-xs text-slate-550 mt-1">Total Produksi Susu: <strong className="text-teal-400">{h.liter} Liter</strong></div>
                        </div>
                        <button onClick={() => handleDeleteListItem('harian', i)} className="text-rose-500 hover:text-rose-400 font-bold px-2">✕</button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_harian_susu')}
                    className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-xl border border-slate-700/50 transition-all text-sm"
                  >
                    + Catat Produksi Harian Susu
                  </button>
                </>
              )}

              {activeCycle.mode === 'breeding_ruminansia' && (
                <>
                  {(activeCycle.data?.kelahiran || []).length === 0 ? (
                    <div className="text-center py-12 text-slate-500">Belum ada kelahiran tercatat.</div>
                  ) : (
                    (activeCycle.data?.kelahiran || []).map((k: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-850">
                        <div>
                          <div className="text-sm font-bold text-slate-200">{k.tgl} — ID Induk: {k.id_induk || '-'}</div>
                          <div className="text-xs text-slate-550 mt-1">Anak Jantan: {k.jantan} ekor · Anak Betina: {k.betina} ekor</div>
                        </div>
                        <button onClick={() => handleDeleteListItem('kelahiran', i)} className="text-rose-500 hover:text-rose-400 font-bold px-2">✕</button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => openModalForm('modal_kelahiran')}
                    className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-xl border border-slate-700/50 transition-all text-sm"
                  >
                    + Catat Kelahiran Baru
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 4: PENJUALAN --- */}
        {activeTab === 4 && (
          <div className="max-w-2xl mx-auto bg-slate-900/40 border border-slate-850 p-6 rounded-3xl space-y-6">
            <h3 className="text-xl font-bold text-slate-200 flex items-center justify-between">
              <span>💰 Catat Penjualan Hasil Produksi</span>
              <span className="text-[10px] px-2 py-0.5 bg-teal-950/40 text-teal-400 rounded-md">
                {(activeCycle.data?.penjualan || []).length} Transaksi
              </span>
            </h3>

            <div className="space-y-3">
              {(activeCycle.data?.penjualan || []).length === 0 ? (
                <div className="text-center py-12 text-slate-550 text-sm">Belum ada transaksi penjualan dicatat.</div>
              ) : (
                (activeCycle.data?.penjualan || []).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-850">
                    <div>
                      <div className="text-sm font-bold text-slate-200">{p.tgl} {p.tipe || p.kategori ? `— ${p.tipe || p.kategori}` : ''}</div>
                      <div className="text-xs text-slate-550 mt-1">
                        {p.kg ? `Volume: ${p.kg} kg · Harga: ${formatRp(p.harga_kg)}/kg` : p.liter ? `Volume: ${p.liter} L · Harga: ${formatRp(p.harga_liter)}/L` : `Qty: ${p.jml} ekor · Harga: ${formatRp(p.harga_ekor)}/ekor`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-emerald-400">{formatRp(p.total)}</span>
                      <button onClick={() => handleDeleteListItem('penjualan', i)} className="text-rose-500 hover:text-rose-400 font-bold px-2">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => openModalForm(
                activeCycle.mode === 'petelur' 
                  ? 'modal_jual_petelur' 
                  : activeCycle.mode === 'susu'
                  ? 'modal_jual_susu'
                  : activeCycle.mode === 'pembibitan_unggas'
                  ? 'modal_jual_doc'
                  : 'modal_jual_breeding'
              )}
              className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-xl border border-slate-700/50 transition-all text-sm"
            >
              + Catat Penjualan Baru
            </button>
          </div>
        )}

        {/* --- TAB: SIMULASI / HARGA PASAR --- */}
        {activeTab === 5 && (
          <div className="max-w-2xl mx-auto bg-slate-900/40 border border-slate-850 p-6 rounded-3xl space-y-6">
            <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <span>📈</span> Simulasi Laba Berdasarkan Harga Jual
            </h3>
            <p className="text-xs text-slate-500">Geser slider di bawah ini untuk mensimulasikan dampak naik-turunnya harga jual di pasar terhadap margin laba bersih Anda.</p>
            
            {/* Setup initial slider value if not set */}
            {(() => {
              const currentHarga = simHarga || (activeCycle.mode === 'broiler' ? 22000 : activeCycle.mode === 'petelur' ? 28000 : activeCycle.mode === 'susu' ? 7000 : 55000);
              const minVal = activeCycle.mode === 'broiler' ? 10000 : activeCycle.mode === 'petelur' ? 15000 : activeCycle.mode === 'susu' ? 3000 : 20000;
              const maxVal = activeCycle.mode === 'broiler' ? 60000 : activeCycle.mode === 'petelur' ? 50000 : activeCycle.mode === 'susu' ? 20000 : 150000;
              const stepVal = activeCycle.mode === 'susu' ? 200 : activeCycle.mode === 'penggemukan' ? 1000 : 500;

              // Formulas
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
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-350">Simulasi Harga Jual:</span>
                      <span className="text-teal-400">{formatRp(currentHarga)} / {activeCycle.mode === 'susu' ? 'Liter' : 'kg'}</span>
                    </div>
                    <input
                      type="range"
                      min={minVal}
                      max={maxVal}
                      step={stepVal}
                      value={currentHarga}
                      onChange={(e) => setSimHarga(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>{formatRp(minVal)}</span>
                      <span>{formatRp(maxVal)}</span>
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl ${labaSim >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                    <span className="text-[10px] font-bold block uppercase opacity-75">Estimasi Laba Bersih Simulasi</span>
                    <span className="text-2xl font-black block mt-1">{formatRp(labaSim)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* FAB Floating Action Button (Only visible on input tabs) */}
      {activeTab >= 2 && activeTab <= 4 && (
        <button
          onClick={() => {
            if (activeTab === 2) {
              openModalForm((activeCycle.mode === 'broiler' || activeCycle.mode === 'petelur') ? 'modal_pakan' : activeCycle.mode === 'susu' ? 'modal_biaya_susu' : 'modal_biaya_ruminansia');
            } else if (activeTab === 3) {
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
            } else if (activeTab === 4) {
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
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-full flex items-center justify-center text-3xl font-black shadow-xl shadow-teal-500/20 active:scale-95 transition-all z-40"
        >
          +
        </button>
      )}

      {/* --- DYNAMIC INPUT MODAL --- */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md relative shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-slate-100 mb-6">{modalTitle}</h3>

            <form onSubmit={handleModalFormSubmit} className="space-y-4">
              
              {/* Common Date Field */}
              {formFields.tgl !== undefined && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-450 block uppercase">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formFields.tgl}
                    onChange={(e) => updateFormField('tgl', e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
              )}

              {/* Feed Fields */}
              {activeModal === 'modal_pakan' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Jenis Pakan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pakan Broiler Starter"
                      value={formFields.jenis}
                      onChange={(e) => updateFormField('jenis', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">Jumlah Sak</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 10"
                        value={formFields.sak}
                        onChange={(e) => updateFormField('sak', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">Berat per Sak (kg)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 50"
                        value={formFields.kg_sak}
                        onChange={(e) => updateFormField('kg_sak', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Harga per Sak (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 350000"
                      value={formFields.harga_sak}
                      onChange={(e) => updateFormField('harga_sak', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}

              {/* Medicine/Obat Fields */}
              {activeModal === 'modal_obat' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Nama Obat/Vaksin</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Vitamin A, Vaksin Gumboro"
                      value={formFields.nama}
                      onChange={(e) => updateFormField('nama', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Keterangan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Dosis 5ml per ekor"
                      value={formFields.ket}
                      onChange={(e) => updateFormField('ket', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Total Biaya Obat (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 150000"
                      value={formFields.total}
                      onChange={(e) => updateFormField('total', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}

              {/* Other Expenses Fields */}
              {activeModal === 'modal_lain' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Nama Pengeluaran</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Sekam Kandang, Gaji Pekerja"
                      value={formFields.nama}
                      onChange={(e) => updateFormField('nama', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Keterangan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Tambahan sekam 10 karung"
                      value={formFields.ket}
                      onChange={(e) => updateFormField('ket', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Total Biaya (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 200000"
                      value={formFields.total}
                      onChange={(e) => updateFormField('total', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}

              {/* Broiler Harvest Fields */}
              {activeModal === 'modal_panen_broiler' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Total Panen (kg)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      placeholder="Contoh: 1200"
                      value={formFields.kg}
                      onChange={(e) => updateFormField('kg', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Harga Jual per kg (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 22000"
                      value={formFields.harga_kg}
                      onChange={(e) => updateFormField('harga_kg', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Jumlah Ayam Mati (Ekor)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 10"
                      value={formFields.jml_mati}
                      onChange={(e) => updateFormField('jml_mati', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}

              {/* Egg Layer Daily Yield Fields */}
              {activeModal === 'modal_harian_petelur' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Jumlah Telur (Butir)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 350"
                      value={formFields.butir}
                      onChange={(e) => updateFormField('butir', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Berat Telur (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Contoh: 20"
                      value={formFields.kg}
                      onChange={(e) => updateFormField('kg', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Telur Retak / BS (Butir)</label>
                    <input
                      type="number"
                      placeholder="Contoh: 5"
                      value={formFields.retak}
                      onChange={(e) => updateFormField('retak', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}

              {/* Egg Layer Sales Fields */}
              {activeModal === 'modal_jual_petelur' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Jumlah Jual (kg)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      placeholder="Contoh: 50"
                      value={formFields.kg}
                      onChange={(e) => updateFormField('kg', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Harga per kg (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 28000"
                      value={formFields.harga_kg}
                      onChange={(e) => updateFormField('harga_kg', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}

              {/* Ruminant Cost Fields */}
              {(activeModal === 'modal_biaya_ruminansia' || activeModal === 'modal_biaya_susu') && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Jenis Pengeluaran</label>
                    <select
                      value={formFields.type}
                      onChange={(e) => updateFormField('type', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                    >
                      <option value="pakan">Pakan / Hijauan / Konsentrat</option>
                      <option value="obat">Obat / Vitamin / Inseminasi Buatan</option>
                      <option value="lain">Lain-lain (Listrik, TK, dll)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Nama Detail Biaya</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Konsentrat Penggemukan, Jerami"
                      value={formFields.nama}
                      onChange={(e) => updateFormField('nama', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {formFields.type === 'pakan' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">Volume Pakan (kg)</label>
                      <input
                        type="number"
                        placeholder="Contoh: 100"
                        value={formFields.kg}
                        onChange={(e) => updateFormField('kg', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Total Biaya (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 500000"
                      value={formFields.total}
                      onChange={(e) => updateFormField('total', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}

              {/* Ruminant Sales Fields */}
              {activeModal === 'modal_panen_penggemukan' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">Dijual (Ekor)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 5"
                        value={formFields.jml_jual}
                        onChange={(e) => updateFormField('jml_jual', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">BB Akhir Rata2 (kg)</label>
                      <input
                        type="number"
                        required
                        step="0.1"
                        placeholder="Contoh: 400"
                        value={formFields.bb_akhir}
                        onChange={(e) => updateFormField('bb_akhir', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Harga Jual per kg (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 55000"
                      value={formFields.harga_kg}
                      onChange={(e) => updateFormField('harga_kg', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Kematian (Ekor)</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={formFields.jml_mati}
                      onChange={(e) => updateFormField('jml_mati', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}

              {/* Milk Yield Fields */}
              {activeModal === 'modal_harian_susu' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-450 block uppercase">Total Produksi Susu (Liter)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    placeholder="Contoh: 50"
                    value={formFields.liter}
                    onChange={(e) => updateFormField('liter', e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
              )}

              {/* Milk Sales Fields */}
              {activeModal === 'modal_jual_susu' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Volume Disetor (Liter)</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      placeholder="Contoh: 150"
                      value={formFields.liter}
                      onChange={(e) => updateFormField('liter', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Harga per Liter (Rp)</label>
                    <input
                      type="number"
                      required
                      placeholder="Contoh: 7000"
                      value={formFields.harga_liter}
                      onChange={(e) => updateFormField('harga_liter', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}

              {/* Breeding Birth Fields */}
              {activeModal === 'modal_kelahiran' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">ID / Nomor Tag Indukan Betina</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: A-01, B-03"
                      value={formFields.id_induk}
                      onChange={(e) => updateFormField('id_induk', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">Jumlah Anak Jantan</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 1"
                        value={formFields.jantan}
                        onChange={(e) => updateFormField('jantan', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">Jumlah Anak Betina</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 1"
                        value={formFields.betina}
                        onChange={(e) => updateFormField('betina', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
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
                      <label className="text-xs font-bold text-slate-450 block uppercase">Kategori</label>
                      <select
                        value={formFields.kategori}
                        onChange={(e) => updateFormField('kategori', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                      >
                        <option>Bakalan</option>
                        <option>Afkir Betina</option>
                        <option>Afkir Jantan</option>
                        <option>Indukan</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">Jenis Kelamin</label>
                      <select
                        value={formFields.jenis}
                        onChange={(e) => updateFormField('jenis', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                      >
                        <option value="jantan">Jantan</option>
                        <option value="betina">Betina</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">Jumlah (Ekor)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 2"
                        value={formFields.jml}
                        onChange={(e) => updateFormField('jml', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">Harga per Ekor (Rp)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 3500000"
                        value={formFields.harga_ekor}
                        onChange={(e) => updateFormField('harga_ekor', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Egg Incubator / Pembibitan Yield Fields */}
              {activeModal === 'modal_telur_pembibitan' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Periode</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Minggu ke-1"
                      value={formFields.periode}
                      onChange={(e) => updateFormField('periode', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">T. Dikumpulkan (Butir)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 200"
                        value={formFields.dikumpulkan}
                        onChange={(e) => updateFormField('dikumpulkan', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">Masuk Tetas (Butir)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 180"
                        value={formFields.masuk_tetas}
                        onChange={(e) => updateFormField('masuk_tetas', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Egg Incubator / Pembibitan Sales Fields */}
              {activeModal === 'modal_jual_doc' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-450 block uppercase">Tipe Penjualan</label>
                    <select
                      value={formFields.tipe}
                      onChange={(e) => updateFormField('tipe', e.target.value)}
                      className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                    >
                      <option>DOC</option>
                      <option>Ayam Remaja</option>
                      <option>Afkir</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">Jumlah Ekor</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 100"
                        value={formFields.jml}
                        onChange={(e) => updateFormField('jml', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-450 block uppercase">Harga per Ekor (Rp)</label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 8000"
                        value={formFields.harga_ekor}
                        onChange={(e) => updateFormField('harga_ekor', e.target.value)}
                        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Realtime Form Value Previews */}
              {previewVal && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-2xl flex justify-between items-center text-xs font-bold">
                  <span>Preview Total Biaya/Penjualan:</span>
                  <span className="text-sm font-black">{previewVal}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20"
              >
                Simpan Catatan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION DIALOG MODAL --- */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <span className="text-5xl block mb-4">⚠️</span>
            <h3 className="text-lg font-bold text-slate-100 mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-slate-450 mb-6 leading-relaxed">{confirmModal.msg}</p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, show: false }))}
                className="flex-1 py-2.5 border border-slate-805 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-colors"
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

      {/* --- FLOATING TOAST --- */}
      {toastMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-slate-200 px-6 py-3 rounded-full text-xs font-bold shadow-2xl z-55 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          {toastMsg}
        </div>
      )}

    </div>
  );
}
