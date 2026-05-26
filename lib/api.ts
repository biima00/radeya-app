/**
 * Helper untuk memanggil API backend Radeya dengan token JWT otomatis.
 */

export async function apiFetch(path: string, options: RequestInit = {}) {
  // 1. Ambil token JWT dari penyimpanan lokal browser (localStorage)
  const token = typeof window !== 'undefined' ? localStorage.getItem('radeya_token') : null;

  // 2. Siapkan header default (memberitahu server bahwa kita mengirim data berbentuk JSON)
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  // Jika token JWT ditemukan, sisipkan ke dalam header Authorization
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 3. Panggil fungsi fetch bawaan browser untuk mengirim data ke server
  const response = await fetch(path, {
    ...options,
    headers,
  });

  // 4. Jika statusnya 401 (Unauthorized / sudah habis masa berlakunya)
  // Bersihkan token dari browser dan arahkan pengguna kembali ke halaman Login
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('radeya_token');
      window.location.href = '/login';
    }
  }

  return response;
}

// Helper untuk mengambil data (GET)
export async function apiGet(path: string) {
  const response = await apiFetch(path, { method: 'GET' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Gagal mengambil data');
  }
  return response.json();
}

// Helper untuk mengirim/menyimpan data baru (POST)
export async function apiPost(path: string, body: any) {
  const response = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Gagal mengirim data');
  }
  return data;
}

// Helper untuk mengubah/mengupdate data (PATCH)
export async function apiPatch(path: string, body: any) {
  const response = await apiFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Gagal memperbarui data');
  }
  return data;
}

// Helper untuk menghapus data (DELETE)
export async function apiDelete(path: string) {
  const response = await apiFetch(path, { method: 'DELETE' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Gagal menghapus data');
  }
  return data;
}
