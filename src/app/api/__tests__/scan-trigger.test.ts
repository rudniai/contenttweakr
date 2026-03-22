import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockGetUser = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      insert: mockInsert.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle,
        }),
      }),
    })),
  })),
}));

// Mock rate limiter
vi.mock('@/lib/ratelimit', () => ({
  applyRateLimit: vi.fn(() => null),
  RATE_LIMITS: {
    scanTrigger: { maxRequests: 1, windowMs: 60_000 },
  },
}));

import { POST } from '../reddit/scan/trigger/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/reddit/scan/trigger', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/reddit/scan/trigger', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(makeRequest({ hours: 24 }));
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid hours', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const res = await POST(makeRequest({ hours: 0 }));
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('Validation failed');
  });

  it('returns 400 for non-integer hours', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const res = await POST(makeRequest({ hours: 1.5 }));
    expect(res.status).toBe(400);
  });

  it('creates scan request and returns pending status', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSingle.mockResolvedValue({ data: { id: 'scan-123' }, error: null });

    const res = await POST(makeRequest({ hours: 24 }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.id).toBe('scan-123');
    expect(json.status).toBe('pending');
  });

  it('uses default hours (24) when not provided', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSingle.mockResolvedValue({ data: { id: 'scan-456' }, error: null });

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(200);

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      hours: 24,
      status: 'pending',
    });
  });

  it('returns 500 when DB insert fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const res = await POST(makeRequest({ hours: 24 }));
    expect(res.status).toBe(500);
  });
});
