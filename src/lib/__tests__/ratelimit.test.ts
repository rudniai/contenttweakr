import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, applyRateLimit, RATE_LIMITS, _resetStore } from '../ratelimit';

beforeEach(() => {
  _resetStore();
});

describe('checkRateLimit', () => {
  it('allows requests within limit', () => {
    const config = { maxRequests: 3, windowMs: 60_000 };
    const r1 = checkRateLimit('user:1', config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit('user:1', config);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit('user:1', config);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('blocks requests exceeding limit', () => {
    const config = { maxRequests: 2, windowMs: 60_000 };
    checkRateLimit('user:1', config);
    checkRateLimit('user:1', config);

    const r3 = checkRateLimit('user:1', config);
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.retryAfter).toBeGreaterThan(0);
  });

  it('isolates users from each other', () => {
    const config = { maxRequests: 1, windowMs: 60_000 };
    checkRateLimit('user:a', config);

    const r = checkRateLimit('user:b', config);
    expect(r.allowed).toBe(true);
  });

  it('allows requests after window expires', async () => {
    const config = { maxRequests: 1, windowMs: 50 };
    checkRateLimit('user:1', config);

    const blocked = checkRateLimit('user:1', config);
    expect(blocked.allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 60));

    const allowed = checkRateLimit('user:1', config);
    expect(allowed.allowed).toBe(true);
  });
});

describe('applyRateLimit', () => {
  it('returns null when allowed', () => {
    const result = applyRateLimit('user-123', 'test-endpoint', RATE_LIMITS.generateResponse);
    expect(result).toBeNull();
  });

  it('returns 429 response when rate limited', () => {
    const config = { maxRequests: 1, windowMs: 60_000 };
    applyRateLimit('user-123', 'test', config);

    const response = applyRateLimit('user-123', 'test', config);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
    expect(response!.headers.get('Retry-After')).toBeTruthy();
    expect(response!.headers.get('X-RateLimit-Limit')).toBe('1');
    expect(response!.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('scopes rate limits by endpoint', () => {
    const config = { maxRequests: 1, windowMs: 60_000 };
    applyRateLimit('user-123', 'endpoint-a', config);

    const result = applyRateLimit('user-123', 'endpoint-b', config);
    expect(result).toBeNull();
  });
});

describe('RATE_LIMITS config', () => {
  it('has correct scan trigger limits', () => {
    expect(RATE_LIMITS.scanTrigger).toEqual({ maxRequests: 1, windowMs: 60_000 });
  });

  it('has correct generate response limits', () => {
    expect(RATE_LIMITS.generateResponse).toEqual({ maxRequests: 10, windowMs: 60_000 });
  });

  it('has correct bulk operation limits', () => {
    expect(RATE_LIMITS.bulkOperation).toEqual({ maxRequests: 5, windowMs: 60_000 });
  });
});
