import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUBREDDITS = [
  'webdev', 'SEO', 'smallbusiness', 'Entrepreneur', 'SaaS',
  'web_design', 'bigseo', 'marketing', 'startups', 'digitalnomad',
  'indiehackers', 'indiedev', 'coderforhire', 'webdevtutorials', 'reactjs', 'nextjs'
];

const KEYWORDS = [
  'website audit', 'seo check', 'site speed', 'ranking', 'free seo',
  'website health', 'pagespeed', 'lighthouse', 'gtmetrix', 'site performance',
  'core web vitals', 'mobile friendly', 'seo tools', 'website analyzer',
  'website', 'site', 'my website', 'my site',
  'feedback', 'review my', 'help with', 'advice',
  'optimize', 'improve', 'slow', 'broken'
];

const QUESTION_PATTERNS = [
  /how (do|can) i check/i,
  /what tool(s)? (can|should) i use/i,
  /need recommendations? for/i,
  /is there a (free|good)/i,
  /anyone know a (good|free)/i,
  /looking for (a|an) (free|good|cheap)/i,
  /can someone (review|check|look at)/i,
  /feedback on my/i,
  /thoughts on/i,
  /how to (improve|optimize|fix)/i
];

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  subreddit: string;
  created_utc: number;
  ups: number;
  num_comments: number;
}

interface Opportunity {
  date: string;
  subreddit: string;
  title: string;
  url: string;
  context: string;
  confidence: number;
  upvotes: number;
  comments: number;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

const MAX_RETRIES = 3;

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function fetchSubredditPosts(subreddit: string, limit = 100): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': randomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });

      if (response.status === 429 || response.status === 403) {
        console.warn(`r/${subreddit}: ${response.status} on attempt ${attempt}/${MAX_RETRIES}`);
        if (attempt < MAX_RETRIES) {
          await randomDelay(3000 * attempt, 6000 * attempt);
          continue;
        }
        console.error(`r/${subreddit}: ${response.status} after ${MAX_RETRIES} attempts, skipping`);
        return [];
      }

      if (!response.ok) {
        console.error(`Reddit API error for r/${subreddit}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.data.children.map((child: { data: RedditPost }) => child.data);
    } catch (err) {
      console.error(`r/${subreddit}: fetch error on attempt ${attempt}/${MAX_RETRIES}:`, err);
      if (attempt < MAX_RETRIES) {
        await randomDelay(3000 * attempt, 6000 * attempt);
        continue;
      }
    }
  }

  return [];
}

function isRelevant(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();

  const hasKeyword = KEYWORDS.some(kw => lowerText.includes(kw.toLowerCase()));
  const hasQuestionPattern = QUESTION_PATTERNS.some(pattern => pattern.test(text));

  return hasKeyword || hasQuestionPattern;
}

function calculateRelevance(title: string, selftext: string): number {
  let score = 0;
  const text = `${title} ${selftext || ''}`.toLowerCase();

  const highValueKeywords = ['website audit', 'seo check', 'free seo tool', 'site speed'];
  highValueKeywords.forEach(kw => {
    if (text.includes(kw)) score += 25;
  });

  if (QUESTION_PATTERNS.some(p => p.test(text))) score += 15;

  const broadKeywords = ['website', 'site', 'my website', 'my site'];

  KEYWORDS.forEach(kw => {
    if (text.includes(kw.toLowerCase())) {
      if (broadKeywords.includes(kw)) {
        score += 10;
      } else if (!highValueKeywords.includes(kw)) {
        score += 5;
      }
    }
  });

  return Math.min(100, score);
}

export async function POST(request: NextRequest) {
  // Authenticate with service role key - internal calls only
  const authHeader = request.headers.get('authorization');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { scan_request_id, user_id, hours = 24 } = body;

  if (!scan_request_id || !user_id) {
    return NextResponse.json(
      { error: 'Missing required fields: scan_request_id, user_id' },
      { status: 400 }
    );
  }

  // Create service role client that bypasses RLS
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  // Mark as processing
  await supabase
    .from('scan_requests')
    .update({ status: 'processing' })
    .eq('id', scan_request_id);

  try {
    const opportunities: Opportunity[] = [];
    const now = Date.now() / 1000;
    const cutoffTime = now - (hours * 3600);

    const succeeded: string[] = [];
    const failed: string[] = [];

    for (const subreddit of SUBREDDITS) {
      try {
        const posts = await fetchSubredditPosts(subreddit, 100);

        if (posts.length === 0) {
          failed.push(subreddit);
          console.log(`[${subreddit}] No posts returned (likely blocked)`);
        } else {
          succeeded.push(subreddit);
          console.log(`[${subreddit}] Fetched ${posts.length} posts`);
        }

        for (const post of posts) {
          if (post.created_utc < cutoffTime) continue;
          if (!isRelevant(post.title + ' ' + (post.selftext || ''))) continue;

          const score = calculateRelevance(post.title, post.selftext);
          if (score < 10) continue;

          opportunities.push({
            date: new Date(post.created_utc * 1000).toISOString(),
            subreddit: post.subreddit,
            title: post.title,
            url: `https://reddit.com${post.permalink}`,
            context: (post.selftext || '').substring(0, 500),
            confidence: score,
            upvotes: post.ups,
            comments: post.num_comments,
          });
        }

        // Rate limiting with random jitter (3-6 seconds)
        await randomDelay(3000, 6000);
      } catch (err) {
        failed.push(subreddit);
        console.error(`Error fetching r/${subreddit}:`, err);
      }
    }

    console.log(`Subreddits succeeded: ${succeeded.join(', ')} (${succeeded.length}/${SUBREDDITS.length})`);
    console.log(`Subreddits failed: ${failed.length > 0 ? failed.join(', ') : 'none'}`);

    // Sort by confidence and take top 20
    opportunities.sort((a, b) => b.confidence - a.confidence);
    const top20 = opportunities.slice(0, 20);

    // Save opportunities to DB
    if (top20.length > 0) {
      const rows = top20.map((opp) => ({
        user_id,
        subreddit: opp.subreddit,
        title: opp.title,
        url: opp.url,
        context: opp.context,
        confidence: opp.confidence,
        upvotes: opp.upvotes,
        comments: opp.comments,
        scanned_at: new Date().toISOString(),
      }));

      const { error: upsertError } = await supabase
        .from('opportunities')
        .upsert(rows, { onConflict: 'user_id,url' });

      if (upsertError) {
        console.error('Error upserting opportunities:', upsertError);
      }
    }

    // Mark scan as completed
    await supabase
      .from('scan_requests')
      .update({
        status: 'completed',
        result_count: top20.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scan_request_id);

    return NextResponse.json({
      success: true,
      count: top20.length,
      succeededSubreddits: succeeded.length,
      failedSubreddits: failed.length,
    });
  } catch (error) {
    console.error('Scan execution error:', error);

    // Mark scan as failed
    await supabase
      .from('scan_requests')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', scan_request_id);

    return NextResponse.json({ error: 'Scan execution failed' }, { status: 500 });
  }
}
