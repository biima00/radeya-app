'use client';

import React, { useState, useEffect } from 'react';

// Define the commodity categories & labels matching Radeya's schema
const COMMODITY_GROUPS = [
  {
    category: 'Unggas (Poultry)',
    items: [
      { id: 'ayam_pedaging', label: '🍗 Ayam Pedaging', desc: 'Siklus broiler cepat panen (30-35 hari)' },
      { id: 'ayam_petelur', label: '🐔 Ayam Petelur', desc: 'Produksi telur harian jangka panjang (laktasi)' },
      { id: 'bebek_pedaging', label: '🍗 Bebek Pedaging', desc: 'Budidaya bebek pedaging intensif' },
      { id: 'bebek_petelur', label: '🦆 Bebek Petelur', desc: 'Produksi telur bebek asin/harian' },
      { id: 'enthok_pedaging', label: '🦆 Entok Pedaging', desc: 'Budidaya entok lokal pedaging' },
    ]
  },
  {
    category: 'Ruminansia (Luminant Livestock)',
    items: [
      { id: 'sapi_pedaging', label: '🐂 Sapi Penggemukan', desc: 'Penggemukan sapi bakalan pedaging' },
      { id: 'sapi_perah', label: '🥛 Sapi Perah', desc: 'Produksi susu sapi harian komersial' },
      { id: 'kambing_pedaging', label: '🐐 Kambing Pedaging', desc: 'Penggemukan kambing/domba pedaging' },
      { id: 'kambing_perah', label: '🥛 Kambing Perah', desc: 'Produksi susu kambing harian etawa' },
    ]
  },
  {
    category: 'Perikanan (Fishery)',
    items: [
      { id: 'ikan_pembesaran', label: '🐟 Ikan Pembesaran', desc: 'Pembesaran benih ikan nila, lele, gurame' },
    ]
  }
];

const ANIMAL_LABELS: Record<string, string> = {
  ayam_petelur: '🐔 Ayam Petelur',
  ayam_pedaging: '🍗 Ayam Pedaging',
  bebek_petelur: '🦆 Bebek Petelur',
  bebek_pedaging: '🍗 Bebek Pedaging',
  enthok_pedaging: '🦆 Entok Pedaging',
  sapi_perah: '🥛 Sapi Perah',
  sapi_pedaging: '🐂 Sapi Pedaging',
  kambing_perah: '🥛 Kambing Perah',
  kambing_pedaging: '🐐 Kambing Pedaging',
  ikan_pembesaran: '🐟 Ikan Pembesaran',
};

const getCategoryName = (selectedAnimal: string) => {
  if (['ayam_pedaging', 'ayam_petelur', 'bebek_pedaging', 'bebek_petelur', 'enthok_pedaging'].includes(selectedAnimal)) {
    return 'Unggas (Poultry)';
  }
  if (['sapi_pedaging', 'sapi_perah', 'kambing_pedaging', 'kambing_perah'].includes(selectedAnimal)) {
    return 'Ruminansia (Luminant)';
  }
  if (['ikan_pembesaran'].includes(selectedAnimal)) {
    return 'Perikanan (Fishery)';
  }
  return 'Lainnya';
};

interface NewCycleWizardProps {
  profile: any;
  onClose?: () => void;
  onSubmit: (name: string, animal: string, scaleStr: string, modalData: any) => Promise<void>;
  isModal?: boolean;
}

