#!/usr/bin/env npx tsx
/**
 * Local scanner worker — polls Supabase for pending scan_requests,
 * runs Reddit scanning locally (no Vercel timeout), and uploads results.
 *
 * Usage: npx tsx scripts/local-scanner.ts
 *    or: npm run scan
 */

import { createClient } from '@supabase/supabase-js';
import { SUBREDDITS as DEFAULT_SUBREDDITS, KEYWORDS as DEFAULT_KEYWORDS, QUESTION_PATTERNS, calculateRelevance } from '../src/lib/reddit/config';
import { fetchHNStories } from '../src/lib/hn/client';
import { isHNRelevant, calculateHNRelevance } from '../src/lib/hn/scorer';
import { sendOpportunityNotification } from '../src/lib/email/send';
import { calculateSentiment, isToxic } from '../src/lib/sentiment';

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const POLL_INTERVAL_MS = 30_000; // 30 seconds

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Heartbeat ────────────────────────────────────────────────────────────────
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

async function updateHeartbeat(status: string, currentScanId?: string) {
  try {
    await supabase
      .from('worker_state')
      .upsert({
        id: 'singleton',
        last_heartbeat: new Date().toISOString(),
        status,
        current_scan_id: currentScanId || null,
        updated_at: new Date().toISOString(),
      });
  } catch (err) {
    console.error('Heartbeat update failed:', err);
  }
}

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function startHeartbeat() {
  if (heartbeatTimer) return;
  updateHeartbeat('running');
  heartbeatTimer = setInterval(() => updateHeartbeat('running'), HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  updateHeartbeat('stopped');
}

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

const MAX_RETRIES = 3;

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
  platform: 'reddit' | 'hackernews';
}

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  return sleep(minMs + Math.random() * (maxMs - minMs));
}

