/**
 * Simple in-memory rate limiter middleware for Express.
 * Tracks request counts per IP within a sliding window.
 *
 * For production, replace with Redis-backed limiter (e.g. express-rate-limit + rate-limit-redis).
 */

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX = 20;

export function rateLimiter({ windowMs = DEFAULT_WINDOW_MS, max = DEFAULT_MAX } = {}) {
  const hits = new Map();

  // Periodically clean up expired entries to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now - entry.windowStart > windowMs) {
        hits.delete(key);
      }
    }
  }, windowMs * 2).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    let entry = hits.get(ip);

    if (!entry || now - entry.windowStart > windowMs) {
      entry = { windowStart: now, count: 1 };
      hits.set(ip, entry);
      return next();
    }

    entry.count++;
    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    next();
  };
}
