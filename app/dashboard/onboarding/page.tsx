'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [farmName, setFarmName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Cek apakah token ada, jika tidak, tendang ke halaman login
  useEffect(() => {
    const token = localStorage.getItem('radeya_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (farmName.trim().length < 2) {
      setError('Nama peternakan minimal 2 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      // Kirim data onboarding ke API
      await apiPost('/api/v1/onboarding', { farmName });
      
      // Update status onboarding di localStorage
      localStorage.setItem('radeya_farm_name', farmName);
      
      // Lanjut ke step sukses
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan konfigurasi peternakan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-teal-500/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative">
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-8">
            <div 
              className="bg-gradient-to-r from-teal-400 to-emerald-400 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>

          {step === 1 ? (
            <div>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-slate-100">
                  Selamat Datang di Radeya! 👋
                </h1>
                <p className="text-sm text-slate-400 mt-2">
                  Mari siapkan ruang kerja digital untuk peternakan Anda.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="farmName" className="text-sm font-semibold text-slate-300">
                    Nama Peternakan / Usaha Anda
                  </label>
                  <input
                    id="farmName"
                    type="text"
                    required
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="Contoh: Legok Farm Mandiri"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-500">
                    Nama ini akan digunakan pada laporan bulanan dan invoice pelanggan Anda.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-600/20"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Lanjutkan</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100 mb-2">
                Semua Siap! 🎉
              </h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
                Peternakan <strong>{farmName}</strong> telah berhasil dibuat. Sekarang Anda dapat mulai mencatat siklus ternak baru.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-600/20"
              >
                Masuk ke Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
