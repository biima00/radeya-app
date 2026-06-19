/**
 * Helper untuk memanggil API backend Radeya.
 * Token JWT dikirim otomatis via httpOnly cookie (same-origin).
 */

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return response;
}

export async function apiGet(path: string) {
  const response = await apiFetch(path, { method: 'GET' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Gagal mengambil data');
  }
  return response.json();
}

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

export async function apiDelete(path: string) {
  const response = await apiFetch(path, { method: 'DELETE' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Gagal menghapus data');
  }
  return data;
}
