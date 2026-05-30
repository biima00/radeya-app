type RateLimitEntry = {
  count: number;
  resetTime: number;
};

// Map global in-memory untuk menyimpan batas laju request per IP
const limiters = new Map<string, RateLimitEntry>();

/**
 * Memeriksa laju permintaan dari IP tertentu.
 * @param ip Alamat IP klien
 * @param limit Jumlah maksimal request yang diizinkan dalam rentang waktu tertentu
 * @param windowMs Durasi rentang waktu dalam milidetik
 */
export function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const entry = limiters.get(ip);

  // Jika data IP belum ada atau window waktunya sudah terlewati, buat window baru
  if (!entry || now > entry.resetTime) {
    const newEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    limiters.set(ip, newEntry);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: newEntry.resetTime,
    };
  }

  // Jika jumlah request melampaui limit, tolak permintaan
  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  // Tambahkan hitungan request
  entry.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Mengambil IP asli dari Request headers
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return '127.0.0.1';
}