export default function NewCycleWizard({ profile, onClose, onSubmit, isModal = false }: NewCycleWizardProps) {
  console.log('NewCycleWizard render: onSubmit is', onSubmit, typeof onSubmit);
  const [step, setStep] = useState(1);
  const [animal, setAnimal] = useState('');
  const [name, setName] = useState('');
  const [scale, setScale] = useState('kecil');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [jamPakanPagi, setJamPakanPagi] = useState('07:00');
  const [jamPakanSiang, setJamPakanSiang] = useState('12:00');
  const [jamPakanSore, setJamPakanSore] = useState('16:00');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Capital Form Fields
  const [capitalDoc, setCapitalDoc] = useState('500');
  const [capitalHargaDoc, setCapitalHargaDoc] = useState('9000');
  const [capitalKandang, setCapitalKandang] = useState('1500000');
  const [capitalWeight, setCapitalWeight] = useState('300'); // penggemukan
  const [capitalHargaKg, setCapitalHargaKg] = useState('55000'); // penggemukan
  const [capitalBetina, setCapitalBetina] = useState('20'); // breeding
  const [capitalJantan, setCapitalJantan] = useState('2'); // breeding

  // New Cage Cost Breakdown & Depreciation states
  const [isDetailedCageInput, setIsDetailedCageInput] = useState(false);
  const [cageMaterialCost, setCageMaterialCost] = useState('0');
  const [cageLaborCost, setCageLaborCost] = useState('0');
  const [cageOtherCost, setCageOtherCost] = useState('0');
  const [cageUsefulLifeYears, setCageUsefulLifeYears] = useState('5');

  // Sum up cage construction cost breakdown
  useEffect(() => {
    if (isDetailedCageInput) {
      const mat = parseFloat(cageMaterialCost) || 0;
      const lab = parseFloat(cageLaborCost) || 0;
      const oth = parseFloat(cageOtherCost) || 0;
      setCapitalKandang((mat + lab + oth).toString());
    }
  }, [isDetailedCageInput, cageMaterialCost, cageLaborCost, cageOtherCost]);

  // Determine mode logic
  const getMode = (selectedAnimal: string): 'susu' | 'petelur' | 'penggemukan' | 'broiler' | 'pembibitan_unggas' | 'breeding_ruminansia' => {
    const isPerah = ['sapi_perah', 'kambing_perah'].includes(selectedAnimal);
    const isAyamPetelur = ['ayam_petelur', 'bebek_petelur'].includes(selectedAnimal);
    const isRuminanPedaging = ['sapi_pedaging', 'kambing_pedaging'].includes(selectedAnimal);
    const isUnggasPedagingOrIkan = [
      'ayam_pedaging',
      'bebek_pedaging',
      'enthok_pedaging',
      'ikan_pembesaran'
    ].includes(selectedAnimal);

    if (isPerah) return 'susu';
    if (isAyamPetelur) return 'petelur';
    if (isRuminanPedaging) return 'penggemukan';
    if (isUnggasPedagingOrIkan) return 'broiler';
    return 'broiler';
  };

  const mode = getMode(animal);

  // Format currency helper
  const formatRp = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Auto suggest cycle name when animal changes
  useEffect(() => {
    if (animal) {
      const label = ANIMAL_LABELS[animal] || animal;
      const cleanLabel = label.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const date = new Date(startDate);
      setName(`Siklus ${cleanLabel} - ${monthNames[date.getMonth()]} ${date.getFullYear()}`);
      
      // Auto adjust default values for scale based on animal
      if (['sapi_pedaging', 'sapi_perah', 'kambing_pedaging', 'kambing_perah'].includes(animal)) {
        setCapitalDoc('5'); // 5 ekor sapi/kambing
        setCapitalHargaDoc(animal.startsWith('sapi') ? '15000000' : '2000000');
        setCapitalKandang(animal.startsWith('sapi') ? '5000000' : '1500000');
      } else if (animal === 'ikan_pembesaran') {
        setCapitalDoc('1000');
        setCapitalHargaDoc('600'); // 600 rupiah per benih
        setCapitalKandang('1000000'); // kolam
      } else if (animal === 'kebun_hijauan') {
        setCapitalDoc('500'); // 500 m2 lahan
        setCapitalHargaDoc('1500000'); // 1.5jt sewa
        setCapitalKandang('500000'); // 500rb pupuk awal
      } else {
        setCapitalDoc('500');
        setCapitalHargaDoc('9000');
        setCapitalKandang('2000000');
      }
    }
  }, [animal, startDate]);

  // Calculate live initial capital based on input fields
  const calculateInitialCapital = () => {
    const qty = parseFloat(capitalDoc) || 0;
    const price = parseFloat(capitalHargaDoc) || 0;
    const cage = parseFloat(capitalKandang) || 0;
    const weight = parseFloat(capitalWeight) || 0;
    const priceKg = parseFloat(capitalHargaKg) || 0;
    const females = parseFloat(capitalBetina) || 0;
    const males = parseFloat(capitalJantan) || 0;

    if (mode === 'broiler') {
      return qty * price + cage;
    } else if (mode === 'petelur') {
      return qty * price + cage;
    } else if (mode === 'susu') {
      return qty * price + cage;
    } else if (mode === 'penggemukan') {
      return qty * weight * priceKg + cage;
    } else if (mode === 'pembibitan_unggas') {
      return (females + males) * price;
    } else if (mode === 'breeding_ruminansia') {
      return (females + males) * price;
    }
    return 0;
  };

  const initialCapitalTotal = calculateInitialCapital();

  // Next / Back buttons validation
  const handleNext = () => {
    setError('');
    if (step === 1 && !animal) {
      setError('Silakan pilih salah satu komoditas ternak.');
      return;
    }
    if (step === 2) {
      if (name.trim().length < 3) {
        setError('Nama siklus minimal 3 karakter.');
        return;
      }
      if (scale === 'besar' && profile?.organization?.plan === 'FREE') {
        setError('Skala Besar / Komersil hanya tersedia untuk paket Radeya Pro.');
        return;
      }
      if (!jamPakanPagi || !jamPakanSiang || !jamPakanSore) {
        setError('Jadwal waktu pemberian pakan harian wajib diisi.');
        return;
      }
    }
    if (step === 3) {
      const capTotal = calculateInitialCapital();
      if (capTotal <= 0) {
        setError('Silakan lengkapi parameter modal awal Anda.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  // Submit Handler
  const handleLaunch = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      // Structure the modal configuration JSON payload based on the selected mode
      const qty = parseFloat(capitalDoc) || 0;
      const price = parseFloat(capitalHargaDoc) || 0;
      const cage = parseFloat(capitalKandang) || 0;
      const weight = parseFloat(capitalWeight) || 0;
      const priceKg = parseFloat(capitalHargaKg) || 0;
      const females = parseFloat(capitalBetina) || 0;
      const males = parseFloat(capitalJantan) || 0;

      let modalData: Record<string, any> = {
        tgl_mulai: startDate,
        jam_pakan_pagi: jamPakanPagi,
        jam_pakan_siang: jamPakanSiang,
        jam_pakan_sore: jamPakanSore
      };

      if (mode === 'broiler') {
        modalData = {
          ...modalData,
          tgl_doc: startDate,
          jml_doc: qty.toString(),
          harga_doc: price.toString(),
          biaya_kandang: cage.toString()
        };
      } else if (mode === 'petelur') {
        modalData = {
          ...modalData,
          tgl_pullet: startDate,
          jml_ekor: qty.toString(),
          harga_ekor: price.toString(),
          biaya_kandang: cage.toString()
        };
      } else if (mode === 'susu') {
        modalData = {
          ...modalData,
          tgl_beli: startDate,
          jml_ekor: qty.toString(),
          harga_ekor: price.toString(),
          biaya_kandang: cage.toString()
        };
      } else if (mode === 'penggemukan') {
        modalData = {
          ...modalData,
          tgl_beli: startDate,
          jml_ekor: qty.toString(),
          bb_awal: weight.toString(),
          harga_kg_bakalan: priceKg.toString(),
          biaya_kandang: cage.toString()
        };
      } else if (mode === 'pembibitan_unggas') {
        modalData = {
          ...modalData,
          tgl_indukan: startDate,
          jml_betina: females.toString(),
          jml_jantan: males.toString(),
          harga_indukan: price.toString()
        };
      } else if (mode === 'breeding_ruminansia') {
        modalData = {
          ...modalData,
          tgl_indukan: startDate,
          jml_betina: females.toString(),
          jml_jantan: males.toString(),
          harga_ekor: price.toString()
        };
      }

      // Add cage breakdown and depreciation details to modalData
      modalData = {
        ...modalData,
        biaya_kandang: cage.toString(),
        kandang_material: cageMaterialCost,
        kandang_pekerja: cageLaborCost,
        kandang_lain: cageOtherCost,
        kandang_total: cage.toString(),
        kandang_manfaat_tahun: cageUsefulLifeYears,
        kandang_detail_aktif: isDetailedCageInput.toString()
      };

      await onSubmit(name, animal, scale, modalData);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan siklus baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full ${isModal ? 'max-w-4xl mx-auto' : 'max-w-4xl mx-auto py-8 px-4'} flex flex-col font-sans text-slate-100`}>
      
      {/* progress bar */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            {isModal ? '➕ Buat Siklus Baru' : '🌿 Setup Siklus Peternakan Pertama Anda'}
          </h1>
          {onClose && (
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-850 hover:border-slate-700 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 -z-10" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 -translate-y-1/2 -z-10 transition-all duration-500" 
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
          <div className="flex justify-between">
            {[1, 2, 3, 4].map((s) => {
              let label = '';
              if (s === 1) label = 'Komoditas';
              if (s === 2) label = 'Pengaturan';
              if (s === 3) label = 'Modal Awal';
              if (s === 4) label = 'Peluncuran';

              const active = step >= s;
              const current = step === s;

              return (
                <div key={s} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      current 
                        ? 'bg-teal-500 text-slate-950 ring-4 ring-teal-950 scale-110 shadow-lg shadow-teal-500/20' 
                        : active 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {s}
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider mt-2 transition-colors duration-300 ${active ? 'text-teal-400' : 'text-slate-500'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-2xl flex items-start gap-3 animate-fadeIn">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: SELECT ANIMAL COMMODITY */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-100">Pilih Komoditas Ternak</h2>
            <p className="text-xs text-slate-400 mt-1">Formulir kerja, grafik laktasi/panen, dan AI Vet Dokter akan otomatis menyesuaikan komoditas pilihan Anda.</p>
          </div>

          <div className="space-y-8">
            {COMMODITY_GROUPS.map((group, idx) => (
              <div key={idx} className="space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block border-b border-slate-900 pb-1.5">{group.category}</span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setAnimal(item.id)}
                      className={`flex flex-col items-start bg-slate-900/40 backdrop-blur border p-5 rounded-2xl text-left transition-all duration-300 group hover:border-slate-700 ${
                        animal === item.id 
                          ? 'border-teal-500 bg-teal-950/20 text-teal-400 shadow-[0_0_15px_rgba(13,148,136,0.15)] scale-[1.02]' 
                          : 'border-slate-850/80 text-slate-300'
                      }`}
                    >
                      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{item.label.split(' ')[0]}</div>
                      <div className="font-extrabold text-sm mb-1 text-slate-100 group-hover:text-teal-400 transition-colors">{item.label.split(' ').slice(1).join(' ')}</div>
                      <div className="text-[11px] leading-relaxed text-slate-400">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: CYCLE DETAILS */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Identitas & Skala Siklus</h2>
            <p className="text-xs text-slate-400 mt-1">Lengkapi nama, skala usaha, dan tanggal mulai siklus.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Nama Siklus</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Siklus Broiler - Mei 2026"
                  className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-slate-200 font-semibold transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tanggal Mulai Siklus</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-3 text-sm text-slate-200 font-semibold transition-colors font-mono"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-900/60">
                <label className="text-xs font-black text-teal-400 uppercase tracking-wider block">⏰ Jadwal Pemberian Pakan (Wajib)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-550 block">🌅 Pagi</span>
                    <input 
                      type="time" 
                      value={jamPakanPagi} 
                      onChange={(e) => setJamPakanPagi(e.target.value)}
                      required
                      className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-slate-250 font-semibold font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-550 block">☀️ Siang</span>
                    <input 
                      type="time" 
                      value={jamPakanSiang} 
                      onChange={(e) => setJamPakanSiang(e.target.value)}
                      required
                      className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-slate-250 font-semibold font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-550 block">🌇 Sore</span>
                    <input 
                      type="time" 
                      value={jamPakanSore} 
                      onChange={(e) => setJamPakanSore(e.target.value)}
                      required
                      className="w-full bg-slate-950/50 border border-slate-850 focus:border-teal-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-slate-250 font-semibold font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pilih Skala Usaha</label>
                <div className="space-y-3">
                  {/* Skala Kecil */}
                  <button
                    onClick={() => setScale('kecil')}
                    className={`w-full flex items-start gap-4 bg-slate-900/40 border-2 p-4 rounded-xl text-left transition-all duration-300 ${
                      scale === 'kecil'
                        ? 'border-teal-500 bg-teal-950/20 text-teal-400 shadow-md shadow-teal-500/5'
                        : 'border-slate-850 text-slate-300 hover:border-slate-800'
                    }`}
                  >
                    <span className="text-2xl mt-0.5">🏡</span>
                    <div>
                      <div className="font-extrabold text-sm text-slate-200">Skala Kecil / Rumahan</div>
                      <div className="text-[10px] text-slate-400 mt-1">Kapasitas minimal, cocok untuk peternak mandiri pemula.</div>
                    </div>
                  </button>

                  {/* Skala Besar */}
                  <button
                    onClick={() => setScale('besar')}
                    className={`w-full flex items-start gap-4 bg-slate-900/40 border-2 p-4 rounded-xl text-left transition-all duration-300 ${
                      scale === 'besar'
                        ? 'border-teal-500 bg-teal-950/20 text-teal-400 shadow-md shadow-teal-500/5'
                        : 'border-slate-850 text-slate-300 hover:border-slate-800'
                    }`}
                  >
                    <span className="text-2xl mt-0.5">🏢</span>
                    <div>
                      <div className="font-extrabold text-sm text-slate-200 font-bold flex items-center gap-2">
                        <span>Skala Besar / Komersil</span>
                        {profile?.organization?.plan === 'FREE' && (
                          <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider font-mono">PRO</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Kapasitas industri modern, FCR/ADG presisi.</div>
                    </div>
                  </button>

                  {/* FREE Plan Warning Alert */}
                  {scale === 'besar' && profile?.organization?.plan === 'FREE' && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-[11px] leading-relaxed flex items-start gap-2.5 animate-fadeIn">
                      <span className="text-base">⭐</span>
                      <div>
                        <strong>Skala Besar Hanya Tersedia di Radeya Pro!</strong>
                        <p className="text-slate-400 mt-0.5">Silakan pilih skala kecil terlebih dahulu atau hubungi pemilik organisasi Anda untuk melakukan upgrade plan langganan Radeya Anda.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: INITIAL CAPITAL FORM */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Setup Modal Awal</h2>
            <p className="text-xs text-slate-400 mt-1">Berapa biaya investasi awal untuk memulai siklus ini? Ini akan dicatat sebagai basis pengeluaran HPP.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Input Form Fields based on Mode */}
            <div className="space-y-5 bg-slate-900/20 border border-slate-850/60 p-6 rounded-2xl">
              
              {/* Poultry Broiler/Peck Mode fields */}
              {mode === 'broiler' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Jumlah DOC / Bibit (Ekor)</label>
                    <input 
                      type="number" 
                      value={capitalDoc} 
                      onChange={(e) => setCapitalDoc(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Harga beli per DOC / Bibit (Rp)</label>
                    <input 
                      type="number" 
                      value={capitalHargaDoc} 
                      onChange={(e) => setCapitalHargaDoc(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Poultry Layer Mode fields */}
              {mode === 'petelur' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Jumlah Pullet / Indukan (Ekor)</label>
                    <input 
                      type="number" 
                      value={capitalDoc} 
                      onChange={(e) => setCapitalDoc(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Harga per Pullet (Rp)</label>
                    <input 
                      type="number" 
                      value={capitalHargaDoc} 
                      onChange={(e) => setCapitalHargaDoc(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Dairy Susu Mode fields */}
              {mode === 'susu' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Jumlah Sapi/Kambing Perah (Ekor)</label>
                    <input 
                      type="number" 
                      value={capitalDoc} 
                      onChange={(e) => setCapitalDoc(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Harga Pembelian per Ekor (Rp)</label>
                    <input 
                      type="number" 
                      value={capitalHargaDoc} 
                      onChange={(e) => setCapitalHargaDoc(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                </>
              )}

              {/* Ruminant Fattening (Penggemukan) Mode fields */}
              {mode === 'penggemukan' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Jumlah Sapi / Kambing Bakalan (Ekor)</label>
                    <input 
                      type="number" 
                      value={capitalDoc} 
                      onChange={(e) => setCapitalDoc(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Bobot Awal Rata-rata (kg)</label>
                      <input 
                        type="number" 
                        value={capitalWeight} 
                        onChange={(e) => setCapitalWeight(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Harga per kg Hidup (Rp)</label>
                      <input 
                        type="number" 
                        value={capitalHargaKg} 
                        onChange={(e) => setCapitalHargaKg(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Ruminant Breeding Mode fields */}
              {(mode === 'pembibitan_unggas' || mode === 'breeding_ruminansia') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Jumlah Induk Betina (Ekor)</label>
                      <input 
                        type="number" 
                        value={capitalBetina} 
                        onChange={(e) => setCapitalBetina(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Jumlah Pejantan (Ekor)</label>
                      <input 
                        type="number" 
                        value={capitalJantan} 
                        onChange={(e) => setCapitalJantan(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Harga Rata-rata per Ekor (Rp)</label>
                    <input 
                      type="number" 
                      value={capitalHargaDoc} 
                      onChange={(e) => setCapitalHargaDoc(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                </>
              )}

              )}

              {/* Unified Cage Construction Setup Section */}
              <div className="mt-6 border-t border-slate-800 pt-6 space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">🏢 Investasi Kandang & Aset (CapEx)</span>
                
                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="isDetailedCageInput"
                    checked={isDetailedCageInput}
                    onChange={(e) => setIsDetailedCageInput(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-950"
                  />
                  <label htmlFor="isDetailedCageInput" className="text-xs font-bold text-slate-300 cursor-pointer">
                    Input Rincian Biaya Pembangunan Kandang Baru
                  </label>
                </div>

                {isDetailedCageInput ? (
                  <div className="space-y-3.5 pl-2 border-l-2 border-teal-500/20 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">1. Biaya Bahan & Material (Baja, Kayu, Semen, dll)</label>
                      <input
                        type="number"
                        value={cageMaterialCost}
                        onChange={(e) => setCageMaterialCost(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2 text-xs text-slate-200 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">2. Biaya Tenaga Kerja (Labor / Upah Tukang)</label>
                      <input
                        type="number"
                        value={cageLaborCost}
                        onChange={(e) => setCageLaborCost(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2 text-xs text-slate-200 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">3. Biaya Lain-lain Pembangunan</label>
                      <input
                        type="number"
                        value={cageOtherCost}
                        onChange={(e) => setCageOtherCost(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2 text-xs text-slate-200 font-semibold"
                      />
                    </div>
                    <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/10 text-[10px] text-teal-400 font-bold flex justify-between font-mono">
                      <span>Total Biaya Konstruksi:</span>
                      <span>{formatRp(parseFloat(capitalKandang) || 0)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Biaya Kandang / Infrastruktur Awal (Rp)</label>
                    <input
                      type="number"
                      value={capitalKandang}
                      onChange={(e) => setCapitalKandang(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 font-semibold"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Estimasi Masa Manfaat Kandang (Tahun)</label>
                  <select
                    value={cageUsefulLifeYears}
                    onChange={(e) => setCageUsefulLifeYears(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-250 font-semibold font-mono cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 8, 10, 15, 20].map((yr) => (
                      <option key={yr} value={yr} className="bg-slate-900 text-slate-100">
                        {yr} Tahun ({yr * 12} Bulan) {yr === 4 ? ' - Standar Pajak Semi-Permanen' : yr === 5 ? ' - Rekomendasi' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-[9px] text-slate-500 block leading-relaxed">
                    *Masa manfaat ini akan digunakan untuk menghitung penyusutan kandang per hari/siklus demi keakuratan EBITDA & Laba Bersih.
                  </span>
                </div>
              </div>
            </div>

            {/* Live Estimation Panel */}
            <div className="space-y-5">
              <div className="bg-[#0b161a] border border-teal-500/10 p-6 rounded-2xl space-y-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Rincian Anggaran Awal</span>
                
                <div className="space-y-3 text-xs font-semibold text-slate-300">
                  {/* Row 1: Stock Purchase */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-900/60">
                    <span>💵 Pembelian Ternak/Bibit:</span>
                    <span className="text-white font-mono">
                      {mode === 'penggemukan'
                        ? formatRp((parseFloat(capitalDoc) || 0) * (parseFloat(capitalWeight) || 0) * (parseFloat(capitalHargaKg) || 0))
                        : (mode === 'pembibitan_unggas' || mode === 'breeding_ruminansia')
                        ? formatRp(((parseFloat(capitalBetina) || 0) + (parseFloat(capitalJantan) || 0)) * (parseFloat(capitalHargaDoc) || 0))
                        : formatRp((parseFloat(capitalDoc) || 0) * (parseFloat(capitalHargaDoc) || 0))
                      }
                    </span>
                  </div>

                  {/* Row 2: Infrastructure */}
                  {!(mode === 'pembibitan_unggas' || mode === 'breeding_ruminansia') && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-900/60">
                      <span>🏗️ Persiapan Kandang/Kolam:</span>
                      <span className="text-white font-mono">{formatRp(parseFloat(capitalKandang) || 0)}</span>
                    </div>
                  )}

                  {/* Row 3: Totals */}
                  <div className="flex justify-between items-center py-3 text-sm font-bold text-teal-400">
                    <span>🔥 Total Modal Awal:</span>
                    <span className="text-lg font-black text-teal-300 font-mono">{formatRp(initialCapitalTotal)}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-xl text-[10px] leading-relaxed text-slate-400 border border-slate-900">
                  ⚡ <strong>Note:</strong> Nilai total modal awal ini akan dicatat secara otomatis dalam laporan siklus baru Anda dan tidak perlu diisi ulang di dalam menu lembar kerja dashboard.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STEP 4: SUMMARY & PROJECTION PREVIEW */}
      {step === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Review & Peluncuran</h2>
            <p className="text-xs text-slate-400 mt-1">Tinjau kembali parameter konfigurasi Anda sebelum memulai pencatatan siklus.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Checklist summary */}
            <div className="bg-[#0b161a]/60 border border-slate-850 p-6 rounded-2xl space-y-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Ringkasan Konfigurasi</span>
              
              <div className="space-y-3 text-xs font-semibold text-slate-300">
                <div className="flex justify-between py-2 border-b border-slate-900">
                  <span className="text-slate-400">🌾 Komoditas:</span>
                  <span className="font-extrabold">{ANIMAL_LABELS[animal] || animal}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-900">
                  <span className="text-slate-400">🏷️ Kategori:</span>
                  <span className="font-extrabold text-teal-400">{getCategoryName(animal)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-900">
                  <span className="text-slate-400">📋 Nama Siklus:</span>
                  <span className="font-extrabold">{name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-900">
                  <span className="text-slate-400">🏢 Skala Usaha:</span>
                  <span className="font-extrabold font-mono text-teal-400 uppercase tracking-wider">{scale === 'besar' ? 'Besar / Komersil' : 'Kecil / Rumahan'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-900">
                  <span className="text-slate-400">📅 Tanggal Mulai:</span>
                  <span className="font-extrabold font-mono">{startDate}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-900">
                  <span className="text-slate-400">⏰ Jadwal Pakan:</span>
                  <span className="font-extrabold font-mono text-slate-350">{jamPakanPagi} | {jamPakanSiang} | {jamPakanSore}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">💸 Budget Modal Awal:</span>
                  <span className="font-extrabold font-mono text-teal-300">{formatRp(initialCapitalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Profit calculator simulation */}
            <div className="bg-gradient-to-tr from-teal-950/20 to-emerald-950/20 border border-teal-500/10 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Simulasi Estimasi Laba</span>
                  <span className="text-xs text-slate-500">Berdasarkan FCR rata-rata nasional & harga jual pasar saat ini.</span>
                </div>
              </div>

              {/* Estimate Calculations */}
              {(() => {
                const qty = parseFloat(capitalDoc) || 0;
                let modal = initialCapitalTotal;
                let projectedRevenue = 0;
                let projectedProfit = 0;
                let detailsText = '';

                if (mode === 'broiler') {
                  const weightTotal = qty * 1.6; // 1.6kg average target
                  projectedRevenue = weightTotal * 22000; // Rp 22.000 / kg standard
                  projectedProfit = projectedRevenue - modal;
                  detailsText = `Panen ayam broiler diestimasi selesai pada hari ke-33 dengan rata-rata bobot 1.6kg. Total bobot: ${weightTotal.toLocaleString()} kg.`;
                } else if (mode === 'petelur') {
                  // hen day 80% for 30 days
                  const eggs = qty * 0.8 * 30;
                  const kg = eggs / 16; // 16 eggs/kg
                  projectedRevenue = kg * 24000; // Rp 24.000 / kg standard
                  projectedProfit = projectedRevenue - modal;
                  detailsText = `Produksi telur per-bulan diestimasi mencapai ${eggs.toFixed(0)} butir (~${kg.toFixed(1)} kg) dengan asumsi produktivitas Hen Day rata-rata 80%.`;
                } else if (mode === 'penggemukan') {
                  // adg 1.1kg for 90 days
                  const gain = 1.1 * 90;
                  const endWeight = (parseFloat(capitalWeight) || 300) + gain;
                  projectedRevenue = qty * endWeight * 55000;
                  projectedProfit = projectedRevenue - modal;
                  detailsText = `Sapi penggemukan diestimasikan siap panen setelah 90 hari dengan pertambahan bobot rata-rata 1.1 kg/hari. Bobot akhir: ${endWeight.toFixed(0)} kg.`;
                } else {
                  // fallback
                  projectedRevenue = modal * 1.35;
                  projectedProfit = projectedRevenue - modal;
                  detailsText = 'Perhitungan keuntungan kotor diestimasi sebesar 35% di atas nilai modal awal Anda pada akhir siklus laktasi/panen.';
                }

                return (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-teal-500/10 pb-3">
                      <span className="text-xs text-slate-400 font-semibold">Proyeksi Laba Bersih:</span>
                      <span className={`text-xl font-black font-mono ${projectedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatRp(projectedProfit)}
                      </span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-slate-400">{detailsText}</p>
                    <div className="text-[9px] text-slate-500 leading-normal italic">
                      *Catatan: Hasil aktual dipengaruhi oleh rasio konversi pakan harian (FCR), tingkat kelangsungan hidup ternak (SR), dan fluktuasi harga pasar lokal.
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="mt-10 border-t border-slate-900 pt-6 flex justify-between">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all"
            disabled={isSubmitting}
          >
            &larr; Kembali
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-gradient-to-r from-teal-650 to-emerald-650 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-950/20"
          >
            Lanjutkan &rarr;
          </button>
        ) : (
          <button
            onClick={handleLaunch}
            disabled={isSubmitting}
            className="px-8 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>🚀 Mulai Siklus Sekarang</span>
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
}

