import { NextResponse } from 'next/server';

export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }
  return '127.0.0.1';
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (!store[ip]) {
    store[ip] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return { success: true, count: 1, resetTime: store[ip].resetTime };
  }

  const record = store[ip];
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return { success: true, count: 1, resetTime: record.resetTime };
  }

  record.count += 1;
  if (record.count > limit) {
    return { success: false, count: record.count, resetTime: record.resetTime };
  }

  return { success: true, count: record.count, resetTime: record.resetTime };
}