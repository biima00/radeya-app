'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  
  // State untuk melacak input email dan password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // State untuk menampilkan error dan status loading
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Callback setelah Google Auth berhasil
  const handleGoogleLoginCallback = async (response: any) => {
    setError('');
    setIsLoading(true);
    try {
      const data = await apiPost('/api/v1/auth/google', { credential: response.credential });
      if (data.success) {
        if (data.orgId) localStorage.setItem('radeya_org_id', data.orgId);
        if (data.needsOnboarding) {
          router.push('/dashboard/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error('Login gagal');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal login menggunakan akun Google.');
    } finally {
      setIsLoading(false);
    }
  };

  // Muat script Google Identity Services (GIS) secara dinamis
  React.useEffect(() => {
    const initializeGoogle = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) return;

      // @ts-ignore
      if (window.google?.accounts?.id) {
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLoginCallback,
        });

        const btnContainer = document.getElementById('google-signin-btn');
        if (btnContainer) {
          // @ts-ignore
          window.google.accounts.id.renderButton(
            btnContainer,
            { theme: 'outline', size: 'large', width: '384' }
          );
        }
      }
    };

    // @ts-ignore
    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Kirim data login ke API backend
      const data = await apiPost('/api/v1/auth/login', { email, password });
      
      // 2. Cookie JWT di-set otomatis oleh server (httpOnly)
      if (data.success) {
        if (data.orgId) localStorage.setItem('radeya_org_id', data.orgId);

        // 3. Arahkan pengguna ke dashboard utama atau onboarding
        if (data.needsOnboarding) {
          router.push('/dashboard/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error('Token tidak diterima dari server');
      }
    } catch (err: any) {
      setError(err.message || 'Email atau kata sandi salah. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-teal-500/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Home Button */}
        <a
          href="/"
          className="absolute top-6 right-6 p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 rounded-xl text-slate-300 hover:text-white transition-all duration-200 z-10"
          title="Kembali ke Beranda"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </a>

        {/* Glow Effect */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Radeya
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Sistem Manajemen Siklus Peternakan Pintar
            </p>
            <h2 className="text-xl font-bold text-slate-200 mt-6">
              Masuk ke Akun Anda
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl flex items-start gap-3 animate-shake">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
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
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-semibold text-slate-300">
                  Kata Sandi
                </label>
                <a href="#" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                  Lupa kata sandi?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 shadow-lg shadow-teal-600/20"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Menghubungkan...</span>
                </>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/80"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900/60 px-3 text-slate-400 font-bold">Atau masuk dengan</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="flex justify-center min-h-[46px] w-full">
            <div id="google-signin-btn" className="w-full"></div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 pt-6 border-t border-slate-800/60 text-center">
            <p className="text-sm text-slate-400">
              Belum punya akun Radeya?{' '}
              <a href="/register" className="text-teal-400 font-semibold hover:text-teal-300 transition-colors">
                Daftar Gratis
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
