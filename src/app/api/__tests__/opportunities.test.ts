import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { GET } from '../reddit/opportunities/saved/route';

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/reddit/opportunities/saved');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString(), { method: 'GET' });
}

/** Create a chainable Supabase query mock that resolves to the given result */
function createQueryChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const self = new Proxy(chain, {
    get(_target, prop: string) {
      if (prop === 'then') {
        // Make the chain thenable — resolves with the result when awaited
        return (resolve: (v: unknown) => void) => resolve(result);
      }
      if (!chain[prop]) {
        chain[prop] = vi.fn().mockReturnValue(self);
      }
      return chain[prop];
    },
  });
  return self;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/reddit/opportunities/saved', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns formatted opportunities', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    const mockOpportunities = [
      {
        id: 'opp-1',
        subreddit: 'webdev',
        title: 'Need SEO help',
        url: 'https://reddit.com/r/webdev/abc',
        context: 'My site is slow',
        confidence: 85,
        upvotes: 10,
        comments: 5,
        scanned_at: '2026-03-23T00:00:00Z',
        hidden: false,
        replied_at: null,
        generated_responses: [
          { id: 'resp-1', response_text: 'Try pagespeed', created_at: '2026-03-23T01:00:00Z' },
        ],
      },
    ];

    mockFrom.mockReturnValue(
      createQueryChain({ data: mockOpportunities, error: null })
    );

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.opportunities).toHaveLength(1);
    expect(json.opportunities[0]).toEqual({
      id: 'opp-1',
      subreddit: 'webdev',
      title: 'Need SEO help',
      url: 'https://reddit.com/r/webdev/abc',
      context: 'My site is slow',
      confidence: 85,
      upvotes: 10,
      comments: 5,
      date: '2026-03-23T00:00:00Z',
      hidden: false,
      repliedAt: null,
      aiResponse: 'Try pagespeed',
    });
  });

  it('returns 500 on DB error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    mockFrom.mockReturnValue(
      createQueryChain({ data: null, error: { message: 'DB error' } })
    );

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
  });

  it('handles empty results', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    mockFrom.mockReturnValue(
      createQueryChain({ data: [], error: null })
    );

    const res = await GET(makeGetRequest());
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.opportunities).toEqual([]);
  });

  it('handles null context and missing responses', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

    mockFrom.mockReturnValue(
      createQueryChain({
        data: [{
          id: 'opp-2',
          subreddit: 'SEO',
          title: 'Question',
          url: 'https://reddit.com/abc',
          context: null,
          confidence: 50,
          upvotes: 0,
          comments: 0,
          scanned_at: '2026-03-23T00:00:00Z',
          hidden: null,
          replied_at: null,
          generated_responses: [],
        }],
        error: null,
      })
    );

    const res = await GET(makeGetRequest());
    const json = await res.json();
    expect(json.opportunities[0].context).toBe('');
    expect(json.opportunities[0].hidden).toBe(false);
    expect(json.opportunities[0].aiResponse).toBeUndefined();
  });
});
