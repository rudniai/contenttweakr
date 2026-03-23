import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from './AnalyticsDashboard';

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = [7, 30, 90].includes(Number(params.days)) ? Number(params.days) : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch opportunities with response presence
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('confidence, platform, subreddit, replied_at, generated_responses(id)')
    .eq('user_id', user.id)
    .gte('created_at', since);

  const opps = opportunities ?? [];
  const total = opps.length;
  const replied = opps.filter((o) => o.replied_at).length;
  const responseCount = opps.filter(
    (o) => Array.isArray(o.generated_responses) && o.generated_responses.length > 0
  ).length;
  const avgConfidence = total > 0
    ? Math.round(opps.reduce((sum, o) => sum + (o.confidence ?? 0), 0) / total)
    : 0;

  // Platform breakdown
  const platformCounts: Record<string, number> = {};
  for (const o of opps) {
    const p = o.platform ?? 'reddit';
    platformCounts[p] = (platformCounts[p] ?? 0) + 1;
  }

  // Subreddit breakdown (top 10)
  const subredditCounts: Record<string, number> = {};
  for (const o of opps) {
    if (o.subreddit) {
      subredditCounts[o.subreddit] = (subredditCounts[o.subreddit] ?? 0) + 1;
    }
  }
  const topSubreddits = Object.entries(subredditCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <AnalyticsDashboard
      days={days}
      total={total}
      responseCount={responseCount}
      replied={replied}
      avgConfidence={avgConfidence}
      platformCounts={platformCounts}
      topSubreddits={topSubreddits}
    />
  );
}
