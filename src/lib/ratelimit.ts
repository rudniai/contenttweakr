import { NextResponse } from 'next/server';

/**
 * In-memory sliding window rate limiter.
 * For production, replace with Upstash Redis (@upstash/ratelimit).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup(windowMs: number) {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    });
  }, CLEANUP_INTERVAL);
  // Don't block process exit
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the oldest request in the window expires */
  retryAfter: number;
  /** Remaining requests in the current window */
  remaining: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  startCleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + config.windowMs - now) / 1000);
    return {
      allowed: false,
      retryAfter: Math.max(retryAfter, 1),
      remaining: 0,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    retryAfter: 0,
    remaining: config.maxRequests - entry.timestamps.length,
  };
}

/**
 * Apply rate limiting to a route handler. Call after authentication.
 * Returns a 429 response if rate limited, or null if allowed.
 */
export function applyRateLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig
): NextResponse | null {
  const key = `${endpoint}:${userId}`;
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  return null;
}

// Pre-configured rate limits
export const RATE_LIMITS = {
  scanTrigger: { maxRequests: 1, windowMs: 60 * 1000 },       // 1 per minute
  generateResponse: { maxRequests: 10, windowMs: 60 * 1000 },  // 10 per minute
  bulkOperation: { maxRequests: 5, windowMs: 60 * 1000 },      // 5 per minute
} as const;

// Export for testing
export function _resetStore() {
  store.clear();
}
