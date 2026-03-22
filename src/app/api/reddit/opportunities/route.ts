import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
  aiResponse?: string;
}

async function fetchSubredditPosts(subreddit: string, limit = 100): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ContentTweakr:RedditFinder:v1.0 (research tool)'
    }
  });

  if (!response.ok) {
    console.error(`Reddit API error for r/${subreddit}: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return data.data.children.map((child: { data: RedditPost }) => child.data);
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
  
  if (QUESTION_PATTERNS.some(p => p.test(text))) score += 20;
  
  KEYWORDS.forEach(kw => {
    if (text.includes(kw.toLowerCase())) score += 5;
  });
  
  return Math.min(100, score);
}

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('hours') || '24');

    const opportunities: Opportunity[] = [];
    const now = Date.now() / 1000;
    const cutoffTime = now - (hours * 3600);

    // Scan subreddits
    for (const subreddit of SUBREDDITS) {
      try {
        const posts = await fetchSubredditPosts(subreddit, 100);
        console.log(`[${subreddit}] Fetched ${posts.length} posts`);

        let relevantCount = 0;
        let scoredCount = 0;

        for (const post of posts) {
          if (post.created_utc < cutoffTime) continue;
          if (!isRelevant(post.title + ' ' + (post.selftext || ''))) continue;

          relevantCount++;
          const score = calculateRelevance(post.title, post.selftext);
          if (score < 15) continue;

          scoredCount++;
          opportunities.push({
            date: new Date(post.created_utc * 1000).toISOString(),
            subreddit: post.subreddit,
            title: post.title,
            url: `https://reddit.com${post.permalink}`,
            context: (post.selftext || '').substring(0, 500),
            confidence: score,
            upvotes: post.ups,
            comments: post.num_comments
          });
        }

        console.log(`[${subreddit}] ${relevantCount} passed relevance check`);
        console.log(`[${subreddit}] ${scoredCount} scored >= 15`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err) {
        console.error(`Error fetching r/${subreddit}:`, err);
      }
    }

    console.log(`Final opportunities: ${opportunities.length}`);

    // Sort by confidence
    opportunities.sort((a, b) => b.confidence - a.confidence);

    const top20 = opportunities.slice(0, 20);

    // Save to database (upsert to avoid duplicates)
    if (top20.length > 0) {
      const rows = top20.map((opp) => ({
        user_id: user.id,
        subreddit: opp.subreddit,
        title: opp.title,
        url: opp.url,
        context: opp.context,
        confidence: opp.confidence,
        upvotes: opp.upvotes,
        comments: opp.comments,
        scanned_at: new Date().toISOString(),
      }));

      const { error: dbError } = await supabase
        .from('opportunities')
        .upsert(rows, { onConflict: 'user_id,url' });

      if (dbError) {
        console.error('Error saving opportunities to DB:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      count: top20.length,
      opportunities: top20,
      scannedSubreddits: SUBREDDITS.length,
      timeRange: `${hours} hours`
    });

  } catch (error) {
    console.error('Reddit opportunities error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}
