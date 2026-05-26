'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Kata sandi harus minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiPost('/api/v1/auth/register', { name, email, password });
      
      if (data.token) {
        localStorage.setItem('radeya_token', data.token);
        if (data.orgId) {
          localStorage.setItem('radeya_org_id', data.orgId);
        }
        
        router.push('/dashboard/onboarding');
      } else {
        throw new Error('Gagal melakukan pendaftaran otomatis setelah pendaftaran sukses.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Email mungkin sudah terdaftar.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-teal-500/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Radeya
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Langkah Pertama Digitalisasi Peternakan Anda
            </p>
            <h2 className="text-xl font-bold text-slate-200 mt-6">
              Daftar Akun Baru
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-slate-300">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Budi Setiawan"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-300">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-300">
                Kata Sandi (Min. 8 karakter)
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-300">
                Konfirmasi Kata Sandi
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 mt-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-600/20"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <span>Daftar & Mulai</span>
              )}
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
            <p className="text-sm text-slate-400">
              Sudah memiliki akun?{' '}
              <a href="/login" className="text-teal-400 font-semibold hover:text-teal-300 transition-colors">
                Masuk Sekarang
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
