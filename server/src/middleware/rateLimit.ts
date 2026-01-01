import { Request, Response, NextFunction } from 'express';

// Rate limit configuration
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10; // 10 requests per window

// In-memory store for rate limiting (per IP)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client IP from request (handles proxies)
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Rate limiting middleware for AI endpoints
 * Limits to 10 requests per minute per IP address
 */
export function aiRateLimit(req: Request, res: Response, next: NextFunction): void {
  const clientIp = getClientIp(req);
  const now = Date.now();

  let entry = rateLimitStore.get(clientIp);

  // Create new entry if none exists or window has expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + WINDOW_MS,
    };
    rateLimitStore.set(clientIp, entry);
  }

  // Increment request count
  entry.count++;

  // Set rate limit headers
  const remaining = Math.max(0, MAX_REQUESTS - entry.count);
  const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetSeconds);

  // Check if rate limit exceeded
  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({
      error: 'Rate limit exceeded. Please wait before making more requests.',
      success: false,
      retryAfter: resetSeconds,
    });
    return;
  }

  next();
}

/**
 * Get current rate limit status for an IP
 */
export function getRateLimitStatus(ip: string): {
  remaining: number;
  resetIn: number;
} {
  const entry = rateLimitStore.get(ip);
  const now = Date.now();

  if (!entry || entry.resetTime < now) {
    return { remaining: MAX_REQUESTS, resetIn: 0 };
  }

  return {
    remaining: Math.max(0, MAX_REQUESTS - entry.count),
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

export default aiRateLimit;
