type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const MAX_ENTRIES = 10000;
const CLEANUP_INTERVAL = 60 * 1000;
const limiters = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of limiters) {
    if (now > entry.resetTime) limiters.delete(key);
  }
  lastCleanup = now;
}

function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL || limiters.size > MAX_ENTRIES) {
    evictExpired();
  }
  if (limiters.size > MAX_ENTRIES) {
    const oldest = limiters.keys().next().value;
    if (oldest) limiters.delete(oldest);
  }
}

export function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  maybeCleanup();
  const now = Date.now();
  const key = `${ip}:${limit}:${windowMs}`;
  const entry = limiters.get(key);

  if (!entry || now > entry.resetTime) {
    const newEntry = { count: 1, resetTime: now + windowMs };
    limiters.set(key, newEntry);
    return { success: true, limit, remaining: limit - 1, reset: newEntry.resetTime };
  }

  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, reset: entry.resetTime };
  }

  entry.count += 1;
  return { success: true, limit, remaining: limit - entry.count, reset: entry.resetTime };
}

export function getClientIp(req: Request): string {
  // x-real-ip lebih trustworthy di Vercel (set oleh edge, bukan client)
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return '127.0.0.1';
}