async function fetchSubredditPosts(subreddit: string, limit = 100): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': randomUserAgent(),
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      if (response.status === 429 || response.status === 403) {
        console.warn(`  r/${subreddit}: ${response.status} on attempt ${attempt}/${MAX_RETRIES}`);
        if (attempt < MAX_RETRIES) {
          await randomDelay(3000 * attempt, 6000 * attempt);
          continue;
        }
        console.error(`  r/${subreddit}: ${response.status} after ${MAX_RETRIES} attempts, skipping`);
        return [];
      }

      if (!response.ok) {
        console.error(`  r/${subreddit}: HTTP ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.data.children.map((child: { data: RedditPost }) => child.data);
    } catch (err) {
      console.error(`  r/${subreddit}: fetch error attempt ${attempt}/${MAX_RETRIES}:`, err);
      if (attempt < MAX_RETRIES) {
        await randomDelay(3000 * attempt, 6000 * attempt);
        continue;
      }
    }
  }
  return [];
}

// ── User settings ────────────────────────────────────────────────────────────
interface UserSettings {
  subreddits: string[];
  keywords: string[];
  email_notifications: boolean;
  notification_threshold: number;
  skip_toxic_threads: boolean;
  hn_enabled: boolean;
  hn_keywords: string[];
}

async function getUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('subreddits, keywords, email_notifications, notification_threshold, skip_toxic_threads, hn_enabled, hn_keywords')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return {
      subreddits: DEFAULT_SUBREDDITS,
      keywords: DEFAULT_KEYWORDS,
      email_notifications: false,
      notification_threshold: 70,
      skip_toxic_threads: true,
      hn_enabled: false,
      hn_keywords: DEFAULT_KEYWORDS,
    };
  }

  return {
    subreddits: data.subreddits ?? DEFAULT_SUBREDDITS,
    keywords: data.keywords ?? DEFAULT_KEYWORDS,
    email_notifications: data.email_notifications ?? false,
    notification_threshold: data.notification_threshold ?? 70,
    skip_toxic_threads: data.skip_toxic_threads ?? true,
    hn_enabled: data.hn_enabled ?? false,
    hn_keywords: data.hn_keywords ?? data.keywords ?? DEFAULT_KEYWORDS,
  };
}

async function getUserEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data?.user?.email) return null;
  return data.user.email;
}

function isRelevantWithKeywords(text: string, keywords: string[]): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const hasKeyword = keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
  const hasQuestionPattern = QUESTION_PATTERNS.some((pattern) => pattern.test(text));
  return hasKeyword || hasQuestionPattern;
}

// ── Scan execution ──────────────────────────────────────────────────────────
async function executeScan(scanRequest: { id: string; user_id: string; hours: number }) {
  const { id, user_id, hours } = scanRequest;
  console.log(`\n🔍 Executing scan ${id} (user=${user_id}, hours=${hours})`);

  // Mark as processing + heartbeat
  await supabase.from('scan_requests').update({ status: 'processing' }).eq('id', id);
  await updateHeartbeat('running', id);

  try {
    // Load user-specific settings
    const settings = await getUserSettings(user_id);
    console.log(`  Using ${settings.subreddits.length} subreddits, ${settings.keywords.length} keywords, HN=${settings.hn_enabled}`);

    const opportunities: Opportunity[] = [];
    const now = Date.now() / 1000;
    const cutoffTime = now - hours * 3600;
    const succeeded: string[] = [];
    const failed: string[] = [];

    // ── Reddit scanning ──────────────────────────────────────────────────────
    for (const sub of settings.subreddits) {
      try {
        const posts = await fetchSubredditPosts(sub, 100);

        if (posts.length === 0) {
          failed.push(sub);
          console.log(`  [${sub}] No posts (likely blocked)`);
        } else {
          succeeded.push(sub);
          console.log(`  [${sub}] ${posts.length} posts`);
        }

        for (const post of posts) {
          if (post.created_utc < cutoffTime) continue;
          if (!isRelevantWithKeywords(post.title + ' ' + (post.selftext || ''), settings.keywords)) continue;

          const score = calculateRelevance(post.title, post.selftext);
          if (score < 10) continue;

          const sentimentScore = calculateSentiment(post.title, post.selftext || '');
          if (settings.skip_toxic_threads && isToxic(post.title, post.selftext || '')) {
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
      } catch (err) {
        failed.push(sub);
        console.error(`  [${sub}] Error processing subreddit (continuing):`, err instanceof Error ? err.message : err);
      }

      await randomDelay(3000, 6000);
    }

    console.log(`  Reddit — Succeeded: ${succeeded.length}/${settings.subreddits.length} | Failed: ${failed.length}`);

    // ── Hacker News scanning ─────────────────────────────────────────────────
    if (settings.hn_enabled) {
      console.log('  Scanning Hacker News (top 50 stories)...');
      try {
        const stories = await fetchHNStories(50);
        let hnMatched = 0;

        for (const story of stories) {
          if (story.time < cutoffTime) continue;

          const hnKeywords = settings.hn_keywords;
          const combined = `${story.title} ${story.text || ''}`;
          const hasKeyword = hnKeywords.some((kw) => combined.toLowerCase().includes(kw.toLowerCase()));
          if (!hasKeyword && !isHNRelevant(story.title, story.text || '')) continue;

          const score = calculateHNRelevance(story.title, story.text || '');
          if (score < 10) continue;

          const sentimentScore = calculateSentiment(story.title, story.text || '');
          if (settings.skip_toxic_threads && isToxic(story.title, story.text || '')) {
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

        console.log(`  HN — ${stories.length} stories fetched, ${hnMatched} matched`);
      } catch (err) {
        console.error('  HN scanning error:', err);
      }
    }

    // Sort by confidence and take top 20
    opportunities.sort((a, b) => b.confidence - a.confidence);
    const top20 = opportunities.slice(0, 20);

    // Save opportunities to DB
    console.log(`  Inserting ${top20.length} opportunities for user ${user_id}, scan ${id}`);

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
        scan_id: id,
      }));

      console.log('  First row:', JSON.stringify(rows[0]));

      const { data: upsertData, error: upsertError } = await supabase
        .from('opportunities')
        .upsert(rows, { onConflict: 'user_id,url' })
        .select('id, title');

      if (upsertError) {
        console.error('  Error upserting opportunities:', upsertError);
        console.error('  Error details:', upsertError.details, upsertError.code);
      } else {
        console.log(`  Upserted ${upsertData?.length} rows. First:`, upsertData?.[0]);
      }

      // Verify count
      const { count } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id);
      console.log(`  Verification: ${count} total opportunities for user after upsert`);
    } else {
      console.log('  No opportunities to insert');
    }

    // Mark completed
    await supabase
      .from('scan_requests')
      .update({
        status: 'completed',
        result_count: top20.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);

    console.log(`✅ Scan ${id} completed — ${top20.length} opportunities found`);

    // Send email notification if enabled
    if (settings.email_notifications) {
      const highConfidence = top20.filter((opp) => opp.confidence >= settings.notification_threshold);
      if (highConfidence.length > 0) {
        const email = await getUserEmail(user_id);
        if (email) {
          console.log(`📧 Sending notification to ${email} (${highConfidence.length} opps >= ${settings.notification_threshold}%)`);
          const result = await sendOpportunityNotification(email, highConfidence, id);
          if (result.success) {
            console.log('📧 Email sent successfully');
          } else {
            console.warn('📧 Email failed:', result.error);
          }
        } else {
          console.warn('📧 No email found for user, skipping notification');
        }
      }
    }
  } catch (error) {
    console.error(`❌ Scan ${id} failed:`, error);

    await supabase
      .from('scan_requests')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);
  }
}

// ── Poll loop ───────────────────────────────────────────────────────────────
async function poll() {
  const { data: pending, error } = await supabase
    .from('scan_requests')
    .select('id, user_id, hours')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('Poll error:', error.message);
    return;
  }

  if (pending && pending.length > 0) {
    await executeScan(pending[0]);
  }
}

async function main() {
  console.log('🚀 Local scanner started — polling every 30s');
  console.log(`   Supabase: ${SUPABASE_URL}`);

  // Start heartbeat
  startHeartbeat();

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down...');
    stopHeartbeat();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Run immediately on start, then loop
  await poll();

  setInterval(async () => {
    try {
      await poll();
    } catch (err) {
      console.error('Poll loop error:', err);
    }
  }, POLL_INTERVAL_MS);
}

main();
