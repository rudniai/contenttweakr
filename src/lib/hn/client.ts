// ── Hacker News API client ──────────────────────────────────────────────────

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

export interface HNStory {
  id: number;
  title: string;
  text: string; // self-text (for Ask HN, Show HN, etc.)
  url: string;
  by: string;
  score: number;
  descendants: number; // comment count
  time: number; // unix timestamp
  type: 'story' | 'comment' | 'job' | 'poll';
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchTopStoryIds(): Promise<number[]> {
  return (await fetchJSON<number[]>(`${HN_API_BASE}/topstories.json`)) ?? [];
}

export async function fetchAskStoryIds(): Promise<number[]> {
  return (await fetchJSON<number[]>(`${HN_API_BASE}/askstories.json`)) ?? [];
}

export async function fetchShowStoryIds(): Promise<number[]> {
  return (await fetchJSON<number[]>(`${HN_API_BASE}/showstories.json`)) ?? [];
}

export async function fetchStory(id: number): Promise<HNStory | null> {
  return fetchJSON<HNStory>(`${HN_API_BASE}/item/${id}.json`);
}

/**
 * Fetch top stories from HN across top/ask/show categories.
 * Returns at most `limit` unique stories (default 50).
 */
export async function fetchHNStories(limit = 50): Promise<HNStory[]> {
  // Fetch IDs from all three categories in parallel
  const [topIds, askIds, showIds] = await Promise.all([
    fetchTopStoryIds(),
    fetchAskStoryIds(),
    fetchShowStoryIds(),
  ]);

  // Merge and deduplicate, preserving priority order
  const seen = new Set<number>();
  const mergedIds: number[] = [];
  for (const id of [...topIds, ...askIds, ...showIds]) {
    if (!seen.has(id)) {
      seen.add(id);
      mergedIds.push(id);
    }
    if (mergedIds.length >= limit) break;
  }

  // Fetch story details in parallel (batched to avoid overwhelming the API)
  const BATCH_SIZE = 10;
  const stories: HNStory[] = [];

  for (let i = 0; i < mergedIds.length; i += BATCH_SIZE) {
    const batch = mergedIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(fetchStory));
    for (const story of results) {
      if (story && story.type === 'story') {
        stories.push(story);
      }
    }
  }

  return stories;
}
