'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [simKomoditas, setSimKomoditas] = useState<'unggas' | 'ruminansia' | 'ikan'>('unggas');
  const [simSkala, setSimSkala] = useState<number>(500);
  const [simHarga, setSimHarga] = useState<number>(22000);

  useEffect(() => {
    const token = localStorage.getItem('radeya_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // --- SVGs Icons Pack ---
  const Icons = {
    check: () => (
      <svg className="w-5 h-5 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
    arrowRight: () => (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
      </svg>
    )
  };

  // Mini-simulation profit calculation
  const calculateSimLaba = () => {
    if (simKomoditas === 'unggas') {
      // Ayam pedaging/broiler: skala (ekor) x 1.6kg x harga_jual - modal_awal (ekor x 18000)
      const modal = simSkala * 18000;
      const panen = simSkala * 1.6 * simHarga;
      return panen - modal;
    } else if (simKomoditas === 'ruminansia') {
      // Sapi penggemukan: skala (ekor) x 400kg x harga_jual - modal_awal (ekor x 15 jt)
      const modal = simSkala * 15000000;
      const panen = simSkala * 400 * simHarga;
      return panen - modal;
    } else {
      // Perikanan: skala (kg) x harga_jual - modal pakan/bibit (skala x 16000)
      const modal = simSkala * 16000;
      const panen = simSkala * simHarga;
      return panen - modal;
    }
  };

  const formatRp = (val: number) => {
    if (Math.abs(val) >= 1000000000) return 'Rp ' + (val / 1000000000).toFixed(1) + ' M';
    if (Math.abs(val) >= 1000000) return 'Rp ' + (val / 1000000).toFixed(1) + ' jt';
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <div className="min-h-screen bg-[#070E10] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-teal-500 selection:text-slate-950">
      
      {/* Dynamic Ambient Blur Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/75 backdrop-blur-xl border-b border-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center font-black text-xl text-slate-950 shadow-lg shadow-teal-500/20">
              R
            </div>
            <div>
              <span className="font-extrabold tracking-tight bg-gradient-to-r from-teal-400 via-teal-200 to-emerald-400 bg-clip-text text-transparent text-lg">
                RADEYA
              </span>
              <span className="text-[9px] block text-slate-500 font-bold uppercase tracking-wider -mt-1">Agro & Livestock SaaS</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-400">
            <a href="#fitur" className="hover:text-teal-400 transition-colors">Fitur</a>
            <a href="#simulasi" className="hover:text-teal-400 transition-colors">Simulasi Laba</a>
            <a href="#harga" className="hover:text-teal-400 transition-colors">Harga</a>
          </nav>

          <div>
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-950/20 flex items-center gap-1.5"
            >
              {isLoggedIn ? 'Masuk Dashboard' : 'Mulai Sekarang'}
              {Icons.arrowRight()}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section (Neon Banner) */}
      <section className="relative py-20 px-4 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Intro copy */}
        <div className="lg:col-span-6 space-y-6">
          <span className="text-[10px] uppercase font-black tracking-widest text-teal-400 bg-teal-950/80 px-3.5 py-1.5 rounded-full border border-teal-500/25 inline-block">
            SaaS Pertanian & Peternakan Modern 🌿
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight">
            Ukur Siklus,<br />
            <span className="bg-gradient-to-r from-teal-400 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
              Lipatgandakan Laba
            </span><br />
            Ternak Anda.
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg">
            Radeya membantu peternak unggas, ruminansia, pembudidaya ikan, dan petani mengelola modal awal, memantau pengeluaran pakan harian, serta menganalisis performa FCR, ADG, dan kelangsungan hidup secara real-time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href={isLoggedIn ? "/dashboard" : "/register"}
              className="py-4 px-8 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl text-center transition-all shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2"
            >
              Daftar Gratis 1 Siklus
              {Icons.arrowRight()}
            </Link>
            <a
              href="#simulasi"
              className="py-4 px-8 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold rounded-xl text-center transition-all flex items-center justify-center"
            >
              Coba Simulasi Laba
            </a>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-900/60 max-w-md text-center sm:text-left">
            <div>
              <span className="text-2xl font-black text-white font-mono block">100%</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cloud Secured</span>
            </div>
            <div>
              <span className="text-2xl font-black text-teal-400 font-mono block">FCR/ADG</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Auto Math</span>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-450 font-mono block">AI Vet</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Consultant</span>
            </div>
          </div>
        </div>

        {/* Neon Banner Agriculture & Livestock Image */}
        <div className="lg:col-span-6 flex justify-center relative">
          {/* Glowing backdrops */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -z-10" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl -z-10" />

          {/* Glassmorphic Screen Container */}
          <div className="w-full max-w-[500px] aspect-[4/3] glass-panel rounded-3xl p-2.5 relative flex items-center justify-center overflow-hidden group shadow-2xl shadow-teal-500/10 border border-teal-500/20">
            <img 
              src="/images/farm_hero_neon.png" 
              alt="Radeya Neon Agriculture & Livestock" 
              className="w-full h-full object-cover rounded-2xl opacity-90 transition-transform duration-700 group-hover:scale-105"
            />
            {/* Glowing neon bottom bar inside card */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-500 opacity-60" />
          </div>
        </div>
      </section>

      {/* Grid Komoditas (Fitur) */}
      <section id="fitur" className="py-24 bg-slate-950/20 border-y border-slate-900/60 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block">KOMODITAS RADE-YA</span>
            <h2 className="text-3xl font-black text-white tracking-tight">Satu Dasbor untuk Seluruh Usaha Agro Anda</h2>
            <p className="text-sm text-slate-450 max-w-xl mx-auto">Tersedia lembar kerja dan kalkulator performa spesifik yang disesuaikan dengan biologis dan proses bisnis tiap komoditas.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card Unggas */}
            <div className="glass-panel p-6 rounded-3xl group">
              <span className="text-4xl block mb-4">🍗</span>
              <h3 className="text-base font-bold text-slate-200 mb-2">Ternak Unggas</h3>
              <p className="text-xs text-slate-450 leading-relaxed mb-4">Dukungan Ayam Pedaging (Broiler) & Ayam Petelur (Layer). Otomatisasi FCR, Hen Day %, Indeks Performa (IP), dan pencatatan mortalitas harian.</p>
              <div className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Broiler & Layer &middot; Bebek</div>
            </div>

            {/* Card Ruminansia */}
            <div className="glass-panel p-6 rounded-3xl group">
              <span className="text-4xl block mb-4">🥩</span>
              <h3 className="text-base font-bold text-slate-200 mb-2">Ruminansia</h3>
              <p className="text-xs text-slate-450 leading-relaxed mb-4">Dukungan Penggemukan Sapi/Kambing & Mode Breeding. Otomatisasi ADG (Average Daily Gain), pencatatan kelahiran anak, dan taksiran nilai aset hidup.</p>
              <div className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Sapi & Kambing &middot; Domba</div>
            </div>

            {/* Card Perikanan */}
            <div className="glass-panel p-6 rounded-3xl group">
              <span className="text-4xl block mb-4">🐟</span>
              <h3 className="text-base font-bold text-slate-200 mb-2">Budidaya Ikan</h3>
              <p className="text-xs text-slate-450 leading-relaxed mb-4">Dukungan untuk kolam pembesaran ikan (Nila, Lele, Gurame). Pantau FCR pelet pakan, kepadatan kolam, tingkat kelangsungan hidup (SR), serta jadwal tebar.</p>
              <div className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Nila & Lele &middot; Gurame</div>
            </div>

            {/* Card Pertanian */}
            <div className="glass-panel p-6 rounded-3xl group">
              <span className="text-4xl block mb-4">🌴</span>
              <h3 className="text-base font-bold text-slate-200 mb-2">Tanaman & Kebun</h3>
              <p className="text-xs text-slate-450 leading-relaxed mb-4">Integrasikan perkebunan penunjang pakan hijau. Jadwalkan pemupukan berkala, catat panen jerami/rumput gajah, serta pantau biaya sewa lahan.</p>
              <div className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Kebun Hijauan &middot; Pertanian</div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive Simulator Section */}
      <section id="simulasi" className="py-24 px-4 max-w-4xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block">INTERAKTIF SIMULATOR</span>
          <h2 className="text-3xl font-black text-white tracking-tight">Prediksikan Laba Usaha Anda</h2>
          <p className="text-sm text-slate-450">Pilih jenis komoditas, skala populasi, dan harga pasar saat ini untuk menghitung profit kotor secara instan.</p>
        </div>

        <div className="glass-panel p-8 rounded-3xl relative grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Controls */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Jenis Komoditas</label>
              <div className="grid grid-cols-3 gap-2">
                {(['unggas', 'ruminansia', 'ikan'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setSimKomoditas(k);
                      if (k === 'unggas') {
                        setSimSkala(500);
                        setSimHarga(22000);
                      } else if (k === 'ruminansia') {
                        setSimSkala(5);
                        setSimHarga(55000);
                      } else {
                        setSimSkala(1000);
                        setSimHarga(26000);
                      }
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      simKomoditas === k
                        ? 'bg-teal-950/80 text-teal-400 border-teal-500/40 shadow-md'
                        : 'bg-slate-950/50 text-slate-400 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    {k === 'unggas' ? '🍗 Unggas' : k === 'ruminansia' ? '🥩 Ruminan' : '🐟 Perikanan'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Skala Usaha:</span>
                <span className="text-white font-mono">{simSkala.toLocaleString('id-ID')} {simKomoditas === 'ruminansia' ? 'ekor sapi' : simKomoditas === 'unggas' ? 'ekor ayam' : 'kg ikan'}</span>
              </div>
              <input
                type="range"
                min={simKomoditas === 'ruminansia' ? 2 : simKomoditas === 'unggas' ? 100 : 200}
                max={simKomoditas === 'ruminansia' ? 50 : simKomoditas === 'unggas' ? 5000 : 10000}
                step={simKomoditas === 'ruminansia' ? 1 : simKomoditas === 'unggas' ? 100 : 200}
                value={simSkala}
                onChange={(e) => setSimSkala(parseInt(e.target.value) || 0)}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Taksiran Harga Jual Pasar:</span>
                <span className="text-white font-mono">{formatRp(simHarga)} / {simKomoditas === 'ruminansia' ? 'kg hidup' : simKomoditas === 'unggas' ? 'kg hidup' : 'kg'}</span>
              </div>
              <input
                type="range"
                min={simKomoditas === 'ruminansia' ? 40000 : simKomoditas === 'unggas' ? 15000 : 15000}
                max={simKomoditas === 'ruminansia' ? 70000 : simKomoditas === 'unggas' ? 35000 : 45000}
                step={500}
                value={simHarga}
                onChange={(e) => setSimHarga(parseInt(e.target.value) || 0)}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>
          </div>

          {/* Results Screen */}
          <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-850 flex flex-col justify-between text-center md:text-left">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Estimasi Keuntungan Siklus</span>
              {(() => {
                const laba = calculateSimLaba();
                return (
                  <>
                    <span className={`text-3xl font-black block mt-2 font-mono ${laba >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatRp(laba)}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-2 block leading-relaxed font-semibold">
                      *Perhitungan di atas bersifat estimasi kotor berdasarkan rata-rata nasional FCR dan biaya pakan standar industri.
                    </span>
                  </>
                );
              })()}
            </div>
            
            <Link
              href={isLoggedIn ? "/dashboard" : "/register"}
              className="w-full mt-6 py-3 bg-gradient-to-r from-teal-650 to-emerald-650 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl text-center text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5"
            >
              Mulai Catat di Radeya
              {Icons.arrowRight()}
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="py-24 bg-slate-950/20 border-t border-slate-900/60 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block">INVESTASI PINTAR</span>
            <h2 className="text-3xl font-black text-white tracking-tight">Skema Langganan Tanpa Batas</h2>
            <p className="text-sm text-slate-450">Nikmati pencatatan siklus cloud dengan harga terjangkau untuk menunjang produktivitas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            
            {/* Free Tier */}
            <div className="bg-slate-900/20 border border-slate-850 p-8 rounded-3xl space-y-6 hover:border-slate-800 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-400 uppercase block">Radeya Lite</span>
                <span className="text-3xl font-black text-white block mt-2">Rp 0</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Selamanya untuk peternak pemula</span>
                <ul className="space-y-3 text-xs font-semibold text-slate-350 mt-6">
                  <li className="flex items-center gap-2.5">{Icons.check()} 3 Siklus Ternak Aktif</li>
                  <li className="flex items-center gap-2.5">{Icons.check()} Kalender Kerja Harian</li>
                  <li className="flex items-center gap-2.5">{Icons.check()} Catat Harian Sederhana</li>
                  <li className="flex items-center gap-2.5 text-slate-600 line-through">✗ Skala Besar / Komersil</li>
                  <li className="flex items-center gap-2.5 text-slate-600 line-through">✗ Radeya AI Vet Chat</li>
                </ul>
              </div>
              <Link
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="w-full py-3 mt-6 bg-slate-950/60 hover:bg-slate-900 text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition-all text-center block"
              >
                Mulai Gratis
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-slate-900/30 border border-teal-500/20 p-8 rounded-3xl space-y-6 relative overflow-hidden shadow-xl shadow-teal-500/2 flex flex-col justify-between">
              <div className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider text-teal-450 bg-teal-950 px-2.5 py-1 rounded-md border border-teal-500/20">
                Terpopuler
              </div>
              <div>
                <span className="text-xs font-extrabold text-teal-450 uppercase block">Radeya Pro</span>
                <span className="text-3xl font-black text-white block mt-2">Rp 50.000 <span className="text-xs font-bold text-slate-500">/ bulan</span></span>
                <span className="text-[10px] text-slate-500 mt-1 block">Untuk peternak komersil mandiri</span>
                <ul className="space-y-3 text-xs font-semibold text-slate-350 mt-6">
                  <li className="flex items-center gap-2.5">{Icons.check()} 10 Siklus Ternak Aktif</li>
                  <li className="flex items-center gap-2.5">{Icons.check()} Buka Skala Besar / Komersil</li>
                  <li className="flex items-center gap-2.5">{Icons.check()} Radeya AI Vet Chat</li>
                  <li className="flex items-center gap-2.5">{Icons.check()} Kalkulator Pearson & FCR</li>
                  <li className="flex items-center gap-2.5">{Icons.check()} Ekspor CSV & Laporan</li>
                </ul>
              </div>
              <Link
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="w-full py-3 mt-6 bg-gradient-to-r from-teal-650 to-emerald-650 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold rounded-xl transition-all text-center block shadow-lg shadow-teal-950/30"
              >
                Upgrade Pro
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-slate-900/20 border border-slate-850 p-8 rounded-3xl space-y-6 hover:border-slate-800 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold text-emerald-450 uppercase block">Radeya Enterprise</span>
                <span className="text-3xl font-black text-white block mt-2">Rp 150.000 <span className="text-xs font-bold text-slate-500">/ bulan</span></span>
                <span className="text-[10px] text-slate-500 mt-1 block">Untuk peternak modern multi-user</span>
                <ul className="space-y-3 text-xs font-semibold text-slate-350 mt-6">
                  <li className="flex items-center gap-2.5">{Icons.check()} 100 Siklus Ternak Aktif</li>
                  <li className="flex items-center gap-2.5">{Icons.check()} Semua Fitur Paket Pro</li>
                  <li className="flex items-center gap-2.5">{Icons.check()} Kolaborasi Multi-user (Tim)</li>
                  <li className="flex items-center gap-2.5">{Icons.check()} 1 Akun Boss + Banyak Pekerja</li>
                  <li className="flex items-center gap-2.5">{Icons.check()} Hak Akses Input Terkendali</li>
                </ul>
              </div>
              <Link
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="w-full py-3 mt-6 bg-slate-950/60 hover:bg-slate-900 text-slate-250 text-xs font-bold rounded-xl border border-slate-800 transition-all text-center block"
              >
                Pilih Enterprise
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center font-black text-lg text-slate-950">
              R
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-sm">RADEYA</span>
              <span className="text-[8px] block text-slate-500 font-bold uppercase tracking-wider -mt-1">&copy; 2026 Radeya Indonesia</span>
            </div>
          </div>

          <div className="flex gap-8 text-[11px] font-bold text-slate-500">
            <a href="#fitur" className="hover:text-slate-300">Fitur</a>
            <a href="#simulasi" className="hover:text-slate-300">Simulasi</a>
            <a href="#harga" className="hover:text-slate-300">Harga</a>
            <a href="/login" className="hover:text-slate-300">Masuk Akun</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
