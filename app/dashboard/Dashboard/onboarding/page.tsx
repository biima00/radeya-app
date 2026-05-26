'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';

interface Cycle {
  id: string;
  name: string;
  animal: string;
  scale: number;
  mode: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [farmName, setFarmName] = useState('');
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State untuk tambah siklus baru
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleAnimal, setNewCycleAnimal] = useState('Ayam Broiler');
  const [newCycleScale, setNewCycleScale] = useState('');
  const [newCycleMode, setNewCycleMode] = useState('Mandiri');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    // 1. Proteksi Client-Side: Cek Token
    const token = localStorage.getItem('radeya_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // 2. Ambil nama peternakan dari localStorage
    const savedFarmName = localStorage.getItem('radeya_farm_name') || 'Peternakan Saya';
    setFarmName(savedFarmName);

    // 3. Ambil data siklus dari API
    fetchCycles();
  }, [router]);

  const fetchCycles = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiGet('/api/v1/cycles');
      setCycles(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data siklus.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('radeya_token');
    localStorage.removeItem('radeya_org_id');
    localStorage.removeItem('radeya_farm_name');
    router.push('/login');
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!newCycleName.trim()) {
      setSubmitError('Nama siklus harus diisi.');
      return;
    }

    const scaleNum = parseInt(newCycleScale);
    if (isNaN(scaleNum) || scaleNum <= 0) {
      setSubmitError('Skala ternak harus berupa angka positif.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: newCycleName,
        animal: newCycleAnimal,
        scale: scaleNum,
        mode: newCycleMode,
      };

      const newCycle = await apiPost('/api/v1/cycles', payload);
      setCycles((prev) => [newCycle, ...prev]);
      
      // Reset form & modal
      setNewCycleName('');
      setNewCycleScale('');
      setShowAddModal(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Gagal membuat siklus baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header / Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center font-black text-xl text-slate-950">
              R
            </div>
            <div>
              <span className="font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent text-lg">
                Radeya
              </span>
              <span className="text-xs block text-slate-500 -mt-1">Peternakan Pintar</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-500 block">Peternakan Anda</span>
              <span className="text-sm font-semibold text-teal-400">{farmName}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700/50 transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              Dashboard <span className="text-teal-400">📊</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Pantau dan kelola siklus ternak aktif untuk <strong className="text-teal-400/80">{farmName}</strong>.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="self-start sm:self-center px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-teal-900/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Mulai Siklus Baru
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl" />
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Total Siklus</span>
            <span className="text-3xl font-black text-slate-100 mt-2 block">{cycles.length}</span>
            <span className="text-xs text-teal-400/70 mt-1 block">Tersimpan aman di database cloud</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Nama Usaha</span>
            <span className="text-lg font-bold text-teal-400 mt-3 block truncate">{farmName}</span>
            <span className="text-xs text-slate-500 mt-1 block">Status: Terverifikasi</span>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl" />
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Koneksi Database</span>
            <span className="text-sm font-bold text-slate-300 mt-3 block flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Railway PostgreSQL
            </span>
            <span className="text-xs text-slate-500 mt-1.5 block">Sinkronisasi Realtime</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Cycles Section */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
            <span>📋</span> Daftar Siklus Ternak
          </h2>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Memuat data dari server...</p>
            </div>
          ) : cycles.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-800/50 rounded-2xl">
              <div className="w-16 h-16 bg-teal-500/5 border border-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-teal-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-300">Belum Ada Siklus Aktif</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Anda belum membuat siklus ternak apapun. Mulai dengan menekan tombol di bawah.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-teal-950 text-teal-400 hover:bg-teal-900 border border-teal-800/50 text-xs font-semibold rounded-lg transition-colors"
              >
                Mulai Siklus Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cycles.map((cycle) => (
                <div 
                  key={cycle.id}
                  className="bg-slate-900/70 border border-slate-850 hover:border-teal-500/30 p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between group hover:shadow-lg hover:shadow-teal-950/10"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs font-semibold rounded-md">
                        {cycle.mode}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(cycle.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-200 group-hover:text-teal-400 transition-colors">
                      {cycle.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <span>🐔</span> Hewan: <strong>{cycle.animal}</strong>
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <span>📊</span> Skala: <strong>{cycle.scale.toLocaleString('id-ID')} ekor</strong>
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center">
                    <span className="text-[10px] text-teal-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      Aktif
                    </span>
                    <button className="text-xs font-bold text-slate-450 hover:text-teal-400 transition-colors">
                      Kelola Siklus &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Cycle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md relative shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <span>🐔</span> Mulai Siklus Baru
            </h3>

            <form onSubmit={handleCreateCycle} className="space-y-4">
              {submitError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                  {submitError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-450">Nama Siklus</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siklus Broiler Mei"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-455">Jenis Ternak</label>
                <select
                  value={newCycleAnimal}
                  onChange={(e) => setNewCycleAnimal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  disabled={isSubmitting}
                >
                  <option value="Ayam Broiler">Ayam Broiler</option>
                  <option value="Ayam Petelur">Ayam Petelur</option>
                  <option value="Bebek">Bebek</option>
                  <option value="Kambing / Domba">Kambing / Domba</option>
                  <option value="Sapi">Sapi</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-455">Skala Ternak (Ekor/Kepala)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 1000"
                  value={newCycleScale}
                  onChange={(e) => setNewCycleScale(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-455">Skema Bisnis</label>
                <select
                  value={newCycleMode}
                  onChange={(e) => setNewCycleMode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  disabled={isSubmitting}
                >
                  <option value="Mandiri">Mandiri</option>
                  <option value="Kemitraan">Kemitraan</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Siklus</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
