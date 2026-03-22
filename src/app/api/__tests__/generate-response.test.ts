import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// Mock Anthropic
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

// Mock rate limiter
vi.mock('@/lib/ratelimit', () => ({
  applyRateLimit: vi.fn(() => null),
  RATE_LIMITS: {
    generateResponse: { maxRequests: 10, windowMs: 60_000 },
  },
}));

import { POST } from '../reddit/generate-response/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/reddit/generate-response', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/reddit/generate-response', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(makeRequest({ title: 'Test', subreddit: 'webdev' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing required fields', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

    const res = await POST(makeRequest({ title: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });

    const req = new NextRequest('http://localhost/api/reddit/generate-response', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid JSON body');
  });

  it('generates a response successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'This is a helpful response.' }],
    });

    const res = await POST(
      makeRequest({ title: 'Need SEO help', subreddit: 'webdev' })
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.response).toBe('This is a helpful response.');
  });

  it('saves response to DB when opportunityUrl is provided', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Great response.' }],
    });

    const mockOppSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'opp-1' }, error: null }),
        }),
      }),
    });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'opportunities') return { select: mockOppSelect };
      if (table === 'generated_responses') return { insert: mockInsert };
      return {};
    });

    const res = await POST(
      makeRequest({
        title: 'Need help',
        subreddit: 'webdev',
        opportunityUrl: 'https://reddit.com/r/webdev/comments/abc123',
      })
    );

    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith({
      opportunity_id: 'opp-1',
      user_id: 'user-1',
      response_text: 'Great response.',
    });
  });

  it('handles AI API errors gracefully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCreate.mockRejectedValue(new Error('API rate limited'));

    const res = await POST(
      makeRequest({ title: 'Test post', subreddit: 'SEO' })
    );
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('strips r/ prefix from subreddit in prompt', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Response text.' }],
    });

    await POST(makeRequest({ title: 'Test', subreddit: 'r/webdev' }));

    const systemPrompt = mockCreate.mock.calls[0][0].system;
    expect(systemPrompt).toContain('r/webdev');
    expect(systemPrompt).not.toContain('r/r/webdev');
  });
});
