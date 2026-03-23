import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SUBREDDITS, KEYWORDS, isRelevant, calculateRelevance } from '@/lib/reddit/config';
import { fetchHNStories } from '@/lib/hn/client';
import { isHNRelevant, calculateHNRelevance } from '@/lib/hn/scorer';
import { fetchPHPosts } from '@/lib/ph/client';
import { isPHRelevant, calculatePHRelevance } from '@/lib/ph/scorer';
import { calculateSentiment, isToxic } from '@/lib/sentiment';

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
  sentiment_score: number;
  platform: 'reddit' | 'hackernews' | 'producthunt';
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
  const { scan_request_id, user_id, hours = 24, skip_toxic_threads = true, hn_enabled = false, ph_enabled = false } = body;

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

          const sentimentScore = calculateSentiment(post.title, post.selftext || '');
          if (skip_toxic_threads && isToxic(post.title, post.selftext || '')) {
            continue;
          }

          opportunities.push({
            date: new Date(post.created_utc * 1000).toISOString(),
            subreddit: post.subreddit,
            title: post.title,
            url: `https://reddit.com${post.permalink}`,
            context: (post.selftext || '').substring(0, 500),
            confidence: score,
            upvotes: post.ups,
            comments: post.num_comments,
            sentiment_score: sentimentScore,
            platform: 'reddit',
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

    // ── Hacker News scanning ─────────────────────────────────────────────────
    if (hn_enabled) {
      console.log('Scanning Hacker News (top 50 stories)...');
      try {
        const stories = await fetchHNStories(50);
        let hnMatched = 0;

        for (const story of stories) {
          if (story.time < cutoffTime) continue;
          if (!isHNRelevant(story.title, story.text || '')) continue;

          const score = calculateHNRelevance(story.title, story.text || '');
          if (score < 10) continue;

          const sentimentScore = calculateSentiment(story.title, story.text || '');
          if (skip_toxic_threads && isToxic(story.title, story.text || '')) {
            continue;
          }

          hnMatched++;
          opportunities.push({
            date: new Date(story.time * 1000).toISOString(),
            subreddit: 'hackernews',
            title: story.title,
            url: `https://news.ycombinator.com/item?id=${story.id}`,
            context: (story.text || '').substring(0, 500),
            confidence: score,
            upvotes: story.score,
            comments: story.descendants || 0,
            sentiment_score: sentimentScore,
            platform: 'hackernews',
          });
        }

        console.log(`HN: ${stories.length} stories fetched, ${hnMatched} matched`);
      } catch (err) {
        console.error('HN scanning error:', err);
      }
    }

    // ── Product Hunt scanning ───────────────────────────────────────────────
    if (ph_enabled) {
      console.log('Scanning Product Hunt...');
      try {
        const posts = await fetchPHPosts(50, hours);
        let phMatched = 0;

        for (const post of posts) {
          if (!isPHRelevant(post.name, post.tagline, post.description || '')) continue;

          const score = calculatePHRelevance(post.name, post.tagline, post.description || '');
          if (score < 10) continue;

          const combined = `${post.name} ${post.tagline}`;
          const sentimentScore = calculateSentiment(combined, post.description || '');
          if (skip_toxic_threads && isToxic(combined, post.description || '')) {
            continue;
          }

          phMatched++;
          opportunities.push({
            date: post.createdAt,
            subreddit: 'producthunt',
            title: `${post.name} - ${post.tagline}`,
            url: post.url,
            context: (post.description || '').substring(0, 500),
            confidence: score,
            upvotes: post.votesCount,
            comments: post.commentsCount,
            sentiment_score: sentimentScore,
            platform: 'producthunt',
          });
        }

        console.log(`PH: ${posts.length} posts fetched, ${phMatched} matched`);
      } catch (err) {
        console.error('PH scanning error:', err);
      }
    }

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
        sentiment_score: opp.sentiment_score,
        platform: opp.platform,
        scanned_at: new Date().toISOString(),
        scan_id: scan_request_id,
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
